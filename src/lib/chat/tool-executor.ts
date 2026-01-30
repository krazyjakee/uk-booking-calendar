import db from "@/lib/db";
import { getAvailableSlots, isSlotAvailable, isWithinWorkingHours } from "@/lib/bookings/availability";
import { isPublicHoliday } from "@/lib/bookings/holidays";
import { getCurrentUKDate } from "@/lib/bookings/timezone";
import {
  validateDate,
  validateFutureDate,
  validateTime,
  validateHourBoundary,
  validateDuration,
  validateCustomerEmail,
  validateCustomerName,
} from "@/lib/bookings/validation";
import { addMinutesToTime } from "@/lib/bookings/timezone";

/**
 * Execute a tool call from the Gemini model.
 * Returns a result object that will be sent back to the model as context.
 */
export async function executeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  tradesmanId: string,
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case "checkAvailability":
      return handleCheckAvailability(args, tradesmanId);
    case "createBooking":
      return handleCreateBooking(args, tradesmanId);
    case "requestCallback":
      return handleRequestCallback(args, tradesmanId);
    case "leaveMessage":
      return handleLeaveMessage(args, tradesmanId);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function handleCheckAvailability(
  args: Record<string, unknown>,
  tradesmanId: string,
): Promise<Record<string, unknown>> {
  const date = args.date as string | undefined;
  const durationMinutes = (args.duration_minutes as number) ?? 60;

  if (!date) {
    return { error: "Date is required." };
  }

  const dateError = validateDate(date);
  if (dateError) return { error: dateError };

  const currentDate = getCurrentUKDate();
  const futureError = validateFutureDate(date, currentDate);
  if (futureError) return { error: futureError };

  const result = await getAvailableSlots(tradesmanId, date, durationMinutes);

  const availableSlots = result.slots.filter((s) => s.available);

  return {
    date,
    is_holiday: result.isHoliday,
    holiday_name: result.holidayName,
    available_slots: availableSlots.map((s) => ({
      start_time: s.start_time,
      end_time: s.end_time,
    })),
    total_slots: result.slots.length,
    available_count: availableSlots.length,
  };
}

async function handleCreateBooking(
  args: Record<string, unknown>,
  tradesmanId: string,
): Promise<Record<string, unknown>> {
  const customerName = args.customer_name as string | undefined;
  const customerEmail = args.customer_email as string | undefined;
  const customerPhone = (args.customer_phone as string) ?? null;
  const date = args.date as string | undefined;
  const startTime = args.start_time as string | undefined;
  const durationMinutes = (args.duration_minutes as number) ?? 60;
  const description = (args.description as string) ?? null;

  // Validate inputs
  const nameError = validateCustomerName(customerName);
  if (nameError) return { success: false, error: nameError };

  const emailError = validateCustomerEmail(customerEmail);
  if (emailError) return { success: false, error: emailError };

  const dateError = validateDate(date);
  if (dateError) return { success: false, error: dateError };

  const currentDate = getCurrentUKDate();
  const futureError = validateFutureDate(date!, currentDate);
  if (futureError) return { success: false, error: futureError };

  const timeError = validateTime(startTime);
  if (timeError) return { success: false, error: timeError };

  const hourError = validateHourBoundary(startTime!);
  if (hourError) return { success: false, error: hourError };

  const durationError = validateDuration(durationMinutes);
  if (durationError) return { success: false, error: durationError };

  const endTime = addMinutesToTime(startTime!, durationMinutes);

  // Check public holiday
  const holiday = await isPublicHoliday(date!);
  if (holiday.isHoliday) {
    return {
      success: false,
      error: `${date} is a public holiday (${holiday.name}). No bookings can be made on this date.`,
    };
  }

  // Check working hours
  const withinHours = await isWithinWorkingHours(tradesmanId, date!, startTime!, endTime);
  if (!withinHours) {
    return {
      success: false,
      error: "The requested time is outside the tradesman's working hours.",
    };
  }

  // Check slot availability
  const available = await isSlotAvailable(tradesmanId, date!, startTime!, endTime);
  if (!available) {
    return {
      success: false,
      error: "The requested time slot is no longer available.",
    };
  }

  // Upsert customer
  const trimmedEmail = customerEmail!.trim().toLowerCase();
  const trimmedName = customerName!.trim();

  let customer = await db("customers")
    .where("email", trimmedEmail)
    .first<{ id: string } | undefined>();

  if (customer) {
    await db("customers")
      .where("id", customer.id)
      .update({
        name: trimmedName,
        phone: customerPhone,
        updated_at: db.fn.now(),
      });
  } else {
    const [inserted] = await db("customers")
      .insert({
        email: trimmedEmail,
        name: trimmedName,
        phone: customerPhone,
      })
      .returning("id");
    customer = { id: inserted.id };
  }

  // Create booking
  const [booking] = await db("bookings")
    .insert({
      tradesman_id: tradesmanId,
      customer_id: customer.id,
      date: date!,
      start_time: startTime!,
      end_time: endTime,
      duration_minutes: durationMinutes,
      status: "pending",
      description,
      created_by: "chatbot",
    })
    .returning("id");

  // Log initial status
  await db("booking_status_log").insert({
    booking_id: booking.id,
    from_status: null,
    to_status: "pending",
    changed_by: null,
    reason: "Created via chat widget",
  });

  return {
    success: true,
    booking_id: booking.id,
    date: date!,
    start_time: startTime!,
    end_time: endTime,
    duration_minutes: durationMinutes,
    status: "pending",
    message: "Booking has been created successfully with a pending status.",
  };
}

async function handleRequestCallback(
  args: Record<string, unknown>,
  tradesmanId: string,
): Promise<Record<string, unknown>> {
  const customerName = args.customer_name as string | undefined;
  const customerPhone = args.customer_phone as string | undefined;
  const message = (args.message as string) ?? null;

  if (!customerName || !customerName.trim()) {
    return { success: false, error: "Customer name is required." };
  }
  if (!customerPhone || !customerPhone.trim()) {
    return { success: false, error: "Customer phone number is required." };
  }

  const fullMessage = message
    ? `Callback requested: ${message}`
    : "Callback requested via chat widget.";

  await db("chat_messages").insert({
    tradesman_id: tradesmanId,
    customer_name: customerName.trim(),
    customer_email: "callback@placeholder.local",
    customer_phone: customerPhone.trim(),
    message: fullMessage,
  });

  return {
    success: true,
    message: "Callback request has been submitted. The tradesman will be in touch shortly.",
  };
}

async function handleLeaveMessage(
  args: Record<string, unknown>,
  tradesmanId: string,
): Promise<Record<string, unknown>> {
  const customerName = args.customer_name as string | undefined;
  const customerEmail = args.customer_email as string | undefined;
  const customerPhone = (args.customer_phone as string) ?? null;
  const message = args.message as string | undefined;

  const nameError = validateCustomerName(customerName);
  if (nameError) return { success: false, error: nameError };

  const emailError = validateCustomerEmail(customerEmail);
  if (emailError) return { success: false, error: emailError };

  if (!message || !message.trim()) {
    return { success: false, error: "Message is required." };
  }

  await db("chat_messages").insert({
    tradesman_id: tradesmanId,
    customer_name: customerName!.trim(),
    customer_email: customerEmail!.trim().toLowerCase(),
    customer_phone: customerPhone?.trim() ?? null,
    message: message.trim(),
  });

  return {
    success: true,
    message: "Your message has been sent. The tradesman will review it and follow up.",
  };
}
