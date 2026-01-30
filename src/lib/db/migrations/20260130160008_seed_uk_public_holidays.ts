import type { Knex } from "knex";

const HOLIDAYS = [
  // 2026 — England and Wales
  { date: "2026-01-01", name: "New Year's Day", region: "england-and-wales" },
  { date: "2026-04-03", name: "Good Friday", region: "england-and-wales" },
  { date: "2026-04-06", name: "Easter Monday", region: "england-and-wales" },
  { date: "2026-05-04", name: "Early May bank holiday", region: "england-and-wales" },
  { date: "2026-05-25", name: "Spring bank holiday", region: "england-and-wales" },
  { date: "2026-08-31", name: "Summer bank holiday", region: "england-and-wales" },
  { date: "2026-12-25", name: "Christmas Day", region: "england-and-wales" },
  { date: "2026-12-28", name: "Boxing Day (substitute)", region: "england-and-wales" },

  // 2027 — England and Wales
  { date: "2027-01-01", name: "New Year's Day", region: "england-and-wales" },
  { date: "2027-03-26", name: "Good Friday", region: "england-and-wales" },
  { date: "2027-03-29", name: "Easter Monday", region: "england-and-wales" },
  { date: "2027-05-03", name: "Early May bank holiday", region: "england-and-wales" },
  { date: "2027-05-31", name: "Spring bank holiday", region: "england-and-wales" },
  { date: "2027-08-30", name: "Summer bank holiday", region: "england-and-wales" },
  { date: "2027-12-27", name: "Christmas Day (substitute)", region: "england-and-wales" },
  { date: "2027-12-28", name: "Boxing Day (substitute)", region: "england-and-wales" },

  // 2028 — England and Wales
  { date: "2028-01-03", name: "New Year's Day (substitute)", region: "england-and-wales" },
  { date: "2028-04-14", name: "Good Friday", region: "england-and-wales" },
  { date: "2028-04-17", name: "Easter Monday", region: "england-and-wales" },
  { date: "2028-05-01", name: "Early May bank holiday", region: "england-and-wales" },
  { date: "2028-05-29", name: "Spring bank holiday", region: "england-and-wales" },
  { date: "2028-08-28", name: "Summer bank holiday", region: "england-and-wales" },
  { date: "2028-12-25", name: "Christmas Day", region: "england-and-wales" },
  { date: "2028-12-26", name: "Boxing Day", region: "england-and-wales" },
];

export async function up(knex: Knex): Promise<void> {
  for (const holiday of HOLIDAYS) {
    const exists = await knex("uk_public_holidays")
      .where("date", holiday.date)
      .first();

    if (!exists) {
      await knex("uk_public_holidays").insert(holiday);
    }
  }

  // Seed default working hours (09:00–17:00 Mon–Fri) for existing tradesmen
  const tradesmen = await knex("users").where("role", "tradesman");
  for (const tradesman of tradesmen) {
    const hasProfile = await knex("tradesman_profiles")
      .where("user_id", tradesman.id)
      .first();

    if (!hasProfile) {
      await knex("tradesman_profiles").insert({ user_id: tradesman.id });
    }

    const hasHours = await knex("working_hours")
      .where("tradesman_id", tradesman.id)
      .first();

    if (!hasHours) {
      const days = [0, 1, 2, 3, 4]; // Monday to Friday
      for (const day of days) {
        await knex("working_hours").insert({
          tradesman_id: tradesman.id,
          day_of_week: day,
          start_time: "09:00",
          end_time: "17:00",
          is_active: true,
        });
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const holiday of HOLIDAYS) {
    await knex("uk_public_holidays").where("date", holiday.date).del();
  }
}
