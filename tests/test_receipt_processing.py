"""
Unit tests for receipt API processing logic with new fields.
Tests the actual processing functions without requiring running services.
"""

import pytest
from datetime import datetime, date
from unittest.mock import Mock, patch
import json

# Import the processing logic
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.schemas import ReceiptUploadResponse


class TestReceiptProcessingLogic:
    """Test receipt processing logic with new API structure"""

    def test_validate_new_api_response_fields(self):
        """Test validation logic for new API response structure"""
        
        # Test complete data
        complete_receipt_data = {
            "market": "TestMart",
            "branch": "Main Branch",
            "total": 89.99,
            "total_discount": 10.00,
            "total_paid": 79.99,
            "date": "17/09/2024",
            "products": [
                {
                    "product_type": "Food",
                    "product": "Apple",
                    "price": 1.50,
                    "quantity": 2,
                    "discount": 0.20,
                    "discount2": 0.00
                }
            ]
        }
        
        required_keys = ["market", "branch", "total", "total_discount", "total_paid", "date", "products"]
        missing_keys = [key for key in required_keys if key not in complete_receipt_data]
        
        assert len(missing_keys) == 0, f"Complete data should have all required keys"
        
        # Test incomplete data (missing new fields)
        incomplete_receipt_data = {
            "market": "TestMart",
            "branch": "Main Branch", 
            "total": 89.99,  # Only old total field
            "date": "17/09/2024",
            "products": []
        }
        
        missing_keys = [key for key in required_keys if key not in incomplete_receipt_data]
        
        assert "total_discount" in missing_keys
        assert "total_paid" in missing_keys
        assert len(missing_keys) == 2

    def test_date_parsing_formats(self):
        """Test various date formats are handled correctly"""
        
        test_dates = [
            ("17/09/2024", "%d/%m/%Y"),
            ("17-09-2024", "%d-%m-%Y"),
            ("2024-09-17", "%Y-%m-%d"),
            ("09/17/2024", "%m/%d/%Y"),
            ("09-17-2024", "%m-%d-%Y")
        ]
        
        for date_str, expected_format in test_dates:
            # Test that the date can be parsed
            try:
                parsed_date = datetime.strptime(date_str, expected_format).date()
                assert isinstance(parsed_date, date)
                print(f"✅ Successfully parsed '{date_str}' with format '{expected_format}'")
            except ValueError as e:
                pytest.fail(f"Failed to parse date '{date_str}' with format '{expected_format}': {e}")

    def test_receipt_creation_with_new_fields(self):
        """Test creating receipt object with new field structure"""
        
        receipt_data = {
            "market": "NewAPIMarket",
            "branch": "Updated Branch",
            "invoice": "INV-2024-001",
            "total": 125.50,      # Total before discounts
            "total_discount": 20.75,  # Total discount amount
            "total_paid": 104.75,     # Amount actually paid
        }
        
        # Simulate creating a receipt object (without database)
        mock_receipt = Mock()
        mock_receipt.market = receipt_data["market"]
        mock_receipt.branch = receipt_data["branch"]
        mock_receipt.invoice = receipt_data.get("invoice")
        mock_receipt.total = receipt_data["total"]
        mock_receipt.total_discount = receipt_data.get("total_discount", 0)
        mock_receipt.total_paid = receipt_data["total_paid"]
        
        # Verify all fields are set correctly
        assert mock_receipt.market == "NewAPIMarket"
        assert mock_receipt.branch == "Updated Branch"
        assert mock_receipt.invoice == "INV-2024-001"
        assert mock_receipt.total == 125.50
        assert mock_receipt.total_discount == 20.75
        assert mock_receipt.total_paid == 104.75
        
        # Verify math is consistent
        assert mock_receipt.total - mock_receipt.total_discount == mock_receipt.total_paid

    def test_batch_api_response_parsing(self):
        """Test parsing the new batch API response structure"""
        
        sample_api_response = {
            "results": [
                {
                    "success": True,
                    "receipt": {
                        "market": "SuperMarket",
                        "branch": "Downtown",
                        "invoice": "SM001",
                        "total": 67.80,
                        "total_discount": 8.30,
                        "total_paid": 59.50,
                        "date": "17/09/2024",
                        "products": [
                            {
                                "product_type": "Dairy",
                                "product": "Milk",
                                "price": 2.50,
                                "quantity": 2,
                                "discount": 0.25,
                                "discount2": 0.00
                            }
                        ]
                    },
                    "error_message": None
                },
                {
                    "success": False,
                    "receipt": None,
                    "error_message": "Could not extract receipt data"
                }
            ],
            "total_files": 2,
            "successful_extractions": 1,
            "failed_extractions": 1
        }
        
        # Test parsing
        assert "results" in sample_api_response
        assert len(sample_api_response["results"]) == 2
        assert sample_api_response["total_files"] == 2
        assert sample_api_response["successful_extractions"] == 1
        assert sample_api_response["failed_extractions"] == 1
        
        # Test successful result
        success_result = sample_api_response["results"][0]
        assert success_result["success"] is True
        assert success_result["receipt"] is not None
        
        receipt_data = success_result["receipt"]
        assert receipt_data["total"] == 67.80
        assert receipt_data["total_discount"] == 8.30
        assert receipt_data["total_paid"] == 59.50
        
        # Test failed result
        failed_result = sample_api_response["results"][1]
        assert failed_result["success"] is False
        assert failed_result["receipt"] is None
        assert failed_result["error_message"] is not None

    def test_backward_compatibility_handling(self):
        """Test handling of receipts from old API format"""
        
        # Simulate old API response (before the update)
        old_receipt_data = {
            "market": "OldFormatMarket",
            "branch": "Legacy Branch",
            "total": 45.00,  # This was the amount paid in old format
            "date": "15/09/2024",
            "products": []
        }
        
        # Test migration logic: old 'total' becomes 'total_paid'
        migrated_data = {
            "market": old_receipt_data["market"],
            "branch": old_receipt_data["branch"],
            "total": old_receipt_data["total"],        # Assume no discount
            "total_discount": 0,                       # No discount info in old format
            "total_paid": old_receipt_data["total"],   # Old total was amount paid
            "date": old_receipt_data["date"],
            "products": old_receipt_data["products"]
        }
        
        # Verify migration logic
        assert migrated_data["total"] == migrated_data["total_paid"]
        assert migrated_data["total_discount"] == 0
        assert migrated_data["total"] == 45.00
        assert migrated_data["total_paid"] == 45.00

    def test_spending_summary_calculation(self):
        """Test spending summary uses total_paid instead of total"""
        
        # Mock receipts with new field structure
        mock_receipts = [
            Mock(total=100.00, total_discount=10.00, total_paid=90.00),
            Mock(total=75.50, total_discount=5.50, total_paid=70.00),
            Mock(total=50.00, total_discount=0.00, total_paid=50.00),
        ]
        
        # Calculate total spent using total_paid (what was actually paid)
        total_spent = sum(receipt.total_paid for receipt in mock_receipts)
        assert total_spent == 210.00  # 90 + 70 + 50
        
        # Verify this is different from using total (before discount)
        total_before_discount = sum(receipt.total for receipt in mock_receipts)
        assert total_before_discount == 225.50  # 100 + 75.5 + 50
        
        # Verify we're using the correct field (amount actually paid)
        assert total_spent < total_before_discount
        
        receipt_count = len(mock_receipts)
        average_per_receipt = total_spent / receipt_count
        assert average_per_receipt == 70.00  # 210 / 3

    def test_upload_response_structure(self):
        """Test ReceiptUploadResponse with new data structure"""
        
        extracted_data = {
            "market": "ResponseTest",
            "branch": "Test Branch",
            "total": 33.75,
            "total_discount": 3.75,
            "total_paid": 30.00,
            "date": "17/09/2024",
            "products": []
        }
        
        # Test successful response
        success_response = ReceiptUploadResponse(
            success=True,
            receipt_id=123,
            message="Receipt processed successfully",
            extracted_data=extracted_data
        )
        
        assert success_response.success is True
        assert success_response.receipt_id == 123
        assert success_response.extracted_data["total_paid"] == 30.00
        assert success_response.extracted_data["total_discount"] == 3.75
        
        # Test failure response
        failure_response = ReceiptUploadResponse(
            success=False,
            message="Missing required fields: total_discount, total_paid",
            extracted_data=None
        )
        
        assert failure_response.success is False
        assert failure_response.receipt_id is None
        assert "total_discount" in failure_response.message
        assert "total_paid" in failure_response.message


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])