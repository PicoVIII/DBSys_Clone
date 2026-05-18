"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";

type WatchlistItem = {
  user_id: number;
  listg_id: number;
  created_at: string;
  listg_title: string;
  listg_status: string;
  listg_fixedprice?: number;
  listg_startprice?: number;
  image_url?: string;
};

export default function WatchlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/watchlist?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setItems(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userId]);

  async function removeItem(listg_id: number) {
    await fetch(`/api/watchlist?user_id=${userId}&listg_id=${listg_id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.listg_id !== listg_id));
    setMsg("Removed from watchlist");
    setTimeout(() => setMsg(""), 3000);
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10 text-center text-gray-500">Loading watchlist…</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Watchlist</h1>

        {msg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded border border-green-200">{msg}</div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">♡</p>
            <p className="text-lg font-medium">Your watchlist is empty</p>
            <p className="text-sm mt-1">
              Save items you&apos;re interested in from{" "}
              <Link href="/" className="text-[#0064D2] hover:underline">listings</Link>
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
            {items.map((item) => {
              const price = item.listg_fixedprice ?? item.listg_startprice ?? 0;
              const isActive = item.listg_status?.toLowerCase() === "active";
              return (
                <div key={item.listg_id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${item.listg_id}`} className="font-medium text-gray-800 hover:text-[#0064D2] hover:underline line-clamp-2">
                      {item.listg_title}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-lg font-bold text-gray-900">${Number(price).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.listg_status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && (
                      <Link
                        href={`/listings/${item.listg_id}`}
                        className="border border-[#0064D2] text-[#0064D2] text-sm px-4 py-1.5 rounded-full hover:bg-blue-50 transition"
                      >
                        View item
                      </Link>
                    )}
                    <button
                      onClick={() => removeItem(item.listg_id)}
                      className="text-xs text-gray-400 hover:text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
