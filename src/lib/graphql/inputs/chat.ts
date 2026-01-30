import builder from "../builder";

export const CreateFaqEntryInput = builder.inputType("CreateFaqEntryInput", {
  fields: (t) => ({
    tradesman_id: t.string({ required: true }),
    question: t.string({ required: true }),
    answer: t.string({ required: true }),
    category: t.string(),
    sort_order: t.int(),
  }),
});

export const UpdateFaqEntryInput = builder.inputType("UpdateFaqEntryInput", {
  fields: (t) => ({
    question: t.string(),
    answer: t.string(),
    category: t.string(),
    sort_order: t.int(),
    is_active: t.boolean(),
  }),
});

export const UpdateChatbotSettingsInput = builder.inputType("UpdateChatbotSettingsInput", {
  fields: (t) => ({
    gemini_api_key: t.string(),
    greeting_message: t.string(),
    system_prompt_override: t.string(),
    model_name: t.string(),
    is_active: t.boolean(),
  }),
});

export const CreateAllowedDomainInput = builder.inputType("CreateAllowedDomainInput", {
  fields: (t) => ({
    tradesman_id: t.string({ required: true }),
    domain: t.string({ required: true }),
  }),
});

export const ChatMessageFilterInput = builder.inputType("ChatMessageFilterInput", {
  fields: (t) => ({
    tradesman_id: t.string({ required: true }),
    is_read: t.boolean(),
  }),
});
