# Mama Fua — Vercel Deployment Guide

**Last updated**: 2026-03-30  
**Status**: Production ready with fixes applied

---

## 🚀 Prerequisites

1. **Vercel Account** — https://vercel.com
2. **GitHub Repository** — Connected to Vercel
3. **External Services** configured:
   - PostgreSQL database (Supabase or Vercel Postgres)
   - Redis (Upstash.com recommended)
   - M-Pesa credentials (Safaricom Daraja)
   - Stripe API keys
   - Firebase project
   - SendGrid account
   - Google Maps API key
   - Africa's Talking account
   - Cloudinary account

---

## ✅ Production Setup Checklist

### Step 1: Generate JWT Keys (CRITICAL)

```bash
# Generate private key
openssl genrsa -out private.pem 2048

# Generate public key from private key
openssl rsa -in private.pem -pubout -out public.pem

# Base64 encode for .env (keep the newlines as \n)
cat private.pem | base64 -w0
cat public.pem | base64 -w0
```

Add to Vercel/production `.env`:
```
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n[your-base64-key]\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n[your-base64-key]\n-----END PUBLIC KEY-----"
```

### Step 2: Database Setup

#### Option A: Supabase (Recommended)
1. Create project at https://supabase.com
2. Copy connection string: `postgresql://user:pass@host.supabase.co/dbname?sslmode=require`
3. Set in Vercel:
   ```
   DATABASE_URL=postgresql://...
   DIRECT_URL=postgresql://...
   ```

#### Option B: Vercel Postgres
1. In Vercel dashboard: Storage → Create Database → Postgres
2. Copy connection strings
3. Set `DATABASE_URL` and `DIRECT_URL` in Vercel environment

### Step 3: Run Database Migrations

```bash
# Local (before deployment)
pnpm db:migrate:deploy

# Or in Vercel deployment (via prestart)
# The build process runs: pnpm db:generate && pnpm db:migrate:deploy
```

### Step 4: Redis Setup (Upstash)

1. Create account at https://upstash.com
2. Create Redis database
3. Copy connection string: `redis://default:password@host.upstash.io:port`
4. Set in Vercel: `REDIS_URL=...`

### Step 5: M-Pesa Configuration

1. Get production credentials from Safaricom's Daraja portal
2. Set in Vercel (replace sandbox values):
   ```
   MPESA_BASE_URL=https://api.safaricom.co.ke
   MPESA_CONSUMER_KEY=your_production_key
   MPESA_CONSUMER_SECRET=your_production_secret
   MPESA_CALLBACK_URL=https://your-api.vercel.app/api/v1/webhooks/mpesa/stk
   MPESA_B2C_RESULT_URL=https://your-api.vercel.app/api/v1/webhooks/mpesa/b2c
   MPESA_B2C_QUEUE_TIMEOUT_URL=https://your-api.vercel.app/api/v1/webhooks/mpesa/b2c/timeout
   ```

3. Update Safaricom callback URLs in Daraja portal

### Step 6: External Services

Set these in Vercel environment variables:

#### Stripe
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Google Maps
```
GOOGLE_MAPS_SERVER_KEY=AIza...
NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIza...
```

#### Firebase
```
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

#### SendGrid
```
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=noreply@mamafua.co.ke
```

#### Africa's Talking
```
AT_API_KEY=...
AT_USERNAME=...
AT_SENDER_ID=MAMAFUA
```

#### Cloudinary
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Step 7: CORS & Domains

Update CORS settings to production domains:

```
ALLOWED_ORIGINS=https://mamafua.co.ke,https://app.mamafua.co.ke,https://admin.mamafua.co.ke
FRONTEND_URL=https://mamafua.co.ke
APP_URL=https://api.mamafua.co.ke
```

---

## 🔧 Vercel Configuration

### Create `vercel.json` (Already configured)

```json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install --frozen-lockfile"
}
```

### Environment Variables in Vercel Dashboard

1. Go to **Project Settings** → **Environment Variables**
2. Add all variables from `.env.example`
3. Mark as **Production** environment
4. **Important**: Always test in **Preview** first before promoting to **Production**

---

## 📋 Deployment Steps

### 1. Add Vercel remote to git (if not connected)
```bash
git remote add vercel https://vercel.com/cli
```

### 2. Deploy from GitHub
```bash
# Option A: Auto-deploy via GitHub
# Push to main branch → Vercel auto-deploys

# Option B: Manual CLI
vercel deploy --prod
```

### 3. Verify Deployment

```bash
# Check API health
curl https://your-api.vercel.app/health

# Check logs
vercel logs --follow
```

### 4. Test Each Service

- **Auth**: POST /api/v1/auth/send-otp
- **M-Pesa**: POST /api/v1/payments/mpesa/stk
- **Emails**: Check SendGrid dashboard
- **Push notifications**: Check Firebase console
- **Database**: Connect to Supabase dashboard

---

## ⚠️ Critical Security Notes

### NEVER Commit Secrets
- `.env.local` should be in `.gitignore`
- All secrets go in Vercel dashboard, NOT code
- JWT keys must be rotated every 90 days in production

### CORS Whitelist
- ✅ Correct: `ALLOWED_ORIGINS=https://mamafua.co.ke,https://app.mamafua.co.ke`
- ❌ Wrong: `ALLOWED_ORIGINS=*`
- ❌ Wrong: `ALLOWED_ORIGINS=http://localhost:3000` (localhost won't work in production)

### Database Access
- `DIRECT_URL` bypasses Vercel's connection pooler (use for migrations)
- `DATABASE_URL` uses pooler (use for application queries)
- Never expose database credentials in frontend code

---

## 🚨 Monitoring & Troubleshooting

### View Logs
```bash
vercel logs --prod
```

### Common Issues

#### **502 Bad Gateway**
- JWT keys invalid → check `JWT_PRIVATE_KEY` format
- Database unavailable → check `DATABASE_URL`
- Redis timeout → check `REDIS_URL`

#### **CORS errors**
- Check `ALLOWED_ORIGINS` matches your frontend domain
- Ensure HTTPS is used (not HTTP)

#### **M-Pesa callbacks not received**
- Verify `MPESA_CALLBACK_URL` is HTTPS
- Check Safaricom IP whitelist (if enabled)
- Test with ngrok locally first

#### **Emails not sending**
- Check `SENDGRID_API_KEY` is set to production key (starts with `SG.`)
- Verify sender email is verified in SendGrid dashboard

#### **Database migrations fail**
- Run `pnpm db:generate` locally first
- Ensure `DIRECT_URL` is correct before deploying
- Check database has public schema

---

## 📞 Rollback Plan

If deployment fails:

```bash
# View previous deployments
vercel deploy --list

# Rollback to previous version
vercel promote <deployment-id>
```

---

## 🔄 Continuous Deployment

### GitHub Actions Setup (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - uses: vercel/action@main
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
```

---

## ✨ Performance Tips

1. **Enable caching** in Vercel dashboard
2. **Use CDN** for static assets (Cloudinary for images)
3. **Monitor function duration** — optimize hot paths
4. **Use database indexes** on frequently queried columns
5. **Enable gzip compression** (automatic in Next.js)

---

## Fix Summary

**Security fixes applied:**
- ✅ CORS vulnerability patched (empty ALLOWED_ORIGINS no longer allows all)
- ✅ JWT key validation at startup (fails fast in production)
- ✅ Stripe webhook signature verification (ready for Phase 2 implementation)
- ✅ M-Pesa B2C timeout handler improved with structured logging

**Environment variables:**
- ✅ All missing variables documented
- ✅ Production `.env.example` created
- ✅ Local `.env` updated with all required variables

Ready to deploy! 🚀
