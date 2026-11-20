"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
    const supabase = createClient();
    const router = useRouter();

    const [mode, setMode] = useState<"login" | "signup">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <section className="w-full rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
            SAFENET
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to access your safety dashboard."
              : "Create your SAFENET account to get started."}
          </p>

          <form
  onSubmit={async (event) => {
    event.preventDefault();

    setLoading(true);
    setMessage("");

  if (mode === "signup") {

    const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback`,
  },
});

      if (error) {
        setMessage(error.message);
      } else {
        setMessage("Account created. Check your email to confirm your account.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
    setMessage(error.message);
    } else {
    router.push("/dashboard");
    }
    }

    setLoading(false);
  }}
  className="mt-8 space-y-5"
>
  <div>
    <label
      htmlFor="email"
      className="block text-sm font-medium text-slate-700"
    >
      Email
    </label>

    <input
      id="email"
      type="email"
      value={email}
      onChange={(event) => setEmail(event.target.value)}
      placeholder="you@example.com"
      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
    />
  </div>

  <div>
    <label
      htmlFor="password"
      className="block text-sm font-medium text-slate-700"
    >
      Password
    </label>

    <input
      id="password"
      type="password"
      value={password}
      onChange={(event) => setPassword(event.target.value)}
      placeholder="••••••••"
      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900"
    />
  </div>

  <button
    type="submit"
    disabled={loading}
    className="w-full rounded-lg bg-slate-900 px-6 py-3 font-semibold text-white disabled:opacity-50"
  >
    {loading
      ? "Please wait..."
      : mode === "login"
        ? "Sign In"
        : "Create Account"}
  </button>

  {message && (
    <p className="text-center text-sm text-slate-600">
      {message}
    </p>
  )}
</form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {mode === "login" ? (
              <p>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-slate-900"
                >
                  Create one
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-slate-900"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
