import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_SYSTEM_PROMPT, buildUserPrompt, type AiDocKind } from "./prompt";

/**
 * OpenRouter
 *
 * O modelo "openrouter/free" escolhe automaticamente
 * um dos modelos gratuitos disponíveis.
 */
const OPENROUTER_MODEL = "openrouter/free";

const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

/** Status da configuração — nunca retorna a chave. */
export const getAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_settings")
      .select("provider, updated_at, api_key")
      .eq("user_id", context.userId)
      .maybeSingle();

    const key = data?.api_key ?? "";

    return {
      configured: key.length > 0,
      provider: data?.provider ?? "openrouter",
      updatedAt: data?.updated_at ?? null,
      hint: key ? `••••••••${key.slice(-4)}` : "",
    };
  });

/**
 * Salva a API Key do OpenRouter.
 */
export const saveAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { apiKey: string }) => ({
    apiKey: String(input.apiKey ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (data.apiKey.length < 10) {
      throw new Error("Informe uma API Key válida do OpenRouter.");
    }

    const { error } = await context.supabase.from("ai_settings").upsert(
      {
        user_id: context.userId,
        provider: "openrouter",
        api_key: data.apiKey,
      },
      { onConflict: "user_id" },
    );

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });

/**
 * Exclui a API Key.
 */
export const deleteAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("ai_settings")
      .delete()
      .eq("user_id", context.userId);

    if (error) {
      throw new Error(error.message);
    }

    return { ok: true };
  });

type AiSupabase = {
  from: (table: "ai_settings") => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{
          data: { api_key: string } | null;
        }>;
      };
    };
  };
};

/**
 * Carrega a API Key do usuário.
 */
async function loadKey(supabase: AiSupabase, userId: string) {
  const { data } = await supabase
    .from("ai_settings")
    .select("api_key")
    .eq("user_id", userId)
    .maybeSingle();

  const key = data?.api_key ?? "";

  if (!key) {
    throw new Error(
      "Configure sua API Key do OpenRouter em Configurações → Inteligência Artificial.",
    );
  }

  return key;
}

/**
 * Chama o OpenRouter.
 */
async function callOpenRouter(key: string, userPrompt: string) {
  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,

      // Opcionais, mas ajudam a identificar o aplicativo.
      "HTTP-Referer": "https://mine-shift-log.lovable.app",
      "X-Title": "Mine Shift Log",
    },

    body: JSON.stringify({
      model: OPENROUTER_MODEL,

      messages: [
        {
          role: "system",
          content: AI_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],

      temperature: 0.2,

      max_tokens: 2048,
    }),
  });

  /**
   * IMPORTANTE:
   * Ler o Body somente UMA vez.
   */
  const responseText = await res.text();

  if (!res.ok) {
    console.error("[OpenRouter] erro", res.status, responseText.slice(0, 2000));

    throw new Error(`OpenRouter retornou erro ${res.status}: ${responseText.slice(0, 800)}`);
  }

  let json: {
    choices?: {
      message?: {
        content?: string;
      };
    }[];
  };

  try {
    json = JSON.parse(responseText);
  } catch {
    console.error("[OpenRouter] resposta inválida:", responseText);

    throw new Error("O OpenRouter retornou uma resposta inválida.");
  }

  const text = json.choices?.[0]?.message?.content?.trim() ?? "";

  if (!text) {
    console.error("[OpenRouter] resposta sem conteúdo:", json);

    throw new Error("O OpenRouter não retornou um texto válido.");
  }

  return text;
}

/**
 * Testa a conexão com a IA.
 */
export const testAiConnection = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await loadKey(context.supabase as unknown as AiSupabase, context.userId);

    await callOpenRouter(key, "Responda apenas com: OK");

    return { ok: true };
  });

/**
 * Gera a revisão do Assistente de Turno ou Ata.
 */
export const reviewWithAi = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { kind: AiDocKind; structured?: string; current?: string; raw?: string }) => ({
      kind: input.kind === "ata" ? ("ata" as const) : ("assistente" as const),

      structured: String(input.structured ?? "").slice(0, 20000),

      current: String(input.current ?? "").slice(0, 20000),

      raw: String(input.raw ?? "").slice(0, 20000),
    }),
  )
  .handler(async ({ data, context }) => {
    if (!data.structured.trim() && !data.current.trim() && !data.raw.trim()) {
      throw new Error("Preencha os dados do informe ou cole um texto bruto para revisar.");
    }

    const key = await loadKey(context.supabase as unknown as AiSupabase, context.userId);

    const texto = await callOpenRouter(key, buildUserPrompt(data));

    return { texto };
  });
