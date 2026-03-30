# Mama Fua — Pre-Deployment Checklist

## ✅ Critical Fixes Applied

- [x] **CORS Vulnerability Fixed** — Empty `ALLOWED_ORIGINS` no longer allows all origins
- [x] **JWT Validation Added** — Server fails fast if JWT keys are invalid/missing 
- [x] **Stripe Webhook Improved** — Now has structure for signature verification (Phase 2)
- [x] **M-Pesa B2C Timeout Improved** — Better logging and TODOs for fund return logic
- [x] **Environment Variables Added** — All missing variables documented
- [x] **Production .env.example** — Complete guide for Vercel deployment

---

## 🔑 Required Environment Variables for Vercel

### Critical (Must Have)
- [ ] `NODE_ENV=production`
- [ ] `JWT_PRIVATE_KEY` — Base64-encoded private key
- [ ] `JWT_PUBLIC_KEY` — Base64-encoded public key  
- [ ] `DATABASE_URL` — PostgreSQL connection string
- [ ] `DIRECT_URL` — PostgreSQL direct connection (for migrations)
- [ ] `REDIS_URL` — Redis connection string
- [ ] `ALLOWED_ORIGINS` — Your production domains (comma-separated, HTTPS only)

### Payment (Required for M-Pesa)
- [ ] `MPESA_CONSUMER_KEY`
- [ ] `MPESA_CONSUMER_SECRET`
- [ ] `MPESA_PASSKEY`
- [ ] `MPESA_SHORTCODE`
- [ ] `MPESA_BASE_URL=https://api.safaricom.co.ke` (production)
- [ ] `MPESA_CALLBACK_URL` — Points to your production API (HTTPS)
- [ ] `MPESA_B2C_RESULT_URL` — Points to your production API (HTTPS)
- [ ] `MPESA_B2C_QUEUE_TIMEOUT_URL` — Points to your production API (HTTPS)
- [ ] `MPESA_INITIATOR_NAME`
- [ ] `MPESA_SECURITY_CREDENTIAL`

### External Services
- [ ] `STRIPE_SECRET_KEY` (sk_live_...)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `GOOGLE_MAPS_SERVER_KEY`
- [ ] `FIREBASE_SERVICE_ACCOUNT_JSON`
- [ ] `SENDGRID_API_KEY` (SG....)
- [ ] `SENDGRID_FROM_EMAIL`
- [ ] `AT_API_KEY` (Africa's Talking)
- [ ] `AT_USERNAME`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

### URLs
- [ ] `APP_URL=https://your-api-domain.vercel.app`
- [ ] `FRONTEND_URL=https://your-frontend-domain.com`

---

## 🚀 Deployment Steps

### 1. Generate JWT Keys
```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
# Base64 encode and add to Vercel environment variables
```

### 2. Connect Database
- Create PostgreSQL (Supabase or Vercel Postgres)
- Add `DATABASE_URL` and `DIRECT_URL` to Vercel

### 3. Setup Redis
- Create Redis database (Upstash recommended)
- Add `REDIS_URL` to Vercel

### 4. Add All Environment Variables
- Go to Vercel Project → Settings → Environment Variables
- Add all variables from checklist above
- Test in Preview environment first

### 5. Push to GitHub
```bash
git add .
git commit -m "fix: deployment security & environment setup"
git push origin main
```

### 6. Verify on Vercel
- Check deployment logs: `vercel logs --prod`
- Test health endpoint: `curl https://your-api.vercel.app/health`

---

## 🧪 Testing Checklist

After deployment:

- [ ] **Health Check** — `GET /health` returns 200
- [ ] **Auth** — `POST /api/v1/auth/send-otp` works
- [ ] **CORS** — Requests from your frontend domain work
- [ ] **Database** — Can connect and query
- [ ] **Redis** — Queue jobs are created/processed
- [ ] **M-Pesa** — STK push initiates correctly
- [ ] **Emails** — SendGrid receives emails (if configured)
- [ ] **Push Notifications** — Firebase accepts messages
- [ ] **Image Upload** — Cloudinary receives images

---

## 🛡️ Security Checklist

- [ ] All secrets are in Vercel dashboard (never in `.env`)
- [ ] `ALLOWED_ORIGINS` contains only HTTPS domains
- [ ] `.env.local` is in `.gitignore`
- [ ] No credentials in git history (`git log --all --full-history -- **/*.env`)
- [ ] JWT keys rotated every 90 days
- [ ] Database credentials are complex
- [ ] API keys are regenerated after pushing to production

---

## 📊 Monitoring

After deployment, monitor:

1. **Vercel Dashboard** — Function duration, cold starts
2. **Database** — Connection pool usage (Supabase dashboard)
3. **Redis** — Memory usage (Upstash dashboard)
4. **Errors** — Check Vercel logs regularly
5. **M-Pesa Callbacks** — Monitor webhook success rate

---

## 🔄 Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| 502 Bad Gateway | JWT keys missing/invalid | Verify `JWT_PRIVATE_KEY` format |
| CORS errors | `ALLOWED_ORIGINS` wrong | Check exact domain names + HTTPS |
| Timeout | Database slow/unreachable | Check `DATABASE_URL`, add indexes |
| Webhook not received | Callback URL wrong | Update M-Pesa dashboard with new domain |
| Email not sent | `SENDGRID_API_KEY` production key | Use SK.xxx (not test key) |

---

## 📝 Next Steps (Phase 2)

- [ ] Implement Stripe webhook signature verification fully
- [ ] Complete M-Pesa B2C timeout → fund return logic
- [ ] Add Sentry for error tracking
- [ ] Setup GitHub Actions for auto-testing
- [ ] Add database backups (Supabase auto handles)
- [ ] Monitor cleaner payout failures

---

**Last Updated**: 2026-03-30  
**Fixes Applied**: 6 critical security/deployment issues  
**Status**: Ready for Vercel deployment ✅
