from msal import PublicClientApplication
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
import os
import secrets
import httpx
import base64
import logging
import asyncio
from typing import List, Dict, Any
from pydantic import BaseModel
from ..database import get_db
from ..models import User
from .auth import get_current_user
from .receipts import process_pdf_content, process_pdf_batch

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Request models


class CodeExchangeRequest(BaseModel):
    code: str
    state: str


# Global sync progress tracking
sync_progress = {}

# Outlook OAuth2 configuration
CLIENT_ID = os.getenv("OUTLOOK_CLIENT_ID")
TENANT_ID = os.getenv("OUTLOOK_TENANT_ID")
# Not used for public clients
CLIENT_SECRET = os.getenv("OUTLOOK_CLIENT_SECRET")
REDIRECT_URI = os.getenv("OUTLOOK_REDIRECT_URI")

# Determine authority based on tenant_id
if TENANT_ID and TENANT_ID.lower() == "consumers":
    AUTHORITY = "https://login.microsoftonline.com/consumers"
else:
    AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"

SCOPE = ["https://graph.microsoft.com/Mail.Read"]

# MSAL app - Use PublicClientApplication for public/native clients
msal_app = PublicClientApplication(
    CLIENT_ID,
    authority=AUTHORITY
)

# Email senders to search for receipts
RECEIPT_SENDERS = [
    os.getenv("EMAIL_SENDER_1", "facturaelectronica@pingodoce.pt"),
    os.getenv("EMAIL_SENDER_2", "noreply@cartaocontinente.pt")
]

# Validate required environment variables
if not CLIENT_ID:
    logger.error("OUTLOOK_CLIENT_ID environment variable is required")
if not REDIRECT_URI:
    logger.error("OUTLOOK_REDIRECT_URI environment variable is required")

logger.info(
    f"Initialized MSAL PublicClientApplication with CLIENT_ID: {CLIENT_ID[:10]}...")
logger.info(f"Using AUTHORITY: {AUTHORITY}")
logger.info(f"Using REDIRECT_URI: {REDIRECT_URI}")


@router.get("/auth-url")
def get_outlook_auth_url(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get the URL to authorize Outlook access"""
    # Clear any existing tokens and state for fresh start
    current_user.outlook_access_token = None
    current_user.outlook_refresh_token = None
    current_user.outlook_token_expires = None
    current_user.outlook_state = None
    db.commit()

    # Generate new state
    state = secrets.token_urlsafe(32)

    # Store state in user
    current_user.outlook_state = state
    db.commit()

    auth_url = msal_app.get_authorization_request_url(
        SCOPE,
        state=state,
        redirect_uri=REDIRECT_URI
    )

    logger.info(f"Generated auth URL for user {current_user.id}: {auth_url}")
    return {"auth_url": auth_url, "state": state}


@router.post("/exchange-code")
async def exchange_authorization_code(
    request_data: CodeExchangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exchange authorization code for tokens"""
    try:
        code = request_data.code
        state = request_data.state

        logger.info(
            f"Exchanging code for user {current_user.id} with state: {state}")

        # Verify state matches what we stored
        if current_user.outlook_state != state:
            logger.error(
                f"State mismatch for user {current_user.id}: expected {current_user.outlook_state}, got {state}")
            raise HTTPException(status_code=400, detail="Invalid state")

        # Exchange code for tokens
        result = msal_app.acquire_token_by_authorization_code(
            code,
            SCOPE,
            redirect_uri=REDIRECT_URI
        )

        logger.info(f"Token exchange result keys: {list(result.keys())}")

        if "access_token" in result:
            # Store tokens
            current_user.outlook_access_token = result["access_token"]
            current_user.outlook_refresh_token = result.get("refresh_token")

            # Calculate token expiration
            expires_in = result.get("expires_in", 3600)  # Default to 1 hour
            current_user.outlook_token_expires = datetime.now() + timedelta(seconds=expires_in)

            current_user.outlook_state = None  # Clear state
            db.commit()

            logger.info(
                f"Successfully stored tokens for user {current_user.id}")

            return {"success": True, "message": "Outlook connected successfully"}
        else:
            error_desc = result.get("error_description", "Unknown error")
            logger.error(f"Token exchange failed: {error_desc}")
            raise HTTPException(
                status_code=400, detail=f"Failed to exchange code: {error_desc}")

    except Exception as e:
        logger.error(f"OAuth code exchange error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/callback")
def outlook_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Handle OAuth callback from Microsoft (legacy endpoint, redirects to frontend)"""
    try:
        logger.info(f"Received OAuth callback with code and state: {state}")

        # Redirect to frontend with code and state as query parameters
        frontend_url = f"http://localhost:3000/settings?code={code}&state={state}&outlook_callback=true"
        return RedirectResponse(url=frontend_url)

    except Exception as e:
        logger.error(f"OAuth callback error: {str(e)}")
        # Redirect to frontend with error
        return RedirectResponse(url="http://localhost:3000/settings?outlook_error=true")


def update_sync_progress(user_id: int, status: str, current_step: str = "", total_steps: int = 0, completed_steps: int = 0):
    """Update sync progress for a user"""
    sync_progress[user_id] = {
        # "starting", "searching", "downloading", "extracting", "completed", "error"
        "status": status,
        "current_step": current_step,
        "total_steps": total_steps,
        "completed_steps": completed_steps,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/sync-progress")
def get_sync_progress(current_user: User = Depends(get_current_user)):
    """Get current sync progress for the user"""
    progress = sync_progress.get(current_user.id, {
        "status": "idle",
        "current_step": "",
        "total_steps": 0,
        "completed_steps": 0,
        "timestamp": datetime.now().isoformat()
    })
    return progress


async def search_emails_from_sender(
    token: str,
    sender: str,
    date_from: datetime = None,
    date_to: datetime = None
) -> List[Dict[str, Any]]:
    """Search for emails from a specific sender, optionally within date range"""
    url = "https://graph.microsoft.com/v1.0/me/messages"
    headers = {"Authorization": f"Bearer {token}"}

    # Build filter query - search entire history if no dates provided
    if date_from and date_to:
        filter_query = (
            f"from/emailAddress/address eq '{sender}' and "
            f"receivedDateTime ge {date_from.isoformat()}Z and "
            f"receivedDateTime le {date_to.isoformat()}Z and "
            f"hasAttachments eq true"
        )
    else:
        filter_query = (
            f"from/emailAddress/address eq '{sender}' and "
            f"hasAttachments eq true"
        )

    params = {
        "$filter": filter_query,
        "$top": 999,  # Increase limit to get more emails
        "$select": "id,subject,receivedDateTime,hasAttachments"
    }

    logger.info(f"Searching for emails from: {sender}")
    logger.info(f"Filter query: {filter_query}")

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

        if response.status_code != 200:
            logger.error(
                f"Error searching emails: {response.status_code} - {response.text}")
            response.raise_for_status()

        results = response.json().get("value", [])
        logger.info(f"Found {len(results)} emails from {sender}")
        return results


async def download_pdf_attachments(token: str, message_id: str, email_received_date: str = None) -> List[bytes]:
    """Download PDF attachments from an email"""
    url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments"
    headers = {"Authorization": f"Bearer {token}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()

        pdf_contents = []
        all_attachments = response.json().get("value", [])

        for attachment in all_attachments:
            # Check if it's a PDF file - either by content type or file extension
            content_type = attachment.get("contentType", "")
            filename = attachment.get("name", "")
            is_pdf = (
                content_type == "application/pdf" or
                (content_type == "application/octet-stream" and filename.lower().endswith('.pdf'))
            )

            if is_pdf:
                # Get attachment content
                attachment_url = f"https://graph.microsoft.com/v1.0/me/messages/{message_id}/attachments/{attachment['id']}/$value"
                attachment_response = await client.get(attachment_url, headers=headers)

                if attachment_response.status_code == 200:
                    # Create unique identifier using filename + email received datetime
                    unique_filename = filename
                    if email_received_date:
                        # Parse the received date and format it as YYYYMMDD_HHMMSS
                        try:
                            from datetime import datetime
                            parsed_date = datetime.fromisoformat(
                                email_received_date.replace('Z', '+00:00'))
                            datetime_str = parsed_date.strftime(
                                '%Y%m%d_%H%M%S')
                            unique_filename = f"{filename}_{datetime_str}"
                        except Exception as e:
                            logger.warning(
                                f"Could not parse email date {email_received_date}: {e}")
                            unique_filename = filename

                    pdf_contents.append({
                        'content': attachment_response.content,
                        'filename': unique_filename,
                        'original_filename': filename  # Keep original for display purposes
                    })
                    logger.info(
                        f"Downloaded PDF: {filename} -> {unique_filename}")
                else:
                    logger.error(
                        f"Failed to download attachment: {attachment_response.text}")

        return pdf_contents


async def refresh_token_if_needed(user: User, db: Session) -> str:
    """Refresh access token if needed and return valid token"""
    # For public clients, we'll try to use the stored token first
    # If it's expired, the user will need to re-authenticate

    if not user.outlook_access_token:
        logger.warning(f"No access token for user {user.id}")
        raise HTTPException(
            status_code=401,
            detail="No Outlook token found. Please connect your Outlook account."
        )

    # Check if token is expired or about to expire (5 minutes buffer)
    if user.outlook_token_expires:
        try:
            # Handle both date and datetime objects for compatibility
            if hasattr(user.outlook_token_expires, 'date'):
                # It's a datetime object
                expires_datetime = user.outlook_token_expires
            else:
                # It's a date object, convert to datetime
                from datetime import time
                expires_datetime = datetime.combine(
                    user.outlook_token_expires, time.max)

            if expires_datetime <= datetime.now() + timedelta(minutes=5):
                logger.warning(
                    f"Token expired for user {user.id}, expires: {expires_datetime}")
                raise HTTPException(
                    status_code=401,
                    detail="Outlook token has expired. Please reconnect your Outlook account."
                )
        except Exception as e:
            logger.error(
                f"Error checking token expiration for user {user.id}: {e}")
            # If we can't check expiration, assume it's valid and let the API call fail if needed
            pass
    else:
        logger.info(
            f"No token expiration time set for user {user.id}, assuming token is valid")

    return user.outlook_access_token


@router.post("/sync")
async def sync_outlook_emails(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Sync emails from Outlook and process receipts"""
    if not current_user.outlook_access_token:
        raise HTTPException(status_code=400, detail="Outlook not connected")

    user_id = current_user.id

    try:
        # Initialize progress
        update_sync_progress(user_id, "starting",
                             "Initializing Outlook sync...")

        # Ensure we have a valid token
        update_sync_progress(user_id, "starting",
                             "Validating authentication token...")
        token = await refresh_token_if_needed(current_user, db)

        # Search entire email history (no date restrictions)
        logger.info("Searching entire email history for receipts")

        processed = 0
        skipped = 0
        errors = []

        logger.info(f"Starting Outlook sync for user {user_id}")
        total_senders = len(RECEIPT_SENDERS)

        # Collect all PDFs for batch processing
        all_pdfs = []  # For batch processing

        for sender_idx, sender in enumerate(RECEIPT_SENDERS):
            update_sync_progress(
                user_id,
                "searching",
                f"Searching emails from {sender.split('@')[0]}...",
                total_senders,
                sender_idx
            )

            logger.info(f"Searching emails from {sender}")

            try:
                emails = await search_emails_from_sender(token, sender)

                # Process emails with attachments
                for email in emails:
                    # If email has attachments, collect PDFs
                    if email.get("hasAttachments"):
                        try:
                            # Download PDFs for batch processing
                            pdf_attachments = await download_pdf_attachments(
                                token,
                                email["id"],
                                email.get('receivedDateTime')
                            )
                            all_pdfs.extend(pdf_attachments)

                        except Exception as e:
                            logger.warning(
                                f"Could not process attachments for email {email.get('subject', 'Unknown')}: {str(e)}")
                            errors.append(
                                f"Email {email['subject']}: {str(e)}")

                if emails:
                    update_sync_progress(
                        user_id,
                        "downloading",
                        f"Found {len(emails)} emails from {sender.split('@')[0]}, collecting attachments...",
                        total_senders,
                        sender_idx
                    )

            except Exception as e:
                logger.error(f"Error searching emails from {sender}: {str(e)}")
                logger.error(f"Exception type: {type(e).__name__}")
                if hasattr(e, 'response'):
                    logger.error(f"Response status: {e.response.status_code}")
                    logger.error(f"Response text: {e.response.text}")
                errors.append(f"Sender {sender}: {str(e)}")

        # Second pass: process all PDFs in batches of 10
        if all_pdfs:
            logger.info(
                f"Found {len(all_pdfs)} PDFs total, processing in batches of 10")
            update_sync_progress(
                user_id,
                "extracting",
                f"Processing {len(all_pdfs)} receipts in batches...",
                total_senders,
                total_senders
            )

            batch_size = 10
            for i in range(0, len(all_pdfs), batch_size):
                batch = all_pdfs[i:i + batch_size]
                batch_num = i//batch_size + 1
                total_batches = (len(all_pdfs) + batch_size - 1) // batch_size

                logger.info(
                    f"Processing batch {batch_num}/{total_batches}: {len(batch)} PDFs")

                try:
                    batch_results = await process_pdf_batch(batch, db, current_user)

                    for result in batch_results:
                        if result.success:
                            processed += 1
                            logger.info(f"Successfully processed batch item")
                        else:
                            skipped += 1
                            logger.warning(
                                f"Failed to process: {result.message}")
                            errors.append(result.message)

                except Exception as e:
                    logger.error(
                        f"Error processing batch {batch_num}: {str(e)}")
                    for pdf_data in batch:
                        skipped += 1
                        errors.append(
                            f"{pdf_data['filename']}: Batch processing error - {str(e)}")

            logger.info(
                f"Completed batch processing: {processed} processed, {skipped} skipped")

        message = f"Processed {processed} receipts from Outlook"
        if skipped > 0:
            message += f", skipped {skipped}"
        if errors:
            # Show first 3 errors
            message += f". Errors: {'; '.join(errors[:3])}"
            if len(errors) > 3:
                message += f" (and {len(errors) - 3} more)"

        # Update progress to completed
        update_sync_progress(
            user_id,
            "completed",
            f"Sync completed: {processed} receipts processed",
            total_senders,
            total_senders
        )

        # Update last sync time
        current_user.outlook_last_sync = datetime.now()
        db.commit()

        logger.info(f"Outlook sync completed for user {user_id}: {message}")
        return {"message": message, "processed": processed, "skipped": skipped}

    except Exception as e:
        logger.error(f"Outlook sync failed for user {user_id}: {str(e)}")
        update_sync_progress(user_id, "error", f"Sync failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/status")
def get_outlook_status(current_user: User = Depends(get_current_user)):
    """Check if Outlook is connected"""
    is_connected = current_user.outlook_access_token is not None
    expires = None
    last_sync = None

    if current_user.outlook_token_expires:
        expires = current_user.outlook_token_expires.isoformat()
        # Check if token is expired
        # Handle both datetime.date and datetime.datetime types
        token_expires = current_user.outlook_token_expires
        if isinstance(token_expires, date) and not isinstance(token_expires, datetime):
            # Convert date to datetime for comparison
            token_expires = datetime.combine(
                token_expires, datetime.min.time())

        if token_expires <= datetime.now():
            is_connected = False  # Token is expired

    if current_user.outlook_last_sync:
        last_sync = current_user.outlook_last_sync.isoformat()

    return {
        "connected": is_connected,
        "expires": expires,
        "last_sync": last_sync
    }


@router.post("/disconnect")
def disconnect_outlook(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Disconnect Outlook account"""
    logger.info(f"Disconnecting Outlook for user {current_user.id}")

    current_user.outlook_access_token = None
    current_user.outlook_refresh_token = None
    current_user.outlook_token_expires = None
    current_user.outlook_state = None
    db.commit()

    return {"message": "Outlook disconnected successfully"}
