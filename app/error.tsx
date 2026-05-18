"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import eBayLogo from "./icons/eBayLogo.png";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-ebay-gray-50/30 flex flex-col items-center justify-center px-4 font-sans antialiased">
      <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
        <Image src={eBayLogo} width={130} height={52} alt="eBay Logo" priority />
      </Link>

      <div className="w-full max-w-[400px] bg-background border border-ebay-gray-100 rounded-[20px] p-8 shadow-soft text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">!</span>
        </div>
        <h1 className="text-[28px] font-bold text-foreground mb-2">Something went wrong</h1>
        <p className="text-sm text-ebay-gray-400 mb-6">An unexpected error occurred. Please try again.</p>

        <button
          onClick={reset}
          className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-3.5 rounded-full text-base transition-colors evo-button cursor-pointer"
        >
          Try again
        </button>

        <Link
          href="/"
          className="block mt-3 text-ebay-blue text-sm font-medium hover:underline"
        >
          Back to home
        </Link>
      </div>

      <div className="mt-8 text-xs text-ebay-gray-400">
        Copyright &copy; 1995-2026 eBay Inc. All Rights Reserved.
      </div>
    </div>
  );
}
