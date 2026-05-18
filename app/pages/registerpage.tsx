"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import eBayLogo from "../icons/eBayLogo.png";

export default function RegisterPage() {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fname, lname, phone, email, password, role: isAdmin ? "admin" : "user" }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError((data as { error?: string })?.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      const signInRes = (await signIn("credentials", {
        redirect: false,
        email,
        password,
      })) as SignInResponse | undefined;

      setLoading(false);
      if (signInRes?.error) {
        router.push("/login");
        return;
      }
      router.push("/");
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-ebay-gray-50/30 flex flex-col items-center pt-12 px-4 font-sans">
      <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
        <Image src={eBayLogo} width={130} height={52} alt="eBay Logo" priority />
      </Link>

      <div className="w-full max-w-[420px] bg-background border border-ebay-gray-100 rounded-[20px] p-8 shadow-soft">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground mb-2">Create an account</h1>
          <p className="text-sm text-ebay-gray-400">Already have an account? <Link href="/login" className="text-ebay-blue font-bold hover:underline">Sign in</Link></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#fef2f3] border border-ebay-red/20 text-ebay-red text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                id="fname"
                value={fname}
                onChange={(e) => setFname(e.target.value)}
                placeholder=" "
                required
                className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
              />
              <label htmlFor="fname" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
                First name
              </label>
            </div>
            <div className="relative flex-1">
              <input
                id="lname"
                value={lname}
                onChange={(e) => setLname(e.target.value)}
                placeholder=" "
                required
                className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
              />
              <label htmlFor="lname" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
                Last name
              </label>
            </div>
          </div>

          <div className="relative">
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder=" "
              required
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
            />
            <label htmlFor="phone" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Phone number
            </label>
          </div>

          <div className="relative">
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder=" "
              required
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
            />
            <label htmlFor="email" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Email
            </label>
          </div>

          <div className="relative">
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder=" "
              required
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
            />
            <label htmlFor="password" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Password
            </label>
          </div>

          <div className="relative">
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder=" "
              required
              className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
            />
            <label htmlFor="confirm" className="absolute left-4 top-4 text-ebay-gray-400 text-base transition-all peer-placeholder-shown:text-base peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
              Confirm password
            </label>
          </div>

          <p className="text-xs text-ebay-gray-400 leading-relaxed mt-4">
            By creating an account, you agree to our{" "}
            <Link href="#" className="text-ebay-blue hover:underline">User Agreement</Link> and acknowledge reading our{" "}
            <Link href="#" className="text-ebay-blue hover:underline">User Privacy Notice</Link>.
          </p>

          <label className="flex items-center gap-2 cursor-pointer mt-2 bg-ebay-blue/5 p-3 rounded-xl border border-ebay-blue/20">
            <input 
              type="checkbox" 
              checked={isAdmin} 
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-4 h-4 text-ebay-blue rounded border-ebay-gray-300 focus:ring-ebay-blue"
            />
            <span className="text-sm font-medium text-ebay-blue">Register as Admin (Testing)</span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-3.5 mt-2 rounded-full text-base transition-colors disabled:opacity-60 evo-button"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>

      <div className="mt-8 mb-8 text-xs text-ebay-gray-400 max-w-sm text-center">
        Copyright © 1995-2026 eBay Inc. All Rights Reserved. <Link href="#" className="underline hover:text-foreground">Accessibility</Link>, <Link href="#" className="underline hover:text-foreground">User Agreement</Link>, <Link href="#" className="underline hover:text-foreground">Privacy</Link>, <Link href="#" className="underline hover:text-foreground">Payments Terms of Use</Link>, <Link href="#" className="underline hover:text-foreground">Cookies</Link>, <Link href="#" className="underline hover:text-foreground">CA Privacy Notice</Link>, <Link href="#" className="underline hover:text-foreground">Your Privacy Choices</Link> and <Link href="#" className="underline hover:text-foreground">AdChoice</Link>
      </div>
    </div>
  );
}
