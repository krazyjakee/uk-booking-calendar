import { describe, it, expect } from "vitest";
import {
  isBST,
  formatUKDate,
  formatUKTime,
  ukLocalToUTC,
  utcToUKLocal,
  getISODayOfWeek,
  compareTime,
  addMinutesToTime,
  timeToMinutes,
} from "./timezone";

describe("Phase 3 — UK timezone utilities", () => {
  describe("isBST", () => {
    it("returns true for a summer date (July)", () => {
      // July 15, 2026 12:00 UTC — definitely BST
      const summer = new Date("2026-07-15T12:00:00Z");
      expect(isBST(summer)).toBe(true);
    });

    it("returns false for a winter date (January)", () => {
      // January 15, 2026 12:00 UTC — definitely GMT
      const winter = new Date("2026-01-15T12:00:00Z");
      expect(isBST(winter)).toBe(false);
    });

    it("returns false for a December date", () => {
      const december = new Date("2026-12-25T12:00:00Z");
      expect(isBST(december)).toBe(false);
    });
  });

  describe("formatUKDate", () => {
    it("formats a UTC date to YYYY-MM-DD in UK time", () => {
      // Noon UTC in winter — same date in UK
      const date = new Date("2026-03-15T12:00:00Z");
      expect(formatUKDate(date)).toBe("2026-03-15");
    });

    it("handles date boundary correctly in winter", () => {
      // Just after midnight UTC on Jan 15 — same date in UK (GMT)
      const date = new Date("2026-01-15T00:30:00Z");
      expect(formatUKDate(date)).toBe("2026-01-15");
    });
  });

  describe("formatUKTime", () => {
    it("formats a UTC time to HH:MM in UK time (winter/GMT)", () => {
      // 14:00 UTC in January = 14:00 UK (GMT = UTC+0)
      const date = new Date("2026-01-15T14:00:00Z");
      expect(formatUKTime(date)).toBe("14:00");
    });

    it("formats a UTC time to HH:MM in UK time (summer/BST)", () => {
      // 14:00 UTC in July = 15:00 UK (BST = UTC+1)
      const date = new Date("2026-07-15T14:00:00Z");
      expect(formatUKTime(date)).toBe("15:00");
    });
  });

  describe("ukLocalToUTC", () => {
    it("converts winter UK time to UTC (no offset)", () => {
      const utc = ukLocalToUTC("2026-01-15", "09:00");
      expect(utc.getUTCHours()).toBe(9);
    });

    it("converts summer UK time to UTC (BST offset)", () => {
      const utc = ukLocalToUTC("2026-07-15", "09:00");
      // BST is UTC+1, so 09:00 UK = 08:00 UTC
      expect(utc.getUTCHours()).toBe(8);
    });
  });

  describe("utcToUKLocal", () => {
    it("converts UTC to UK local date and time (winter)", () => {
      const utc = new Date("2026-01-15T10:00:00Z");
      const result = utcToUKLocal(utc);
      expect(result.date).toBe("2026-01-15");
      expect(result.time).toBe("10:00");
    });

    it("converts UTC to UK local date and time (summer)", () => {
      const utc = new Date("2026-07-15T10:00:00Z");
      const result = utcToUKLocal(utc);
      expect(result.date).toBe("2026-07-15");
      expect(result.time).toBe("11:00"); // BST = UTC+1
    });
  });

  describe("getISODayOfWeek", () => {
    it("returns 0 for Monday", () => {
      // 2026-01-05 is a Monday
      expect(getISODayOfWeek("2026-01-05")).toBe(0);
    });

    it("returns 4 for Friday", () => {
      // 2026-01-09 is a Friday
      expect(getISODayOfWeek("2026-01-09")).toBe(4);
    });

    it("returns 5 for Saturday", () => {
      // 2026-01-10 is a Saturday
      expect(getISODayOfWeek("2026-01-10")).toBe(5);
    });

    it("returns 6 for Sunday", () => {
      // 2026-01-11 is a Sunday
      expect(getISODayOfWeek("2026-01-11")).toBe(6);
    });

    it("returns 2 for Wednesday", () => {
      // 2026-01-07 is a Wednesday
      expect(getISODayOfWeek("2026-01-07")).toBe(2);
    });
  });

  describe("compareTime", () => {
    it("returns negative when first time is earlier", () => {
      expect(compareTime("09:00", "10:00")).toBeLessThan(0);
    });

    it("returns positive when first time is later", () => {
      expect(compareTime("14:00", "09:00")).toBeGreaterThan(0);
    });

    it("returns zero for equal times", () => {
      expect(compareTime("10:30", "10:30")).toBe(0);
    });

    it("compares minutes correctly", () => {
      expect(compareTime("09:30", "09:00")).toBeGreaterThan(0);
    });
  });

  describe("addMinutesToTime", () => {
    it("adds 60 minutes to a time", () => {
      expect(addMinutesToTime("09:00", 60)).toBe("10:00");
    });

    it("adds 30 minutes to a time", () => {
      expect(addMinutesToTime("09:00", 30)).toBe("09:30");
    });

    it("handles overflow past an hour", () => {
      expect(addMinutesToTime("09:45", 30)).toBe("10:15");
    });

    it("adds zero minutes", () => {
      expect(addMinutesToTime("14:30", 0)).toBe("14:30");
    });

    it("handles large additions", () => {
      expect(addMinutesToTime("09:00", 480)).toBe("17:00"); // 8 hours
    });
  });

  describe("timeToMinutes", () => {
    it("converts midnight to 0", () => {
      expect(timeToMinutes("00:00")).toBe(0);
    });

    it("converts 09:00 to 540", () => {
      expect(timeToMinutes("09:00")).toBe(540);
    });

    it("converts 17:30 to 1050", () => {
      expect(timeToMinutes("17:30")).toBe(1050);
    });

    it("converts 23:59 to 1439", () => {
      expect(timeToMinutes("23:59")).toBe(1439);
    });
  });
});
