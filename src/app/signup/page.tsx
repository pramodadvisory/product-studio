import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = { title: "Sign up · Product Studio" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <SignupForm next={safeNextPath(next)} />
    </AuthShell>
  );
}
