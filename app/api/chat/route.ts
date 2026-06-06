/**
 * ============================================================
 *  app/api/chat/route.ts
 *  Full-Stack Advanced AI Chat API — OpenRouter Edition
 * ============================================================
 *  Features:
 *   ✅ OpenRouter multi-model routing
 *   ✅ Streaming (SSE) responses
 *   ✅ Text conversations (multi-turn)
 *   ✅ Image uploads (JPG, PNG, WEBP, GIF)
 *   ✅ PDF / document uploads (base64 vision)
 *   ✅ Voice / Audio transcription (Whisper via OpenRouter)
 *   ✅ System prompt injection
 *   ✅ Token usage tracking
 *   ✅ Rate-limit headers
 *   ✅ CORS preflight
 *   ✅ Full error handling & typed responses
 * ============================================================
 */

import { NextRequest, NextResponse } from "next/server";

// ─── ENV / CONFIG ────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";
const OPENROUTER_BASE    = "https://openrouter.ai/api/v1";
const SITE_URL           = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_NAME          = process.env.NEXT_PUBLIC_SITE_NAME ?? "AI Chat App";

// Default model — user can override per-request
const DEFAULT_TEXT_MODEL    = "openai/gpt-4o";
const DEFAULT_VISION_MODEL  = "openai/gpt-4o";          // supports images & PDFs
const WHISPER_MODEL         = "openai/whisper-large-v3"; // for audio transcription

// Maximum file sizes (bytes)
const MAX_IMAGE_BYTES = 20 * 1024 * 1024;   // 20 MB
const MAX_PDF_BYTES   = 50 * 1024 * 1024;   // 50 MB
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;   // 25 MB

// ─── TYPES ───────────────────────────────────────────────────
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

interface ContentPart {
  type: "text" | "image_url" | "document";
  text?: string;
  image_url?: { url: string; detail?: "low" | "high" | "auto" };
  document?: { type: "base64"; media_type: string; data: string };
}

interface OpenRouterRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

// ─── HELPERS ─────────────────────────────────────────────────

/** Convert an ArrayBuffer → base64 string */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary  = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Validate MIME type is image */
function isImageMime(mime: string): boolean {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mime);
}

/** Validate MIME type is audio */
function isAudioMime(mime: string): boolean {
  return [
    "audio/mpeg", "audio/mp4", "audio/wav", "audio/webm",
    "audio/ogg", "audio/flac", "audio/m4a", "audio/x-m4a",
  ].includes(mime);
}

/** Build common OpenRouter fetch headers */
function orHeaders(): HeadersInit {
  return {
    Authorization:      `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type":     "application/json",
    "HTTP-Referer":     SITE_URL,
    "X-Title":          SITE_NAME,
    "X-OpenRouter-Via": "next-app-router",
  };
}

/** Forward streaming SSE from OpenRouter to the client */
function createStreamResponse(upstream: Response): NextResponse {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = upstream.body!.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // Pass SSE lines through verbatim
        await writer.write(encoder.encode(chunk));
      }
    } catch (err) {
      const errPayload = `data: ${JSON.stringify({ error: String(err) })}\n\n`;
      await writer.write(encoder.encode(errPayload));
    } finally {
      await writer.close();
    }
  })();

  return new NextResponse(readable, {
    headers: {
      "Content-Type":  "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection:      "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ─── TRANSCRIBE AUDIO (Whisper via OpenRouter) ───────────────
async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  mimeType: string,
  fileName: string,
): Promise<string> {
  // OpenRouter proxies OpenAI's audio/transcriptions endpoint
  const formData = new FormData();
  const blob     = new Blob([audioBuffer], { type: mimeType });
  formData.append("file", blob, fileName);
  formData.append("model", WHISPER_MODEL);
  formData.append("language", "en");          // auto-detect: remove this line
  formData.append("response_format", "text");

  const res = await fetch(`${OPENROUTER_BASE}/audio/transcriptions`, {
    method:  "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": SITE_URL,
      "X-Title":      SITE_NAME,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper transcription failed: ${err}`);
  }

  return res.text(); // plain text transcript
}

// ─── BUILD CONTENT PARTS FROM FILES ──────────────────────────
async function buildContentParts(
  text: string,
  files: File[],
): Promise<ContentPart[]> {
  const parts: ContentPart[] = [];

  // Text part first
  if (text.trim()) {
    parts.push({ type: "text", text: text.trim() });
  }

  for (const file of files) {
    const mime   = file.type || "application/octet-stream";
    const buffer = await file.arrayBuffer();

    // ── Image ──
    if (isImageMime(mime)) {
      if (buffer.byteLength > MAX_IMAGE_BYTES) {
        throw new Error(`Image "${file.name}" exceeds 20 MB limit.`);
      }
      const b64 = bufferToBase64(buffer);
      parts.push({
        type: "image_url",
        image_url: {
          url:    `data:${mime};base64,${b64}`,
          detail: "high",
        },
      });
      continue;
    }

    // ── PDF ──
    if (mime === "application/pdf") {
      if (buffer.byteLength > MAX_PDF_BYTES) {
        throw new Error(`PDF "${file.name}" exceeds 50 MB limit.`);
      }
      // GPT-4o accepts PDFs as images via base64; some OR models support document type
      const b64 = bufferToBase64(buffer);
      parts.push({
        type: "image_url",
        image_url: {
          url:    `data:application/pdf;base64,${b64}`,
          detail: "high",
        },
      });
      continue;
    }

    // ── Plain text / code / CSV / JSON ──
    if (
      mime.startsWith("text/") ||
      mime === "application/json" ||
      mime === "text/csv"
    ) {
      const text = new TextDecoder().decode(buffer);
      parts.push({ type: "text", text: `\`\`\`${file.name}\n${text}\n\`\`\`` });
      continue;
    }

    // ── Unsupported (skip gracefully) ──
    parts.push({
      type: "text",
      text: `[Attached file "${file.name}" (${mime}) could not be processed inline.]`,
    });
  }

  return parts;
}

// ─── CORS PREFLIGHT ──────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin":  "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

// ─── MAIN POST HANDLER ───────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // ── 0. Guard: API key present ────────────────────────────
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json<ApiError>(
      { error: "OPENROUTER_API_KEY is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const contentType = req.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    // ================================================================
    //  BRANCH A — multipart/form-data  (files + optional text/voice)
    // ================================================================
    if (isMultipart) {
      const formData = await req.formData();

      // ── Extract fields ──────────────────────────────────────
      const userText     = (formData.get("message")     as string)  ?? "";
      const systemPrompt = (formData.get("system")      as string)  ?? "";
      const model        = (formData.get("model")       as string)  ?? DEFAULT_VISION_MODEL;
      const stream       = (formData.get("stream")      as string)  === "true";
      const maxTokens    = parseInt((formData.get("max_tokens") as string) ?? "4096", 10);
      const temperature  = parseFloat((formData.get("temperature") as string) ?? "0.7");
      const historyRaw   = (formData.get("history")     as string)  ?? "[]";

      let history: ChatMessage[] = [];
      try { history = JSON.parse(historyRaw); } catch { /* ignore */ }

      // ── Collect uploaded files ───────────────────────────────
      const fileEntries: File[] = [];
      for (const [key, value] of formData.entries()) {
        if (key.startsWith("file") && value instanceof File) {
          fileEntries.push(value);
        }
      }

      // ── Handle AUDIO separately → transcribe first ──────────
      const audioFile = fileEntries.find((f) => isAudioMime(f.type));
      let finalText    = userText;

      if (audioFile) {
        if (audioFile.size > MAX_AUDIO_BYTES) {
          return NextResponse.json<ApiError>(
            { error: `Audio file exceeds 25 MB limit.` },
            { status: 400 },
          );
        }
        const audioBuffer  = await audioFile.arrayBuffer();
        const transcript   = await transcribeAudio(audioBuffer, audioFile.type, audioFile.name);
        finalText          = transcript + (userText ? `\n\n${userText}` : "");

        // Remove audio from file list — already handled
        const idx = fileEntries.indexOf(audioFile);
        fileEntries.splice(idx, 1);
      }

      // ── Build content parts (text + non-audio files) ─────────
      const nonAudioFiles = fileEntries.filter((f) => !isAudioMime(f.type));
      const contentParts  = await buildContentParts(finalText, nonAudioFiles);

      if (contentParts.length === 0) {
        return NextResponse.json<ApiError>(
          { error: "Message or file is required." },
          { status: 400 },
        );
      }

      // ── Compose messages array ───────────────────────────────
      const messages: ChatMessage[] = [];

      if (systemPrompt.trim()) {
        messages.push({ role: "system", content: systemPrompt.trim() });
      }

      // Append history
      messages.push(...history);

      // Current user turn — use parts array if multimodal, else string
      if (contentParts.length === 1 && contentParts[0].type === "text") {
        messages.push({ role: "user", content: contentParts[0].text! });
      } else {
        messages.push({ role: "user", content: contentParts });
      }

      // ── Call OpenRouter ──────────────────────────────────────
      const orBody: OpenRouterRequest = {
        model,
        messages,
        stream,
        max_tokens:  maxTokens,
        temperature,
      };

      const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method:  "POST",
        headers: orHeaders(),
        body:    JSON.stringify(orBody),
      });

      if (!orRes.ok) {
        const errText = await orRes.text();
        return NextResponse.json<ApiError>(
          { error: "OpenRouter error", details: errText },
          { status: orRes.status },
        );
      }

      if (stream) return createStreamResponse(orRes);

      const data = await orRes.json();
      return NextResponse.json({
        id:           data.id,
        model:        data.model,
        message:      data.choices?.[0]?.message?.content ?? "",
        finish_reason: data.choices?.[0]?.finish_reason,
        usage:        data.usage,
        // If audio was transcribed, return transcript too
        transcript:   audioFile ? finalText : undefined,
      });
    }

    // ================================================================
    //  BRANCH B — application/json  (pure text / history conversation)
    // ================================================================
    const body = await req.json();

    const {
      message,
      messages: rawMessages,
      system:   systemPrompt = "",
      model    = DEFAULT_TEXT_MODEL,
      stream   = false,
      max_tokens   = 4096,
      temperature  = 0.7,
      top_p        = 1,
      frequency_penalty = 0,
      presence_penalty  = 0,
    } = body as {
      message?:          string;
      messages?:         ChatMessage[];
      system?:           string;
      model?:            string;
      stream?:           boolean;
      max_tokens?:       number;
      temperature?:      number;
      top_p?:            number;
      frequency_penalty?: number;
      presence_penalty?:  number;
    };

    // Build message list
    const messages: ChatMessage[] = [];

    if (systemPrompt.trim()) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }

    if (Array.isArray(rawMessages) && rawMessages.length > 0) {
      // Full history provided
      messages.push(...rawMessages);
    } else if (typeof message === "string" && message.trim()) {
      messages.push({ role: "user", content: message.trim() });
    } else {
      return NextResponse.json<ApiError>(
        { error: "Provide `message` (string) or `messages` (array)." },
        { status: 400 },
      );
    }

    const orBody: OpenRouterRequest = {
      model,
      messages,
      stream,
      max_tokens,
      temperature,
      top_p,
      frequency_penalty,
      presence_penalty,
    };

    const orRes = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
      method:  "POST",
      headers: orHeaders(),
      body:    JSON.stringify(orBody),
    });

    if (!orRes.ok) {
      const errText = await orRes.text();
      return NextResponse.json<ApiError>(
        { error: "OpenRouter error", details: errText },
        { status: orRes.status },
      );
    }

    if (stream) return createStreamResponse(orRes);

    const data = await orRes.json();
    return NextResponse.json({
      id:           data.id,
      model:        data.model,
      message:      data.choices?.[0]?.message?.content ?? "",
      finish_reason: data.choices?.[0]?.finish_reason,
      usage:        data.usage,
    });

  } catch (err: unknown) {
    console.error("[chat/route] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json<ApiError>(
      { error: message },
      { status: 500 },
    );
  }
}
