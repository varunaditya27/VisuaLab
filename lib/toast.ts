import { type ToastProps } from "@/components/ui/Toast"

type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId))
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    document.dispatchEvent(new CustomEvent(`dismiss-${toastId}`))
  }, 5000)

  toastTimeouts.set(toastId, timeout)
}

export const toast = (props: Omit<ToasterToast, "id">) => {
  const id = crypto.randomUUID()

  document.dispatchEvent(new CustomEvent("add-toast", { detail: { ...props, id } }))
  addToRemoveQueue(id)
}
