import { loginWithPassword } from "@/lib/actions/auth";

const ERRORS: Record<string, string> = {
  missing_fields: "Enter your email and password.",
  invalid_credentials: "That email or password isn't right.",
  invalid_state: "Your sign-in session expired. Please try again.",
  exchange_failed: "Couldn't complete sign-in with Spurs. Please try again.",
  access_denied: "You cancelled the Spurs sign-in.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Sign-in failed. Please try again.")
    : null;
  const target = returnTo ?? "/";
  const spursHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  return (
    <main className="vp-root vp-login">
      <div className="vp-login-card">
        <h1 className="vp-login-title">Sign in to Velvet</h1>
        <p className="vp-login-subtitle">
          Use your email or continue with Spurs.
        </p>

        {message && <div className="vp-login-error">{message}</div>}

        <form action={loginWithPassword} className="vp-login-form">
          <input type="hidden" name="returnTo" value={target} />
          <label className="vp-field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="vp-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="vp-btn vp-btn-primary vp-login-btn">
            Sign In
          </button>
        </form>

        <div className="vp-login-divider">
          <span>or</span>
        </div>

        <a href={spursHref} className="vp-btn vp-btn-secondary vp-login-btn">
          Continue with Spurs
        </a>

        <p className="vp-login-switch">
          New to Velvet?{" "}
          <a
            href={`/signup${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          >
            Create an account
          </a>
        </p>
      </div>
    </main>
  );
}
