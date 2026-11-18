/**
 * This browser's copies of project data belong to whoever was signed in when
 * they were saved. The storage layer sends up any local copy Supabase hasn't
 * got, so if someone else signs in on the same browser, those copies must go
 * first, or they'd be uploaded into the new person's account.
 */
const SIGNED_IN_AS_KEY = "product-studio:signed-in-as";

/** Keys that hold project data or personal workspace state. */
const PREFIXES = ["product-board:", "product-studio:", "decisions:"];
const EXACT = ["decisions", "docs-tree", "agents"];

function isAppKey(key: string) {
  return EXACT.includes(key) || PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Removes every copy this app keeps in the browser. Used on sign-out. */
export function clearLocalData() {
  if (typeof window === "undefined") return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key && isAppKey(key)) keys.push(key);
    }
    for (const key of keys) window.localStorage.removeItem(key);
  } catch {
    // Storage blocked: nothing was kept, so there is nothing to clear.
  }
}

/**
 * Marks this browser's data as `userId`'s. If it belonged to someone else, it
 * is cleared first. Data from before sign-in existed (no owner recorded) is
 * kept, so the first person to sign in keeps what they made.
 */
export function adoptLocalData(userId: string) {
  if (typeof window === "undefined") return;
  try {
    const previous = window.localStorage.getItem(SIGNED_IN_AS_KEY);
    if (previous && previous !== userId) clearLocalData();
    window.localStorage.setItem(SIGNED_IN_AS_KEY, userId);
  } catch {
    // Storage blocked: there are no local copies to mix up.
  }
}
