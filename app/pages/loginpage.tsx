"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import type { SignInResponse } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import eBayLogo from "../icons/eBayLogo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = (await signIn("credentials", {
      redirect: false,
      email,
      password,
    })) as SignInResponse | undefined;

    setLoading(false);
    if (res?.error) {
      setError("The email or password you entered doesn't match our records. Please try again.");
      return;
    }

    router.push("/");
  }

  return (
    <div className="min-h-screen bg-ebay-gray-50/30 flex flex-col items-center pt-12 px-4 font-sans">
      <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
        <Image src={eBayLogo} width={130} height={52} alt="eBay Logo" priority />
      </Link>

      <div className="w-full max-w-[400px] bg-background border border-ebay-gray-100 rounded-[20px] p-8 shadow-soft">
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-foreground mb-2">Hello</h1>
          <p className="text-sm text-ebay-gray-400">Sign in to eBay or <Link href="/register" className="text-ebay-blue font-bold hover:underline">create an account</Link></p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#fef2f3] border border-ebay-red/20 text-ebay-red text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              Email or username
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-3.5 mt-2 rounded-full text-base transition-colors disabled:opacity-60 evo-button"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="text-center mt-6 flex flex-col gap-2">
          <button className="text-ebay-blue text-sm font-medium hover:underline cursor-pointer bg-transparent border-none">
            Need help signing in?
          </button>
          <Link href="/admin/login" className="text-ebay-gray-400 text-xs font-medium hover:text-foreground transition-colors mt-2">
            Admin Portal (Testing)
          </Link>
        </div>
      </div>
      
      <div className="mt-8 text-xs text-ebay-gray-400 max-w-sm text-center">
        Copyright © 1995-2026 eBay Inc. All Rights Reserved. <Link href="#" className="underline hover:text-foreground">Accessibility</Link>, <Link href="#" className="underline hover:text-foreground">User Agreement</Link>, <Link href="#" className="underline hover:text-foreground">Privacy</Link>, <Link href="#" className="underline hover:text-foreground">Payments Terms of Use</Link>, <Link href="#" className="underline hover:text-foreground">Cookies</Link>, <Link href="#" className="underline hover:text-foreground">CA Privacy Notice</Link>, <Link href="#" className="underline hover:text-foreground">Your Privacy Choices</Link> and <Link href="#" className="underline hover:text-foreground">AdChoice</Link>
      </div>
    </div>
  );
}
