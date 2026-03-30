

**MAMA FUA**

Cleaning & Home Services Marketplace

**DOCUMENT 3**

Full Database Schema

Version 1.0  |  KhimTech  |  2026

Lead Developer: Brian Wanjiku  |  QA: Maryann Wanjiru

**Owner: KhimTech**

**CONFIDENTIAL**

# **1\. Database Overview**

The Mama Fua platform uses PostgreSQL as its primary relational database, managed via Supabase and accessed through Prisma ORM. This document defines every table, column, data type, constraint, and relationship in the schema.

**Schema conventions:**

* All primary keys are UUID v4 (uuid\_generate\_v4()).

* All tables include createdAt (TIMESTAMPTZ), updatedAt (TIMESTAMPTZ), and deletedAt (TIMESTAMPTZ, nullable) for soft deletes.

* Foreign keys use ON DELETE RESTRICT by default unless noted otherwise.

* Enum types are defined as PostgreSQL ENUM types and managed by Prisma.

* PostGIS extension is enabled for geospatial columns (GEOGRAPHY type).

* All monetary values are stored as INTEGER in Kenya Shillings (KES) cents to avoid floating point errors. Example: KES 1,200.00 is stored as 120000\.

## **1.1 Table Index**

| Table | Description |
| :---- | :---- |
| users | All platform users (clients, cleaners, admins) |
| cleaner\_profiles | Extended profile data for cleaners |
| client\_profiles | Extended profile data for clients |
| addresses | Saved addresses for clients |
| services | Service types offered on the platform |
| cleaner\_services | Services each cleaner offers \+ their pricing |
| availability\_slots | Cleaner availability schedule |
| bookings | Core booking records |
| booking\_items | Line items within a booking |
| bids | Bids submitted in post-and-bid mode |
| payments | Payment transaction records |
| wallet\_transactions | Cleaner wallet credit/debit log |
| payouts | Payout requests and disbursement records |
| reviews | Client reviews of cleaners |
| review\_responses | Cleaner responses to reviews |
| notifications | In-app notification records |
| chat\_messages | In-app messages per booking |
| disputes | Dispute records and resolution log |
| admin\_actions | Audit log of all admin actions |
| verification\_documents | ID and selfie uploads for cleaner verification |
| otp\_tokens | OTP codes for phone verification |
| device\_tokens | FCM push notification device tokens |

# **2\. Enum Types**

The following PostgreSQL ENUM types are defined and referenced across tables.

| Enum Name | Values |
| :---- | :---- |
| UserRole | CLIENT, CLEANER, ADMIN, SUPER\_ADMIN |
| UserStatus | ACTIVE, SUSPENDED, BANNED, DELETED |
| VerificationStatus | PENDING, UNDER\_REVIEW, VERIFIED, REJECTED |
| BookingMode | AUTO\_ASSIGN, BROWSE\_PICK, POST\_BID |
| BookingStatus | DRAFT, PENDING, ACCEPTED, PAID, IN\_PROGRESS, COMPLETED, CONFIRMED, DISPUTED, CANCELLED, REFUNDED |
| BookingType | ONE\_OFF, RECURRING |
| RecurringFrequency | WEEKLY, BIWEEKLY, MONTHLY |
| PaymentMethod | MPESA, STRIPE\_CARD, WALLET, CASH |
| PaymentStatus | PENDING, PROCESSING, SUCCEEDED, FAILED, REFUNDED |
| PayoutStatus | PENDING, PROCESSING, COMPLETED, FAILED |
| DisputeStatus | OPEN, UNDER\_REVIEW, RESOLVED\_CLIENT, RESOLVED\_CLEANER, ESCALATED |
| NotificationType | BOOKING, PAYMENT, REVIEW, CHAT, SYSTEM, PROMOTION |
| WalletTxType | CREDIT, DEBIT, HOLD, RELEASE |
| ServiceCategory | HOME\_CLEANING, LAUNDRY, OFFICE\_CLEANING, POST\_CONSTRUCTION, DEEP\_CLEANING |

# **3\. Table Definitions**

## **3.1 users**

Central user table. Every person on the platform — client, cleaner, or admin — has exactly one row here. Role-specific data lives in cleaner\_profiles or client\_profiles.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK, DEFAULT uuid\_generate\_v4() | Unique user identifier |
| phone | VARCHAR(20) | UNIQUE, NOT NULL | Kenyan phone in \+254 format |
| email | VARCHAR(255) | UNIQUE, NULLABLE | Optional email address |
| passwordHash | VARCHAR(255) | NULLABLE | Bcrypt hash (null if OTP-only) |
| firstName | VARCHAR(100) | NOT NULL | User's first name |
| lastName | VARCHAR(100) | NOT NULL | User's last name |
| avatarUrl | TEXT | NULLABLE | Cloudinary URL for profile photo |
| role | UserRole | NOT NULL, DEFAULT CLIENT | Platform role |
| status | UserStatus | NOT NULL, DEFAULT ACTIVE | Account status |
| fcmToken | TEXT | NULLABLE | Latest Firebase FCM device token |
| preferredLang | VARCHAR(5) | NOT NULL, DEFAULT 'en' | UI language: en or sw |
| lastLoginAt | TIMESTAMPTZ | NULLABLE | Timestamp of last successful login |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Account creation time |
| updatedAt | TIMESTAMPTZ | NOT NULL | Auto-updated on change |
| deletedAt | TIMESTAMPTZ | NULLABLE | Soft delete timestamp |

## **3.2 cleaner\_profiles**

Extended data specific to cleaner accounts. One-to-one with users where role \= CLEANER.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Profile identifier |
| userId | UUID | FK users.id, UNIQUE, NOT NULL | Linked user account |
| bio | TEXT | NULLABLE | Short description written by cleaner |
| nationalIdNumber | VARCHAR(20) | UNIQUE, NULLABLE | Kenyan National ID number |
| verificationStatus | VerificationStatus | NOT NULL, DEFAULT PENDING | KYC status |
| verifiedAt | TIMESTAMPTZ | NULLABLE | When admin approved verification |
| verifiedBy | UUID | FK users.id, NULLABLE | Admin who approved |
| rating | DECIMAL(3,2) | NOT NULL, DEFAULT 0.00 | Aggregate rating (0.00–5.00) |
| totalReviews | INTEGER | NOT NULL, DEFAULT 0 | Count of received reviews |
| totalJobs | INTEGER | NOT NULL, DEFAULT 0 | Total completed jobs |
| serviceAreaLat | DOUBLE PRECISION | NULLABLE | Centre of service area |
| serviceAreaLng | DOUBLE PRECISION | NULLABLE | Centre of service area |
| serviceAreaRadius | INTEGER | NOT NULL, DEFAULT 10 | Service radius in kilometres |
| isAvailable | BOOLEAN | NOT NULL, DEFAULT TRUE | Currently taking bookings |
| currentLat | DOUBLE PRECISION | NULLABLE | Live GPS latitude (updated by app) |
| currentLng | DOUBLE PRECISION | NULLABLE | Live GPS longitude (updated by app) |
| lastLocationAt | TIMESTAMPTZ | NULLABLE | When GPS last updated |
| walletBalance | INTEGER | NOT NULL, DEFAULT 0 | Balance in KES cents |
| bankName | VARCHAR(100) | NULLABLE | Bank name for payouts |
| bankAccount | VARCHAR(50) | NULLABLE | Bank account number (encrypted) |
| mpesaPhone | VARCHAR(20) | NULLABLE | M-Pesa number for payouts |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.3 client\_profiles**

Extended data for client accounts. One-to-one with users where role \= CLIENT.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Profile identifier |
| userId | UUID | FK users.id, UNIQUE, NOT NULL | Linked user account |
| defaultAddressId | UUID | FK addresses.id, NULLABLE | Preferred job location |
| totalBookings | INTEGER | NOT NULL, DEFAULT 0 | Lifetime booking count |
| walletBalance | INTEGER | NOT NULL, DEFAULT 0 | Platform wallet in KES cents |
| stripeCustomerId | VARCHAR(100) | NULLABLE, UNIQUE | Stripe customer ID for cards |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.4 addresses**

Saved location addresses for clients. Each client can save multiple addresses (home, office, etc.).

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Address identifier |
| userId | UUID | FK users.id, NOT NULL | Owning client |
| label | VARCHAR(50) | NOT NULL | e.g. Home, Office, Mum's place |
| addressLine1 | VARCHAR(255) | NOT NULL | Street address or estate name |
| addressLine2 | VARCHAR(255) | NULLABLE | Apartment, floor, unit |
| area | VARCHAR(100) | NOT NULL | Neighbourhood or estate |
| city | VARCHAR(100) | NOT NULL, DEFAULT Nairobi | City |
| county | VARCHAR(100) | NULLABLE | Kenyan county |
| lat | DOUBLE PRECISION | NOT NULL | Geocoded latitude |
| lng | DOUBLE PRECISION | NOT NULL | Geocoded longitude |
| instructions | TEXT | NULLABLE | Access instructions for cleaner |
| isDefault | BOOLEAN | NOT NULL, DEFAULT FALSE | Is this the primary address |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.5 services**

Master list of service types available on the platform. Managed by admins.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Service identifier |
| category | ServiceCategory | NOT NULL | Top-level service category |
| name | VARCHAR(100) | NOT NULL, UNIQUE | Display name (e.g. Home Cleaning) |
| nameSwahili | VARCHAR(100) | NULLABLE | Swahili display name |
| description | TEXT | NOT NULL | What the service includes |
| basePrice | INTEGER | NOT NULL | Platform minimum price in KES cents |
| maxPrice | INTEGER | NOT NULL | Platform maximum price in KES cents |
| durationMinutes | INTEGER | NOT NULL | Estimated duration in minutes |
| isActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether service is bookable |
| iconUrl | TEXT | NULLABLE | Icon image URL |
| sortOrder | INTEGER | NOT NULL, DEFAULT 0 | Display sort order |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.6 cleaner\_services**

Junction table linking cleaners to the services they offer, with their individual pricing.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Record identifier |
| cleanerId | UUID | FK cleaner\_profiles.id, NOT NULL | The cleaner |
| serviceId | UUID | FK services.id, NOT NULL | The service offered |
| customPrice | INTEGER | NOT NULL | Cleaner's price in KES cents |
| isActive | BOOLEAN | NOT NULL, DEFAULT TRUE | Is this service currently offered |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

Unique constraint: (cleanerId, serviceId).

## **3.7 bookings**

The central table of the platform. Every service engagement starts here.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Booking identifier |
| bookingRef | VARCHAR(20) | UNIQUE, NOT NULL | Human-readable ref e.g. MF-2025-00142 |
| clientId | UUID | FK users.id, NOT NULL | Client who made the booking |
| cleanerId | UUID | FK users.id, NULLABLE | Assigned cleaner (null until matched) |
| serviceId | UUID | FK services.id, NOT NULL | Service type booked |
| mode | BookingMode | NOT NULL | AUTO\_ASSIGN, BROWSE\_PICK, or POST\_BID |
| status | BookingStatus | NOT NULL, DEFAULT DRAFT | Current booking state |
| bookingType | BookingType | NOT NULL, DEFAULT ONE\_OFF | One-off or recurring |
| scheduledAt | TIMESTAMPTZ | NOT NULL | Requested date and time for job |
| estimatedDuration | INTEGER | NOT NULL | Estimated minutes for the job |
| actualStartAt | TIMESTAMPTZ | NULLABLE | When cleaner checked in |
| actualEndAt | TIMESTAMPTZ | NULLABLE | When job marked complete |
| addressId | UUID | FK addresses.id, NOT NULL | Job location |
| specialInstructions | TEXT | NULLABLE | Client notes for the cleaner |
| baseAmount | INTEGER | NOT NULL | Service price in KES cents |
| platformFee | INTEGER | NOT NULL | Commission in KES cents |
| totalAmount | INTEGER | NOT NULL | Total charged to client |
| cleanerEarnings | INTEGER | NOT NULL | Net payout to cleaner |
| recurringParentId | UUID | FK bookings.id, NULLABLE | Parent booking for recurring |
| recurringFrequency | RecurringFrequency | NULLABLE | Frequency if recurring |
| nextBookingAt | TIMESTAMPTZ | NULLABLE | Next recurrence date |
| acceptedAt | TIMESTAMPTZ | NULLABLE | When cleaner accepted |
| cancelledAt | TIMESTAMPTZ | NULLABLE | When booking was cancelled |
| cancelledBy | UUID | FK users.id, NULLABLE | Who cancelled |
| cancelReason | TEXT | NULLABLE | Reason for cancellation |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |
| deletedAt | TIMESTAMPTZ | NULLABLE | Soft delete |

## **3.8 bids**

Bids submitted by cleaners in Post & Bid mode. Multiple bids can exist per booking.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Bid identifier |
| bookingId | UUID | FK bookings.id, NOT NULL | Booking being bid on |
| cleanerId | UUID | FK users.id, NOT NULL | Cleaner submitting the bid |
| proposedAmount | INTEGER | NOT NULL | Bid price in KES cents |
| estimatedDuration | INTEGER | NOT NULL | Cleaner's time estimate (minutes) |
| message | TEXT | NULLABLE | Cleaner's pitch to the client |
| isAccepted | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether client accepted this bid |
| expiresAt | TIMESTAMPTZ | NOT NULL | Bid validity window (24 hours from submit) |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.9 payments**

Every payment transaction — whether M-Pesa, Stripe, or wallet — creates one row here.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Payment record identifier |
| bookingId | UUID | FK bookings.id, NOT NULL | Associated booking |
| payerId | UUID | FK users.id, NOT NULL | User making the payment |
| method | PaymentMethod | NOT NULL | Payment method used |
| status | PaymentStatus | NOT NULL, DEFAULT PENDING | Payment lifecycle status |
| amount | INTEGER | NOT NULL | Amount in KES cents |
| currency | VARCHAR(3) | NOT NULL, DEFAULT KES | ISO currency code |
| mpesaPhone | VARCHAR(20) | NULLABLE | M-Pesa phone number used |
| mpesaCheckoutId | VARCHAR(100) | NULLABLE, UNIQUE | Daraja CheckoutRequestID |
| mpesaReceiptNumber | VARCHAR(50) | NULLABLE | M-Pesa confirmation code |
| stripePaymentIntentId | VARCHAR(100) | NULLABLE, UNIQUE | Stripe PaymentIntent ID |
| stripeChargeId | VARCHAR(100) | NULLABLE, UNIQUE | Stripe Charge ID |
| failureReason | TEXT | NULLABLE | Error message on failure |
| refundedAt | TIMESTAMPTZ | NULLABLE | When refund was initiated |
| refundAmount | INTEGER | NULLABLE | Amount refunded in KES cents |
| metadata | JSONB | NULLABLE | Raw provider webhook payload |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.10 wallet\_transactions**

Immutable ledger of all credits and debits to a cleaner's platform wallet.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Transaction identifier |
| cleanerId | UUID | FK cleaner\_profiles.id, NOT NULL | Wallet owner |
| type | WalletTxType | NOT NULL | CREDIT, DEBIT, HOLD, or RELEASE |
| amount | INTEGER | NOT NULL | Amount in KES cents (always positive) |
| balanceBefore | INTEGER | NOT NULL | Balance before this transaction |
| balanceAfter | INTEGER | NOT NULL | Balance after this transaction |
| bookingId | UUID | FK bookings.id, NULLABLE | Source booking if applicable |
| payoutId | UUID | FK payouts.id, NULLABLE | Related payout if applicable |
| description | VARCHAR(255) | NOT NULL | Human-readable description |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable — no updatedAt |

## **3.11 payouts**

Payout requests from cleaners and the resulting disbursement records.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Payout identifier |
| cleanerId | UUID | FK cleaner\_profiles.id, NOT NULL | Requesting cleaner |
| amount | INTEGER | NOT NULL | Requested amount in KES cents |
| method | PaymentMethod | NOT NULL | MPESA or bank transfer |
| status | PayoutStatus | NOT NULL, DEFAULT PENDING | Payout lifecycle status |
| mpesaPhone | VARCHAR(20) | NULLABLE | Destination M-Pesa number |
| mpesaReceiptNumber | VARCHAR(50) | NULLABLE | M-Pesa B2C confirmation |
| bankName | VARCHAR(100) | NULLABLE | Destination bank name |
| bankAccount | VARCHAR(50) | NULLABLE | Destination account (masked in logs) |
| processedAt | TIMESTAMPTZ | NULLABLE | When payout was disbursed |
| processedBy | UUID | FK users.id, NULLABLE | Admin who approved |
| failureReason | TEXT | NULLABLE | Error on failure |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.12 reviews**

Client reviews submitted after a job is confirmed complete.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Review identifier |
| bookingId | UUID | FK bookings.id, UNIQUE, NOT NULL | One review per booking |
| clientId | UUID | FK users.id, NOT NULL | Reviewing client |
| cleanerId | UUID | FK users.id, NOT NULL | Reviewed cleaner |
| rating | SMALLINT | NOT NULL, CHECK (1-5) | Star rating 1 to 5 |
| title | VARCHAR(150) | NULLABLE | Optional review headline |
| body | TEXT | NULLABLE | Full review text |
| isPublic | BOOLEAN | NOT NULL, DEFAULT TRUE | Whether shown on profile |
| isFlagged | BOOLEAN | NOT NULL, DEFAULT FALSE | Flagged for moderation |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.13 disputes**

Formal disputes raised by clients after a booking is completed.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Dispute identifier |
| bookingId | UUID | FK bookings.id, UNIQUE, NOT NULL | Disputed booking |
| raisedBy | UUID | FK users.id, NOT NULL | User who raised the dispute |
| status | DisputeStatus | NOT NULL, DEFAULT OPEN | Resolution status |
| reason | VARCHAR(100) | NOT NULL | Reason code (e.g. NO\_SHOW, POOR\_QUALITY) |
| description | TEXT | NOT NULL | Detailed description from client |
| evidenceUrls | TEXT\[\] | NULLABLE | Array of Cloudinary URLs for evidence |
| adminNotes | TEXT | NULLABLE | Internal admin notes |
| resolvedBy | UUID | FK users.id, NULLABLE | Admin who resolved |
| resolvedAt | TIMESTAMPTZ | NULLABLE | Resolution timestamp |
| resolution | TEXT | NULLABLE | Resolution description |
| refundAmount | INTEGER | NULLABLE | Refund issued in KES cents |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.14 notifications**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Notification identifier |
| userId | UUID | FK users.id, NOT NULL | Recipient |
| type | NotificationType | NOT NULL | Notification category |
| title | VARCHAR(255) | NOT NULL | Notification title |
| body | TEXT | NOT NULL | Notification body text |
| data | JSONB | NULLABLE | Deep link data e.g. {bookingId} |
| isRead | BOOLEAN | NOT NULL, DEFAULT FALSE | Read state |
| readAt | TIMESTAMPTZ | NULLABLE | When user opened notification |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |

## **3.15 chat\_messages**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Message identifier |
| bookingId | UUID | FK bookings.id, NOT NULL | Chat thread (one per booking) |
| senderId | UUID | FK users.id, NOT NULL | Message author |
| body | TEXT | NULLABLE | Text content |
| mediaUrl | TEXT | NULLABLE | Image attachment URL |
| isRead | BOOLEAN | NOT NULL, DEFAULT FALSE | Whether recipient has read |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |

## **3.16 verification\_documents**

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Document record |
| cleanerId | UUID | FK cleaner\_profiles.id, NOT NULL | Owning cleaner |
| idFrontUrl | TEXT | NOT NULL | National ID front (Cloudinary signed URL) |
| idBackUrl | TEXT | NOT NULL | National ID back |
| selfieUrl | TEXT | NOT NULL | Live selfie for face match |
| submittedAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Submission time |
| reviewedAt | TIMESTAMPTZ | NULLABLE | When admin reviewed |
| reviewedBy | UUID | FK users.id, NULLABLE | Reviewing admin |
| status | VerificationStatus | NOT NULL, DEFAULT PENDING | Review status |
| rejectionReason | TEXT | NULLABLE | Reason if rejected |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() |  |
| updatedAt | TIMESTAMPTZ | NOT NULL |  |

## **3.17 admin\_actions**

Immutable audit log of every action taken by an admin. Append-only — no updates or deletes.

| Column | Type | Constraints | Description |
| :---- | :---- | :---- | :---- |
| id | UUID | PK | Audit record identifier |
| adminId | UUID | FK users.id, NOT NULL | Admin who performed the action |
| action | VARCHAR(100) | NOT NULL | Action code e.g. CLEANER\_APPROVED |
| targetType | VARCHAR(50) | NOT NULL | Entity type e.g. user, booking, dispute |
| targetId | UUID | NOT NULL | ID of the affected entity |
| notes | TEXT | NULLABLE | Optional admin notes |
| ipAddress | VARCHAR(45) | NULLABLE | Admin's IP at time of action |
| createdAt | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Immutable timestamp |

# **4\. Database Indexes**

Performance-critical indexes defined on top of primary keys and unique constraints:

| Index | Purpose |
| :---- | :---- |
| users(phone) | Fast OTP and login lookups |
| users(email) | Email login and uniqueness check |
| cleaner\_profiles(userId) | Profile lookup by user |
| cleaner\_profiles(verificationStatus) | Admin queue filter |
| cleaner\_profiles(isAvailable) | Search filter for available cleaners |
| cleaner\_profiles(serviceAreaLat, serviceAreaLng) | Bounding box geo queries |
| bookings(clientId, status) | Client's active bookings |
| bookings(cleanerId, status) | Cleaner's job queue |
| bookings(scheduledAt) | Upcoming bookings scheduler |
| bookings(bookingRef) | Human-readable ref lookups |
| payments(bookingId) | Payment by booking |
| payments(mpesaCheckoutId) | Daraja callback lookup |
| notifications(userId, isRead) | Unread notification count |
| chat\_messages(bookingId, createdAt) | Chat thread pagination |
| wallet\_transactions(cleanerId, createdAt) | Wallet history pagination |

# **5\. Key Relationships**

Entity relationship summary for the core domain:

| Relationship | Cardinality |
| :---- | :---- |
| users → cleaner\_profiles | One-to-One (optional) |
| users → client\_profiles | One-to-One (optional) |
| users → addresses | One-to-Many |
| cleaner\_profiles → cleaner\_services | One-to-Many |
| services → cleaner\_services | One-to-Many |
| bookings → payments | One-to-Many (retries possible) |
| bookings → bids | One-to-Many (in POST\_BID mode) |
| bookings → reviews | One-to-One (after completion) |
| bookings → disputes | One-to-One (optional) |
| bookings → chat\_messages | One-to-Many |
| cleaner\_profiles → wallet\_transactions | One-to-Many |
| cleaner\_profiles → payouts | One-to-Many |
| cleaner\_profiles → verification\_documents | One-to-Many (resubmission allowed) |

# **6\. Prisma Schema Excerpt**

The following is the core Prisma schema (schema.prisma) excerpt for the primary tables. The full schema file is maintained in the /packages/database directory of the monorepo.

generator client {

  provider \= "prisma-client-js"

}

datasource db {

  provider \= "postgresql"

  url      \= env("DATABASE\_URL")

}

model User {

  id            String    @id @default(uuid())

  phone         String    @unique

  email         String?   @unique

  firstName     String

  lastName      String

  role          UserRole  @default(CLIENT)

  status        UserStatus @default(ACTIVE)

  cleanerProfile CleanerProfile?

  clientProfile  ClientProfile?

  bookingsAsClient  Booking\[\] @relation("ClientBookings")

  bookingsAsCleaner Booking\[\] @relation("CleanerBookings")

  createdAt     DateTime  @default(now())

  updatedAt     DateTime  @updatedAt

  deletedAt     DateTime?

}

model Booking {

  id              String        @id @default(uuid())

  bookingRef      String        @unique

  client          User          @relation("ClientBookings", fields: \[clientId\], references: \[id\])

  clientId        String

  cleaner         User?         @relation("CleanerBookings", fields: \[cleanerId\], references: \[id\])

  cleanerId       String?

  service         Service       @relation(fields: \[serviceId\], references: \[id\])

  serviceId       String

  mode            BookingMode

  status          BookingStatus @default(DRAFT)

  scheduledAt     DateTime

  totalAmount     Int

  platformFee     Int

  cleanerEarnings Int

  payments        Payment\[\]

  review          Review?

  dispute         Dispute?

  messages        ChatMessage\[\]

  createdAt       DateTime      @default(now())

  updatedAt       DateTime      @updatedAt

}

*End of Document MF-DOC-003*

Mama Fua — KhimTech  |  Lead Dev: Brian Wanjiku  |  QA: Maryann Wanjiru