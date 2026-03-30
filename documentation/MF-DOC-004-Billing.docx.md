

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 4**

Billing & Payments Module

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document specifies the complete billing and payments architecture for the Mama Fua platform. It covers all payment methods supported, the escrow model, commission calculation, wallet management, payout processing, refund handling, and the integration specifics for M-Pesa Daraja and Stripe.

*All monetary values in this system are stored and processed as integers in Kenya Shillings (KES) cents. KES 1,200.00 is represented as 120000\. This eliminates floating-point rounding errors in financial calculations.*

# **2\. Payment Methods**

## **2.1 M-Pesa (Primary)**

M-Pesa is the primary payment method, accounting for the majority of transactions. Integration is via Safaricom's Daraja API v2 using OAuth 2.0 bearer tokens.

| Daraja Feature | Details |
| :---- | :---- |
| API Base URL (Production) | https://api.safaricom.co.ke |
| API Base URL (Sandbox) | https://sandbox.safaricom.co.ke |
| Auth Endpoint | POST /oauth/v1/generate?grant\_type=client\_credentials |
| STK Push Endpoint | POST /mpesa/stkpush/v1/processrequest |
| Query Status Endpoint | POST /mpesa/stkpushquery/v1/query |
| B2C Endpoint | POST /mpesa/b2c/v1/paymentrequest |
| Callback Method | HTTPS POST to platform webhook |
| Token Expiry | 3600 seconds — cached in Redis, refreshed proactively |

### **2.1.1 STK Push Flow (Client Payment)**

The STK Push (also called Lipa Na M-Pesa Online) initiates a payment by sending a prompt directly to the client's phone:

1. Client confirms booking and taps Pay Now.

2. Backend calls POST /mpesa/stkpush/v1/processrequest with BusinessShortCode, Amount, PhoneNumber, CallBackURL, AccountReference, and TransactionDesc.

3. Safaricom returns a CheckoutRequestID. Stored in payments table.

4. Client receives USSD prompt on their phone and enters M-Pesa PIN.

5. Safaricom sends callback to platform webhook: /api/v1/webhooks/mpesa/stk.

6. Webhook validates ResultCode (0 \= success). Updates payment status. Triggers booking state change.

7. If client does not respond within 60 seconds, status is polled via Query Status endpoint.

### **2.1.2 B2C Flow (Cleaner Payout)**

B2C (Business to Customer) is used to disburse cleaner earnings directly to their M-Pesa number:

8. Cleaner requests withdrawal from wallet in app.

9. Admin approves payout (or auto-approved if below KES 5,000 threshold).

10. Backend calls POST /mpesa/b2c/v1/paymentrequest with InitiatorName, SecurityCredential, CommandID (BusinessPayment), Amount, PartyA (shortcode), PartyB (cleaner phone), and QueueTimeOutURL \+ ResultURL.

11. Safaricom processes and sends result to ResultURL webhook.

12. On success: payout record updated, wallet\_transaction DEBIT recorded, cleaner notified via push \+ SMS.

13. On failure: payout retried up to 3 times with exponential backoff via Bull queue.

## **2.2 Stripe (Card Payments)**

Stripe handles all Visa and Mastercard transactions. The platform uses Payment Intents API with automatic payment methods enabled.

| Step | Actor | Action |
| :---- | :---- | :---- |
| 1 | Backend | Create PaymentIntent with amount, currency (kes), customer (stripeCustomerId), metadata (bookingId). |
| 2 | Frontend | Receive client\_secret from backend. Confirm payment using Stripe.js (web) or @stripe/stripe-react-native. |
| 3 | Stripe | Processes card. Sends payment\_intent.succeeded webhook to /api/v1/webhooks/stripe. |
| 4 | Backend | Validate webhook signature (Stripe-Signature header). Update payment \+ booking status. |
| 5 | Backend | Trigger escrow hold. Send booking confirmation to both parties. |

*Stripe webhook signatures must always be verified using the Stripe SDK's constructEvent() method and the endpoint's webhook secret. Unverified webhooks must be rejected with HTTP 400\.*

## **2.3 Platform Wallet**

Every client has an optional platform wallet that can be topped up and used for bookings. Wallet top-ups are done via M-Pesa or card, and the balance is stored in client\_profiles.walletBalance.

* Minimum top-up: KES 500\.

* Maximum wallet balance: KES 50,000 (CBK compliance for stored value).

* Wallet payments are instant — no external API call required.

* Wallet top-up creates a wallet\_transaction CREDIT record.

* Wallet spend creates a wallet\_transaction DEBIT record linked to the booking.

## **2.4 Cash on Completion**

Cash is supported as a payment option for selected cleaners who have opted in. When cash is selected:

* No payment is collected at booking time.

* A payment record with method=CASH and status=PENDING is created.

* After job completion, the cleaner marks the cash as received in the app.

* Platform updates payment status to SUCCEEDED and records the transaction.

* Commission is deducted from the cleaner's next digital payout.

  *Cash bookings have reduced dispute protection. Clients are warned of this before confirming a cash booking. Cash is limited to cleaners with a verified rating of 4.5 or above.*

# **3\. Commission & Pricing**

## **3.1 Commission Calculation**

The platform charges a commission on every completed booking. Commission is calculated at the time of booking confirmation and stored immutably on the booking record.

| Scenario | Commission Rate |
| :---- | :---- |
| Standard booking | 15% of booking total |
| Cleaner rating 4.8 or above | 12% of booking total |
| Agency account cleaner | 18% of booking total |
| Recurring booking (3rd booking onward) | 10% of booking total |
| Cash payment booking | 5% (deducted from next payout) |

### **3.1.1 Calculation Example**

Scenario: Standard home cleaning booking, KES 1,500, standard cleaner.

bookingTotal     \= 150000 (KES 1,500 in cents)

commissionRate   \= 0.15

platformFee      \= Math.round(150000 \* 0.15) \= 22500

cleanerEarnings  \= 150000 \- 22500 \= 127500

// Stored on booking record:

baseAmount       \= 150000

platformFee      \= 22500

totalAmount      \= 150000  // charged to client

cleanerEarnings  \= 127500  // released to cleaner wallet

## **3.2 Dynamic Pricing**

The platform supports surge pricing during peak demand periods (e.g. end of month, public holidays, post-rain days). Surge is controlled by admins and applied as a multiplier:

* Surge multiplier range: 1.0x (normal) to 1.5x (peak).

* Surge is shown clearly to the client before booking confirmation.

* Surge does NOT increase the commission rate — the platform takes its standard rate on the surged total.

* Cleaners earn more during surge periods, which incentivises availability.

# **4\. Escrow Model**

## **4.1 How Escrow Works**

All payments are held in escrow by the platform from the moment of booking confirmation until the job is verified complete. This is the core trust mechanism protecting both parties.

| Stage | Booking Status | Funds State |
| :---- | :---- | :---- |
| Client pays | PAID | Held by platform — not yet credited to cleaner |
| Job starts | IN\_PROGRESS | Still held — cleaner has checked in |
| Job completed | COMPLETED | 24-hour dispute window begins |
| No dispute raised | CONFIRMED | Funds released to cleaner wallet automatically |
| Dispute raised | DISPUTED | Funds frozen — admin reviews |
| Dispute: client wins | REFUNDED | Full or partial refund to client |
| Dispute: cleaner wins | CONFIRMED | Funds released to cleaner |

## **4.2 Escrow Release Automation**

Escrow release is handled by a Bull job scheduled when the booking moves to COMPLETED status:

// Bull job: escrow-release

// Scheduled: 24 hours after booking COMPLETED

async function releaseEscrow(bookingId) {

  const booking \= await prisma.booking.findUnique({ where: { id: bookingId } });

  if (booking.status \!== 'COMPLETED') return; // already disputed or confirmed

  await prisma.$transaction(\[

    prisma.booking.update({ where: { id: bookingId }, data: { status: 'CONFIRMED' } }),

    prisma.cleanerProfile.update({

      where: { userId: booking.cleanerId },

      data: { walletBalance: { increment: booking.cleanerEarnings } }

    }),

    prisma.walletTransaction.create({ data: {

      cleanerId: booking.cleanerId, type: 'CREDIT',

      amount: booking.cleanerEarnings, description: 'Job earnings released'

    }})

  \]);

  await notificationService.send(booking.cleanerId, 'PAYMENT', 'Earnings released\!');

}

# **5\. Wallet Management**

## **5.1 Cleaner Wallet**

Every cleaner has an internal wallet (walletBalance on cleaner\_profiles). The wallet is the ledger for all earnings, holds, and withdrawals.

| Operation | Description |
| :---- | :---- |
| CREDIT | Job earnings released from escrow after confirmed completion. |
| HOLD | Earnings reserved when job is COMPLETED but dispute window active. |
| RELEASE | Hold converted to CREDIT when dispute window passes without dispute. |
| DEBIT | Withdrawal processed to M-Pesa or bank. Platform commission on cash jobs. |

## **5.2 Withdrawal Rules**

* Minimum withdrawal: KES 200\.

* Maximum single withdrawal: KES 70,000 (M-Pesa B2C transaction limit).

* Withdrawals above KES 5,000 require admin approval (anti-fraud).

* Maximum 3 withdrawals per day per cleaner.

* Withdrawal to M-Pesa: processed within 1 hour during business hours (8am–8pm EAT).

* Withdrawal to bank: processed within 1–3 business days.

* Failed withdrawals: amount returned to wallet within 24 hours. Cleaner notified.

# **6\. Refunds**

## **6.1 Refund Policy**

| Scenario | Refund Policy |
| :---- | :---- |
| Cancelled by client (\>24hr before job) | Full refund to original payment method |
| Cancelled by client (\<24hr before job) | 50% refund — 50% cancellation fee to cleaner |
| Cancelled by cleaner | Full refund to client. Penalty flag on cleaner profile. |
| No-show by cleaner | Full refund \+ KES 200 platform credit to client. |
| Dispute resolved in client's favour | Full or partial refund per admin decision. |
| Technical payment failure | Full refund within 24 hours, no penalty. |

## **6.2 Refund Processing**

Refunds are processed back to the original payment method:

* M-Pesa refunds: processed via a separate B2C transaction to the client's phone. Takes 1–24 hours.

* Stripe card refunds: via Stripe Refunds API. Takes 5–10 business days to appear on statement.

* Wallet refunds: instant — balance credited immediately.

* Cash refunds: not applicable (no digital escrow held).

# **7\. Financial Reporting**

## **7.1 Platform Revenue Reports**

The admin dashboard provides the following financial reports, all exportable as CSV:

* Daily GMV — total booking value processed each day.

* Daily Revenue — platform commission collected each day.

* Payout Summary — total disbursed to cleaners each week/month.

* Refund Summary — total refunded, by reason code.

* Top Earners — cleaners ranked by total earnings.

* Payment Method Split — percentage of GMV by M-Pesa, card, wallet, cash.

## **7.2 Cleaner Income Statements**

Each cleaner can download a monthly income statement PDF from the app showing:

* All completed jobs with date, client area, service type, and gross amount.

* Platform commission deducted per job.

* Net earnings per job.

* Total earnings for the month.

* All withdrawals processed.

* Closing wallet balance.

  *These statements are designed to be usable for bank loan applications and tax compliance in Kenya, where freelancers are increasingly required to demonstrate digital income history.*

*End of Document MF-DOC-004*

Mama Fua — KhimTech  |  Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru