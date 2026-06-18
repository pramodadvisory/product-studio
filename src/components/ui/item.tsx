import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const itemVariants = cva(
  "relative flex w-full items-start gap-2 rounded-xl transition-colors",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-border bg-background",
        muted: "border border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800/60",
      },
      size: {
        default: "min-h-16 p-3",
        sm: "min-h-14 p-2.5",
        xs: "min-h-12 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ItemProps = React.ComponentProps<"div"> & VariantProps<typeof itemVariants>

function Item({ className, variant, size, ...props }: ItemProps) {
  return (
    <div
      data-slot="item"
      className={cn(itemVariants({ variant, size }), className)}
      {...props}
    />
  )
}

function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="item-content" className={cn("min-w-0 flex-1", className)} {...props} />
  )
}

function ItemTitle({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-title"
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("ml-auto flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Item, ItemActions, ItemContent, ItemDescription, ItemTitle }
