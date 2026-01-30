import type { BookingStatus } from "./types";

const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in-progress", "cancelled", "no-show"],
  "in-progress": ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  "no-show": [],
};

const TERMINAL_STATUSES: BookingStatus[] = ["completed", "cancelled", "no-show"];

export function canTransition(
  from: BookingStatus,
  to: BookingStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function validateTransition(
  from: BookingStatus,
  to: BookingStatus
): string | null {
  if (!canTransition(from, to)) {
    return `Cannot change status from "${from}" to "${to}".`;
  }
  return null;
}

export function isTerminalStatus(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}
