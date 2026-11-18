"use client";

/**
 * Supabase client for Client Components. Uses cookies for the auth session, so
 * the server (and src/proxy.ts) sees the same signed-in user. In the browser
 * this returns one shared client.
 */
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/** Null when Supabase isn't configured. */
export function createClient(): SupabaseClient | null {
  const env = getSupabaseEnv();
  return env ? createBrowserClient(env.url, env.key) : null;
}
