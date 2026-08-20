import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./types";

function isNewSupabaseApiKey(value: string): boolean {
  return (
    value.startsWith("sb_publishable_") ||
    value.startsWith("sb_secret_")
  );
}

function createSupabaseFetch(
  supabaseKey: string,
): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" &&
        input instanceof Request
        ? input.headers
        : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach(
        (value, key) => {
          headers.set(key, value);
        },
      );
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") ===
        `Bearer ${supabaseKey}`
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

function getSupabaseAuthConfig() {
  const url = process.env.SUPABASE_URL;

  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    const missing: string[] = [];

    if (!url) {
      missing.push("SUPABASE_URL");
    }

    if (!publishableKey) {
      missing.push(
        "SUPABASE_PUBLISHABLE_KEY",
      );
    }

    throw new Error(
      [
        "Supabase Auth não configurado.",
        `Variáveis ausentes: ${missing.join(", ")}.`,
      ].join(" "),
    );
  }

  return {
    url,
    publishableKey,
  };
}

export const requireSupabaseAuth =
  createMiddleware({
    type: "function",
  }).server(async ({ next }) => {
    const { url, publishableKey } =
      getSupabaseAuthConfig();

    const request = getRequest();

    if (!request?.headers) {
      throw new Error(
        "Unauthorized: cabeçalhos da requisição não disponíveis.",
      );
    }

    const authHeader =
      request.headers.get("authorization");

    if (!authHeader) {
      throw new Error(
        "Unauthorized: token de autenticação ausente.",
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      throw new Error(
        "Unauthorized: formato de autenticação inválido.",
      );
    }

    const token =
      authHeader.slice("Bearer ".length);

    if (!token) {
      throw new Error(
        "Unauthorized: token vazio.",
      );
    }

    const supabase =
      createClient<Database>(
        url,
        publishableKey,
        {
          global: {
            fetch:
              createSupabaseFetch(
                publishableKey,
              ),

            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          },

          auth: {
            storage: undefined,
            persistSession: false,
            autoRefreshToken: false,
          },
        },
      );

    const { data, error } =
      await supabase.auth.getClaims(token);

    if (
      error ||
      !data?.claims ||
      !data.claims.sub
    ) {
      throw new Error(
        "Unauthorized: token inválido ou expirado.",
      );
    }

    return next({
      context: {
        supabase,
        userId: data.claims.sub,
        claims: data.claims,
      },
    });
  });
