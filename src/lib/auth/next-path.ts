/**
 * Where to go after signing in. Only paths inside this app are allowed, so a
 * crafted link (`?next=https://evil.example`) can't bounce someone off-site.
 */
export function safeNextPath(value: string | null | undefined, fallback = "/projects"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
