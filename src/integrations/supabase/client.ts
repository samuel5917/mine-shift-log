import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

function getSupabaseConfig() {
  const viteEnv = import.meta.env as Record<string, string | undefined>;

  const serverEnv = typeof process !== "undefined" ? process.env : {};

  const url = viteEnv["VITE_SUPABASE_URL"] || serverEnv["SUPABASE_URL"];

  const publishableKey =
    viteEnv["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    viteEnv["VITE_SUPABASE_ANON_KEY"] ||
    serverEnv["SUPABASE_PUBLISHABLE_KEY"] ||
    serverEnv["SUPABASE_ANON_KEY"];

  if (!url || !publishableKey) {
    const missing: string[] = [];

    if (!url) {
      missing.push("VITE_SUPABASE_URL");
    }

    if (!publishableKey) {
      missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
    }

    throw new Error(
      [
        "Supabase não configurado.",
        `Variáveis ausentes: ${missing.join(", ")}.`,
        "Crie um arquivo .env.local e informe as credenciais do seu projeto Supabase.",
      ].join(" "),
    );
  }

  return {
    url,
    publishableKey,
  };
}

function createSupabaseClient() {
  const { url, publishableKey } = getSupabaseConfig();

  return createClient<Database>(url, publishableKey, {
    global: {
      fetch: createSupabaseFetch(publishableKey),
    },

    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,

      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let supabaseInstance: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!supabaseInstance) {
      supabaseInstance = createSupabaseClient();
    }

    return Reflect.get(supabaseInstance, prop, receiver);
  },
});
