"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { AuthHeading, authErrorMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD = 8;

/** Step one of a reset: email a link that signs the person in and opens /reset-password. */
export function ForgotPasswordForm() {
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          title="Check your email"
          description={
            <>
              If <span className="font-medium text-foreground">{sentTo}</span> has an account, a link to set a new
              password is on its way. Open it in this browser.
            </>
          }
        />
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Back to sign in
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase || busy) return;
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    setBusy(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/confirm?next=/reset-password`,
    });

    setBusy(false);
    if (error) setError(authErrorMessage(error));
    else setSentTo(email);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthHeading title="Reset your password" description="We'll email you a link to set a new one." />
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Sending…" : "Send reset link"}
          </Button>
          <FieldDescription className="text-center">
            <Link href="/" className="underline underline-offset-4">
              Back to sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}

/** Step two: the reset link has signed the person in; they choose a new password. */
export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));

    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (password !== String(form.get("confirm"))) {
      setError("The two passwords don't match.");
      return;
    }

    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(authErrorMessage(error));
      setBusy(false);
      return;
    }
    router.replace("/projects");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthHeading title="Choose a new password" description="You'll use it the next time you sign in." />
        <Field>
          <FieldLabel htmlFor="password">New password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="confirm">Type it again</FieldLabel>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save password"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
