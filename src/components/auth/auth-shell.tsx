import { GalleryVerticalEndIcon } from "lucide-react";

/** The frame around every sign-in page: one narrow form, and the product's promise beside it. */
export function AuthShell({ children }: { children: React.ReactNode }) {
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
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-muted to-muted dark:brightness-[0.4]" />
        <div className="absolute inset-0 flex flex-col justify-end gap-2 p-10">
          <p className="text-2xl font-semibold tracking-tight">Manage your work, stakeholders and delivery.</p>
          <p className="text-sm text-muted-foreground">One studio for product managers.</p>
        </div>
      </div>
    </div>
  );
}

/** Heading block shared by the sign-in forms. */
export function AuthHeading({ title, description }: { title: string; description: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-balance text-muted-foreground">{description}</p>
    </div>
  );
}

/** Plain-language versions of Supabase's sign-in errors. */
export function authErrorMessage(error: { code?: string; message: string }): string {
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don't match an account.";
    case "email_not_confirmed":
      return "Confirm your email first. Check your inbox for the link we sent.";
    case "user_already_exists":
    case "email_exists":
      return "There's already an account with that email. Sign in instead.";
    case "weak_password":
      return "Choose a stronger password: at least 8 characters.";
    case "same_password":
      return "That's your current password. Choose a new one.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Wait a few minutes and try again.";
    default:
      return error.message;
  }
}
