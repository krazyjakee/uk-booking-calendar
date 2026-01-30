import { GoogleGenAI } from "@google/genai";
import type {
  FunctionDeclaration,
  Content,
  Part,
  Tool,
} from "@google/genai";
import type { ChatSSEEvent, ChatSessionMessage } from "./types";

export function createGeminiClient(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

/**
 * Convert internal session messages to Gemini Content format.
 */
function toGeminiHistory(messages: ChatSessionMessage[]): Content[] {
  return messages.map((msg) => ({
    role: msg.role === "model" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
}

export interface StreamChatOptions {
  apiKey: string;
  model: string;
  systemPrompt: string;
  history: ChatSessionMessage[];
  userMessage: string;
  tools: FunctionDeclaration[];
  executeToolCall: (
    name: string,
    args: Record<string, unknown>,
  ) => Promise<Record<string, unknown>>;
}

/**
 * Build a Part containing a function response to send back to the model.
 */
function buildFunctionResponsePart(
  name: string,
  result: Record<string, unknown>,
): Part {
  return {
    functionResponse: {
      name,
      response: { output: result },
    },
  };
}

/**
 * Process a streaming response from the model, yielding SSE events.
 * When a function call is encountered, executes the tool and sends
 * the result back to the model for continued generation.
 *
 * Supports up to 5 chained function calls to prevent infinite loops.
 */
async function* processStream(
  chat: ReturnType<GoogleGenAI["chats"]["create"]>,
  response: AsyncGenerator<import("@google/genai").GenerateContentResponse>,
  executeToolCall: StreamChatOptions["executeToolCall"],
  depth: number = 0,
): AsyncGenerator<ChatSSEEvent> {
  const MAX_DEPTH = 5;

  for await (const chunk of response) {
    // Handle text content
    const text = chunk.text;
    if (text) {
      yield { type: "token", data: text };
    }

    // Handle function calls
    const functionCalls = chunk.functionCalls;
    if (functionCalls && functionCalls.length > 0 && depth < MAX_DEPTH) {
      for (const fc of functionCalls) {
        const name = fc.name ?? "unknown";
        const args = (fc.args as Record<string, unknown>) ?? {};

        yield { type: "tool_call", data: { name, args } };

        const result = await executeToolCall(name, args);

        yield { type: "tool_result", data: { name, result } };

        // Send function response back to the model
        const followUp = await chat.sendMessageStream({
          message: [buildFunctionResponsePart(name, result)],
        });

        // Recursively process the follow-up stream
        yield* processStream(chat, followUp, executeToolCall, depth + 1);
      }
    }
  }
}

/**
 * Stream a chat response from Gemini, handling function calls inline.
 * Yields ChatSSEEvent objects for each piece of the response.
 */
export async function* streamChat(
  options: StreamChatOptions,
): AsyncGenerator<ChatSSEEvent> {
  const {
    apiKey,
    model,
    systemPrompt,
    history,
    userMessage,
    tools,
    executeToolCall,
  } = options;

  const ai = createGeminiClient(apiKey);

  const toolConfig: Tool = {
    functionDeclarations: tools,
  };

  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: systemPrompt,
      tools: [toolConfig],
    },
    history: toGeminiHistory(history),
  });

  try {
    const response = await chat.sendMessageStream({
      message: userMessage,
    });

    yield* processStream(chat, response, executeToolCall);
    yield { type: "done", data: null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    yield { type: "error", data: message };
  }
}
