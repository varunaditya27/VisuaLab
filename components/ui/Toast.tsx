"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { CheckCircle2, AlertTriangle, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, type HTMLMotionProps } from "framer-motion"

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive: "destructive group border-destructive bg-destructive text-destructive-foreground",
        success: "success group border-green-500 bg-green-500 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface ToastProps extends HTMLMotionProps<'div'>, VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onDismiss?: () => void;
}

const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant, title, description, onDismiss, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(toastVariants({ variant }), className)}
        layout
        initial={{ opacity: 0, y: 50, scale: 0.3 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {variant === 'success' && <CheckCircle2 className="h-6 w-6" />}
          {variant === 'destructive' && <AlertTriangle className="h-6 w-6" />}
          <div className="grid gap-1">
            {title && <p className="font-semibold">{title}</p>}
            {description && (
              <p className="text-sm opacity-90">{description}</p>
            )}
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </motion.div>
    )
  }
)
Toast.displayName = "Toast"

export { Toast }
