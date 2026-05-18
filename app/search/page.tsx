"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "../components/navbar";
import Link from "next/link";
import { Heart, Search, Filter, X, Package } from "lucide-react";

type Listing = {
  listg_id: number;
  listg_title: string;
  listg_format: string;
  listg_fixedprice?: number;
  listg_startprice?: number;
  listg_status: string;
  listg_quantity: number;
  listg_enddate: string;
  prdct_cond?: string;
  ctgry_name?: string;
  image_url?: string;
  bid_count?: number;
};

type Category = { ctgry_id: number; ctgry_name: string };

const CONDITIONS = ["", "New", "Like New", "Good", "Used", "Refurbished", "For Parts or Not Working"];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string } | null)?.id;

  const q = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";
  const format = searchParams.get("format") ?? "";
  const condition = searchParams.get("condition") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const page = Number(searchParams.get("page") ?? 1);

  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [watchlisted, setWatchlisted] = useState<Set<number>>(new Set());
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [localCondition, setLocalCondition] = useState(condition);
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  useEffect(() => {
    setLocalCondition(condition);
    setLocalMin(minPrice);
    setLocalMax(maxPrice);
  }, [condition, minPrice, maxPrice]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.data ?? []));
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/watchlist?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => setWatchlisted(new Set((d.data ?? []).map((w: { listg_id: number }) => w.listg_id))));
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (format) params.set("format", format);
    if (condition) params.set("condition", condition);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("limit", "25");

    fetch(`/api/listings?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
          setListings([]);
          setTotal(0);
        } else {
          setListings(d.data ?? []);
          setTotal(d.total ?? 0);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load results");
        setLoading(false);
      });
  }, [q, category, format, condition, minPrice, maxPrice, sort, page]);

  function applyFilters() {
    const params = new URLSearchParams(searchParams.toString());
    if (localCondition) params.set("condition", localCondition);
    else params.delete("condition");
    if (localMin) params.set("minPrice", localMin);
    else params.delete("minPrice");
    if (localMax) params.set("maxPrice", localMax);
    else params.delete("maxPrice");
    params.set("page", "1");
    router.push(`/search?${params}`);
  }

  function clearFilters() {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    if (format) p.set("format", format);
    if (sort && sort !== "newest") p.set("sort", sort);
    router.push(`/search?${p}`);
  }

  function setFormatFilter(f: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (f) params.set("format", f);
    else params.delete("format");
    params.set("page", "1");
    router.push(`/search?${params}`);
  }

  function setSort(s: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (s && s !== "newest") params.set("sort", s);
    else params.delete("sort");
    params.set("page", "1");
    router.push(`/search?${params}`);
  }

  const catName = categories.find((c) => String(c.ctgry_id) === category)?.ctgry_name;
  const totalPages = Math.max(1, Math.ceil(total / 25));

  return (
    <>
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-6 flex gap-6">
        <aside className="w-56 flex-shrink-0 text-sm hidden md:block">
          <h3 className="font-bold text-gray-800 mb-3">Category</h3>
          <ul className="space-y-1.5 mb-6 max-h-64 overflow-y-auto">
            <li>
              <button
                onClick={() => {
                  const p = new URLSearchParams(searchParams.toString());
                  p.delete("category");
                  p.set("page", "1");
                  router.push(`/search?${p}`);
                }}
                className={`text-left hover:underline ${!category ? "font-semibold text-gray-900" : "text-[#0064D2]"}`}
              >
                All
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.ctgry_id}>
                <button
                  onClick={() => {
                    const p = new URLSearchParams(searchParams.toString());
                    p.set("category", String(c.ctgry_id));
                    p.set("page", "1");
                    router.push(`/search?${p}`);
                  }}
                  className={`text-left hover:underline ${category === String(c.ctgry_id) ? "font-semibold text-gray-900" : "text-[#0064D2]"}`}
                >
                  {c.ctgry_name}
                </button>
              </li>
            ))}
          </ul>

          <div className="border-t border-gray-200 pt-4 mb-5">
            <h3 className="font-bold text-gray-800 mb-2">Condition</h3>
            <div className="space-y-1">
              {CONDITIONS.map((c) => (
                <label key={c || "any"} className="flex items-center gap-2 text-gray-600 cursor-pointer py-0.5 hover:text-gray-900">
                  <input type="radio" name="cond" checked={localCondition === c} onChange={() => setLocalCondition(c)} className="accent-[#0064D2]" />
                  {c === "" ? "Any" : c}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mb-5">
            <h3 className="font-bold text-gray-800 mb-2">Price</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
              <span className="text-gray-400 text-xs">to</span>
              <input type="number" placeholder="Max" value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs" />
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-5">
            <button onClick={applyFilters} className="w-full bg-[#0064D2] text-white text-xs font-medium py-2.5 rounded-full hover:bg-[#0053B3] transition-colors">Apply filters</button>
            <button onClick={clearFilters} className="w-full border border-gray-300 text-xs py-2.5 rounded-full hover:bg-gray-50 text-gray-600 transition-colors">Clear all</button>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{q ? `Results for "${q}"` : catName ?? "All Listings"}</h1>
              {!loading && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {total.toLocaleString()} result{total !== 1 ? "s" : ""}
                  {totalPages > 1 && ` · Page ${page} of ${totalPages}`}
                </p>
              )}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white cursor-pointer hover:border-gray-500">
              <option value="newest">Best Match</option>
              <option value="price_asc">Price: lowest first</option>
              <option value="price_desc">Price: highest first</option>
              <option value="ending">Time: ending soonest</option>
            </select>
          </div>

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <button onClick={() => setShowMobileFilters(true)} className="md:hidden flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-full text-gray-700 hover:border-gray-500 transition-colors">
              <Filter className="w-3.5 h-3.5" /> Filters
            </button>
            {[{ val: "", label: "All" }, { val: "auction", label: "Auction" }, { val: "fixed", label: "Buy It Now" }].map(({ val, label }) => (
              <button key={val} onClick={() => setFormatFilter(val)} className={`px-4 py-1.5 text-sm border rounded-full transition-colors ${format === val ? "bg-[#0064D2] text-white border-[#0064D2]" : "border-gray-300 text-gray-700 hover:border-gray-500"}`}>
                {label}
              </button>
            ))}
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200">{error}</div>}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex gap-4 border border-gray-200 rounded-lg p-3 animate-pulse">
                  <div className="w-36 h-36 bg-gray-200 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 stroke-1" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm mt-1">Try different keywords or adjust filters</p>
            </div>
          ) : (
            <>
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                {listings.map((l) => {
                  const isAuction = l.listg_format?.toLowerCase() === "auction";
                  const price = isAuction ? l.listg_startprice : l.listg_fixedprice;
                  const isActive = l.listg_status?.toLowerCase() === "active";
                  return (
                    <div key={l.listg_id} className="flex gap-4 p-4 bg-white hover:bg-gray-50/60 transition group">
                      <Link href={`/listings/${l.listg_id}`} className="w-36 h-36 sm:w-44 sm:h-44 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                        {l.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.image_url} alt={l.listg_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                        )}
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <Link href={`/listings/${l.listg_id}`} className="text-[#0064D2] hover:underline font-medium line-clamp-2 leading-snug">{l.listg_title}</Link>
                        {l.prdct_cond && <p className="text-xs text-gray-500 mt-0.5">{l.prdct_cond}</p>}
                        {l.ctgry_name && <p className="text-xs text-gray-400 mt-0.5">{l.ctgry_name}</p>}
                        <div className="mt-2">
                          <p className="text-lg sm:text-xl font-bold text-gray-900">${Number(price ?? 0).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">{isAuction ? `Auction · ${Number(l.bid_count ?? 0)} bid(s)` : "Buy It Now"}</p>
                        </div>
                        {isAuction && <p className="text-xs text-gray-400 mt-0.5">Ends {new Date(l.listg_enddate).toLocaleDateString()}</p>}
                        {!isActive && <span className="inline-block mt-2 text-xs bg-red-50 text-red-600 font-medium px-2.5 py-0.5 rounded-full w-fit">{l.listg_status}</span>}
                      </div>
                      <div className="flex flex-col items-end justify-between flex-shrink-0 py-0.5">
                        <button
                          onClick={async () => {
                            if (!userId) { router.push("/login"); return; }
                            if (watchlisted.has(l.listg_id)) {
                              await fetch(`/api/watchlist?user_id=${userId}&listg_id=${l.listg_id}`, { method: "DELETE" });
                              setWatchlisted((prev) => { const n = new Set(prev); n.delete(l.listg_id); return n; });
                            } else {
                              await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: Number(userId), listg_id: l.listg_id }) });
                              setWatchlisted((prev) => new Set(prev).add(l.listg_id));
                            }
                          }}
                          className={watchlisted.has(l.listg_id) ? "text-red-500" : "text-gray-400 hover:text-red-400 transition-colors"}
                        >
                          <Heart className={`w-5 h-5 ${watchlisted.has(l.listg_id) ? "fill-current" : ""}`} />
                        </button>
                        {isActive && (
                          <Link href={`/listings/${l.listg_id}`} className="text-xs border border-[#0064D2] text-[#0064D2] font-medium px-3 py-1.5 rounded-full hover:bg-blue-50 transition-colors">
                            {isAuction ? "Place bid" : "Buy It Now"}
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(page - 1)); router.push(`/search?${p}`); }}
                  disabled={page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >← Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && Number(p) - Number(arr[idx - 1]) > 1) acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                    ) : (
                      <button
                        key={String(p)}
                        onClick={() => { const p2 = new URLSearchParams(searchParams.toString()); p2.set("page", String(p)); router.push(`/search?${p2}`); }}
                        className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${p === page ? "bg-[#0064D2] text-white" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
                      >{p}</button>
                    )
                  )}
                <button
                  onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("page", String(page + 1)); router.push(`/search?${p}`); }}
                  disabled={page >= totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >Next →</button>
              </div>
              )}
            </>
          )}
        </div>
      </div>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-base">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h4 className="font-semibold text-gray-700 text-sm mb-2.5">Category</h4>
            <ul className="space-y-1.5 mb-5 text-sm">
              <li>
                <button onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.delete("category"); p.set("page", "1"); router.push(`/search?${p}`); setShowMobileFilters(false); }} className={`text-left hover:underline ${!category ? "font-semibold text-gray-900" : "text-[#0064D2]"}`}>All</button>
              </li>
              {categories.map((c) => (
                <li key={c.ctgry_id}>
                  <button onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set("category", String(c.ctgry_id)); p.set("page", "1"); router.push(`/search?${p}`); setShowMobileFilters(false); }} className={`text-left hover:underline ${category === String(c.ctgry_id) ? "font-semibold text-gray-900" : "text-[#0064D2]"}`}>{c.ctgry_name}</button>
                </li>
              ))}
            </ul>

            <h4 className="font-semibold text-gray-700 text-sm mb-2.5">Condition</h4>
            <div className="space-y-1 mb-5">
              {CONDITIONS.map((c) => (
                <label key={c || "any"} className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer py-0.5 hover:text-gray-900">
                  <input type="radio" name="mob-cond" checked={localCondition === c} onChange={() => setLocalCondition(c)} className="accent-[#0064D2]" />
                  {c === "" ? "Any" : c}
                </label>
              ))}
            </div>

            <h4 className="font-semibold text-gray-700 text-sm mb-2.5">Price</h4>
            <div className="flex items-center gap-2 mb-5">
              <input type="number" placeholder="Min" value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
              <span className="text-gray-400 text-sm">to</span>
              <input type="number" placeholder="Max" value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => { applyFilters(); setShowMobileFilters(false); }} className="w-full bg-[#0064D2] text-white text-sm font-medium py-2.5 rounded-full hover:bg-[#0053B3] transition-colors">Apply filters</button>
              <button onClick={() => { clearFilters(); setShowMobileFilters(false); }} className="w-full border border-gray-300 text-sm py-2.5 rounded-full hover:bg-gray-50 text-gray-600 transition-colors">Clear all</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Loading…</div>}>
      <SearchContent />
    </Suspense>
  );
}