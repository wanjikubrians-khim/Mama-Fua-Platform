

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 2**

System Architecture & Technical Design

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Introduction**

This document defines the complete system architecture for the Mama Fua platform. It covers the high-level design principles, component breakdown, technology stack, service communication patterns, infrastructure topology, and security architecture. This document should be read alongside MF-DOC-001 (Product Overview) and serves as the primary reference for all engineering decisions.

*Architecture Principle: The platform is designed as a modular, service-oriented system built for rapid iteration in the MVP phase, with a clear path to full microservices as scale demands. Premature over-engineering is avoided; each module is independently deployable from day one.*

# **2\. Architecture Overview**

## **2.1 Design Principles**

* API-first — all functionality is exposed via REST APIs; the frontend is a pure consumer.

* Mobile-first — all APIs are optimised for mobile network conditions (low latency, small payloads).

* Event-driven for async operations — bookings, notifications, and payouts use a job queue, not synchronous calls.

* Separation of concerns — auth, business logic, payments, and notifications are independent modules.

* Fail gracefully — every external integration (M-Pesa, SMS, Maps) has a fallback path.

* Security by default — no sensitive data in logs, all secrets in environment variables, RBAC enforced at middleware level.

## **2.2 System Layers**

The platform is organised into four distinct layers:

| Layer | Description |
| :---- | :---- |
| Presentation Layer | Client-facing web and mobile apps (Next.js, React Native). Communicates exclusively via HTTPS REST APIs. |
| API Layer | Node.js/Express gateway. Handles authentication, routing, rate limiting, and request validation. |
| Service Layer | Core business logic modules: Booking, Matching, Payments, Notifications, User Management. |
| Data Layer | PostgreSQL (primary store), Redis (cache/sessions), Cloud Storage (media), WebSockets (real-time). |

## **2.3 Deployment Architecture**

The system is deployed on Railway (backend services) and Vercel (frontend) with the following topology:

| Component | Platform | Notes |
| :---- | :---- | :---- |
| Next.js web app | Vercel | CDN-distributed, edge functions for SSR |
| React Native app | Expo EAS / App Store / Play Store | OTA updates via Expo |
| Node.js API server | Railway | Auto-scaling, zero-downtime deploys |
| PostgreSQL database | Supabase | Managed Postgres with realtime subscriptions |
| Redis cache | Upstash | Serverless Redis, pay-per-request |
| Media storage | Cloudinary | Auto-optimised images, ID scan storage |
| Job queue worker | Railway (worker dyno) | Bull queues backed by Redis |
| WebSocket server | Railway | Socket.io for live tracking and chat |

# **3\. Technology Stack**

## **3.1 Frontend**

| Technology | Version | Purpose | Justification |
| :---- | :---- | :---- | :---- |
| Next.js | 14+ | Web application framework | SSR, SEO, API routes, App Router |
| React Native | 0.73+ | Mobile app framework | Cross-platform iOS \+ Android |
| Expo | 50+ | Mobile dev toolchain | OTA updates, EAS builds |
| Tailwind CSS | 3+ | Styling system | Rapid UI development |
| React Query | 5+ | Server state management | Caching, background sync |
| Zustand | 4+ | Client state management | Lightweight, no boilerplate |
| React Hook Form | 7+ | Form handling | Performance, validation |
| React Native Maps | 1+ | Map display | Google Maps integration |

## **3.2 Backend**

| Technology | Version | Purpose | Justification |
| :---- | :---- | :---- | :---- |
| Node.js | 20 LTS | Runtime | Non-blocking I/O, large ecosystem |
| Express.js | 4+ | HTTP framework | Minimal, well-understood, fast |
| Prisma ORM | 5+ | Database access | Type-safe queries, migrations |
| Socket.io | 4+ | Real-time comms | WebSocket abstraction, rooms |
| Bull | 4+ | Job queue | Reliable async jobs via Redis |
| Passport.js | 0.6+ | Authentication | JWT \+ OAuth strategies |
| Zod | 3+ | Schema validation | Runtime type safety |
| Winston | 3+ | Logging | Structured logs, log levels |
| Jest | 29+ | Testing | Unit \+ integration tests |

## **3.3 Infrastructure & Services**

| Service | Provider | Purpose | Notes |
| :---- | :---- | :---- | :---- |
| PostgreSQL | Supabase | Primary database | Managed, backups, realtime |
| Redis | Upstash | Cache \+ job queue | Serverless, no server mgmt |
| Media storage | Cloudinary | Images, ID scans | Transform \+ CDN delivery |
| Email | SendGrid | Transactional email | Booking receipts, alerts |
| SMS | Africa's Talking | SMS notifications | Kenya coverage, Swahili support |
| Push notifications | Firebase FCM | Mobile push | iOS \+ Android |
| Mobile payments | M-Pesa Daraja | KES payments | STK Push \+ C2B \+ B2C |
| Card payments | Stripe | Card processing | Visa, Mastercard |
| Maps | Google Maps Platform | Location \+ routing | Geocoding, Distance Matrix |
| App deployment | Railway \+ Vercel | Hosting | CI/CD from GitHub |

# **4\. Service Architecture**

## **4.1 Service Breakdown**

The backend is structured as a monorepo with independently deployable service modules. Each service owns its routes, controllers, services, and validators.

| Service Module | Responsibilities |
| :---- | :---- |
| auth-service | Registration, login, JWT issuance, token refresh, OAuth (Google), session management. |
| user-service | Profile management for clients and cleaners. ID verification workflow. Avatar uploads. |
| booking-service | Creating, updating, and cancelling bookings. Booking state machine. Recurring schedule management. |
| matching-service | Cleaner discovery, auto-assign algorithm, availability checking, radius search. |
| payment-service | M-Pesa STK Push, Stripe charges, escrow management, wallet credits, payout processing. |
| notification-service | Push (FCM), SMS (Africa's Talking), email (SendGrid). Template management. |
| review-service | Post-job ratings and reviews. Review moderation. Rating aggregation. |
| chat-service | In-app messaging between client and cleaner via Socket.io rooms. |
| admin-service | Dashboard APIs, cleaner approval, dispute resolution, analytics queries. |
| location-service | Geocoding, reverse geocoding, distance calculations, live cleaner position updates. |

## **4.2 API Gateway**

All external requests pass through the API gateway layer before reaching service modules. The gateway is responsible for:

* JWT verification — every protected route validates the Bearer token before passing to the service.

* Rate limiting — using Redis to enforce per-user and per-IP limits (100 req/min default, 10 req/min for auth endpoints).

* Request logging — structured logs with request ID, user ID, path, status code, and duration.

* CORS — configured per environment with explicit allowed origins.

* Request validation — Zod schemas validate body, query, and params before hitting controllers.

* Role-based access control — middleware checks user role against route requirements (CLIENT, CLEANER, ADMIN).

## **4.3 Booking State Machine**

Every booking in the system moves through a defined set of states. Invalid state transitions are rejected at the API layer.

| State | Description |
| :---- | :---- |
| DRAFT | Client has started a booking but not confirmed. |
| PENDING | Booking submitted, awaiting cleaner acceptance. |
| ACCEPTED | Cleaner has accepted. Payment is being processed. |
| PAID | Payment confirmed. Escrow active. Job scheduled. |
| IN\_PROGRESS | Cleaner has checked in at the location. |
| COMPLETED | Cleaner has marked the job done. Awaiting client confirmation. |
| CONFIRMED | Client confirmed completion. Payout released to cleaner. |
| DISPUTED | Client raised a dispute. Under admin review. |
| CANCELLED | Booking cancelled by either party or system (e.g. no cleaner found). |
| REFUNDED | Payment reversed. Escrow returned to client. |

# **5\. Data Architecture**

## **5.1 Primary Database — PostgreSQL**

PostgreSQL via Supabase is the single source of truth for all persistent application data. Prisma ORM manages all queries, migrations, and type generation. The schema is documented in detail in MF-DOC-003.

**Key design decisions:**

* UUIDs are used as primary keys throughout — safer for distributed systems and avoids sequential ID enumeration attacks.

* Soft deletes on all user-facing entities — records are never physically deleted, only flagged with deletedAt.

* Audit timestamps (createdAt, updatedAt) on every table.

* PostGIS extension enabled for geospatial queries — cleaner location searches use ST\_DWithin for radius queries.

* Row-level security (RLS) enabled via Supabase — database-level access control as a second line of defence.

## **5.2 Caching Strategy — Redis**

| Cache Key Pattern | TTL / Usage |
| :---- | :---- |
| session:{userId} | 24 hours — JWT session data |
| cleaners:available:{lat}:{lng}:{radius} | 60 seconds — nearby cleaner search results |
| cleaner:profile:{cleanerId} | 10 minutes — cleaner profile data |
| booking:lock:{bookingId} | 5 minutes — pessimistic lock during payment |
| rate:limit:{userId} | 60 seconds — rolling request count window |
| otp:{phone} | 10 minutes — SMS verification codes |
| payout:queue:{cleanerId} | Persistent — Bull queue job data |

## **5.3 File Storage — Cloudinary**

All user-generated media is stored in Cloudinary with the following folder structure:

mama-fua/

  users/

    avatars/{userId}.jpg

    id-scans/{userId}-front.jpg

    id-scans/{userId}-back.jpg

    id-scans/{userId}-selfie.jpg

  jobs/

    before/{bookingId}-{n}.jpg

    after/{bookingId}-{n}.jpg

  reviews/

    {reviewId}-{n}.jpg

All ID scan images are stored with restricted access (signed URLs only, 15-minute expiry) and are only accessible by the cleaner and admins.

# **6\. Real-Time Architecture**

## **6.1 WebSocket Events**

Socket.io manages all real-time communication. Each user joins a personal room on connection (user:{userId}). Active bookings create a shared room (booking:{bookingId}) that both client and cleaner join.

| Event Name | Direction | Description |
| :---- | :---- | :---- |
| booking:accepted | Server → Client | Cleaner accepted the booking |
| booking:declined | Server → Client | Cleaner declined; system searching next |
| booking:in\_progress | Server → Client | Cleaner checked in, job started |
| booking:completed | Server → Client | Cleaner marked job done |
| cleaner:location | Server → Client | Live GPS position of cleaner (en route) |
| chat:message | Bidirectional | In-app message in booking room |
| payment:confirmed | Server → Client | M-Pesa / Stripe payment confirmed |
| notification:new | Server → Client | General push for alerts |

## **6.2 Live Location Tracking**

When a cleaner is en route to a job, the mobile app emits GPS coordinates every 10 seconds via the WebSocket connection. The server broadcasts these to the client's room. Coordinates are also written to Redis (not PostgreSQL) with a 60-second TTL to avoid database bloat. A full route history is NOT stored — only the last known position.

# **7\. Authentication & Authorisation**

## **7.1 Authentication Flow**

The platform uses JWT-based authentication with refresh token rotation.

**Registration:**

* User submits phone number. Platform sends OTP via Africa's Talking SMS.

* User verifies OTP. Account created. Access token (15 min) and refresh token (30 days) issued.

* All tokens signed with RS256 (asymmetric) — public key available for verification, private key server-only.

**Login:**

* Phone \+ OTP (preferred) or email \+ password.

* On success, new access token issued. Refresh token rotated (old token invalidated in Redis blacklist).

* Failed OTP attempts tracked. Account locked after 5 consecutive failures for 15 minutes.

**Token Refresh:**

* Client sends refresh token to POST /auth/refresh.

* Server validates token against Redis. Issues new access \+ refresh token pair.

* Old refresh token immediately invalidated (rotation prevents reuse).

## **7.2 Role-Based Access Control**

Four roles exist in the system. Role is embedded in the JWT payload and checked at middleware level.

| Role | Assigned To | Access Scope |
| :---- | :---- | :---- |
| CLIENT | All registered clients | Own profile, own bookings, search, payments |
| CLEANER | Verified cleaners | Own profile, assigned bookings, earnings, availability |
| ADMIN | Platform staff | All users, all bookings, disputes, payouts, analytics |
| SUPER\_ADMIN | Technical leads | All admin \+ system config, role management, audit logs |

# **8\. Security Architecture**

## **8.1 Data Security**

* All connections use TLS 1.3. HTTP traffic is rejected and redirected.

* Database credentials, API keys, and secrets stored in Railway/Vercel environment variables — never in code.

* Payment card data is never stored or logged on platform servers — Stripe handles PCI compliance.

* M-Pesa transaction references are stored but never raw card or phone PINs.

* User passwords hashed with bcrypt (12 rounds). Phone OTPs are hashed before Redis storage.

## **8.2 API Security**

* Rate limiting: 100 req/min per authenticated user, 20 req/min per IP for unauthenticated.

* Input validation via Zod on every endpoint — malformed requests rejected before business logic.

* SQL injection prevented by Prisma's parameterised query model.

* XSS prevented by returning JSON only — no server-rendered HTML from user input.

* CORS: explicit allowed origin list — no wildcard in production.

* Helmet.js applied globally — sets all security-relevant HTTP headers.

## **8.3 Cleaner Verification**

Before a cleaner can accept jobs, they must pass a three-step verification process:

* Step 1 — Phone verification: OTP to registered phone number.

* Step 2 — National ID: Front and back photo of Kenyan National ID uploaded and reviewed by admin.

* Step 3 — Selfie match: Live selfie compared against ID photo (manual review \+ optional future AI matching).

* Status transitions: PENDING → UNDER\_REVIEW → VERIFIED or REJECTED.

* Unverified cleaners cannot appear in search results or accept bookings.

## **8.4 Fraud Detection**

Basic fraud signals tracked and flagged for admin review:

* Multiple accounts registered to the same phone or device ID.

* Abnormal booking patterns — many bookings cancelled immediately after acceptance.

* Disputed jobs exceeding 20% of a cleaner's completed jobs.

* Payment failures followed by immediate retry with different methods.

# **9\. External Integration Architecture**

## **9.1 M-Pesa Integration (Daraja API)**

M-Pesa is the primary payment method and requires Safaricom's Daraja API v2. The integration uses three Daraja flows:

| Daraja Flow | Use Case |
| :---- | :---- |
| STK Push (C2B) | Client pays for a booking. Push prompt sent to client's phone. Real-time confirmation callback. |
| B2C (Business to Customer) | Platform disburses earnings to cleaner's M-Pesa number. |
| Account Balance | Admin checks platform M-Pesa wallet balance. |

All Daraja callbacks are received at a publicly accessible HTTPS webhook endpoint. Requests are validated using Safaricom's IP whitelist and HMAC signature verification before processing.

## **9.2 Stripe Integration**

Stripe handles all card-based payments. The integration uses Stripe Payment Intents with the following flow:

* Client initiates payment → server creates PaymentIntent → returns client\_secret.

* Client confirms payment using Stripe.js (web) or Stripe SDK (mobile).

* Stripe sends webhook to server on payment\_intent.succeeded.

* Server confirms payment, updates booking status to PAID.

* Refunds initiated via Stripe Refunds API on dispute resolution.

## **9.3 Africa's Talking SMS**

Africa's Talking provides SMS delivery across Kenyan networks (Safaricom, Airtel, Telkom). Used for:

* OTP delivery for phone verification and login.

* Booking confirmation SMS to clients (in case of notification failure).

* Payout confirmation SMS to cleaners.

* All SMS templates are pre-approved and available in English and Swahili.

## **9.4 Google Maps Platform**

Google Maps is used for three distinct functions:

| API | Usage |
| :---- | :---- |
| Geocoding API | Convert address text to lat/lng coordinates for job location. |
| Reverse Geocoding | Convert cleaner GPS coordinates to human-readable area name. |
| Distance Matrix API | Calculate travel time and distance between cleaner and job. |
| Maps JavaScript API | Render interactive map on web app for cleaner search. |
| Maps SDK (Android/iOS) | Render map in React Native app via react-native-maps. |

# **10\. CI/CD & Development Workflow**

## **10.1 Repository Structure**

The project uses a monorepo structure managed with pnpm workspaces:

mama-fua/

  apps/

    web/          (Next.js web app)

    mobile/       (React Native / Expo app)

    admin/        (Next.js admin dashboard)

  packages/

    api/          (Express API server)

    shared/       (Shared types, utils, constants)

    database/     (Prisma schema \+ migrations)

    ui/           (Shared component library)

  docs/           (This documentation series)

## **10.2 Branching Strategy**

| Branch | Purpose |
| :---- | :---- |
| main | Production. Protected. Requires PR \+ review \+ passing CI. |
| develop | Integration branch. Staging deployments trigger on push. |
| feature/{name} | Feature branches. Merge to develop via PR. |
| hotfix/{name} | Critical production fixes. Merge to main \+ develop. |
| release/{version} | Release preparation. Version bumps, changelogs. |

## **10.3 Deployment Pipeline**

GitHub Actions drives the CI/CD pipeline:

* On PR open: lint, type-check, unit tests, integration tests.

* On merge to develop: deploy to staging on Railway \+ Vercel preview.

* On merge to main: deploy to production. Database migrations run automatically via Prisma migrate deploy.

* Rollback: Railway allows instant rollback to previous deployment. Database rollback via migration revert.

## **10.4 Environments**

| Environment | URL | Purpose |
| :---- | :---- | :---- |
| Development | localhost:3000 | Local development with seeded test data |
| Staging | staging.mamafua.co.ke | QA testing, product review, integration testing |
| Production | app.mamafua.co.ke | Live user-facing environment |

# **11\. Monitoring & Observability**

## **11.1 Logging**

* All API requests logged with: timestamp, request ID, user ID, method, path, status, duration.

* Errors logged with full stack trace, user context, and request body (PII fields redacted).

* Winston logger with Railway log drain to external log aggregator (e.g. Logtail or Papertrail).

## **11.2 Error Tracking**

* Sentry integrated on both frontend (Next.js \+ React Native) and backend (Node.js).

* Errors grouped by fingerprint. Alerts sent to Slack channel on new issue.

* Source maps uploaded on deploy for readable stack traces.

## **11.3 Uptime & Performance**

* Uptime monitoring via Better Uptime — checks every 60 seconds from 3 global regions.

* Status page at status.mamafua.co.ke for public incident communication.

* API response time tracked via Railway built-in metrics \+ custom Prometheus counters.

* Alert thresholds: p95 \> 500ms → Slack warning. p95 \> 1000ms → PagerDuty alert.

# **12\. Architecture Decision Log**

Key architectural decisions and their rationale:

| Decision | Chosen Option | Rationale |
| :---- | :---- | :---- |
| Backend framework | Express.js | Team familiarity, wide ecosystem, sufficient for scale target |
| Database ORM | Prisma | Type safety, migration management, readable schema |
| Real-time layer | Socket.io | Handles reconnection, rooms, and fallback gracefully |
| Mobile framework | React Native \+ Expo | Single codebase, OTA updates, strong Maps support |
| Auth mechanism | JWT \+ OTP | Phone-first auth is standard in Kenya; no password friction |
| Job queue | Bull \+ Redis | Reliable, retry logic built-in, good monitoring tooling |
| Hosting | Railway \+ Vercel | Fastest path to production; scales automatically |
| Payment primary | M-Pesa | Over 80% of Kenyans use M-Pesa; cards are secondary |

*End of Document MF-DOC-002*

Mama Fua — KhimTech  |  Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru