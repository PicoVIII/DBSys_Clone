"use client";

export default function AdminError({ error: _error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans antialiased">
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-soft text-center max-w-md w-full">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 text-2xl font-bold">!</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Admin error</h1>
        <p className="text-sm text-gray-500 mb-6">Something went wrong in the admin panel.</p>
        <button
          onClick={reset}
          className="bg-[#0064D2] hover:bg-[#0053B3] text-white font-bold py-3 px-8 rounded-full text-sm transition-colors cursor-pointer"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
