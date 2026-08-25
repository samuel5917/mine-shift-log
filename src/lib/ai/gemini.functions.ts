import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_SYSTEM_PROMPT, buildUserPrompt, type AiDocKind } from "./prompt";
import { createAiProvider, type AiProviderConfig } from "./provider";

/** Status da configuração — nunca retorna a chave. */
export const getAiStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("ai_settings")
      .select("provider, model, updated_at, api_key")
      .eq("user_id", context.userId)
      .maybeSingle();

    const key = data?.api_key ?? "";

    return {
      configured: key.length > 0,
      provider: data?.provider ?? "openrouter",
      model: data?.model ?? "",
      updatedAt: data?.updated_at ?? null,
      hint: key ? `••••••••${key.slice(-4)}` : "",
    };
  });

/** Salva a API Key e a configuração do provedor. */
export const saveAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { apiKey: string; provider?: string; model?: string }) => ({
    apiKey: String(input.apiKey ?? "").trim(),
    provider: String(input.provider ?? "openrouter").trim() || "openrouter",
    model: String(input.model ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (data.apiKey.length < 10) {
      throw new Error("Informe uma API Key válida.");
    }

    const { error } = await context.supabase.from("ai_settings").upsert(
      {
        user_id: context.userId,
        provider: data.provider,
        model: data.model || null,
        api_key: data.apiKey,
      },
      { onConflict: "user_id" },
    );

    if (error) throw new Error(error.message);

    return { ok: true };
  });

/** Exclui a API Key. */
export const deleteAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("ai_settings")
      .delete()
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);

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
          data: { api_key: string; provider?: string; model?: string | null } | null;
        }>;
      };
    };
  };
};

async function loadProviderConfig(supabase: AiSupabase, userId: string): Promise<AiProviderConfig> {
  const { data } = await supabase
    .from("ai_settings")
    .select("api_key, provider, model")
    .eq("user_id", userId)
    .maybeSingle();

  const key = data?.api_key ?? "";

  if (!key) {
    throw new Error("Configure sua API Key em Configurações → Inteligência Artificial.");
  }

  return {
    provider: data?.provider ?? "openrouter",
    apiKey: key,
    model: data?.model ?? undefined,
  };
}

/** Testa a conexão com a IA. */
export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const config = await loadProviderConfig(
      context.supabase as unknown as AiSupabase,
      context.userId,
    );

    const provider = createAiProvider(config);
    await provider.generateText("Responda apenas com: OK", "Teste de conexão.");

    return { ok: true };
  });

/** Gera a revisão do Assistente de Turno ou Ata. */
export const reviewWithAi = createServerFn({ method: "POST" })
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

    const config = await loadProviderConfig(
      context.supabase as unknown as AiSupabase,
      context.userId,
    );

    const provider = createAiProvider(config);
    const texto = await provider.generateText(AI_SYSTEM_PROMPT, buildUserPrompt(data));

    return { texto };
  });
