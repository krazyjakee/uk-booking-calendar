import type { FunctionDeclaration } from "@google/genai";

export const chatToolDefinitions: FunctionDeclaration[] = [
  {
    name: "checkAvailability",
    description:
      "Check available booking slots for a tradesman on a specific date. Always call this before suggesting appointment times to the customer.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Date in YYYY-MM-DD format",
        },
        duration_minutes: {
          type: "number",
          description:
            "Duration in minutes. Must be a multiple of 60. Defaults to 60.",
        },
      },
      required: ["date"],
      additionalProperties: false,
    },
  },
  {
    name: "createBooking",
    description:
      "Create a new booking for the customer. Collect all required information before calling this tool. Confirm the details with the customer first.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Customer's full name",
        },
        customer_email: {
          type: "string",
          description: "Customer's email address",
        },
        customer_phone: {
          type: "string",
          description: "Customer's phone number (optional)",
        },
        date: {
          type: "string",
          description: "Booking date in YYYY-MM-DD format",
        },
        start_time: {
          type: "string",
          description:
            "Start time in HH:MM format. Must be on the hour (e.g. 09:00, 10:00).",
        },
        duration_minutes: {
          type: "number",
          description:
            "Duration in minutes. Must be a multiple of 60. Defaults to 60.",
        },
        description: {
          type: "string",
          description: "Brief description of the work needed (optional)",
        },
      },
      required: [
        "customer_name",
        "customer_email",
        "date",
        "start_time",
        "duration_minutes",
      ],
      additionalProperties: false,
    },
  },
  {
    name: "requestCallback",
    description:
      "Request a callback from the tradesman. Use when the customer wants to speak directly rather than book online.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Customer's full name",
        },
        customer_phone: {
          type: "string",
          description: "Customer's phone number",
        },
        message: {
          type: "string",
          description:
            "Brief message about what they need (optional)",
        },
      },
      required: ["customer_name", "customer_phone"],
      additionalProperties: false,
    },
  },
  {
    name: "leaveMessage",
    description:
      "Leave a message for the tradesman when the customer's query cannot be resolved. Collect name, email, and message from the customer.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: "Customer's full name",
        },
        customer_email: {
          type: "string",
          description: "Customer's email address",
        },
        customer_phone: {
          type: "string",
          description: "Customer's phone number (optional)",
        },
        message: {
          type: "string",
          description: "The message to leave for the tradesman",
        },
      },
      required: ["customer_name", "customer_email", "message"],
      additionalProperties: false,
    },
  },
];
