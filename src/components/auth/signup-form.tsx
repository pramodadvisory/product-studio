"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { adoptLocalData } from "@/lib/auth/local-data";
import { createClient } from "@/lib/supabase/client";
import { AuthHeading, authErrorMessage } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD = 8;

/**
 * Creates an account. If Supabase is set to confirm emails, the person is
 * told to check their inbox; otherwise they go straight in.
 */
export function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [sentTo, setSentTo] = React.useState<string | null>(null);

  const nextQuery = next === "/projects" ? "" : `?next=${encodeURIComponent(next)}`;

  if (sentTo) {
    return (
      <div className="flex flex-col gap-6">
        <AuthHeading
          title="Check your email"
          description={
            <>
              We sent a confirmation link to <span className="font-medium text-foreground">{sentTo}</span>. Open it
              in this browser to finish signing up.
            </>
          }
        />
        <Button variant="outline" nativeButton={false} render={<Link href={`/${nextQuery}`} />}>
          Back to sign in
        </Button>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase || busy) return;
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email")).trim();
    const password = String(form.get("password"));

    if (password.length < MIN_PASSWORD) {
      setError(`Use at least ${MIN_PASSWORD} characters for your password.`);
      return;
    }

    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: String(form.get("name")).trim() },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      setError(authErrorMessage(error));
      setBusy(false);
      return;
    }

    if (data.session) {
      adoptLocalData(data.session.user.id);
      router.replace(next);
      router.refresh();
      return;
    }

    setSentTo(email);
  }

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <FieldGroup>
        <AuthHeading title="Create your account" description="Your projects stay private until you add people to them." />
        <Field>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" name="name" autoComplete="name" required autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input id="email" name="email" type="email" autoComplete="email" required />
          <FieldDescription>Collaborators add you to their projects with this email.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={MIN_PASSWORD}
            required
          />
          <FieldDescription>At least {MIN_PASSWORD} characters.</FieldDescription>
        </Field>
        {error && <FieldError>{error}</FieldError>}
        <Field>
          <Button type="submit" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </Button>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <Link href={`/${nextQuery}`} className="underline underline-offset-4">
              Sign in
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
