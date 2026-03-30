

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 8**

Security, Compliance & Privacy

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Overview**

This document defines the security architecture, compliance requirements, and privacy framework for the Mama Fua platform. It covers application security, infrastructure security, data protection, regulatory compliance under Kenyan law, and the cleaner verification and fraud prevention system.

*Security is not a feature to be added later — it is a foundational requirement. A single data breach or payment fraud incident in a market built on trust could permanently damage the platform's reputation. Every design decision must consider the security implications.*

# **2\. Application Security**

## **2.1 Authentication Security**

* JWT access tokens signed with RS256 (2048-bit RSA). Asymmetric signing means compromise of a verification service does not expose signing keys.

* Access tokens: 15-minute expiry. Short-lived to limit exposure window if stolen.

* Refresh tokens: 30-day expiry, single-use (rotation on each use). Stored as SHA-256 hash in Redis.

* OTP codes: 6-digit, cryptographically random (crypto.randomInt). SHA-256 hashed before Redis storage.

* OTP expiry: 10 minutes. Maximum 5 attempts before lockout.

* Account lockout: 5 failed OTP attempts → 15-minute lockout. Tracked in Redis.

* Token blacklist: invalidated refresh tokens stored in Redis with TTL \= remaining token lifetime.

## **2.2 Input Validation & Sanitisation**

* All API inputs validated with Zod schemas before reaching business logic. Invalid requests rejected with HTTP 422\.

* Prisma ORM uses parameterised queries exclusively — SQL injection is structurally prevented.

* All text inputs sanitised to strip HTML tags before storage — XSS prevention.

* File uploads validated by MIME type and file signature (magic bytes), not extension alone.

* Upload size limits enforced: profile photos 5MB, job photos 10MB, ID scans 8MB.

## **2.3 API Security**

| Control | Implementation |
| :---- | :---- |
| Rate limiting | 100 req/min per authenticated user. 20 req/min per IP unauthenticated. Redis sliding window. |
| CORS | Explicit allowlist: mamafua.co.ke, app.mamafua.co.ke, admin.mamafua.co.ke. No wildcard in production. |
| HTTPS enforcement | HTTP → HTTPS redirect at infrastructure level. HSTS header with 1-year max-age. |
| Security headers | Helmet.js: CSP, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy. |
| Request IDs | Every request assigned UUID. Logged end-to-end for trace correlation. |
| Webhook validation | M-Pesa: IP whitelist \+ HMAC. Stripe: signature verification via constructEvent(). |
| Admin IP whitelist | Admin dashboard accessible only from registered office IP ranges. |

# **3\. Infrastructure Security**

## **3.1 Secrets Management**

* All secrets (API keys, database URLs, JWT private keys) stored in Railway and Vercel environment variables.

* Secrets never committed to source code. .env files in .gitignore. Pre-commit hooks scan for secret patterns.

* Production secrets rotated quarterly or immediately on suspected compromise.

* Database credentials: each service module has a dedicated DB user with minimum required permissions (principle of least privilege).

## **3.2 Network Security**

* All traffic encrypted with TLS 1.3. TLS 1.0 and 1.1 disabled.

* Database connection encrypted. Supabase enforces SSL on all connections.

* Redis connections use TLS (Upstash enforces by default).

* Internal service-to-service calls use private network (Railway private networking) — not exposed to internet.

## **3.3 Database Security**

* Row-Level Security (RLS) enabled in Supabase as defence-in-depth.

* No direct public internet access to database — accessible only via application server.

* Automated daily backups with 30-day retention.

* Point-in-time recovery enabled — can restore to any second in the last 7 days.

* Database audit logging enabled — all queries logged for 90 days.

# **4\. Data Protection & Privacy**

## **4.1 Kenya Data Protection Act 2019 (KDPA) Compliance**

The Mama Fua platform processes personal data of Kenyan residents and is subject to the Kenya Data Protection Act 2019, administered by the Office of the Data Protection Commissioner (ODPC).

* Data controller registration: Mama Fua Ltd registered with ODPC before launch.

* Lawful basis for processing: contract performance (bookings), legitimate interest (fraud prevention), consent (marketing).

* Data subjects rights implemented: access, rectification, erasure, objection, portability.

* Privacy notice: displayed at registration and available at mamafua.co.ke/privacy.

* Data breach notification: ODPC notified within 72 hours of discovery of any breach. Affected users notified within 7 days.

## **4.2 Data Minimisation**

| Data Type | Retention Policy |
| :---- | :---- |
| User profiles (active) | Retained while account is active |
| User profiles (deleted) | Anonymised after 30 days of deletion request |
| Booking records | 7 years (financial record requirement, CBK) |
| Payment records | 7 years (KRA tax compliance) |
| Chat messages | 90 days after booking completion, then deleted |
| GPS position data | Not stored in DB — Redis TTL 60 seconds only |
| ID scan documents | Until cleaner account deleted \+ 90 days |
| Audit logs | 7 years (financial compliance) |
| OTP codes | 10 minutes (Redis TTL) |
| Push notification tokens | Refreshed on each login; stale tokens purged after 90 days |

## **4.3 Sensitive Data Handling**

* National ID numbers: stored encrypted at rest using AES-256-GCM. Searchable via HMAC of the plaintext.

* Bank account numbers: stored encrypted. Only last 4 digits shown in UI.

* M-Pesa phone numbers: stored in plaintext (required for API calls) but masked in logs (e.g. \+2547\*\*\*\*678).

* Payment card data: never stored. Stripe tokenises cards — only Stripe customer ID and last 4 digits stored.

* Passwords: bcrypt with 12 rounds. bcrypt.compare() used for verification — constant-time to prevent timing attacks.

# **5\. Fraud Prevention**

## **5.1 Account Fraud Signals**

| Signal | Action |
| :---- | :---- |
| Multiple accounts on same phone number | Block registration. Flag for admin review. |
| Multiple accounts on same device ID | Soft-block: require manual admin approval for second account. |
| Velocity: \>5 bookings in 1 hour | Temporary hold. Admin review. |
| Payment failure rate \>30% in 7 days | Flag client account. Require M-Pesa only. |
| Dispute rate \>20% of completed jobs | Automatic cleaner suspension pending review. |
| Booking cancelled immediately after acceptance repeatedly | Flag cleaner for low acceptance rate penalty. |
| Login from new country | Send security alert SMS to registered phone. |

## **5.2 Payment Fraud Controls**

* M-Pesa STK Push: client must enter their own M-Pesa PIN — platform never handles PIN.

* Stripe: 3D Secure authentication required for all card transactions above KES 5,000.

* Payout velocity: maximum 3 withdrawals per day. Large payouts require admin approval.

* B2C payout phone validated against registered cleaner phone before processing.

# **6\. Incident Response**

| Severity | Definition | Response Time |
| :---- | :---- | :---- |
| P0 — Critical | Data breach, payment fraud, system down | 15 minutes — all hands |
| P1 — High | Auth system failure, payment processing down | 1 hour |
| P2 — Medium | Feature outage, SMS/push failure | 4 hours |
| P3 — Low | Performance degradation, minor bug | Next business day |

Incident response contacts stored in 1Password shared vault. On-call rotation managed via PagerDuty. Post-incident review required for all P0 and P1 incidents within 48 hours.

*End of Document MF-DOC-008*

Mama Fua Platform — KhimTech  
Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru  |  2026