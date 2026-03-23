# Mama Fua Platform

**Cleaning & Home Services Marketplace**

Developed by **KhimTech** | Lead Developers: Brian Wanjiku & Maryann Wanjiru| QA: Maryann Wanjiru | 2026

---

## Quick Start

### Prerequisites
- Node.js 20 LTS
- pnpm 8+
- Docker Desktop

### 1. Install dependencies
```bash
pnpm install
```

### 2. Start local services (PostgreSQL + Redis)
```bash
docker-compose up -d
```

### 3. Set up environment variables
```bash
cp packages/api/.env.example packages/api/.env
# Edit packages/api/.env with your values
```

### 4. Generate JWT keys (first time)
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy contents into .env JWT_PRIVATE_KEY and JWT_PUBLIC_KEY
```

### 5. Run database migrations and seed
```bash
pnpm db:migrate
pnpm db:seed
```

### 6. Start all services
```bash
pnpm dev
```

API runs at: http://localhost:3001
Health check: http://localhost:3001/health

---

## Project Structure

```
mama-fua/
├── apps/
│   ├── web/          Next.js web app (client-facing)
│   ├── mobile/       React Native + Expo app
│   └── admin/        Next.js admin dashboard
├── packages/
│   ├── api/          Express API server  ← START HERE
│   ├── database/     Prisma schema + migrations
│   ├── shared/       Types, constants, utilities
│   └── ui/           Shared component library
├── docs/             Full documentation (MF-DOC-001 to MF-DOC-010)
└── docker-compose.yml
```

## Test Accounts (after seed)

| Role    | Phone           | OTP (dev) |
|---------|----------------|-----------|
| Admin   | +254700000001  | 123456    |
| Client  | +254700000002  | 123456    |
| Cleaner | +254700000003  | 123456    |

## API Base URL

```
http://localhost:3001/api/v1
```

## Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/request-otp | Request OTP |
| POST | /auth/verify-otp | Verify OTP |
| POST | /auth/register | Register new user |
| POST | /auth/refresh | Refresh tokens |
| POST | /bookings | Create booking |
| GET | /bookings | List my bookings |
| POST | /bookings/:id/accept | Cleaner accepts job |
| POST | /bookings/:id/start | Cleaner checks in |
| POST | /bookings/:id/complete | Mark job done |
| POST | /bookings/:id/confirm | Client confirms |
| GET | /admin/dashboard | Platform KPIs |

Full API reference: **MF-DOC-009-API.docx**

---

## Documentation

| Document | File |
|----------|------|
| Product Overview | MF-DOC-001-Overview.docx |
| System Architecture | MF-DOC-002-Architecture.docx |
| Database Schema | MF-DOC-003-Database.docx |
| Billing & Payments | MF-DOC-004-Billing.docx |
| Maps & Matching | MF-DOC-005-Maps.docx |
| Notifications | MF-DOC-006-Notifications.docx |
| Admin Dashboard | MF-DOC-007-Admin.docx |
| Security & Compliance | MF-DOC-008-Security.docx |
| API Reference | MF-DOC-009-API.docx |
| Deployment & DevOps | MF-DOC-010-DevOps.docx |

---

*KhimTech — Building for East Africa, 2026*
