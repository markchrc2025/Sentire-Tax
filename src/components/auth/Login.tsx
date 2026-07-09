// Login.tsx — email + password sign in / sign up for cloud mode (API or
// Supabase, via the auth facade). On success, the auth state change is picked
// up by the RepositoryProvider.

import { useState } from "react";
import { authSignIn, authSignUp } from "../../lib/auth/facade";
import { Mark } from "../icons";

export function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const needsEmailConfirm = await authSignUp(email, password);
        if (needsEmailConfirm) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
        }
      } else {
        await authSignIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="s-auth">
      <form className="s-auth-card" onSubmit={submit}>
        <div className="s-auth-brand">
          <div className="s-brand-tile">
            <Mark size={26} />
          </div>
          <div className="s-brand-txt">
            <b>Sentire</b>
            <i>BIR Form Generator</i>
          </div>
        </div>
        <h1 className="s-auth-title">{mode === "signin" ? "Sign in" : "Create your account"}</h1>
        <p className="s-auth-sub">Your taxpayers, filings, and COR files are stored securely to your account.</p>

        <label className="s-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="s-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </label>

        {error && <div className="s-auth-error">{error}</div>}
        {notice && <div className="s-auth-notice">{notice}</div>}

        <button className="s-btn s-btn-primary full" type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
        </button>

        <div className="s-auth-switch">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <a onClick={() => { setMode("signup"); setError(null); setNotice(null); }}>Create one</a>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <a onClick={() => { setMode("signin"); setError(null); setNotice(null); }}>Sign in</a>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
