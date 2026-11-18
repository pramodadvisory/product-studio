"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/env";

export type CurrentUser = { id: string; email: string; name: string };

export type CurrentUserState = {
  /** Null when signed out, or when Supabase isn't configured. */
  user: CurrentUser | null;
  loading: boolean;
};

/** Initials for an avatar: "Ada Lovelace" → "AL", "[REDACTED_EMAIL_ADDRESS_4]" → "A". */
export function initialsOf(name: string): string {
  return (
    name
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "?"
  );
}

/** The signed-in person, with the name from their profile. */
export function useCurrentUser(): CurrentUserState {
  // With sign-in off there is no one to load.
  const [state, setState] = React.useState<CurrentUserState>(() => ({ user: null, loading: getSupabaseEnv() !== null }));

  React.useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        if (!cancelled) setState({ user: null, loading: false });
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
      const email = user.email ?? "";
      const name = profile?.full_name || (user.user_metadata?.full_name as string | undefined) || email.split("@")[0];
      if (!cancelled) setState({ user: { id: user.id, email, name }, loading: false });
    };

    void load();
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setState({ user: null, loading: false });
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") void load();
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
