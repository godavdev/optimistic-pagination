"use client"

import { useRegisterSW } from "virtual:pwa-register/react"

import { toast } from "@/components/ui/toast"

/**
 * Registers the service worker and tells the user when a new version is ready
 * to be activated.
 *
 * It renders nothing: the service worker is registered in an effect and the
 * updates are reported with a toast.
 */
export function RegisterServiceWorker() {
  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      toast.add({
        title: "A new version is available",
        description: "Reload the app to apply the latest changes.",
        type: "info",
        timeout: 0,
        actionProps: {
          children: "Update",
          onClick: () => {
            void updateServiceWorker()
          },
        },
      })
    },
    onRegisterError(error) {
      // Without the service worker the app keeps working, but it loses the
      // offline support. Better to warn than to fail silently.
      console.error("[pwa] The service worker could not be registered", error)
      toast.add({
        title: "No offline support",
        description:
          "The service worker could not be registered, so the app will not work without a connection.",
        type: "error",
      })
    },
  })

  return null
}
