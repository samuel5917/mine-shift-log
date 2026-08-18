// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// Bolt's preview environment does not set LOVABLE_SANDBOX / DEV_SERVER__PROJECT_PATH, so the
// Lovable config wrapper never enters sandbox mode and skips the dev-server-bridge + hmr-gate
// plugins that connect the Vite dev server to the preview proxy. Setting it here before the
// wrapper evaluates its environment detection enables those plugins so the preview works.
process.env.LOVABLE_SANDBOX = process.env.LOVABLE_SANDBOX ?? "1";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
