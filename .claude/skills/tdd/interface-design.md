# Interface Design for Testability

Good interfaces make testing natural:

## 1. Accept dependencies, don't create them

```python
# Testable - dependencies injected
async def process_payment_request(
    payment_id: int,
    icyte_client: IcyteAPIClient,
    client_session: AsyncSession,
    common_session: AsyncSession,
):
    payment = await get_payment(client_session, payment_id)
    result = await icyte_client.submit_payment(payment.to_dict())
    return result

# Hard to test - creates dependencies internally
async def process_payment_request(payment_id: int):
    icyte_client = IcyteAPIClient()  # Hard to mock
    async with get_client_session() as session:  # Hard to intercept
        payment = await get_payment(session, payment_id)
        result = await icyte_client.submit_payment(payment.to_dict())
        return result
```

## 2. Return results, don't produce side effects

```python
# Testable - returns result
async def calculate_payment_approval_tier(
    payment: Payment,
    subrole: Subrole,
) -> int:
    """Returns tier value based on payment amount and subrole configuration"""
    if payment.payment_amount <= subrole.tier.max_approval_amount:
        return subrole.tier.value
    return subrole.tier.value + 1

# Hard to test - mutates input, returns nothing
async def apply_payment_approval_tier(
    payment: Payment,
    subrole: Subrole,
) -> None:
    """Modifies payment object directly"""
    if payment.payment_amount <= subrole.tier.max_approval_amount:
        payment.tier_value = subrole.tier.value
    else:
        payment.tier_value = subrole.tier.value + 1
```

## 3. Small surface area

```python
# GOOD: Small interface, focused responsibility
class PaymentApprovalService:
    async def approve(
        self,
        payment_id: int,
        user: User,
        session: AsyncSession,
    ) -> PaymentApproval:
        """Single focused method with minimal parameters"""
        # Deep implementation hidden here
        pass

# BAD: Large interface, many parameters
class PaymentApprovalService:
    async def approve_with_validation_and_notification(
        self,
        payment_id: int,
        user: User,
        session: AsyncSession,
        validate_tier: bool = True,
        send_email: bool = True,
        email_template: str = "default",
        notify_client: bool = True,
        update_history: bool = True,
    ) -> tuple[PaymentApproval, bool, Optional[str]]:
        """Too many parameters = too many test combinations"""
        pass
```

Fewer methods = fewer tests needed. Fewer params = simpler test setup.
