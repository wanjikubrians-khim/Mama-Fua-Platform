// Mama Fua — Test Environment Setup
// KhimTech | QA: Maryann Wanjiru | 2026
// Runs before every test file (setupFiles in jest.config.js)

process.env.NODE_ENV = 'test';
process.env.PORT = '3002';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mamafua_test';
process.env.DIRECT_URL = process.env.DATABASE_URL;
process.env.REDIS_URL = process.env.TEST_REDIS_URL ?? 'redis://localhost:6379/1'; // DB 1 = test namespace
process.env.JWT_PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQLF29amygykEMmYz0+Kcj3bKBp29N2rFXAvVGPY
testKeyForTestingOnlyDoNotUseInProduction==
-----END RSA PRIVATE KEY-----`;
process.env.JWT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2a2rwplBQLztest==
-----END PUBLIC KEY-----`;
process.env.JWT_ACCESS_EXPIRY = '900';
process.env.JWT_REFRESH_EXPIRY = '2592000';
process.env.MPESA_CONSUMER_KEY = 'test_consumer_key';
process.env.MPESA_CONSUMER_SECRET = 'test_consumer_secret';
process.env.MPESA_SHORTCODE = '174379';
process.env.MPESA_PASSKEY = 'test_passkey';
process.env.MPESA_CALLBACK_URL = 'https://test.mamafua.co.ke/api/v1/webhooks/mpesa/stk';
process.env.MPESA_B2C_RESULT_URL = 'https://test.mamafua.co.ke/api/v1/webhooks/mpesa/b2c';
process.env.MPESA_B2C_QUEUE_TIMEOUT_URL = 'https://test.mamafua.co.ke/api/v1/webhooks/mpesa/b2c/timeout';
process.env.MPESA_INITIATOR_NAME = 'testapi';
process.env.MPESA_SECURITY_CREDENTIAL = 'test_credential';
process.env.GOOGLE_MAPS_SERVER_KEY = 'test_maps_key';
process.env.AT_API_KEY = 'test_at_key';
process.env.AT_USERNAME = 'sandbox';
process.env.SENDGRID_API_KEY = 'SG.test';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.LOG_LEVEL = 'error'; // suppress logs during tests
