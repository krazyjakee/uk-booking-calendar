import { SignJWT, jwtVerify } from "jose";
import { AUTH_CONFIG } from "./config";
import type { JwtPayload, SafeUser } from "./types";

function getSecretKey(): Uint8Array {
  const secret = AUTH_CONFIG.jwtSecret;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(user: SafeUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuer(AUTH_CONFIG.jwtIssuer)
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.jwtExpiry)
    .sign(getSecretKey());
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, getSecretKey(), {
    issuer: AUTH_CONFIG.jwtIssuer,
  });
  return payload as unknown as JwtPayload;
}
