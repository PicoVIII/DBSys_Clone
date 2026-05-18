"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ebayclone.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleSetup() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/setup", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMsg("Admin account ready! Password: " + data.password);
      setPassword(data.password);
    } else {
      setError(data.error ?? "Setup failed");
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError(res.error);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ebay-gray-50/30 px-4 font-sans">
      <div className="w-full max-w-[400px] bg-background border border-ebay-gray-100 rounded-[20px] p-8 shadow-soft evo-card">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground mb-2">Admin Portal</h1>
          <p className="text-sm text-ebay-gray-400">Sign in to manage the platform</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-[#fef2f3] border border-ebay-red/20 text-ebay-red text-sm p-4 rounded-xl font-medium mb-4">{error}</div>
          )}
          {msg && (
            <div className="bg-green-50 border border-ebay-green/20 text-ebay-green text-sm p-4 rounded-xl font-medium mb-4">{msg}</div>
          )}

          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
              required
            />
            <label htmlFor="email" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Admin Email
            </label>
          </div>
          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
              required
            />
            <label htmlFor="password" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Password
            </label>
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-foreground hover:bg-black text-white font-bold py-3.5 mt-4 rounded-full text-base transition-colors disabled:opacity-60 evo-button"
          >
            {busy ? "Signing in…" : "Sign in to Dashboard"}
          </button>

          <button
            type="button"
            onClick={handleSetup}
            disabled={busy}
            className="w-full border border-ebay-gray-300 text-foreground font-bold py-3.5 mt-2 rounded-full text-base hover:bg-ebay-gray-50 transition-colors disabled:opacity-60 evo-button"
          >
            Reset / Create Admin Account
          </button>
        </form>
      </div>
    </div>
  );
}
