# M-Pesa Integration Guide
# KhimTech | Mama Fua Platform | 2026
# Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru

---

## Overview

This document covers everything needed to set up, test, and deploy the
M-Pesa Daraja API integration for the Mama Fua platform.

---

## 1. Safaricom Developer Account Setup

1. Go to https://developer.safaricom.co.ke
2. Create an account and log in
3. Go to **My Apps** → **Create App**
   - App Name: `Mama Fua`
   - Select: **Lipa Na M-Pesa Sandbox**, **M-Pesa Sandbox**
4. Note down:
   - Consumer Key
   - Consumer Secret
5. Go to **Sandbox** → **Test Credentials** to get:
   - Business Short Code: `174379`
   - Lipa Na M-Pesa Online Passkey

---

## 2. Environment Variables

Add these to `packages/api/.env`:

```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_CALLBACK_URL=https://your-ngrok-url/api/v1/webhooks/mpesa/stk
MPESA_B2C_RESULT_URL=https://your-ngrok-url/api/v1/webhooks/mpesa/b2c
MPESA_B2C_QUEUE_TIMEOUT_URL=https://your-ngrok-url/api/v1/webhooks/mpesa/b2c/timeout
MPESA_INITIATOR_NAME=testapi
MPESA_SECURITY_CREDENTIAL=your_security_credential
```

---

## 3. Exposing Localhost for Callbacks (Development)

Safaricom needs to call your webhook. In development, use ngrok:

```bash
# Install ngrok (one time)
npm install -g ngrok

# Expose your API
ngrok http 3001

# Copy the HTTPS URL e.g. https://abc123.ngrok.io
# Set MPESA_CALLBACK_URL=https://abc123.ngrok.io/api/v1/webhooks/mpesa/stk
# Set MPESA_B2C_RESULT_URL=https://abc123.ngrok.io/api/v1/webhooks/mpesa/b2c
```

---

## 4. Sandbox Test Credentials

Safaricom provides test phone numbers and PINs for sandbox testing:

| Test Phone     | PIN  |
|----------------|------|
| 254708374149   | 1234 |
| 254703052510   | 1234 |

Use these when initiating STK Push in sandbox.

---

## 5. Testing STK Push Flow

### Step 1: Create a booking (use test client credentials)
```bash
curl -X POST http://localhost:3001/api/v1/bookings \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "SERVICE_UUID",
    "mode": "AUTO_ASSIGN",
    "addressId": "ADDRESS_UUID",
    "scheduledAt": "2026-08-15T09:00:00+03:00",
    "bookingType": "ONE_OFF",
    "paymentMethod": "MPESA",
    "mpesaPhone": "+254712345678"
  }'
```

### Step 2: Initiate STK Push
```bash
curl -X POST http://localhost:3001/api/v1/payments/mpesa/initiate \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "BOOKING_UUID",
    "phone": "+254708374149"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "checkoutRequestId": "ws_CO_...",
    "message": "Success. Request accepted for processing",
    "instruction": "Check your phone and enter your M-Pesa PIN to complete payment."
  }
}
```

### Step 3: Check payment status (while waiting)
```bash
curl http://localhost:3001/api/v1/payments/mpesa/status/CHECKOUT_REQUEST_ID \
  -H "Authorization: Bearer CLIENT_ACCESS_TOKEN"
```

### Step 4: Simulate callback (for unit testing without real Safaricom)
```bash
# Simulate SUCCESS callback
curl -X POST http://localhost:3001/api/v1/webhooks/mpesa/stk \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "29115-34620561-1",
        "CheckoutRequestID": "ws_CO_191220191020363925",
        "ResultCode": 0,
        "ResultDesc": "The service request is processed successfully.",
        "CallbackMetadata": {
          "Item": [
            { "Name": "Amount", "Value": 1200 },
            { "Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV" },
            { "Name": "TransactionDate", "Value": 20191219102115 },
            { "Name": "PhoneNumber", "Value": 254708374149 }
          ]
        }
      }
    }
  }'
```

```bash
# Simulate FAILURE callback (user cancelled)
curl -X POST http://localhost:3001/api/v1/webhooks/mpesa/stk \
  -H "Content-Type: application/json" \
  -d '{
    "Body": {
      "stkCallback": {
        "MerchantRequestID": "29115-34620561-1",
        "CheckoutRequestID": "ws_CO_191220191020363925",
        "ResultCode": 1032,
        "ResultDesc": "Request cancelled by user"
      }
    }
  }'
```

---

## 6. Testing B2C (Cleaner Payouts)

### Step 1: Request a payout (as cleaner)
```bash
curl -X POST http://localhost:3001/api/v1/payments/payout/request \
  -H "Authorization: Bearer CLEANER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 120000,
    "method": "MPESA",
    "mpesaPhone": "+254708374149"
  }'
```

### Step 2: Simulate B2C success callback
```bash
curl -X POST http://localhost:3001/api/v1/webhooks/mpesa/b2c \
  -H "Content-Type: application/json" \
  -d '{
    "Result": {
      "ResultType": 0,
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "OriginatorConversationID": "19455-773836-1",
      "ConversationID": "AG_20191219_00005797af5d7d75f652",
      "TransactionID": "NLJ0000000",
      "ResultParameters": {
        "ResultParameter": [
          { "Key": "TransactionReceipt", "Value": "NLJ0000000" },
          { "Key": "TransactionAmount", "Value": 1200 },
          { "Key": "B2CWorkingAccountAvailableFunds", "Value": 900000.0 },
          { "Key": "B2CUtilityAccountAvailableFunds", "Value": 85500.0 },
          { "Key": "TransactionCompletedDateTime", "Value": "19.12.2019 10:25:00" },
          { "Key": "ReceiverPartyPublicName", "Value": "254708374149 - Grace Muthoni" }
        ]
      }
    }
  }'
```

---

## 7. Common Errors & Fixes

| Error Code | Meaning | Fix |
|------------|---------|-----|
| `400.008.02` | Invalid Access Token | Re-fetch token, check consumer key/secret |
| `404.001.03` | Invalid shortcode | Verify MPESA_SHORTCODE in env |
| `500.001.1001` | Unable to lock subscriber | User's M-Pesa PIN locked — try different test number |
| `1032` | Request cancelled by user | Normal — user rejected STK prompt |
| `1037` | DS timeout user | User ignored prompt for 60s |
| `2001` | Wrong PIN | Test user entered wrong PIN |

---

## 8. Going to Production

### Checklist before going live:

- [ ] Apply for M-Pesa API credentials at https://developer.safaricom.co.ke/docs#going-live
- [ ] Submit business registration documents to Safaricom
- [ ] Switch BASE_URL from sandbox to production (`api.safaricom.co.ke`)
- [ ] Set NODE_ENV=production (enables IP whitelist on webhook validator)
- [ ] Update MPESA_CALLBACK_URL to production domain
- [ ] Set Safaricom IP whitelist in your server firewall
- [ ] Test end-to-end with a real KES 1 transaction before launch
- [ ] Enable M-Pesa transaction alerts on the business number
- [ ] Set up Daraja API monitoring alerts

---

## 9. Security Notes

- Never log full M-Pesa phone numbers — use maskPhone() helper
- Never log security credentials or passkeys
- IP whitelist is enforced in production (see mpesa.security.ts)
- All Daraja tokens cached in Redis, not in-memory (survives restarts)
- B2C security credential must be generated using Safaricom's OpenSSL certificate

---

*KhimTech | Mama Fua Platform | 2026*
*Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru*
