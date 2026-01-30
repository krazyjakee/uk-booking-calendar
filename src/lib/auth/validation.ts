import { AUTH_CONFIG } from "./config";

export function validateEmail(email: unknown): string | null {
  if (!email || typeof email !== "string") return "Email is required.";
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return "Enter a valid email address.";
  if (trimmed.length > 255) return "Email must be under 255 characters.";
  return null;
}

export function validatePassword(password: unknown): string | null {
  if (!password || typeof password !== "string") return "Password is required.";
  if (password.length < AUTH_CONFIG.passwordMinLength) {
    return `Password must be at least ${AUTH_CONFIG.passwordMinLength} characters.`;
  }
  if (password.length > 128) return "Password must be under 128 characters.";
  return null;
}

export function validateName(name: unknown): string | null {
  if (!name || typeof name !== "string") return "Name is required.";
  const trimmed = name.trim();
  if (trimmed.length < 1) return "Name is required.";
  if (trimmed.length > 255) return "Name must be under 255 characters.";
  return null;
}
