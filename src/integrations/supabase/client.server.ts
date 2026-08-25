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

function getServerSupabaseConfig() {
  const url = process.env["SUPABASE_URL"];

  const adminKey = process.env["SUPABASE_SECRET_KEY"] || process.env["SUPABASE_SERVICE_ROLE_KEY"];

  if (!url || !adminKey) {
    const missing: string[] = [];

    if (!url) {
      missing.push("SUPABASE_URL");
    }

    if (!adminKey) {
      missing.push("SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY");
    }

    throw new Error(
      [
        "Supabase do servidor não configurado.",
        `Variáveis ausentes: ${missing.join(", ")}.`,
        "Configure as variáveis de ambiente do servidor.",
      ].join(" "),
    );
  }

  return {
    url,
    adminKey,
  };
}

function createSupabaseAdminClient() {
  const { url, adminKey } = getServerSupabaseConfig();

  return createClient<Database>(url, adminKey, {
    global: {
      fetch: createSupabaseFetch(adminKey),
    },

    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let supabaseAdminInstance: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!supabaseAdminInstance) {
      supabaseAdminInstance = createSupabaseAdminClient();
    }

    return Reflect.get(supabaseAdminInstance, prop, receiver);
  },
});
