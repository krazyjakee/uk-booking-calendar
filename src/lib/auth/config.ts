export const AUTH_CONFIG = {
  jwtSecret: process.env.JWT_SECRET || "",
  jwtIssuer: process.env.JWT_ISSUER || "uk-booking-calendar",
  jwtExpiry: process.env.JWT_EXPIRY || "7d",
  cookieName: "auth-token",
  bcryptRounds: 12,
  passwordMinLength: 8,
} as const;
