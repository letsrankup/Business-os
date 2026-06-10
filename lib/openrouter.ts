// lib/openrouter.ts
// OpenRouter AI client with free model rotation & fallback chain

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free models (June 2026) - in priority order with fallback
export const FREE_MODELS = [
  "qwen/qwen3-coder:free",           // Best for code
  "deepseek/deepseek-r1:free",       // Best for reasoning
  "meta-llama/llama-4-maverick:free", // 1M context
  "meta-llama/llama-3.3-70b-instruct:free",
  "openrouter/auto",                  // Auto-select free model
];

export interface OpenRouterMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface OpenRouterOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  system?: string;
}

export interface OpenRouterResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call OpenRouter with automatic free model fallback
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in environment variables");
  }

  const {
    model,
    temperature = 0.7,
    max_tokens = 2048,
    system,
  } = options;

  // Build messages array with optional system prompt
  const finalMessages: OpenRouterMessage[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  // Try models in order until one works
  const modelsToTry = model ? [model, ...FREE_MODELS] : FREE_MODELS;

  let lastError: Error | null = null;

  for (const currentModel of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://business-os.vercel.app",
          "X-Title": "Business OS",
        },
        body: JSON.stringify({
          model: currentModel,
          messages: finalMessages,
          temperature,
          max_tokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;

        // Skip to next model on rate limit or model not found
        if (response.status === 429 || response.status === 404 || response.status === 402) {
          console.warn(`OpenRouter model ${currentModel} failed (${response.status}): ${errorMsg}. Trying next...`);
          lastError = new Error(`Model ${currentModel}: ${errorMsg}`);
          continue;
        }

        throw new Error(`OpenRouter API error (${response.status}): ${errorMsg}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error("Empty response from OpenRouter");
      }

      return {
        content,
        model: data.model || currentModel,
        usage: data.usage,
      };
    } catch (err) {
      if (err instanceof Error && err.message.includes("OpenRouter API error")) {
        throw err; // Re-throw non-recoverable errors
      }
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`OpenRouter model ${currentModel} failed:`, lastError.message);
      continue;
    }
  }

  throw lastError || new Error("All OpenRouter models failed");
}

/**
 * Simple single-turn completion
 */
export async function complete(
  prompt: string,
  options: OpenRouterOptions = {}
): Promise<string> {
  const result = await callOpenRouter(
    [{ role: "user", content: prompt }],
    options
  );
  return result.content;
}

/**
 * Streaming completion (returns ReadableStream)
 */
export async function streamOpenRouter(
  messages: OpenRouterMessage[],
  options: OpenRouterOptions = {}
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set");
  }

  const { model = FREE_MODELS[0], temperature = 0.7, max_tokens = 2048, system } = options;

  const finalMessages: OpenRouterMessage[] = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  return fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://business-os.vercel.app",
      "X-Title": "Business OS",
    },
    body: JSON.stringify({
      model,
      messages: finalMessages,
      temperature,
      max_tokens,
      stream: true,
    }),
  });
}
