/**
 * Vitest setup — runs before every test file. Sets a dedicated test database
 * and test secrets BEFORE app modules are imported (env.js reads process.env
 * and dotenv does not override existing values).
 */
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/campus_connect_test';
process.env.JWT_SECRET = 'test-jwt-secret-0123456789';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789';
process.env.RAZORPAY_KEY_ID = 'rzp_test_dummy';
process.env.RAZORPAY_KEY_SECRET = 'test_secret_key';
process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.PORT = '5100';
