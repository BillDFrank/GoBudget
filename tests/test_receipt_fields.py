"""
Unit tests for receipt models and schemas with new API fields.
These tests don't require Docker services to be running.
"""

import pytest
from datetime import date
from pydantic import ValidationError

# Import the models and schemas
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.schemas import ReceiptBase, ReceiptCreate, Receipt, ReceiptProduct
from app.models import Receipt as ReceiptModel, ReceiptProduct as ReceiptProductModel


class TestReceiptSchemas:
    """Test receipt Pydantic schemas with new fields"""

    def test_receipt_base_with_new_fields(self):
        """Test ReceiptBase schema includes new fields"""
        receipt_data = {
            "market": "Supermarket ABC",
            "branch": "Downtown Branch",
            "invoice": "INV-123",
            "date": date.today(),
            "total": 150.00,  # Total before discounts
            "total_discount": 25.00,  # Discount amount
            "total_paid": 125.00  # Amount actually paid
        }
        
        receipt = ReceiptBase(**receipt_data)
        
        assert receipt.market == "Supermarket ABC"
        assert receipt.branch == "Downtown Branch"
        assert receipt.invoice == "INV-123"
        assert receipt.total == 150.00
        assert receipt.total_discount == 25.00
        assert receipt.total_paid == 125.00

    def test_receipt_base_with_zero_discount(self):
        """Test receipt with no discount"""
        receipt_data = {
            "market": "Supermarket XYZ",
            "branch": "Mall Branch",
            "date": date.today(),
            "total": 100.00,
            "total_discount": 0.00,
            "total_paid": 100.00
        }
        
        receipt = ReceiptBase(**receipt_data)
        
        assert receipt.total == receipt.total_paid
        assert receipt.total_discount == 0.00

    def test_receipt_base_default_discount(self):
        """Test that total_discount defaults to 0 when not provided"""
        receipt_data = {
            "market": "Supermarket DEF",
            "branch": "Suburb Branch",
            "date": date.today(),
            "total": 75.50,
            "total_paid": 75.50
        }
        
        receipt = ReceiptBase(**receipt_data)
        
        assert receipt.total_discount == 0

    def test_receipt_base_missing_required_fields(self):
        """Test validation fails when required fields are missing"""
        
        # Missing total_paid
        with pytest.raises(ValidationError):
            ReceiptBase(
                market="Test Market",
                branch="Test Branch",
                date=date.today(),
                total=100.00
                # total_paid is missing
            )

        # Missing total
        with pytest.raises(ValidationError):
            ReceiptBase(
                market="Test Market",
                branch="Test Branch",
                date=date.today(),
                total_paid=100.00
                # total is missing
            )

    def test_receipt_create_with_products(self):
        """Test ReceiptCreate with products"""
        product_data = {
            "product_type": "Food",
            "product": "Bread",
            "quantity": 2.0,
            "price": 3.50,
            "discount": 0.50,
            "discount2": 0.00
        }
        
        receipt_data = {
            "market": "Local Store",
            "branch": "Main Street",
            "date": date.today(),
            "total": 14.00,
            "total_discount": 1.00,
            "total_paid": 13.00,
            "products": [product_data]
        }
        
        receipt = ReceiptCreate(**receipt_data)
        
        assert len(receipt.products) == 1
        assert receipt.products[0].product == "Bread"
        assert receipt.products[0].discount == 0.50


class TestReceiptAPIResponseStructure:
    """Test handling of new API response structure"""

    def test_new_api_response_structure(self):
        """Test parsing the new API response structure"""
        
        # Simulate the new API response structure
        api_response = {
            "results": [
                {
                    "success": True,
                    "receipt": {
                        "market": "SuperMart",
                        "branch": "Central Plaza",
                        "invoice": "SM-2024-001",
                        "total": 89.95,  # Total before discount
                        "total_discount": 12.45,  # Discount amount
                        "total_paid": 77.50,  # Amount paid after discount
                        "date": "2024-09-17",
                        "products": [
                            {
                                "product_type": "Groceries",
                                "product": "Milk 1L",
                                "price": 2.99,
                                "quantity": 2,
                                "discount": 0.30,
                                "discount2": 0.00
                            },
                            {
                                "product_type": "Groceries",
                                "product": "Bread Whole Wheat",
                                "price": 3.49,
                                "quantity": 1,
                                "discount": 0.00,
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
        
        # Test that we can access all the new fields
        result = api_response["results"][0]
        receipt_data = result["receipt"]
        
        assert result["success"] is True
        assert receipt_data["total"] == 89.95
        assert receipt_data["total_discount"] == 12.45
        assert receipt_data["total_paid"] == 77.50
        assert len(receipt_data["products"]) == 2

    def test_validate_receipt_data_completeness(self):
        """Test validation of required fields in API response"""
        
        # Complete data should pass
        complete_data = {
            "market": "TestMart",
            "branch": "Test Branch",
            "total": 50.00,
            "total_discount": 5.00,
            "total_paid": 45.00,
            "date": "2024-09-17",
            "products": []
        }
        
        required_keys = ["market", "branch", "total", "total_discount", "total_paid", "date", "products"]
        missing_keys = [key for key in required_keys if key not in complete_data]
        
        assert len(missing_keys) == 0, f"Missing required keys: {missing_keys}"
        
        # Incomplete data should fail validation
        incomplete_data = {
            "market": "TestMart",
            "branch": "Test Branch",
            "total": 50.00,
            # missing total_discount and total_paid
            "date": "2024-09-17",
            "products": []
        }
        
        missing_keys = [key for key in required_keys if key not in incomplete_data]
        assert len(missing_keys) > 0, "Should detect missing keys"
        assert "total_discount" in missing_keys
        assert "total_paid" in missing_keys


class TestReceiptCalculations:
    """Test receipt calculation logic"""

    def test_total_calculations(self):
        """Test that total, discount, and paid amounts are consistent"""
        
        # Test case where total - total_discount = total_paid
        total_before = 100.00
        discount = 15.00
        total_paid = 85.00
        
        assert total_before - discount == total_paid
        
        # Test receipt with this data
        receipt_data = {
            "market": "MathMart",
            "branch": "Calculator Branch",
            "date": date.today(),
            "total": total_before,
            "total_discount": discount,
            "total_paid": total_paid
        }
        
        receipt = ReceiptBase(**receipt_data)
        
        # Verify the math works out
        assert receipt.total - receipt.total_discount == receipt.total_paid

    def test_no_discount_scenario(self):
        """Test receipt where no discount was applied"""
        
        receipt_data = {
            "market": "NoDiscountMart",
            "branch": "Full Price Branch",
            "date": date.today(),
            "total": 50.00,
            "total_discount": 0.00,
            "total_paid": 50.00
        }
        
        receipt = ReceiptBase(**receipt_data)
        
        assert receipt.total == receipt.total_paid
        assert receipt.total_discount == 0.00

    def test_backward_compatibility_logic(self):
        """Test logic for handling old receipts during migration"""
        
        # Simulate old receipt where total was the amount paid
        old_total_value = 75.00  # This was the amount actually paid
        
        # In migration, this should become:
        migrated_data = {
            "market": "OldMart",
            "branch": "Legacy Branch", 
            "date": date.today(),
            "total": old_total_value,  # Assume no discount for old receipts
            "total_discount": 0.00,    # No discount info available
            "total_paid": old_total_value  # What was actually paid
        }
        
        receipt = ReceiptBase(**migrated_data)
        
        assert receipt.total == receipt.total_paid  # No discount applied
        assert receipt.total_discount == 0.00


if __name__ == "__main__":
    # Run the tests
    pytest.main([__file__, "-v"])