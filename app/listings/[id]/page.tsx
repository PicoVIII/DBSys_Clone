"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "../../components/navbar";
import Link from "next/link";
import { Heart, Tag, Search, User, ShieldCheck, Trash2 } from "lucide-react";

type ListingDetail = {
  listg_id: number;
  listg_title: string;
  listg_format: string;
  listg_fixedprice?: number;
  listg_startprice?: number;
  listg_reserveprice?: number;
  listg_bestoffer: string;
  listg_status: string;
  listg_quantity: number;
  listg_startdate: string;
  listg_enddate: string;
  prdct_name: string;
  prdct_brand?: string;
  prdct_cond: string;
  prdct_desc?: string;
  ctgry_id: number;
  ctgry_name: string;
  fname: string;
  lname: string;
  user_id: number;
  current_bid?: number;
  bid_count: number;
  images: { image_url: string; image_alt?: string }[];
  bids: { bid_amount: number; bid_date: string; bid_status: string; fname: string; lname: string }[];
};

type Address = {
  baddr_id: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
};

type RecentlyViewedItem = Pick<
  ListingDetail,
  | "listg_id"
  | "listg_title"
  | "listg_format"
  | "listg_fixedprice"
  | "listg_startprice"
  | "listg_status"
  | "listg_quantity"
  | "listg_enddate"
  | "prdct_cond"
  | "ctgry_name"
  | "bid_count"
> & {
  image_url?: string;
};

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;
  const userRole = (session?.user as { role?: string } | null)?.role;

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);

  // Action states
  const [bidAmount, setBidAmount] = useState("");
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  // Checkout modal
  const [showCheckout, setShowCheckout] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddr, setSelectedAddr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [newAddr, setNewAddr] = useState({ street: "", city: "", country: "", pcode: "" });
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data ?? null;
        setListing(data);
        setLoading(false);
        if (data) {
          try {
            const stored = JSON.parse(localStorage.getItem("recentlyViewed") || "[]");
            const entry = {
              listg_id: data.listg_id,
              listg_title: data.listg_title,
              listg_format: data.listg_format,
              listg_fixedprice: data.listg_fixedprice,
              listg_startprice: data.listg_startprice,
              listg_status: data.listg_status,
              listg_quantity: data.listg_quantity,
              listg_enddate: data.listg_enddate,
              prdct_cond: data.prdct_cond,
              ctgry_name: data.ctgry_name,
              image_url: data.images?.[0]?.image_url,
              bid_count: data.bid_count,
            };
            const updated = [entry, ...stored.filter((i: RecentlyViewedItem) => i.listg_id !== data.listg_id)].slice(0, 12);
            localStorage.setItem("recentlyViewed", JSON.stringify(updated));
          } catch {}
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!userId || !showCheckout) return;
    fetch(`/api/addresses?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setAddresses(d.data ?? []);
        if (d.data?.[0]) setSelectedAddr(String(d.data[0].baddr_id));
      });
  }, [userId, showCheckout]);

  async function addToCart() {
    if (!userId) { router.push("/login"); return; }
    setBusy(true); setMsg(null);
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), listg_id: listing!.listg_id, quantity: qty }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg({ text: res.ok ? "Added to cart!" : data.error, ok: res.ok });
  }

  async function addToWatchlist() {
    if (!userId) { router.push("/login"); return; }
    const res = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), listg_id: listing!.listg_id }),
    });
    const data = await res.json();
    setMsg({ text: res.ok ? data.message : data.error, ok: res.ok });
  }

  async function placeBid() {
    if (!userId) { router.push("/login"); return; }
    if (!bidAmount) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/bids", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), listg_id: listing!.listg_id, amount: Number(bidAmount) }),
    });
    const data = await res.json();
    setBusy(false);
    setMsg({ text: res.ok ? "Bid placed successfully!" : data.error, ok: res.ok });
    if (res.ok) {
      // Refresh listing data
      fetch(`/api/listings/${id}`).then((r) => r.json()).then((d) => setListing(d.data));
    }
  }

  async function addAddress() {
    if (!newAddr.street || !newAddr.city || !newAddr.country || !newAddr.pcode) return;
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), ...newAddr }),
    });
    const data = await res.json();
    if (res.ok) {
      const a: Address = { baddr_id: data.id, baddr_street: newAddr.street, baddr_city: newAddr.city, baddr_country: newAddr.country, baddr_pcode: newAddr.pcode };
      setAddresses((p) => [a, ...p]);
      setSelectedAddr(String(data.id));
      setShowNewAddr(false);
      setNewAddr({ street: "", city: "", country: "", pcode: "" });
    }
  }

  async function placeOrder() {
    if (!selectedAddr) return;
    setBusy(true); setMsg(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), baddr_id: Number(selectedAddr), listg_id: listing!.listg_id, quantity: qty, payment_method: paymentMethod }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setShowCheckout(false);
      setMsg({ text: "Order placed! Check My eBay for details.", ok: true });
    } else {
      setMsg({ text: data.error, ok: false });
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setMsg({ text: data.error ?? "Failed to delete listing", ok: false });
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row gap-10 animate-pulse">
            <div className="w-full md:w-[500px] h-[500px] bg-ebay-gray-100 rounded-2xl" />
            <div className="flex-1 space-y-6">
              <div className="h-8 bg-ebay-gray-100 rounded w-3/4" />
              <div className="h-5 bg-ebay-gray-100 rounded w-1/2" />
              <div className="h-14 bg-ebay-gray-100 rounded w-1/3 mt-8" />
              <div className="h-12 bg-ebay-gray-100 rounded w-full max-w-sm mt-8 rounded-full" />
              <div className="h-12 bg-ebay-gray-100 rounded w-full max-w-sm rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-20 text-center text-ebay-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-xl font-bold text-foreground">Listing not found</p>
          <Link href="/" className="text-ebay-blue hover:underline font-medium mt-4 inline-block">Back to home</Link>
        </div>
      </div>
    );
  }

  const isAuction = listing.listg_format?.toLowerCase() === "auction";
  const isFixed = listing.listg_format?.toLowerCase() === "fixed";
  const currentPrice = isAuction
    ? (listing.current_bid ?? listing.listg_startprice ?? 0)
    : (listing.listg_fixedprice ?? 0);
  const isActive = listing.listg_status?.toLowerCase() === "active";
  const isSeller = userId && Number(userId) === listing.user_id;

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-[13px] text-ebay-gray-400 mb-6 flex items-center gap-2 font-medium">
          <Link href="/" className="hover:text-ebay-blue transition-colors">Home</Link>
          <span className="text-ebay-gray-300">/</span>
          <Link href={`/search?category=${listing.ctgry_id}`} className="hover:text-ebay-blue transition-colors">{listing.ctgry_name}</Link>
          <span className="text-ebay-gray-300">/</span>
          <span className="text-foreground truncate max-w-sm font-bold">{listing.listg_title}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Images */}
          <div className="w-full lg:w-[500px] flex-shrink-0">
            <div className="flex gap-4">
              {/* Thumbnails */}
              <div className="flex flex-col gap-3 w-[72px]">
                {listing.images.length > 0 ? listing.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`w-[72px] h-[72px] border-2 rounded-xl overflow-hidden transition-colors ${activeImg === i ? "border-ebay-blue" : "border-ebay-gray-100 hover:border-ebay-gray-300"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.image_url} alt={img.image_alt ?? ""} className="w-full h-full object-cover" />
                  </button>
                )) : (
                  <div className="w-[72px] h-[72px] bg-ebay-gray-50 rounded-xl border-2 border-ebay-blue flex items-center justify-center text-2xl">📦</div>
                )}
              </div>
              {/* Main image */}
              <div className="flex-1 aspect-square bg-white border border-ebay-gray-100 rounded-2xl overflow-hidden flex items-center justify-center p-4">
                {listing.images[activeImg] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.images[activeImg].image_url}
                    alt={listing.images[activeImg].image_alt ?? listing.listg_title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-9xl opacity-20">📦</div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details + Purchase */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-[28px] font-bold text-foreground mb-3 leading-tight">
              {listing.listg_title}
            </h1>

            {/* Condition */}
            <div className="mb-6 bg-ebay-gray-50/50 rounded-xl p-4 border border-ebay-gray-100">
              <p className="text-sm">
                <span className="text-ebay-gray-400 font-medium">Condition:</span>{" "}
                <span className="font-bold text-foreground">{listing.prdct_cond}</span>
              </p>
              {listing.prdct_desc && (
                <p className="text-[13px] text-ebay-gray-400 mt-1 pl-[75px] truncate">
                  {listing.prdct_desc}
                </p>
              )}
            </div>

            <div className="border-t border-ebay-gray-100 pt-6 mb-8">
              {/* Price */}
              {isAuction ? (
                <div className="bg-ebay-gray-50/30 p-6 rounded-[20px] border border-ebay-gray-100 shadow-sm">
                  <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-1">Current bid</p>
                  <p className="text-4xl font-bold text-foreground mb-2">
                    ${Number(currentPrice).toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-ebay-gray-400 flex items-center gap-2">
                    <span className="text-foreground">{listing.bid_count} bid{listing.bid_count !== 1 ? "s" : ""}</span>
                    <span>•</span>
                    <span className="text-ebay-red">Ends {new Date(listing.listg_enddate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </p>
                </div>
              ) : (
                <div className="mb-6">
                  <p className="text-4xl font-bold text-foreground mb-2">
                    ${Number(currentPrice).toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-ebay-gray-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-ebay-green" />
                    <span>eBay Money Back Guarantee</span>
                  </p>
                </div>
              )}
            </div>

            {/* Status badge */}
            {!isActive && (
              <div className="mb-6 inline-flex bg-[#fef2f3] border border-ebay-red/20 text-ebay-red text-sm font-bold px-4 py-2 rounded-full shadow-sm">
                This listing is {listing.listg_status}
              </div>
            )}

            {/* Actions */}
            {isActive && !isSeller && (
              <div className="space-y-4 max-w-[400px]">
                {msg && (
                  <div className={`text-sm p-4 rounded-xl font-medium shadow-sm border ${msg.ok ? "bg-green-50 text-ebay-green border-green-200" : "bg-[#fef2f3] text-ebay-red border-ebay-red/20"}`}>
                    {msg.text}
                  </div>
                )}

                {isAuction && (
                  <div className="bg-background border border-ebay-gray-200 rounded-[24px] p-5 shadow-soft">
                    <div className="flex gap-3 mb-4">
                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min={Number(currentPrice) + 0.01}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={(Number(currentPrice) + 1).toFixed(2)}
                          className="w-full border border-ebay-gray-300 rounded-xl pl-8 pr-4 py-3 text-base font-bold outline-none focus:border-ebay-blue transition-colors"
                        />
                      </div>
                    </div>
                    <button
                      onClick={placeBid}
                      disabled={busy || !bidAmount}
                      className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full text-base transition-colors disabled:opacity-50 evo-button"
                    >
                      Place bid
                    </button>
                    <p className="text-center text-xs text-ebay-gray-400 mt-3">Enter ${(Number(currentPrice) + 1).toFixed(2)} or more</p>
                  </div>
                )}

                {isFixed && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-4">
                      <label className="text-sm font-bold text-foreground">Quantity:</label>
                      <select
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="border border-ebay-gray-300 rounded-xl px-4 py-2.5 text-base font-medium outline-none focus:border-ebay-blue bg-background"
                      >
                        {Array.from({ length: Math.min(listing.listg_quantity, 10) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                      <span className="text-sm text-ebay-gray-400">{listing.listg_quantity} available</span>
                    </div>
                    <button
                      onClick={() => { if (!userId) { router.push("/login"); return; } setShowCheckout(true); }}
                      className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full text-base transition-colors evo-button shadow-soft"
                    >
                      Buy It Now
                    </button>
                    <button
                      onClick={addToCart}
                      disabled={busy}
                      className="w-full bg-[#f4f4f4] hover:bg-[#e5e5e5] text-foreground font-bold py-4 rounded-full text-base transition-colors disabled:opacity-50 evo-button"
                    >
                      Add to cart
                    </button>
                  </div>
                )}

                {listing.listg_bestoffer?.toLowerCase() === "yes" && (
                  <BestOfferButton userId={Number(userId)} listgId={listing.listg_id} setMsg={setMsg} />
                )}

                <button
                  onClick={addToWatchlist}
                  className="w-full bg-transparent border border-ebay-blue text-ebay-blue font-bold py-4 rounded-full text-base transition-colors hover:bg-ebay-blue/5 flex items-center justify-center gap-2 evo-button mt-4"
                >
                  <Heart className="w-5 h-5" /> Add to Watchlist
                </button>
              </div>
            )}

            {(isSeller || userRole === "admin") && (
              <div className="space-y-3 max-w-[400px]">
                <div className="bg-ebay-gray-50/50 border border-ebay-gray-200 rounded-xl p-5 text-sm font-medium text-foreground flex items-start gap-3">
                  <User className="w-5 h-5 text-ebay-blue shrink-0" />
                  <div>
                    <p className="font-bold text-base mb-1">{isSeller ? "Your Listing" : "Admin View"}</p>
                    <p className="text-ebay-gray-400">{isSeller ? "You are the seller of this item." : "You are viewing this as an admin."}</p>
                  </div>
                </div>
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full border border-red-300 text-red-600 font-bold py-3 rounded-full text-sm transition-colors hover:bg-red-50 flex items-center justify-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete listing
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Grid (Seller & Details) */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-10 border-t border-ebay-gray-100 pt-10">
          <div className="lg:col-span-2 order-2 lg:order-1">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Tag className="w-5 h-5" /> About this item
            </h2>
            <div className="bg-background border border-ebay-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-[15px] mb-8 pb-8 border-b border-ebay-gray-100">
                {listing.prdct_brand && (
                  <div className="flex gap-4">
                    <span className="text-ebay-gray-400 w-24 flex-shrink-0">Brand</span>
                    <span className="font-bold text-foreground">{listing.prdct_brand}</span>
                  </div>
                )}
                <div className="flex gap-4">
                  <span className="text-ebay-gray-400 w-24 flex-shrink-0">Condition</span>
                  <span className="font-bold text-foreground">{listing.prdct_cond}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-ebay-gray-400 w-24 flex-shrink-0">Category</span>
                  <span className="font-bold text-foreground">{listing.ctgry_name}</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-ebay-gray-400 w-24 flex-shrink-0">Format</span>
                  <span className="font-bold text-foreground capitalize">{listing.listg_format}</span>
                </div>
              </div>
              {listing.prdct_desc ? (
                <div className="text-foreground leading-relaxed whitespace-pre-wrap font-sans text-base">
                  {listing.prdct_desc}
                </div>
              ) : (
                <p className="text-ebay-gray-400 italic">No description provided.</p>
              )}
            </div>

            {/* Bid history */}
            {isAuction && listing.bids.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-bold text-foreground mb-6">Bid History</h3>
                <div className="border border-ebay-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-ebay-gray-50/50 border-b border-ebay-gray-100 text-xs uppercase text-ebay-gray-400 font-bold">
                      <tr>
                        <th className="px-6 py-4">Bidder</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {listing.bids.map((b, i) => (
                        <tr key={i} className="hover:bg-ebay-gray-50/30 transition-colors">
                          <td className="px-6 py-4 font-medium text-foreground">{b.fname} {b.lname[0]}.</td>
                          <td className="px-6 py-4 font-bold text-foreground">${Number(b.bid_amount).toFixed(2)}</td>
                          <td className="px-6 py-4">
                            <span className={`text-xs px-3 py-1 rounded-full font-bold ${b.bid_status === "Active" ? "bg-green-50 text-ebay-green" : "bg-ebay-gray-100 text-ebay-gray-400"}`}>
                              {b.bid_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <User className="w-5 h-5" /> About the seller
            </h2>
            <SellerCard sellerId={listing.user_id} fname={listing.fname} lname={listing.lname} currentUserId={userId ? Number(userId) : null} listgId={listing.listg_id} />
            
            {!isSeller && userId && (
              <button onClick={() => setShowReport(true)} className="text-sm font-medium text-ebay-gray-400 hover:text-ebay-red transition-colors mt-6 flex items-center gap-2">
                Report this listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2">Complete your order</h2>
            <p className="text-base text-ebay-gray-400 mb-6 truncate">{listing.listg_title}</p>
            
            <div className="bg-ebay-gray-50/50 rounded-xl p-6 border border-ebay-gray-100 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-ebay-gray-400">Total</span>
                <p className="text-3xl font-bold text-foreground">
                  ${(qty * Number(listing.listg_fixedprice ?? 0)).toFixed(2)}
                </p>
              </div>
            </div>

            <label className="block text-base font-bold text-foreground mb-2">Ship to</label>
            {addresses.length > 0 ? (
              <div className="relative mb-3">
                <select value={selectedAddr} onChange={(e) => setSelectedAddr(e.target.value)} className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue appearance-none bg-background cursor-pointer">
                  {addresses.map((a) => (
                    <option key={a.baddr_id} value={a.baddr_id}>
                      {a.baddr_street}, {a.baddr_city}, {a.baddr_country} {a.baddr_pcode}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <p className="text-sm text-ebay-gray-400 mb-3">No saved addresses. Add one below.</p>
            )}

            <button onClick={() => setShowNewAddr((v) => !v)} className="text-sm font-bold text-ebay-blue hover:underline mb-6 inline-block">
              {showNewAddr ? "Cancel adding address" : "+ Add new address"}
            </button>

            {showNewAddr && (
              <div className="space-y-3 mb-6 p-5 bg-ebay-gray-50/50 rounded-xl border border-ebay-gray-100">
                {(["street", "city", "country", "pcode"] as const).map((f) => (
                  <input key={f} placeholder={f.charAt(0).toUpperCase() + f.slice(1)} value={newAddr[f]} onChange={(e) => setNewAddr((p) => ({ ...p, [f]: e.target.value }))} className="w-full border border-ebay-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-ebay-blue bg-background" />
                ))}
                <button onClick={addAddress} className="w-full bg-foreground text-white font-bold py-3 rounded-xl hover:bg-black transition-colors mt-2">Save Address</button>
              </div>
            )}

            <label className="block text-base font-bold text-foreground mb-2">Payment method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue appearance-none bg-background mb-8 cursor-pointer">
              {["Credit Card", "Debit Card", "PayPal", "Bank Transfer"].map((m) => <option key={m}>{m}</option>)}
            </select>

            {msg && (
              <p className={`text-sm mb-6 font-medium ${msg.ok ? "text-ebay-green" : "text-ebay-red"}`}>{msg.text}</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => setShowCheckout(false)} className="flex-1 border border-ebay-gray-300 text-foreground font-bold py-4 rounded-full hover:bg-ebay-gray-50 transition-colors">Cancel</button>
              <button onClick={placeOrder} disabled={busy || !selectedAddr} className="flex-1 bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button">
                {busy ? "Placing…" : "Confirm order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2">Report Listing</h2>
            <p className="text-base text-ebay-gray-400 mb-6">Why are you reporting this listing?</p>
            <div className="space-y-4">
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue bg-background">
                <option value="">Select a reason</option>
                <option value="Prohibited item">Prohibited item</option>
                <option value="Counterfeit">Counterfeit</option>
                <option value="Misleading title">Misleading title</option>
                <option value="Wrong category">Wrong category</option>
                <option value="Fraud">Fraud</option>
                <option value="Other">Other</option>
              </select>
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)} placeholder="Additional details…" className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base min-h-[120px] resize-none outline-none focus:border-ebay-blue bg-background" />
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowReport(false); setReportReason(""); setReportDesc(""); }} className="flex-1 border border-ebay-gray-300 text-foreground font-bold py-4 rounded-full hover:bg-ebay-gray-50 transition-colors">Cancel</button>
                <button onClick={async () => {
                  if (!reportReason) return;
                  await fetch("/api/reports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      reporter_user_id: Number(userId),
                      listg_id: listing!.listg_id,
                      reported_user_id: listing!.user_id,
                      reason: reportReason,
                      description: reportDesc || null,
                    }),
                  });
                  setShowReport(false);
                  setReportReason("");
                  setReportDesc("");
                  setMsg({ text: "Report submitted. Thank you.", ok: true });
                }} disabled={!reportReason} className="flex-1 bg-ebay-red hover:bg-red-700 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button">
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Delete listing?</h2>
              <p className="text-base text-ebay-gray-400 mb-6">
                This will permanently delete this listing and all associated data (images, bids, watchlists, offers, feedback). This action cannot be undone.
              </p>
              {msg && (
                <p className={`text-sm mb-4 font-medium ${msg.ok ? "text-ebay-green" : "text-ebay-red"}`}>{msg.text}</p>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setShowDeleteConfirm(false); setMsg(null); }} className="flex-1 border border-ebay-gray-300 text-foreground font-bold py-4 rounded-full hover:bg-ebay-gray-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SellerCard({ sellerId, fname, lname, currentUserId, listgId }: { sellerId: number; fname: string; lname: string; currentUserId: number | null; listgId: number }) {
  const [feedback, setFeedback] = useState<{ total: number; averageRating: number; score: number } | null>(null);

  useEffect(() => {
    fetch(`/api/feedback/seller/${sellerId}`)
      .then((r) => r.json())
      .then((d) => setFeedback(d.data ?? null));
  }, [sellerId]);

  async function messageSeller() {
    if (!currentUserId) return;
    const res = await fetch("/api/messages/conv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seller_id: sellerId, listg_id: listgId }),
    });
    if (res.ok) {
      const data = await res.json();
      window.location.href = `/messages?conv=${data.conv_id}`;
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6 border border-ebay-gray-100 rounded-2xl bg-background shadow-sm evo-card">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-ebay-blue/10 flex items-center justify-center text-2xl font-bold text-ebay-blue flex-shrink-0">
          {fname[0]}
        </div>
        <div>
          <p className="text-lg font-bold text-foreground">{fname} {lname}</p>
          <p className="text-sm text-ebay-gray-400 font-medium">eBay member since 2026</p>
        </div>
      </div>
      
      {feedback && (
        <div className="bg-ebay-gray-50/50 rounded-xl p-4 flex items-center justify-between border border-ebay-gray-100">
          <div>
            <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-0.5">Seller Rating</p>
            <p className="text-2xl font-bold text-foreground">{feedback.averageRating.toFixed(1)}/5</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-0.5">Reviews</p>
            <p className="text-xl font-bold text-foreground">{feedback.total}</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col gap-2 mt-2">
        <Link href={`/seller/${sellerId}`} className="w-full text-center border border-ebay-gray-300 text-foreground font-bold py-3 rounded-full hover:bg-ebay-gray-50 transition-colors">
          See other items
        </Link>
        {currentUserId && currentUserId !== sellerId && (
          <button onClick={messageSeller} className="w-full text-center border border-ebay-blue text-ebay-blue font-bold py-3 rounded-full hover:bg-ebay-blue/5 transition-colors">
            Contact seller
          </button>
        )}
      </div>
    </div>
  );
}

function BestOfferButton({ userId, listgId, setMsg }: { userId: number; listgId: number; setMsg: (msg: { text: string; ok: boolean } | null) => void }) {
  const [showOffer, setShowOffer] = useState(false);
  const [offerAmt, setOfferAmt] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitOffer() {
    if (!offerAmt) return;
    setBusy(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listg_id: listgId, user_id: userId, amount: Number(offerAmt) }),
    });
    const data = await res.json();
    setBusy(false);
    setShowOffer(false);
    setOfferAmt("");
    setMsg({ text: res.ok ? "Offer submitted!" : data.error, ok: res.ok });
  }

  return (
    <>
      <button
        onClick={() => setShowOffer(true)}
        className="w-full border border-ebay-blue text-ebay-blue font-bold py-4 rounded-full text-base transition-colors hover:bg-ebay-blue/5 evo-button mt-4"
      >
        Make Offer
      </button>
      {showOffer && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-2">Make a Best Offer</h2>
            <p className="text-base text-ebay-gray-400 mb-6">Enter the price you&apos;d like to offer.</p>
            <div className="relative mb-8">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={offerAmt}
                onChange={(e) => setOfferAmt(e.target.value)}
                placeholder="Offer amount"
                className="w-full border border-ebay-gray-300 rounded-xl pl-8 pr-4 py-4 text-lg font-bold outline-none focus:border-ebay-blue bg-background"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowOffer(false); setOfferAmt(""); }} className="flex-1 border border-ebay-gray-300 text-foreground font-bold py-4 rounded-full hover:bg-ebay-gray-50 transition-colors">Cancel</button>
              <button onClick={submitOffer} disabled={busy || !offerAmt} className="flex-1 bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full disabled:opacity-50 evo-button">
                {busy ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
