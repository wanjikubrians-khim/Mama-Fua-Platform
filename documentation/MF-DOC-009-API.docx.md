

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 9**

API Reference

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document is the API reference for the Mama Fua platform REST API. All endpoints are served from https://api.mamafua.co.ke/api/v1. Responses are JSON. Authentication uses Bearer JWT tokens in the Authorization header.

*This document covers the primary endpoints. A full interactive API reference (Swagger/OpenAPI) is available at https://api.mamafua.co.ke/docs in development and staging environments only.*

# **2\. Authentication**

## **2.1 Base URL & Headers**

Base URL:    https://api.mamafua.co.ke/api/v1

Content-Type: application/json

Authorization: Bearer \<access\_token\>

## **2.2 Auth Endpoints**

| Method | Endpoint | Auth Required | Description |
| :---- | :---- | :---- | :---- |
| POST | /auth/request-otp | No | Send OTP to phone number |
| POST | /auth/verify-otp | No | Verify OTP, return tokens |
| POST | /auth/refresh | No (refresh token) | Rotate tokens |
| POST | /auth/logout | Yes | Invalidate refresh token |
| POST | /auth/register | No | Create account (after OTP verify) |

## **2.3 Request / Response Example**

// POST /auth/request-otp

{ "phone": "+254712345678" }

// Response 200

{ "success": true, "expiresIn": 600 }

// POST /auth/verify-otp

{ "phone": "+254712345678", "otp": "482917" }

// Response 200

{ "accessToken": "eyJ...", "refreshToken": "eyJ...", "user": { "id": "...", "role": "CLIENT" } }

# **3\. User Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /users/me | Yes | Get current user profile |
| PATCH | /users/me | Yes | Update profile (name, language, avatar) |
| POST | /users/me/avatar | Yes | Upload profile photo (multipart) |
| DELETE | /users/me | Yes | Request account deletion |
| GET | /users/me/notifications | Yes | List notifications (paginated) |
| PATCH | /users/me/notifications/:id/read | Yes | Mark notification as read |
| POST | /users/me/device-token | Yes | Register FCM device token |

# **4\. Cleaner Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /cleaners/:id | Yes | Get cleaner public profile |
| PATCH | /cleaners/me | CLEANER | Update cleaner profile and bio |
| POST | /cleaners/me/verify | CLEANER | Submit ID documents for verification |
| GET | /cleaners/me/earnings | CLEANER | Get earnings summary and history |
| GET | /cleaners/me/wallet | CLEANER | Get wallet balance and transactions |
| POST | /cleaners/me/withdraw | CLEANER | Request payout withdrawal |
| GET | /cleaners/me/availability | CLEANER | Get availability slots |
| POST | /cleaners/me/availability | CLEANER | Create availability slot |
| DELETE | /cleaners/me/availability/:id | CLEANER | Delete availability slot |
| PATCH | /cleaners/me/available | CLEANER | Toggle availability on/off |
| GET | /cleaners/me/services | CLEANER | List offered services and prices |
| POST | /cleaners/me/services | CLEANER | Add a service offering |
| PATCH | /cleaners/me/services/:id | CLEANER | Update service price |
| DELETE | /cleaners/me/services/:id | CLEANER | Remove a service offering |

# **5\. Booking Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| POST | /bookings | CLIENT | Create a new booking |
| GET | /bookings | Yes | List own bookings (paginated, filterable) |
| GET | /bookings/:id | Yes | Get booking detail |
| PATCH | /bookings/:id/cancel | Yes | Cancel a booking |
| POST | /bookings/:id/accept | CLEANER | Accept an assigned booking |
| POST | /bookings/:id/decline | CLEANER | Decline an assigned booking |
| POST | /bookings/:id/start | CLEANER | Check in — mark job started |
| POST | /bookings/:id/complete | CLEANER | Mark job as completed |
| POST | /bookings/:id/confirm | CLIENT | Confirm job completion |
| GET | /bookings/:id/chat | Yes | Get chat message history |
| POST | /bookings/:id/dispute | CLIENT | Open a dispute |
| POST | /bookings/:id/bids | CLEANER | Submit a bid (POST\_BID mode) |
| GET | /bookings/:id/bids | CLIENT | List bids on a booking |
| POST | /bookings/:id/bids/:bidId/accept | CLIENT | Accept a cleaner's bid |

## **5.1 Create Booking Request Body**

POST /bookings

{

  "serviceId":          "uuid",

  "mode":               "AUTO\_ASSIGN | BROWSE\_PICK | POST\_BID",

  "cleanerId":          "uuid",      // required for BROWSE\_PICK

  "addressId":          "uuid",      // use existing saved address

  "address":            { ... },     // or provide new address inline

  "scheduledAt":        "2025-08-15T09:00:00+03:00",

  "bookingType":        "ONE\_OFF | RECURRING",

  "recurringFrequency": "WEEKLY",    // if RECURRING

  "specialInstructions":"Please bring your own mop.",

  "paymentMethod":      "MPESA | STRIPE\_CARD | WALLET",

  "mpesaPhone":         "+254712345678"  // if MPESA

}

# **6\. Payment Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| POST | /payments/mpesa/initiate | CLIENT | Initiate M-Pesa STK Push for booking |
| GET | /payments/mpesa/status/:checkoutId | CLIENT | Poll M-Pesa payment status |
| POST | /payments/stripe/intent | CLIENT | Create Stripe PaymentIntent |
| GET | /payments/:bookingId | Yes | Get payment record for a booking |
| POST | /webhooks/mpesa/stk | No (Safaricom) | M-Pesa STK Push callback |
| POST | /webhooks/mpesa/b2c | No (Safaricom) | M-Pesa B2C result callback |
| POST | /webhooks/stripe | No (Stripe) | Stripe event webhook |

# **7\. Location Endpoints**

| Method | Endpoint | Auth | Description |
| :---- | :---- | :---- | :---- |
| GET | /location/autocomplete | Yes | Address autocomplete suggestions |
| GET | /location/place | Yes | Place details by place\_id |
| GET | /location/coverage | Yes | Check cleaner coverage for an area |
| GET | /location/cleaners/nearby | CLIENT | Browse cleaners near a point |
| POST | /location/cleaner/position | CLEANER | Update live GPS position |
| GET | /location/cleaner/:id/position | Yes | Get last cleaner position (booking parties) |

# **8\. Error Codes**

| HTTP Status | Meaning |
| :---- | :---- |
| 200 OK | Request succeeded |
| 201 Created | Resource created successfully |
| 400 Bad Request | Request body malformed or missing required fields |
| 401 Unauthorized | Missing or invalid Bearer token |
| 403 Forbidden | Authenticated but insufficient permissions for this action |
| 404 Not Found | Resource does not exist or is soft-deleted |
| 409 Conflict | Resource already exists (e.g. duplicate phone number) |
| 422 Unprocessable Entity | Validation failed — response body includes field-level errors |
| 429 Too Many Requests | Rate limit exceeded. Retry-After header included. |
| 500 Internal Server Error | Unexpected server error. Request ID included for support. |
| 503 Service Unavailable | Temporary outage or maintenance mode. |

## **8.1 Error Response Format**

{ "success": false,

  "error": {

    "code": "VALIDATION\_ERROR",

    "message": "Validation failed",

    "requestId": "req\_01J9X...",

    "fields": {

      "phone": "Invalid Kenyan phone number format",

      "scheduledAt": "Must be at least 2 hours in the future"

    }

  }

}

*End of Document MF-DOC-009*

Mama Fua Platform — KhimTech  
Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru  |  2026