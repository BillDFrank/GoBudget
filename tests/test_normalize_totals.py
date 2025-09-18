from app.routes.receipts import _normalize_totals
import sys
import os

# Add backend to path like other tests do
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))


def test_normalize_when_total_is_none_uses_products_sum():
    data = {
        "total": None,
        "total_paid": 2.99,
        "total_discount": None,
        "products": [
            {"price": 2.99, "quantity": 1}
        ],
    }
    total, discount, paid = _normalize_totals(data)
    assert total == 2.99
    assert discount == 0.0
    assert paid == 2.99


essential = {
    "products": [
        {"price": 3.00, "quantity": 2},  # 6.00
    ]
}


def test_normalize_when_only_total_sets_paid_minus_discount():
    data = {**essential, "total": 10.0,
            "total_discount": 3.0, "total_paid": None}
    total, discount, paid = _normalize_totals(data)
    assert total == 10.0
    assert discount == 3.0
    assert paid == 7.0


def test_normalize_when_only_paid_sets_total_equal_paid():
    data = {**essential, "total": None,
            "total_discount": None, "total_paid": 5.5}
    total, discount, paid = _normalize_totals(data)
    assert total == 6.0  # prefers products sum when available
    assert discount == 0.5  # 6.0 - 5.5
    assert paid == 5.5


def test_normalize_all_none_defaults_to_zero():
    data = {"total": None, "total_paid": None,
            "total_discount": None, "products": []}
    total, discount, paid = _normalize_totals(data)
    assert total == 0.0
    assert discount == 0.0
    assert paid == 0.0
