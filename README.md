# Mama Fua Platform

**Cleaning & Home Services Marketplace - Kenya**

Developed by **KhimTech** | Lead Developers: Brian Wanjiku & Maryann Wanjiru | QA: Maryann Wanjiru | 2026

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20 LTS
- pnpm 8+
- Docker Desktop
- Git

### 📦 1. Install Dependencies
```bash
git clone https://github.com/wanjikubrians-khim/Mama-Fua-Platform.git
cd Mama-Fua-Platform
pnpm install
```

### 🐳 2. Start Local Services
```bash
docker-compose up -d
```
This starts PostgreSQL and Redis containers.

### 🔐 3. Environment Setup
```bash
# Copy environment templates
cp packages/api/.env.example packages/api/.env
cp packages/database/.env.example packages/database/.env

# Required Environment Variables:
# M-Pesa Sandbox (get from developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_PASSKEY=your_passkey

# Database (Supabase recommended - see Database Setup below)
DATABASE_URL=your_database_url
DIRECT_URL=your_database_url

# JWT Keys (generate once)
JWT_PRIVATE_KEY=your_private_key
JWT_PUBLIC_KEY=your_public_key
```

### 🔑 4. Generate JWT Keys (First Time Only)
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Copy contents into your .env file
```

### 🗄️ 5. Database Setup
**Option A: Supabase (Recommended)**
1. Create free account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy connection strings to .env
4. Run: `pnpm db:push`

**Option B: Local PostgreSQL**
1. Ensure Docker is running
2. Run: `pnpm db:push`

### 🎯 6. Start Development
```bash
pnpm dev
```

## 🌐 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:3000 | Client-facing application |
| **Admin Dashboard** | http://localhost:3001 | Admin control panel |
| **API Server** | http://localhost:3001/api/v1 | REST API |
| **Health Check** | http://localhost:3001/health | Server status |
| **API Docs** | http://localhost:3001/docs | Interactive API docs |

## 📱 Test Accounts (Development)

| Role | Phone Number | OTP (Development) |
|------|-------------|-------------------|
| **Admin** | +254700000001 | 123456 |
| **Client** | +254700000002 | 123456 |
| **Cleaner** | +254700000003 | 123456 |

## 🏗️ Project Architecture

```
mama-fua/
├── apps/
│   ├── web/              # Next.js web application (clients)
│   ├── admin/            # Next.js admin dashboard
│   └── mobile/           # React Native + Expo app
├── packages/
│   ├── api/              # Express.js API server
│   ├── database/         # Prisma ORM & migrations
│   ├── shared/           # Shared types & utilities
│   └── ui/               # Shared component library
├── docs/                 # Complete documentation (MF-DOC-001 to MF-DOC-009)
├── docker-compose.yml    # Local development services
└── README.md
```

## 💳 Payment Integration

### M-Pesa (Sandbox)
```bash
# Test credentials (already configured)
MPESA_CONSUMER_KEY=5rq3xhLyNPnfFiI8pgLMhAvgoZsYzhrrOzQZ827Og7j9mrT8
MPESA_CONSUMER_SECRET=o089O2qtkRBafjGZyTG7evTukb3GmghOA0pXs6WNrmAIGUtgGYNpYdNomuE67FBU
MPESA_PASSKEY=bfb279c9769729a711f685ccf1be3f9e6d43298e44c2df1a7d8e6381b7e27bd1
```

### Testing M-Pesa
- Use any Kenyan phone number (+254...)
- Test amounts: KES 1-100
- PIN: `123456` (sandbox default)

## 📚 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/request-otp` | Send OTP to phone |
| `POST` | `/auth/verify-otp` | Verify OTP & get tokens |
| `POST` | `/auth/register` | Register new user |
| `GET` | `/users/me` | Get current user profile |
| `POST` | `/bookings` | Create new booking |
| `GET` | `/bookings` | List user bookings |
| `POST` | `/payments/mpesa/initiate` | Initiate M-Pesa payment |
| `GET` | `/admin/dashboard` | Platform analytics |
| `GET` | `/admin/disputes` | Dispute management |

## 🛠️ Development Commands

```bash
# Development
pnpm dev              # Start all services
pnpm dev:api          # API server only
pnpm dev:web          # Web app only
pnpm dev:admin        # Admin dashboard only

# Database
pnpm db:push          # Push schema to database
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed test data

# Build & Deploy
pnpm build            # Build all packages
pnpm deploy           # Deploy to production
```

## 🔧 Features Implemented

### ✅ Core Platform
- **Authentication**: OTP-based login with JWT tokens
- **User Management**: Clients, Cleaners, Admin roles
- **Booking System**: Create, manage, track bookings
- **Payment Processing**: M-Pesa integration with escrow
- **Location Services**: Google Maps integration
- **Matching Engine**: Smart cleaner-client matching

### ✅ Admin Dashboard
- **Analytics Dashboard**: Platform KPIs and metrics
- **User Management**: View, suspend, ban users
- **Dispute Resolution**: Handle booking disputes
- **Cleaner Verification**: ID verification workflow
- **Financial Reports**: Revenue and payout tracking

### ✅ Client Features
- **Service Booking**: Browse and book cleaning services
- **Real-time Tracking**: Live location tracking
- **Payment Processing**: M-Pesa, card, wallet payments
- **Notifications**: In-app, email, SMS notifications
- **Rating System**: Rate and review cleaners

### ✅ Cleaner Features
- **Profile Management**: Create and update profiles
- **Job Management**: Accept and track jobs
- **Earnings Dashboard**: View earnings and payouts
- **Availability Calendar**: Set working hours
- **Service Pricing**: Set rates for different services

### ✅ Security & Compliance
- **Two-Factor Authentication**: TOTP, SMS, Email options
- **Activity Logging**: Comprehensive audit trail
- **Data Privacy**: GDPR-compliant data handling
- **Rate Limiting**: API protection and abuse prevention
- **Input Validation**: Zod schemas throughout

## 📖 Documentation

| Document | Description | File |
|----------|-------------|------|
| **MF-DOC-001** | Product Overview & Requirements | `documentation/MF-DOC-001-Overview.docx.md` |
| **MF-DOC-002** | System Architecture & Design | `documentation/MF-DOC-002-Architecture.docx.md` |
| **MF-DOC-003** | Database Schema & Design | `documentation/MF-DOC-003-Database.docx.md` |
| **MF-DOC-004** | Billing & Payment System | `documentation/MF-DOC-004-Billing.docx.md` |
| **MF-DOC-005** | Maps & Location Services | `documentation/MF-DOC-005-Maps.docx.md` |
| **MF-DOC-006** | Notifications & Communications | `documentation/MF-DOC-006-Notifications.docx.md` |
| **MF-DOC-007** | Admin Dashboard & Management | `documentation/MF-DOC-007-Admin.docx.md` |
| **MF-DOC-008** | Security, Compliance & Privacy | `documentation/MF-DOC-008-Security.docx.md` |
| **MF-DOC-009** | API Reference & Documentation | `documentation/MF-DOC-009-API.docx.md` |

## 🚀 Deployment

### Environment Setup
```bash
# Production Environment Variables
NODE_ENV=production
DATABASE_URL=production_database_url
MPESA_CONSUMER_KEY=production_mpesa_key
MPESA_CONSUMER_SECRET=production_mpesa_secret
JWT_PRIVATE_KEY=production_jwt_private
JWT_PUBLIC_KEY=production_jwt_public
```

### Vercel Deployment
```bash
# Deploy web applications
vercel --prod

# Environment variables in Vercel dashboard
# - DATABASE_URL
# - MPESA_CONSUMER_KEY
# - MPESA_CONSUMER_SECRET
# - JWT_PUBLIC_KEY
```

### Railway Deployment (API)
```bash
# Deploy API server
railway login
railway link
railway up
```

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check Docker containers
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check database logs
docker logs mamafua-postgres
```

**2. M-Pesa Payment Issues**
- Ensure sandbox credentials are correct
- Check callback URLs are accessible
- Verify phone number format (+254...)

**3. API Server Not Starting**
```bash
# Check environment variables
cat packages/api/.env

# Generate Prisma client
cd packages/database && npx prisma generate

# Check logs
pnpm dev:api
```

**4. Build Errors**
```bash
# Clear node_modules
rm -rf node_modules
pnpm install

# Clear build cache
pnpm clean
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary software developed by KhimTech.

## 📞 Support

- **Email**: dev@khimtech.co.ke
- **Documentation**: See MF-DOC series above
- **Issues**: Create issue on GitHub repository

---

**KhimTech — Building for East Africa, 2026**

🌟 **Made with ❤️ in Kenya** 🌟
