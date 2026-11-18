"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { adoptLocalData } from "@/lib/auth/local-data";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { AuthHeading, authErrorMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const LINK_ERROR = "That link has expired or was already used. Try again.";

export function LoginForm({
  next,
  linkError = false,
  className,
}: {
  /** Where to go once signed in. Already checked to be inside the app. */
  next: string;
  /** Set when an email link failed and sent the person back here. */
  linkError?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(linkError ? LINK_ERROR : null);
  const [busy, setBusy] = React.useState(false);

  const nextQuery = next === "/projects" ? "" : `?next=${encodeURIComponent(next)}`;

  if (!getSupabaseEnv()) {
    return (
      <div className={cn("flex flex-col gap-6", className)}>
        <AuthHeading
          title="Sign-in is off"
          description="Supabase isn't configured, so projects are saved only in this browser."
        />
        <Button onClick={() => router.push("/projects")}>Continue</Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });

    if (error) {
      setError(authErrorMessage(error));
      setBusy(false);
      return;
    }

    adoptLocalData(data.user.id);
    router.replace(next);
    router.refresh();
  }

  return (
    <form className={cn("flex flex-col gap-6", className)} onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthHeading title="Sign in to Product Studio" description="Enter your email and password." />
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Link href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
              Forgot your password?
            </Link>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <Link href={`/signup${nextQuery}`} className="underline underline-offset-4">
              Sign up
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
