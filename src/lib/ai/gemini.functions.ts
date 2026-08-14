import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { AI_SYSTEM_PROMPT, buildUserPrompt, type AiDocKind } from "./prompt";

const GEMINI_MODEL = "gemini-2.5-flash";

function endpoint(key: string) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`;
}

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
      provider: data?.provider ?? "gemini",
      updatedAt: data?.updated_at ?? null,
      hint: key ? `••••••••${key.slice(-4)}` : "",
    };
  });

export const saveAiKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { apiKey: string }) => ({ apiKey: String(input.apiKey ?? "").trim() }))
  .handler(async ({ data, context }) => {
    if (data.apiKey.length < 10) throw new Error("Informe uma API Key válida do Google Gemini.");
    const { error } = await context.supabase
      .from("ai_settings")
      .upsert(
        { user_id: context.userId, provider: "gemini", api_key: data.apiKey },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

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
      ) => { maybeSingle: () => Promise<{ data: { api_key: string } | null }> };
    };
  };
};

async function loadKey(supabase: AiSupabase, userId: string) {
  const { data } = await supabase
    .from("ai_settings")
    .select("api_key")
    .eq("user_id", userId)
    .maybeSingle();
  const key = data?.api_key ?? "";
  if (!key) {
    throw new Error("Configure sua API Key do Gemini em Configurações → Inteligência Artificial.");
  }
  return key;
}

async function callGemini(key: string, userPrompt: string) {
  const res = await fetch(endpoint(key), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: AI_SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    }),
  });

  // IMPORTANTE:
  // A resposta é lida UMA ÚNICA VEZ.
  const responseText = await res.text();

  if (!res.ok) {
    console.error(
      "[Gemini] erro",
      res.status,
      responseText.slice(0, 1000),
    );

    throw new Error(
      `Gemini retornou erro ${res.status}: ${responseText.slice(0, 500)}`,
    );
  }

  let json: {
    candidates?: {
      content?: {
        parts?: {
          text?: string;
        }[];
      };
    }[];
  };

  try {
    json = JSON.parse(responseText);
  } catch (error) {
    console.error("[Gemini] resposta inválida:", responseText);

    throw new Error(
      "O Gemini retornou uma resposta inválida.",
    );
  }

  const text =
    json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("")
      .trim() ?? "";

  if (!text) {
    console.error("[Gemini] resposta sem texto:", json);

    throw new Error(
      "O Gemini não retornou um texto válido.",
    );
  }

  return text;
}

export const testAiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const key = await loadKey(context.supabase as unknown as AiSupabase, context.userId);
    await callGemini(key, "Responda apenas com: OK");
    return { ok: true };
  });

export const reviewWithAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    kind: AiDocKind;
    structured?: string;
    current?: string;
    raw?: string;
  }) => ({
    kind: input.kind === "ata" ? ("ata" as const) : ("assistente" as const),
    structured: String(input.structured ?? "").slice(0, 20000),
    current: String(input.current ?? "").slice(0, 20000),
    raw: String(input.raw ?? "").slice(0, 20000),
  }))
  .handler(async ({ data, context }) => {
    if (!data.structured.trim() && !data.current.trim() && !data.raw.trim()) {
      throw new Error("Preencha os dados do informe ou cole um texto bruto para revisar.");
    }
    const key = await loadKey(context.supabase as unknown as AiSupabase, context.userId);
    const texto = await callGemini(key, buildUserPrompt(data));
    return { texto };
  });
