"use client"

import { useState, useEffect } from "react"
import { Toast, type ToastProps } from "@/components/ui/Toast"
import { AnimatePresence } from "framer-motion"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToasterToast[]>([])

  useEffect(() => {
    const addToast = (event: Event) => {
      const detail = (event as CustomEvent).detail
      setToasts((prev) => [detail, ...prev])
    }

    const dismissToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }

    document.addEventListener("add-toast", addToast)

    toasts.forEach(toast => {
      document.addEventListener(`dismiss-${toast.id}`, () => dismissToast(toast.id))
    })

    return () => {
      document.removeEventListener("add-toast", addToast)
      toasts.forEach(toast => {
        document.removeEventListener(`dismiss-${toast.id}`, () => dismissToast(toast.id))
      })
    }
  }, [toasts])

  return (
    <div
      className="fixed bottom-0 right-0 z-[500] m-4 flex w-full max-w-sm flex-col-reverse gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
      role="status"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={() => setToasts(toasts.filter((t) => t.id !== toast.id))}
            className="pointer-events-auto"
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
