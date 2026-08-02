export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
}) {
  const ERRORS: Record<string, string> = {
    invalid_state: "Your sign-in session expired. Please try again.",
    exchange_failed: "Couldn't complete sign-in with Spurs. Please try again.",
    access_denied: "You cancelled the Spurs sign-in.",
  };

  const { error, returnTo } = await searchParams;
  const message = error
    ? (ERRORS[error] ?? "Sign-in failed. Please try again.")
    : null;
  const loginHref = returnTo
    ? `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
    : "/auth/login";

  return (
    <main className="vp-root vp-login">
      <div className="vp-login-card">
        <h1 className="vp-login-title">Sign in to Velvet</h1>
        <p className="vp-login-subtitle">Use your Spurs account to continue.</p>
        {message && <div className="vp-login-error">{message}</div>}
        <a href={loginHref} className="vp-btn vp-btn-primary vp-login-btn">
          Continue with Spurs
        </a>
      </div>
    </main>
  );
}
