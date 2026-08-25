/**
 * AI provider abstraction layer.
 *
 * The application talks to AI through this interface so the provider
 * (OpenRouter, OpenAI, Gemini, etc.) can be swapped without touching
 * business logic.
 */

export interface AiProvider {
  /** Provider identifier, e.g. "openrouter", "openai", "gemini". */
  readonly id: string;

  /** Human-readable name shown in the UI. */
  readonly label: string;

  /** Generate text from a system+user prompt pair. */
  generateText(systemPrompt: string, userPrompt: string): Promise<string>;
}

export type AiProviderConfig = {
  provider: string;
  apiKey: string;
  model?: string | null | undefined;
};

const DEFAULT_MODEL: Record<string, string> = {
  openrouter: "openrouter/free",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.0-flash",
};

export function resolveModel(provider: string, model?: string | null): string {
  if (model && model.trim().length > 0) return model;
  return DEFAULT_MODEL[provider] ?? "openrouter/free";
}

/**
 * Factory: build an AiProvider from a config row stored in the database.
 * Add new providers by extending the switch below.
 */
export function createAiProvider(config: AiProviderConfig): AiProvider {
  switch (config.provider) {
    case "openrouter":
      return new OpenRouterProvider(config.apiKey, resolveModel(config.provider, config.model));
    default:
      return new OpenRouterProvider(config.apiKey, resolveModel(config.provider, config.model));
  }
}

/**
 * OpenRouter provider — routes to multiple models through a single API.
 * https://openrouter.ai/docs
 */
class OpenRouterProvider implements AiProvider {
  readonly id = "openrouter";
  readonly label = "OpenRouter";

  private readonly endpoint = "https://openrouter.ai/api/v1/chat/completions";

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async generateText(systemPrompt: string, userPrompt: string): Promise<string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
    };

    const siteName = process.env["AI_SITE_NAME"];
    const siteUrl = process.env["AI_SITE_URL"];
    if (siteUrl) headers["HTTP-Referer"] = siteUrl;
    if (siteName) headers["X-Title"] = siteName;

    const res = await fetch(this.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    const responseText = await res.text();

    if (!res.ok) {
      throw new Error(`OpenRouter retornou erro ${res.status}: ${responseText.slice(0, 800)}`);
    }

    let json: { choices?: { message?: { content?: string } }[] };
    try {
      json = JSON.parse(responseText);
    } catch {
      throw new Error("O provedor de IA retornou uma resposta inválida.");
    }

    const text = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!text) throw new Error("O provedor de IA não retornou um texto válido.");

    return text;
  }
}
