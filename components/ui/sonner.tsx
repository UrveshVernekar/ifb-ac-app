"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!bg-green-500/10 group-[.toaster]:!text-green-600 dark:group-[.toaster]:!text-green-400 group-[.toaster]:!border-green-500/20",
          error: "group-[.toaster]:!bg-rose-500/10 group-[.toaster]:!text-rose-600 dark:group-[.toaster]:!text-rose-400 group-[.toaster]:!border-rose-500/20",
          warning: "group-[.toaster]:!bg-amber-500/10 group-[.toaster]:!text-amber-600 dark:group-[.toaster]:!text-amber-400 group-[.toaster]:!border-amber-500/20",
          info: "group-[.toaster]:!bg-blue-500/10 group-[.toaster]:!text-blue-600 dark:group-[.toaster]:!text-blue-400 group-[.toaster]:!border-blue-500/20",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
