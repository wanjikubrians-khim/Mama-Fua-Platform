# Mama Fua — QA & Testing Guide
# KhimTech | QA Owner: Maryann Wanjiru | 2026

---

## Overview

This document is Maryann's primary reference for the Mama Fua test suite.
It covers test structure, how to run tests, what each file tests, and
what to focus on when reviewing new features.

---

## Test Structure

```
packages/api/src/__tests__/
├── unit/
│   ├── shared.utils.test.ts          Constants, formatKES, normalisePhone, calculateCommission
│   ├── booking.state-machine.test.ts  Every valid and invalid booking status transition
│   ├── mpesa.service.test.ts          STK callback handling, B2C result handling
│   ├── auth.service.test.ts           OTP flow, JWT refresh, lockouts
│   └── matching.engine.test.ts        Cleaner scoring algorithm (haversine + score weights)
│
├── integration/
│   ├── auth.routes.test.ts            HTTP: request-otp, verify-otp, register, refresh
│   ├── bookings.routes.test.ts        HTTP: create, get, accept, start, complete, dispute
│   ├── payments.routes.test.ts        HTTP: STK initiate, wallet pay, payout request
│   └── webhooks.routes.test.ts        HTTP: M-Pesa STK callback, B2C result, Stripe
│
├── fixtures/
│   └── index.ts                       Factory functions for creating test users, bookings etc
│
└── helpers/
    ├── env.setup.ts                   Env vars for test environment
    ├── auth.helper.ts                 JWT helper for test requests
    ├── global.setup.ts                Runs once before all tests
    └── global.teardown.ts             Runs once after all tests
```

---

## Running Tests

```bash
# All tests
cd packages/api
pnpm test

# Unit tests only (fast — no server needed)
pnpm test:unit

# Integration tests only
pnpm test:integration

# Watch mode (re-runs on file change)
pnpm test:watch

# With coverage report
pnpm test:coverage
```

---

## Coverage Targets

| Metric     | Target |
|------------|--------|
| Lines      | 75%    |
| Functions  | 75%    |
| Branches   | 70%    |
| Statements | 75%    |

Run `pnpm test:coverage` and open `packages/api/coverage/index.html` to see the full report.

---

## Priority Test Areas (Maryann's Focus)

### 1. Booking State Machine (CRITICAL)
File: `unit/booking.state-machine.test.ts`

This is the most financially sensitive code in the platform. A wrong transition
can release funds before a job is done, or prevent a legitimate job from completing.

Every test here must pass before any booking-related code is merged.

Key scenarios to always test:
- `IN_PROGRESS → COMPLETED` triggers `scheduleEscrowRelease`
- `COMPLETED → CONFIRMED` triggers `releaseEscrow`
- `CONFIRMED`, `CANCELLED`, `REFUNDED` are terminal — no further transitions
- Only the booking's own client can confirm
- Only the assigned cleaner can start/complete
- Admin can cancel any cancellable booking

### 2. M-Pesa Callbacks (CRITICAL)
File: `unit/mpesa.service.test.ts`, `integration/webhooks.routes.test.ts`

These are irreversible financial operations. Test every ResultCode scenario.

Key scenarios:
- ResultCode 0 → payment SUCCEEDED, booking → PAID, escrow activated
- ResultCode 1032 (user cancelled) → payment FAILED, booking unchanged
- ResultCode 1 (insufficient funds) → payment FAILED
- Unknown CheckoutRequestID → no crash, no update
- Redis cleanup after callback
- Webhook always returns 200 to Safaricom (even on error)
- Webhook responds before async processing completes

### 3. Auth Flow (HIGH)
File: `unit/auth.service.test.ts`, `integration/auth.routes.test.ts`

Key scenarios:
- OTP hash stored correctly in Redis
- Wrong OTP increments attempt counter
- 5 wrong attempts = account locked for 15 minutes
- Locked account returns 429
- Expired OTP (not in Redis) returns OTP_EXPIRED
- SUSPENDED/BANNED users cannot log in
- Refresh token rotation (old invalidated, new issued)
- Revoked refresh token rejected

### 4. Commission Calculation (HIGH)
File: `unit/shared.utils.test.ts`

The calculateCommission function must satisfy this invariant for ALL inputs:
```
platformFee + cleanerEarnings === totalAmount
```

Test with: standard, premium, agency, recurring, cash rates.

### 5. Payout Limits (HIGH)
File: `integration/payments.routes.test.ts`

- Minimum withdrawal: KES 200 (20000 cents)
- Maximum per day: 3 withdrawals
- Over KES 5,000: requires admin approval
- Insufficient balance: 402 response
- Below minimum: 422 response

---

## Adding New Tests

When Brian adds a new feature, Maryann should add tests in this order:

1. **Unit test** the core service logic with mocked dependencies
2. **Integration test** the HTTP endpoint with supertest
3. **Edge case tests** — invalid inputs, missing auth, wrong roles, DB errors

Template for a new test file:
```typescript
// Mama Fua — [Unit/Integration] Tests: [Feature Name]
// KhimTech | QA: Maryann Wanjiru | 2026

describe('[FeatureName]', () => {
  beforeEach(() => jest.clearAllMocks());

  it('happy path: [what should happen]', async () => {
    // Arrange
    // Act
    // Assert
  });

  it('returns 4xx for [invalid input]', async () => {
    // ...
  });

  it('returns 403 for [wrong role]', async () => {
    // ...
  });
});
```

---

## Test Data

Never hardcode UUIDs or phone numbers in tests. Use fixtures:

```typescript
import { createTestClient, createTestCleaner, createTestBooking } from '../fixtures';

const client = await createTestClient();
const cleaner = await createTestCleaner({ rating: 4.8 });
const booking = await createTestBooking({
  clientId: client.id,
  cleanerId: cleaner.cleanerProfile!.userId,
  serviceId: service.id,
  addressId: address.id,
  status: 'PENDING',
});
```

Clean up after integration tests that touch the database:
```typescript
afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});
```

---

## CI Pipeline

Tests run automatically on every PR via GitHub Actions (`.github/workflows/ci.yml`).

A PR cannot be merged if:
- Any test fails
- Coverage drops below thresholds
- TypeScript errors exist

---

## Reporting Bugs

When a test fails in staging or production:

1. Write a failing test that reproduces the bug FIRST
2. Fix the code to make the test pass
3. Never fix the code without a test — the bug will return

Bug report template:
```
Bug: [short description]
File: [which service/route]
Steps to reproduce:
  1. ...
Expected: ...
Actual: ...
Test added: [filename]:[line]
```

---

*KhimTech | Mama Fua Platform | 2026*
*QA Owner: Maryann Wanjiru | Lead Dev: Brian Wanjiku*
