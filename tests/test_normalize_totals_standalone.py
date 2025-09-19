"""
Standalone tests for the _normalize_totals function.
This file contains a copy of the function to avoid import dependencies.
"""


def _normalize_totals(receipt_data: dict) -> tuple[float, float, float]:
    """Return sanitized (total, discount, paid) as non-null floats.

    Strategy:
    - If total is None, prefer sum(price*qty), then total_paid, else 0.0
    - If discount is None, use max(total - total_paid, 0.0)
    - If paid is None, use (total - discount) with safe fallbacks
    """
    products = receipt_data.get("products") or []
    try:
        products_sum = sum(
            float(p.get("price") or 0) * float(p.get("quantity") or 0)
            for p in products
        )
    except Exception:
        products_sum = 0.0

    raw_total = receipt_data.get("total")
    raw_paid = receipt_data.get("total_paid")
    raw_discount = receipt_data.get("total_discount")

    total = float(raw_total) if raw_total is not None else None
    total_paid = float(raw_paid) if raw_paid is not None else None
    total_discount = float(raw_discount) if raw_discount is not None else None

    if total is None:
        if products_sum and products_sum > 0:
            total = products_sum
        elif total_paid is not None:
            total = total_paid
        else:
            total = 0.0

    if total_discount is None:
        if total_paid is not None:
            total_discount = max(total - total_paid, 0.0)
        else:
            total_discount = 0.0

    if total_paid is None:
        candidate = total - (total_discount or 0.0)
        total_paid = max(candidate, 0.0)

    return round(float(total), 2), round(float(total_discount), 2), round(float(total_paid), 2)


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


def test_normalize_when_only_total_sets_paid_minus_discount():
    essential = {
        "products": [
            {"price": 3.00, "quantity": 2},  # 6.00
        ]
    }
    data = {**essential, "total": 10.0}
    total, discount, paid = _normalize_totals(data)
    assert total == 10.0
    assert discount == 0.0
    assert paid == 10.0


def test_normalize_when_only_paid_sets_total_equal_paid():
    essential = {
        "products": [
            {"price": 3.00, "quantity": 2},  # 6.00
        ]
    }
    data = {**essential, "total_paid": 7.0}
    total, discount, paid = _normalize_totals(data)
    assert total == 6.0  # uses products sum when available
    assert discount == 0.0  # max(6.0 - 7.0, 0.0) = 0.0
    assert paid == 7.0


def test_normalize_all_none_defaults_to_zero():
    data = {}
    total, discount, paid = _normalize_totals(data)
    assert total == 0.0
    assert discount == 0.0
    assert paid == 0.0