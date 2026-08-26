"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loginWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    const supabase = createClient();

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }
      // No session means the project requires the address to be confirmed first.
      if (!data.session) {
        setNotice(`Check ${email} for a confirmation link, then sign in.`);
        setMode("signin");
        return;
      }
      router.push("/dashboard/scheduled");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push("/dashboard/scheduled");
  }

  const isSignup = mode === "signup";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold">{isSignup ? "Create account" : "Login"}</h1>

        <Button onClick={loginWithGoogle} variant="outline" className="w-full">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.85A11 11 0 0 0 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.85z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.85C6.71 7.3 9.14 5.38 12 5.38z" />
          </svg>
          Continue with Google
        </Button>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <div className="h-px flex-1 bg-border" />
          or {isSignup ? "sign up" : "sign in"} through email
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Input
            type="email"
            required
            autoComplete="email"
            placeholder="Email ID"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "Password (min 6 characters)" : "Password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-xs text-danger">{error}</p>}
          {notice && <p className="text-xs text-primary">{notice}</p>}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (isSignup ? "Creating account..." : "Logging in...") : isSignup ? "Create account" : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted">
          {isSignup ? "Already have an account?" : "No account yet?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError(null);
              setNotice(null);
            }}
            className="font-medium text-primary hover:underline"
          >
            {isSignup ? "Sign in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}
