import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/login-form";
import { safeNextPath } from "@/lib/auth/next-path";

export const metadata: Metadata = { title: "Sign in · Product Studio" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <AuthShell>
      <LoginForm next={safeNextPath(next)} linkError={error === "link"} />
    </AuthShell>
  );
}
