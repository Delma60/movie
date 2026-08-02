import { registerWithPassword } from "@/lib/actions/auth";

const ERRORS: Record<string, string> = {
  invalid_input:
    "Enter a name, email, and a password of at least 8 characters.",
  email_taken: "An account with that email already exists.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const { error, returnTo } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Couldn't create your account.")
    : null;
  const target = returnTo ?? "/";
  const spursHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  return (
    <main className="vp-root vp-login">
      <div className="vp-login-card">
        <h1 className="vp-login-title">Create your account</h1>
        <p className="vp-login-subtitle">
          Sign up with email or continue with Spurs.
        </p>

        {message && <div className="vp-login-error">{message}</div>}

        <form action={registerWithPassword} className="vp-login-form">
          <input type="hidden" name="returnTo" value={target} />
          <label className="vp-field">
            <span>Name</span>
            <input type="text" name="name" autoComplete="name" required />
          </label>
          <label className="vp-field">
            <span>Email</span>
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label className="vp-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          <button type="submit" className="vp-btn vp-btn-primary vp-login-btn">
            Create Account
          </button>
        </form>

        <div className="vp-login-divider">
          <span>or</span>
        </div>

        <a href={spursHref} className="vp-btn vp-btn-secondary vp-login-btn">
          Continue with Spurs
        </a>

        <p className="vp-login-switch">
          Already have an account?{" "}
          <a
            href={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`}
          >
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
