// Global test setup — set environment variables before any imports
process.env.JWT_SECRET = "test-secret-key-that-is-at-least-32-characters-long";
process.env.JWT_ISSUER = "uk-booking-calendar-test";
process.env.JWT_EXPIRY = "1h";
process.env.NODE_ENV = "test";
