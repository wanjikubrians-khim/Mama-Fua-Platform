

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 1**

Product Overview & Requirements Specification

Version 1.0  |  KhimTech  |  2026

2026

**CONFIDENTIAL**

# **Document Control**

| Project Name | Mama Fua — Cleaning & Home Services Marketplace |
| :---- | :---- |

| Document Title | Product Overview & Requirements Specification |
| :---- | :---- |

| Document ID | MF-DOC-001 |
| :---- | :---- |

| Version | 1.0 |
| :---- | :---- |

| Status | Draft — For Review |
| :---- | :---- |

| Classification | Confidential — KhimTech Internal Use Only |
| :---- | :---- |

| Owner | KhimTech |
| :---- | :---- |

| Lead Developer | Brian Wanjiku |
| :---- | :---- |

| QA Engineer | Maryann Wanjiru |
| :---- | :---- |

| Version | Date | Description |
| :---- | :---- | :---- |
| 0.1 | 2026 | Initial draft |
| 1.0 | 2026 | Full requirements specification |

# **1\. Executive Summary**

Mama Fua is a two-sided marketplace platform connecting clients who need cleaning and home services with vetted professional cleaners and mama fuas (domestic workers) in Kenya. The platform operates as a digital middleman — similar in model to Uber, Bolt, and Kilimall — facilitating discovery, booking, payment, and trust between both parties.

The platform is built for the East African market, with deep integration of M-Pesa (Safaricom's mobile money), local SMS providers (Africa's Talking), and geolocation services tuned for Kenyan urban and peri-urban areas including Nairobi, Mombasa, Kisumu, Nakuru, and Eldoret.

**The core value proposition is threefold:**

* For clients: reliable, vetted, background-checked cleaners available on-demand or scheduled, with transparent pricing and secure payment.

* For cleaners/mama fuas: steady access to clients, digital payment, profile-building, and income tracking without relying on word-of-mouth alone.

* For the platform: a commission on every transaction, creating a scalable, recurring revenue stream.

# **2\. Problem Statement**

## **2.1 The Current Situation**

In Kenya and across East Africa, domestic cleaning services are predominantly arranged through informal channels: word of mouth, community notice boards, or personal referrals. This creates significant friction on both sides of the market.

## **2.2 Problems for Clients**

* No reliable way to find vetted cleaners on short notice.

* No standardised pricing — clients are often overcharged or unsure of fair rates.

* No accountability mechanisms — if a cleaner fails to show, there is no recourse.

* No digital payment — cash transactions are untraceable and insecure.

* No reviews or ratings — quality is entirely unknown until service is rendered.

## **2.3 Problems for Cleaners**

* Irregular income and unpredictable work schedules.

* No way to build a professional reputation digitally.

* Dependence on a small pool of existing clients — no growth path.

* No protection — disputes with clients are handled informally.

* No digital financial records — difficult to access credit or loans.

## **2.4 The Opportunity**

Kenya has over 50 million mobile subscribers and over 30 million M-Pesa users. Smartphone penetration in urban areas exceeds 60%. The informal domestic services sector is estimated to employ over 2 million workers nationally. A well-designed digital marketplace can formalise this sector, improve quality and income stability, and generate significant economic value.

# **3\. Product Vision & Goals**

## **3.1 Vision Statement**

*"To be the most trusted marketplace for domestic services in East Africa — empowering cleaners with dignity and income, and giving clients peace of mind in their own homes."*

## **3.2 Strategic Goals**

| Goal | Target | Timeframe |
| :---- | :---- | :---- |
| Cleaner onboarding | 500 verified cleaners | Month 1–3 |
| Client bookings | 1,000 bookings/month | Month 3–6 |
| Geographic coverage | Nairobi full coverage | Month 1–6 |
| Revenue | KES 500,000/month GMV | Month 6 |
| Expansion | Mombasa \+ Kisumu | Month 9–12 |

## **3.3 Success Metrics**

* Gross Merchandise Value (GMV) — total value of bookings processed.

* Take rate — platform commission as a percentage of GMV (target: 15–20%).

* Cleaner utilisation rate — percentage of available cleaner hours that are booked.

* Client retention rate — percentage of clients who book again within 30 days.

* Average rating — platform-wide average rating of completed jobs.

* Time-to-match — average time between a client posting a job and a cleaner accepting.

# **4\. Target Users**

## **4.1 Clients**

Clients are individuals, households, or businesses who need cleaning or domestic services.

| Segment | Description |
| :---- | :---- |
| Urban households | Middle-class families in Nairobi, Mombasa, Kisumu seeking reliable home cleaning. |
| Working professionals | Busy single adults or couples who need recurring cleaning services. |
| Landlords & property managers | Need regular cleaning of rental units between tenants. |
| Offices & SMEs | Small businesses needing office cleaning on a schedule. |
| Post-construction | Developers or homeowners needing deep cleaning after renovation. |

## **4.2 Cleaners / Mama Fuas**

Cleaners are the supply side of the marketplace — verified individuals providing domestic services.

| Segment | Description |
| :---- | :---- |
| Independent mama fuas | Experienced domestic workers seeking digital access to clients. |
| Part-time cleaners | Individuals supplementing income with cleaning work. |
| Specialised cleaners | Workers with skills in specific areas: laundry, post-construction, office. |
| Cleaning agencies | Small agencies that can deploy multiple workers per job. |

## **4.3 Platform Administrators**

The admin team manages the platform, handles disputes, approves cleaner profiles, manages payouts, and monitors quality. Admins have access to a separate dashboard with elevated privileges.

# **5\. Services Offered**

At launch, the platform supports the following service categories:

| Service | Type | Description |
| :---- | :---- | :---- |
| Home cleaning | One-off / Recurring | General residential cleaning including bedrooms, kitchen, bathrooms. |
| Laundry (mama fua) | One-off / Recurring | Hand washing, machine washing, ironing, and folding. |
| Office cleaning | One-off / Recurring | Commercial cleaning for offices and small business premises. |
| Post-construction | One-off | Deep cleaning after renovation or construction work. |
| Deep cleaning | One-off | Intensive cleaning including carpets, windows, upholstery. |

## **5.1 Pricing Structure**

Pricing is determined by the platform based on service type, duration, location, and cleaner rating tier. Cleaners can set their own base rates within platform-defined minimum and maximum bands.

| Service | Starting Price (KES) | Notes |
| :---- | :---- | :---- |
| Home cleaning (2 bed) | 1,200 | Approximately 3 hours |
| Laundry (per load) | 500 | Wash \+ dry \+ fold |
| Office cleaning | 2,000 | Up to 50 sqm |
| Post-construction | 5,000+ | Quoted per job size |
| Deep cleaning | 3,500+ | Quoted per room |

# **6\. Booking Modes**

The platform supports three distinct booking modes to accommodate different user preferences and urgency levels.

## **6.1 Mode A — Auto-Assign (Default)**

The system automatically matches a client with the nearest available, highest-rated cleaner who meets the job requirements. This mode prioritises speed and is the default for first-time users.

* Client enters job details, location, date/time, and service type.

* The matching engine identifies the top 3 eligible cleaners based on proximity, rating, and availability.

* The top-ranked cleaner receives a push notification and has 5 minutes to accept.

* If declined or no response, the job cascades to the next cleaner.

* Once accepted, both parties receive confirmation and can see each other's details.

## **6.2 Mode B — Browse & Pick**

Clients can browse a list of available cleaners in their area, view profiles, read reviews, see pricing, and select their preferred cleaner directly. This mode is preferred by repeat clients or those with specific requirements.

* Client searches by location, service type, date/time, and price range.

* Results are displayed on a map and list view, sorted by rating and distance.

* Client can view full cleaner profile including: bio, photo, ratings, services, and availability calendar.

* Client sends a booking request directly to the chosen cleaner.

* Cleaner has 30 minutes to accept or decline. If declined, client is returned to search.

## **6.3 Mode C — Post & Bid**

Clients post a job description and eligible cleaners in the area submit bids. The client reviews bids and selects the best offer. This mode is suitable for large, complex, or negotiable jobs.

* Client posts job with full details: service type, scope, date, location, and budget range.

* Nearby eligible cleaners are notified and can submit a bid within 24 hours.

* Each bid includes price, estimated duration, and a short message from the cleaner.

* Client reviews all bids and selects one, or counter-offers.

* Both parties confirm the final terms before payment is initiated.

## **6.4 Recurring Bookings**

Any booking mode can result in a recurring schedule. After a successful first job, clients can subscribe to repeat bookings on a weekly, bi-weekly, or monthly basis with the same cleaner, at a discounted rate.

# **7\. Payment & Financial Model**

## **7.1 Supported Payment Methods**

| Method | Details |
| :---- | :---- |
| M-Pesa (STK Push) | Primary payment method. Client pays via Safaricom's Daraja API. Real-time confirmation. |
| Credit/Debit Card | Processed via Stripe. Supports Visa, Mastercard. |
| Platform Wallet | Internal credits that clients can top up and spend across bookings. |
| Cash on Completion | Available for select cleaners. Platform records the transaction for reporting. |

## **7.2 Commission Structure**

The platform earns revenue by charging a commission on every completed transaction.

| Commission Type | Rate |
| :---- | :---- |
| Standard commission | 15% of job value |
| Premium cleaners (4.8+ rating) | 12% of job value |
| Agency accounts | 18% of job value |
| Recurring bookings (after 3rd booking) | 10% of job value |

## **7.3 Escrow & Payout**

To protect both parties, the platform holds payment in escrow from the moment of booking until the job is marked complete and rated by the client. This is the core trust mechanism of the platform.

* Client pays at time of booking. Funds are held by the platform.

* Upon job completion, the client has 24 hours to raise a dispute.

* If no dispute is raised, funds are released to the cleaner's wallet automatically.

* Cleaners can withdraw to M-Pesa or bank account. Withdrawals processed within 24 hours.

* Platform retains its commission before releasing the net amount.

## **7.4 Cleaner Wallet**

Each cleaner has an internal wallet that accumulates earnings from completed jobs. The wallet supports:

* Viewing earnings history and pending payouts.

* Withdrawing to M-Pesa (instant) or bank account (1–3 business days).

* Viewing commission deductions and net earnings per job.

* Monthly income statements downloadable as PDF.

# **8\. User Roles & Permissions**

| Role | Access Level | Key Permissions |
| :---- | :---- | :---- |
| Client | Standard | Post jobs, browse cleaners, make payments, rate, raise disputes |
| Cleaner | Standard | Accept jobs, view earnings, manage availability, update profile |
| Agency | Elevated | Manage multiple cleaner profiles, receive consolidated payouts |
| Admin | Full | Approve cleaners, resolve disputes, manage payouts, view analytics |
| Super Admin | Root | All admin rights \+ system configuration, user bans, fee management |

# **9\. Non-Functional Requirements**

## **9.1 Performance**

* API response time: \< 300ms for 95th percentile under normal load.

* App load time: \< 3 seconds on a 3G connection.

* Map rendering: \< 2 seconds for cleaner location results.

* Uptime target: 99.5% excluding scheduled maintenance.

## **9.2 Security**

* All data encrypted in transit (TLS 1.3) and at rest (AES-256).

* Payment data handled exclusively by Stripe and M-Pesa — never stored on platform servers.

* Cleaner identity verified via national ID scan and selfie matching.

* Role-based access control (RBAC) for all admin functions.

* Audit logs for all financial transactions retained for 7 years.

## **9.3 Compliance**

* Kenya Data Protection Act 2019 — user data handling and consent.

* Kenya Revenue Authority — tax reporting for cleaners earning above threshold.

* Central Bank of Kenya — compliance for mobile money handling.

* GDPR principles applied for any European users or data processors.

## **9.4 Localisation**

* English and Swahili language support at launch.

* All prices displayed in Kenyan Shillings (KES).

* Kenyan phone number format supported (+254 prefix).

* Local time zones (EAT, UTC+3) applied throughout.

# **10\. Project Milestones**

| Phase | Duration | Deliverables |
| :---- | :---- | :---- |
| Phase 1 — Foundation | Weeks 1–4 | Architecture, DB schema, backend scaffolding, auth system |
| Phase 2 — Core Product | Weeks 5–10 | Booking flow, cleaner onboarding, basic client app |
| Phase 3 — Payments | Weeks 11–13 | M-Pesa integration, Stripe, wallet, escrow logic |
| Phase 4 — Maps & Matching | Weeks 14–16 | Location services, matching engine, real-time tracking |
| Phase 5 — Comms & Notifications | Weeks 17–18 | SMS, push notifications, in-app chat |
| Phase 6 — Admin & Analytics | Weeks 19–20 | Admin dashboard, analytics, dispute management |
| Phase 7 — QA & Launch | Weeks 21–24 | Testing, security audit, beta launch, go-to-market |

# **11\. Document Series**

This document is part of a complete technical documentation series for the Mama Fua platform:

| Document | Description |
| :---- | :---- |
| MF-DOC-001 (this document) | Product Overview & Requirements Specification |
| MF-DOC-002 | System Architecture & Technical Design |
| MF-DOC-003 | Full Database Schema |
| MF-DOC-004 | Billing & Payments Module |
| MF-DOC-005 | Maps, Location & Matching Engine |
| MF-DOC-006 | Notifications & Communications Module |
| MF-DOC-007 | Admin Dashboard & Analytics |
| MF-DOC-008 | Security, Compliance & Privacy |
| MF-DOC-009 | API Reference |
| MF-DOC-010 | Deployment & DevOps Guide |

# **12\. Glossary**

| Term | Definition |
| :---- | :---- |
| Mama Fua | Swahili term for a domestic laundry worker; used broadly for domestic cleaning professionals. |
| GMV | Gross Merchandise Value — total monetary value of all transactions on the platform. |
| Escrow | Holding of funds by a neutral party (the platform) until service is confirmed complete. |
| STK Push | SIM Toolkit Push — M-Pesa's mechanism to trigger payment prompts on a customer's phone. |
| Daraja API | Safaricom's official API gateway for M-Pesa integrations. |
| Matching Engine | The algorithm that connects clients with the most suitable available cleaner. |
| Take Rate | The percentage of GMV retained by the platform as commission. |
| Utilisation Rate | Percentage of a cleaner's available hours that result in paid bookings. |
| RBAC | Role-Based Access Control — a security model restricting system access by user role. |
| EAT | East Africa Time — UTC+3, the timezone used throughout the platform. |

*End of Document MF-DOC-001*

Mama Fua Platform — KhimTech | Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru