import { logger } from "../lib/logger";

const BASE_URL = "https://openrouter.ai/api/v1";

const FREE_MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "openai/gpt-oss-20b:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.2-3b-instruct:free",
];

function getKey(): string {
  return process.env["OPENROUTER_API_KEY"] ?? "";
}

async function callModel(
  model: string,
  systemPrompt: string,
  userMessage: string,
  maxTokens: number,
  key: string
): Promise<{ text: string | null; rateLimited: boolean }> {
  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://azzatrader.bot",
        "X-Title": "AZZA TRADER Bot",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: maxTokens,
        temperature: 0.4,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (res.status === 429) {
      logger.warn({ model }, "OpenRouter rate limit, coba model berikutnya");
      return { text: null, rateLimited: true };
    }

    if (!res.ok) {
      const err = await res.text().catch(() => res.status.toString());
      logger.warn({ model, status: res.status, err }, "OpenRouter error");
      return { text: null, rateLimited: false };
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message: string };
    };

    if (data?.error) {
      logger.warn({ model, error: data.error.message }, "OpenRouter API error");
      return { text: null, rateLimited: false };
    }

    const text = data?.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) return { text: null, rateLimited: false };

    logger.info({ model }, "OpenRouter berhasil");
    return { text, rateLimited: false };
  } catch (err: any) {
    logger.warn({ model, code: err?.name ?? "unknown" }, "OpenRouter timeout/error");
    return { text: null, rateLimited: false };
  }
}

export async function askOpenRouter(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 400
): Promise<string | null> {
  const key = getKey();
  if (!key) {
    logger.warn("OPENROUTER_API_KEY tidak ditemukan");
    return null;
  }

  for (const model of FREE_MODELS) {
    const { text, rateLimited } = await callModel(
      model, systemPrompt, userMessage, maxTokens, key
    );
    if (text) return text;
    if (!rateLimited) break;
  }

  logger.warn("Semua model OpenRouter tidak tersedia, fallback ke rule-based");
  return null;
}
