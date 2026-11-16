"use client"

import { LoginForm } from "@/components/login-form"
import { GalleryVerticalEndIcon } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <span className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEndIcon className="size-4" />
            </span>
            Product Studio
          </span>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-muted dark:brightness-[0.4]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-2 p-10">
          <p className="text-2xl font-semibold tracking-tight">
            Manage your work, stakeholders and delivery.
          </p>
          <p className="text-sm text-muted-foreground">
            One studio for product managers.
          </p>
        </div>
      </div>
    </div>
  )
}
