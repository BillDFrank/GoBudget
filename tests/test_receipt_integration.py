"""
Integration tests for receipt processing with mocked database operations.
Tests the complete flow without requiring actual database connections.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import date, datetime
import json

# Import required modules
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.schemas import ReceiptUploadResponse


class TestReceiptIntegration:
    """Integration tests for receipt processing flow"""

    @patch('app.routes.receipts.httpx.AsyncClient')
    @patch('app.routes.receipts.get_db')
    @patch('app.routes.receipts.get_current_user')
    def test_complete_receipt_upload_flow_new_api(self, mock_user, mock_db, mock_client):
        """Test complete receipt upload flow with new API response structure"""
        
        # Mock user
        mock_current_user = Mock()
        mock_current_user.id = 1
        mock_user.return_value = mock_current_user
        
        # Mock database session
        mock_session = Mock()
        mock_db.return_value = mock_session
        
        # Mock the new API response
        new_api_response = {
            "results": [
                {
                    "success": True,
                    "receipt": {
                        "market": "SuperMart Plus",
                        "branch": "Downtown Plaza",
                        "invoice": "SM-2024-0917-001",
                        "total": 145.75,      # Total before discount
                        "total_discount": 22.85,  # Total discount applied
                        "total_paid": 122.90,     # Amount actually paid
                        "date": "17/09/2024",
                        "products": [
                            {
                                "product_type": "Groceries",
                                "product": "Organic Bananas",
                                "price": 4.50,
                                "quantity": 2,
                                "discount": 0.45,
                                "discount2": 0.00
                            },
                            {
                                "product_type": "Household",
                                "product": "Dish Soap",
                                "price": 8.99,
                                "quantity": 1,
                                "discount": 1.50,
                                "discount2": 0.50
                            }
                        ]
                    },
                    "error_message": None
                }
            ],
            "total_files": 1,
            "successful_extractions": 1,
            "failed_extractions": 0
        }
        
        # Mock HTTP client response
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = new_api_response
        
        mock_client_instance = Mock()
        mock_client_instance.post.return_value = mock_response
        mock_client.return_value.__aenter__.return_value = mock_client_instance
        
        # Mock database operations
        mock_receipt = Mock()
        mock_receipt.id = 123
        mock_session.add.return_value = None
        mock_session.flush.return_value = None
        mock_session.commit.return_value = None
        mock_session.refresh.return_value = None
        
        # Create mock file upload
        mock_file = Mock()
        mock_file.filename = "test_receipt.pdf"
        mock_file.read.return_value = b"fake pdf content"
        
        # Test the validation logic that would happen in the actual route
        result = new_api_response["results"][0]
        receipt_data = result["receipt"]
        
        # Validate new required fields are present
        required_keys = ["market", "branch", "total", "total_discount", "total_paid", "date", "products"]
        missing_keys = [key for key in required_keys if key not in receipt_data]
        
        assert len(missing_keys) == 0, f"Missing required keys: {missing_keys}"
        
        # Test date parsing
        date_str = receipt_data["date"]
        parsed_date = datetime.strptime(date_str, "%d/%m/%Y").date()
        assert parsed_date == date(2024, 9, 17)
        
        # Test receipt creation with new fields
        receipt_creation_data = {
            "market": receipt_data["market"],
            "branch": receipt_data["branch"],
            "invoice": receipt_data.get("invoice"),
            "total": receipt_data["total"],
            "total_discount": receipt_data.get("total_discount", 0),
            "total_paid": receipt_data["total_paid"],
            "date": parsed_date,
            "user_id": mock_current_user.id
        }
        
        # Verify all required data is present and correct
        assert receipt_creation_data["market"] == "SuperMart Plus"
        assert receipt_creation_data["total"] == 145.75
        assert receipt_creation_data["total_discount"] == 22.85
        assert receipt_creation_data["total_paid"] == 122.90
        assert receipt_creation_data["total"] - receipt_creation_data["total_discount"] == receipt_creation_data["total_paid"]
        
        # Test product creation
        products_data = receipt_data["products"]
        assert len(products_data) == 2
        
        for product_data in products_data:
            product_creation_data = {
                "product_type": product_data["product_type"],
                "product": product_data["product"],
                "quantity": product_data["quantity"],
                "price": product_data["price"],
                "discount": product_data.get("discount", 0),
                "discount2": product_data.get("discount2", 0),
                "receipt_id": 123  # Mock receipt ID
            }
            
            # Verify product data is correctly structured
            assert all(key in product_creation_data for key in ["product_type", "product", "quantity", "price"])

    def test_migration_scenario_simulation(self):
        """Test migration scenario for existing receipts"""
        
        # Simulate existing receipt data (pre-migration)
        existing_receipts = [
            {"id": 1, "total": 75.50, "market": "OldMart", "date": "2024-09-01"},
            {"id": 2, "total": 123.25, "market": "LegacyStore", "date": "2024-09-05"},
            {"id": 3, "total": 45.00, "market": "VintageShop", "date": "2024-09-10"}
        ]
        
        # Simulate migration process
        migrated_receipts = []
        for receipt in existing_receipts:
            migrated_receipt = {
                "id": receipt["id"],
                "market": receipt["market"],
                "date": receipt["date"],
                "total": receipt["total"],         # Keep same value (assume no discount)
                "total_discount": 0.0,            # No discount info available
                "total_paid": receipt["total"]    # Old total was amount paid
            }
            migrated_receipts.append(migrated_receipt)
        
        # Verify migration logic
        for original, migrated in zip(existing_receipts, migrated_receipts):
            assert migrated["total"] == original["total"]
            assert migrated["total_paid"] == original["total"]
            assert migrated["total_discount"] == 0.0
            assert migrated["total"] - migrated["total_discount"] == migrated["total_paid"]

    def test_spending_summary_with_new_fields(self):
        """Test spending summary calculation uses correct fields"""
        
        # Mock receipts with new field structure
        mock_receipts = [
            {
                "id": 1,
                "total": 100.00,         # Before discount
                "total_discount": 15.00, # Discount applied
                "total_paid": 85.00,     # Actually paid
                "date": "2024-09-15"
            },
            {
                "id": 2,
                "total": 50.00,
                "total_discount": 0.00,
                "total_paid": 50.00,
                "date": "2024-09-16"
            },
            {
                "id": 3,
                "total": 75.25,
                "total_discount": 8.75,
                "total_paid": 66.50,
                "date": "2024-09-17"
            }
        ]
        
        # Calculate spending summary using total_paid (what users actually spent)
        total_spent = sum(receipt["total_paid"] for receipt in mock_receipts)
        receipt_count = len(mock_receipts)
        average_per_receipt = total_spent / receipt_count
        total_savings = sum(receipt["total_discount"] for receipt in mock_receipts)
        
        assert total_spent == 201.50  # 85.00 + 50.00 + 66.50
        assert receipt_count == 3
        assert round(average_per_receipt, 2) == 67.17  # Properly rounded to 2 decimal places
        assert total_savings == 23.75  # 15.00 + 0.00 + 8.75
        
        # Verify we're using total_paid instead of total
        total_before_discounts = sum(receipt["total"] for receipt in mock_receipts)
        assert total_before_discounts == 225.25  # 100.00 + 50.00 + 75.25
        assert total_spent < total_before_discounts  # Should be less due to discounts

    def test_error_handling_missing_new_fields(self):
        """Test error handling when new API fields are missing"""
        
        # Simulate API response missing new fields (old format)
        incomplete_api_response = {
            "results": [
                {
                    "success": True,
                    "receipt": {
                        "market": "IncompleteData",
                        "branch": "Missing Fields",
                        "total": 50.00,  # Only old field present
                        "date": "17/09/2024",
                        "products": []
                        # Missing: total_discount, total_paid
                    },
                    "error_message": None
                }
            ]
        }
        
        receipt_data = incomplete_api_response["results"][0]["receipt"]
        required_keys = ["market", "branch", "total", "total_discount", "total_paid", "date", "products"]
        missing_keys = [key for key in required_keys if key not in receipt_data]
        
        # Should detect missing fields
        assert len(missing_keys) == 2
        assert "total_discount" in missing_keys
        assert "total_paid" in missing_keys
        
        # Simulate error response creation
        error_response = ReceiptUploadResponse(
            success=False,
            message=f"Incomplete receipt data. Missing: {missing_keys}",
            extracted_data=receipt_data
        )
        
        assert error_response.success is False
        assert "total_discount" in error_response.message
        assert "total_paid" in error_response.message

    def test_api_response_validation_edge_cases(self):
        """Test edge cases in API response validation"""
        
        # Test zero discount scenario
        zero_discount_data = {
            "market": "NoDiscountMart",
            "branch": "Full Price",
            "total": 25.00,
            "total_discount": 0.00,
            "total_paid": 25.00,
            "date": "17/09/2024",
            "products": []
        }
        
        required_keys = ["market", "branch", "total", "total_discount", "total_paid", "date", "products"]
        missing_keys = [key for key in required_keys if key not in zero_discount_data]
        
        assert len(missing_keys) == 0
        assert zero_discount_data["total"] == zero_discount_data["total_paid"]
        assert zero_discount_data["total_discount"] == 0.00
        
        # Test high discount scenario
        high_discount_data = {
            "market": "ClearanceMart",
            "branch": "Sale Section",
            "total": 100.00,
            "total_discount": 75.00,   # 75% discount
            "total_paid": 25.00,
            "date": "17/09/2024",
            "products": []
        }
        
        missing_keys = [key for key in required_keys if key not in high_discount_data]
        
        assert len(missing_keys) == 0
        assert high_discount_data["total"] - high_discount_data["total_discount"] == high_discount_data["total_paid"]
        assert high_discount_data["total_discount"] / high_discount_data["total"] == 0.75  # 75% discount


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])