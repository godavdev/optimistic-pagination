import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";

const pwa = VitePWA({
  // The service worker is written by hand in `src/sw/sw.ts` so the server
  // functions can be excluded from the cache.
  strategies: "injectManifest",
  srcDir: "src/sw",
  filename: "sw.ts",
  // `sw.js` is generated in `public/` so Nitro copies it to the deploy output.
  outDir: "public",
  // The web app manifest already exists (`public/site.webmanifest`).
  manifest: false,
  // There is no `index.html` to inject the registration script into, so it is
  // registered from `src/integrations/pwa/register-service-worker.tsx`.
  injectRegister: false,
  registerType: "prompt",
  scope: "/",
  injectManifest: {
    swSrc: "src/sw/sw.ts",
    swDest: "public/sw.js",
    // The hashed client assets are the only files needed to boot the app.
    globDirectory: ".output/public",
    globPatterns: ["**/*.{js,css,woff2}"],
    // The service worker must never precache itself.
    globIgnores: ["sw.js"],
  },
  devOptions: {
    // The service worker gets in the way of the Vite HMR while developing.
    enabled: false,
  },
});

// `vite-plugin-pwa` builds the service worker in `closeBundle`, which Vite
// calls once per environment. Keeping it to the client environment builds it
// once, before Nitro copies `public/` into the output.
const pwaPlugins = pwa.map((plugin) =>
  plugin.name === "vite-plugin-pwa:build"
    ? {
        ...plugin,
        applyToEnvironment: (environment: { name: string }) =>
          environment.name === "client",
      }
    : plugin,
);

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      // No SSR: the server serves a static shell and the routes are rendered
      // on the client. The server functions keep working the same way.
      spa: {
        enabled: true,
      },
    }),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
    nitro(),
    ...pwaPlugins,
  ],
});

export default config;
