/**
 * OPGODAV service worker.
 *
 * Everything the app serves is cached (shell, assets and navigations) except
 * the TanStack Start server functions, which always go to the network so
 * stale data is never shown.
 */

import { ExpirationPlugin } from "workbox-expiration"
import {
  cleanupOutdatedCaches,
  matchPrecache,
  precacheAndRoute,
} from "workbox-precaching"
import { registerRoute, setCatchHandler } from "workbox-routing"
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate,
} from "workbox-strategies"

import type { WorkboxPlugin } from "workbox-core/types.js"
import type { PrecacheEntry } from "workbox-precaching/_types.js"

declare global {
  interface WorkerGlobalScope {
    /**
     * Precache manifest. It is injected by `workbox-build` when this service
     * worker is compiled, replacing the reference with the list of files.
     */
    __WB_MANIFEST: Array<PrecacheEntry | string>
  }
}

/** Prefix TanStack Start serves the server functions under. */
const SERVER_FN_BASE = "/_serverFn/"

/** Header TanStack Start adds to every server function request. */
const SERVER_FN_HEADER = "x-tsr-serverFn"

/** App shell URL. In SPA mode it is the same for every route. */
const APP_SHELL_URL = "/"

/** Fallback page served when there is no network. */
const OFFLINE_URL = "/offline.html"

/** Cache for the app shell (navigations). */
const CACHE_SHELL = "opgodav-shell"

/** Cache for the remaining static resources. */
const CACHE_ASSETS = "opgodav-assets"

/** Path of the service worker itself, it must never be cached. */
const SW_PATH = self.location.pathname

/**
 * Every navigation shares the same cache key.
 *
 * In SPA mode the server returns the same shell for any route, so there is no
 * point in keeping a copy per URL.
 */
const shellCacheKey: WorkboxPlugin = {
  cacheKeyWillBeUsed: async () => new Request(new URL("./", self.location.href)),
}

/**
 * If the runtime cache is empty (for example on the first visit, while the
 * service worker is already controlling the page) the precached shell is
 * served.
 *
 * That way the app can always boot, even offline and without having navigated
 * with the service worker active.
 */
const shellFallback: WorkboxPlugin = {
  cachedResponseWillBeUsed: async ({ cachedResponse }) =>
    cachedResponse ?? (await matchPrecache(APP_SHELL_URL)),
}

/**
 * Revision of the precached shell.
 *
 * The shell only changes when the bundle changes, so a hash of the manifest is
 * enough to download the shell again on every deployment, without touching
 * anything by hand.
 */
function hashManifest(manifest: Array<PrecacheEntry | string>): string {
  const entries = manifest
    .map((entry) =>
      typeof entry === "string" ? entry : `${entry.url}#${entry.revision ?? ""}`,
    )
    .sort()
    .join("|")

  let hash = 5381
  for (let index = 0; index < entries.length; index++) {
    hash = (Math.imul(hash, 33) ^ entries.charCodeAt(index)) >>> 0
  }

  return hash.toString(36)
}

// ---------------------------------------------------------------------------
// 1. Server functions: never cached.
// ---------------------------------------------------------------------------
registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith(SERVER_FN_BASE) ||
    request.headers.get(SERVER_FN_HEADER) === "true",
  new NetworkOnly(),
)

// ---------------------------------------------------------------------------
// 2. Navigations: stale while revalidate.
//
//    Registered BEFORE the precache on purpose: in Workbox the first matching
//    route wins, so the shell is always served from the runtime cache (which
//    refreshes in the background). The precached copy is kept as the offline
//    fallback.
// ---------------------------------------------------------------------------
registerRoute(
  ({ request }) => request.mode === "navigate",
  new StaleWhileRevalidate({
    cacheName: CACHE_SHELL,
    plugins: [shellCacheKey, shellFallback],
  }),
)

// ---------------------------------------------------------------------------
// 3. Precache: hashed assets, the shell and the offline page.
//
//    The shell and the offline page are added by hand because they are not part
//    of the glob: the shell is served at runtime and the offline page is not
//    in the output yet when this service worker is compiled.
// ---------------------------------------------------------------------------
const manifest = self.__WB_MANIFEST
const revision = hashManifest(manifest)

cleanupOutdatedCaches()
precacheAndRoute([
  ...manifest,
  { url: APP_SHELL_URL, revision },
  { url: OFFLINE_URL, revision },
])

// ---------------------------------------------------------------------------
// 4. Remaining same origin resources: cache first.
// ---------------------------------------------------------------------------
registerRoute(
  ({ url, request }) =>
    url.origin === self.location.origin &&
    url.pathname !== SW_PATH &&
    request.method === "GET",
  new CacheFirst({
    cacheName: CACHE_ASSETS,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  }),
)

// ---------------------------------------------------------------------------
// 5. No network and no cache: serve the precached shell and, if that is not
//    available either, the offline page.
// ---------------------------------------------------------------------------
setCatchHandler(async ({ request }) => {
  if (request.mode === "navigate") {
    const shell = await matchPrecache(APP_SHELL_URL)
    if (shell) {
      return shell
    }

    const offline = await matchPrecache(OFFLINE_URL)
    if (offline) {
      return offline
    }
  }

  return Response.error()
})
