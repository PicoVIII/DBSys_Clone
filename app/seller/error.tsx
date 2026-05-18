"use client";

import Link from "next/link";

export default function SellerError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-ebay-gray-50/30 flex items-center justify-center px-4 font-sans antialiased">
      <div className="bg-background border border-ebay-gray-100 rounded-[20px] p-8 shadow-soft text-center max-w-md w-full">
        <h1 className="text-2xl font-bold text-foreground mb-2">Seller area error</h1>
        <p className="text-sm text-ebay-gray-400 mb-6">Something went wrong. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-3 px-8 rounded-full text-sm transition-colors cursor-pointer"
          >
            Try again
          </button>
          <Link
            href="/"
            className="border border-ebay-gray-300 text-foreground font-bold py-3 px-8 rounded-full text-sm hover:bg-ebay-gray-50 transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
