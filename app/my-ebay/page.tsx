"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";
import { Package, Receipt, Heart, MessageCircle, TrendingUp, X } from "lucide-react";

type Listing = {
  listg_id: number;
  listg_title: string;
  listg_format: string;
  listg_fixedprice?: number;
  listg_startprice?: number;
  listg_status: string;
  listg_quantity: number;
  listg_enddate: string;
};

type Order = {
  order_id: number;
  order_date: string;
  order_status: string;
  order_totalamount: number;
  listg_title?: string;
  listg_id?: number;
  seller_user_id?: number;
  ordit_quantity?: number;
  ordit_itemprice?: number;
  paymt_method?: string;
  paymt_status?: string;
  shpmt_id?: number;
  shpmt_trackingno?: string;
  shpmt_deliverydate?: string | null;
  shpmt_status?: string;
  cancel_reason?: string | null;
  cancel_requested_at?: string | null;
};

type WatchlistItem = {
  listg_id: number;
  listg_title: string;
  listg_status: string;
  listg_fixedprice?: number;
  listg_startprice?: number;
};

type OfferItem = {
  bstof_id: number;
  listg_id: number;
  user_id: number;
  bstof_amount: number;
  bstof_date: string;
  bstof_status: string;
  listg_title: string;
  listing_status: string;
  listg_fixedprice: number;
  fname: string;
  lname: string;
};

type Tab = "listings" | "orders" | "watchlist" | "offers" | "sales";

export default function MyEbayPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [tab, setTab] = useState<Tab>("listings");
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [offersReceived, setOffersReceived] = useState<OfferItem[]>([]);
  const [myOffers, setMyOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackModal, setFeedbackModal] = useState<{ listg_id: number; seller_user_id: number } | null>(null);
  const [feedbackType, setFeedbackType] = useState("Positive");
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackGiven, setFeedbackGiven] = useState<Set<number>>(new Set());
  const [sales, setSales] = useState<Order[]>([]);
  const [shipModal, setShipModal] = useState<Order | null>(null);
  const [shipCourrier, setShipCourrier] = useState("");
  const [shipTracking, setShipTracking] = useState("");
  const [shipExpectDate, setShipExpectDate] = useState("");
  const [cancelModal, setCancelModal] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [restockModal, setRestockModal] = useState<Listing | null>(null);
  const [restockQty, setRestockQty] = useState("1");
  const cancelReasons = [
    "Changed my mind",
    "Made a mistake during checkout",
    "Found a better price",
    "No longer needed",
    "Other reason",
  ];

  const isPaymentPaid = (order: Order) => order.paymt_status === "Paid";
  const isOrderFinished = (order: Order) =>
    order.order_status === "Completed" ||
    order.shpmt_status === "Delivered" ||
    Boolean(order.shpmt_deliverydate);
  const hasCancelRequest = (order: Order) => Boolean(order.cancel_requested_at);
  const orderBadgeClass = (order: Order) => {
    if (hasCancelRequest(order)) return "bg-purple-50 text-purple-700";
    if (order.order_status === "Cancelled" || order.order_status === "Returned") return "bg-red-50 text-ebay-red";
    if (isOrderFinished(order)) return "bg-green-50 text-ebay-green";
    if (isPaymentPaid(order)) return "bg-blue-50 text-ebay-blue";
    return "bg-yellow-50 text-yellow-700";
  };
  const orderLabel = (order: Order) => {
    if (hasCancelRequest(order)) return "Cancellation requested";
    if (isOrderFinished(order)) return "Completed";
    if (order.order_status === "Cancelled") return "Cancelled";
    if (order.order_status === "Returned") return "Returned";
    return isPaymentPaid(order) ? "Paid" : "Awaiting payment";
  };

  async function refreshOrdersAndSales() {
    if (!userId) return;
    const [ordersData, salesData] = await Promise.all([
      fetch(`/api/orders?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/orders?seller_id=${userId}`).then((r) => r.json()),
    ]);
    setOrders(ordersData.data ?? []);
    setSales(salesData.data ?? []);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/listings/user/${userId}`).then((r) => r.json()),
      fetch(`/api/orders?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/watchlist?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/offers?seller_id=${userId}`).then((r) => r.json()),
      fetch(`/api/offers?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/feedback?buyer_id=${userId}`).then((r) => r.json()),
      fetch(`/api/orders?seller_id=${userId}`).then((r) => r.json()),
    ]).then(([l, o, w, or, mo, fb, s]) => {
      setMyListings(l.data ?? []);
      setOrders(o.data ?? []);
      setWatchlist(w.data ?? []);
      setOffersReceived(or.data ?? []);
      setMyOffers(mo.data ?? []);
      setFeedbackGiven(new Set((fb.data ?? []).map((f: { listg_id: number }) => f.listg_id)));
      setSales(s.data ?? []);
      setLoading(false);
    });
  }, [userId]);

  async function endListing(listg_id: number) {
    await fetch(`/api/listings/${listg_id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "Ended" }),
    });
    setMyListings((prev) => prev.map((l) => l.listg_id === listg_id ? { ...l, listg_status: "Ended" } : l));
  }

  async function updateOfferStatus(offerId: number, status: "Accepted" | "Rejected") {
    setLoading(true);
    await fetch("/api/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer_id: offerId, seller_user_id: Number(userId), status }),
    });
    const [or] = await Promise.all([
      fetch(`/api/offers?seller_id=${userId}`).then((r) => r.json()),
      fetch(`/api/listings/user/${userId}`).then((r) => r.json()),
    ]);
    setOffersReceived(or.data ?? []);
    const [l] = await Promise.all([fetch(`/api/listings/user/${userId}`).then((r) => r.json())]);
    setMyListings(l.data ?? []);
    setLoading(false);
  }

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: "listings", label: "My Listings", count: myListings.length, icon: <Package className="w-4 h-4" /> },
    { key: "orders", label: "Purchase History", count: orders.length, icon: <Receipt className="w-4 h-4" /> },
    { key: "watchlist", label: "Watchlist", count: watchlist.length, icon: <Heart className="w-4 h-4" /> },
    { key: "offers", label: "Offers", count: offersReceived.length + myOffers.length, icon: <MessageCircle className="w-4 h-4" /> },
    { key: "sales", label: "Sales", count: sales.length, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1000px] mx-auto px-5 py-10">
          <div className="flex items-center justify-between mb-8 animate-pulse">
            <div>
              <div className="h-8 bg-ebay-gray-100 rounded w-48 mb-2" />
              <div className="h-4 bg-ebay-gray-100 rounded w-64" />
            </div>
            <div className="h-10 bg-ebay-gray-100 rounded-full w-32" />
          </div>
          <div className="flex gap-4 border-b border-ebay-gray-100 mb-8 overflow-x-auto pb-1 animate-pulse">
             <div className="h-10 bg-ebay-gray-100 rounded-lg w-24" />
             <div className="h-10 bg-ebay-gray-100 rounded-lg w-32" />
             <div className="h-10 bg-ebay-gray-100 rounded-lg w-24" />
          </div>
          <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-ebay-gray-100 rounded-2xl w-full" />
            <div className="h-24 bg-ebay-gray-100 rounded-2xl w-full" />
            <div className="h-24 bg-ebay-gray-100 rounded-2xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[1000px] mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My eBay</h1>
            <p className="text-sm text-ebay-gray-400 mt-1">
              Welcome back, <span className="font-bold text-foreground">{session?.user?.name}</span>
            </p>
          </div>
          <Link
            href="/sell"
            className="bg-ebay-blue hover:bg-ebay-blue-hover text-white text-sm font-bold px-6 py-3 rounded-full transition-colors whitespace-nowrap shadow-soft flex-shrink-0 text-center"
          >
            + List an item
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-ebay-gray-100 mb-8 overflow-x-auto hide-scrollbar">
          {tabs.map(({ key, label, count, icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                tab === key
                  ? "border-ebay-blue text-ebay-blue"
                  : "border-transparent text-ebay-gray-400 hover:text-foreground"
              }`}
            >
              {icon}
              {label}
              <span className={`ml-1.5 text-xs px-2 py-0.5 rounded-full font-bold ${tab === key ? "bg-ebay-blue/10 text-ebay-blue" : "bg-ebay-gray-100 text-ebay-gray-400"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* My Listings Tab */}
        {tab === "listings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {myListings.length === 0 ? (
              <div className="text-center py-20 bg-ebay-gray-50/50 rounded-[24px] border border-ebay-gray-100">
                <Package className="w-16 h-16 mx-auto mb-4 text-ebay-gray-300" />
                <p className="text-xl font-bold text-foreground">No listings yet</p>
                <p className="text-ebay-gray-400 mt-2 mb-6 max-w-sm mx-auto">Start turning your items into cash today. It&apos;s fast and easy.</p>
                <Link href="/sell" className="bg-foreground text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-colors inline-block">Start selling</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {myListings.map((l) => {
                  const price = l.listg_format?.toLowerCase() === "auction" ? l.listg_startprice : l.listg_fixedprice;
                  const isActive = l.listg_status?.toLowerCase() === "active";
                  return (
                    <div key={l.listg_id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                      <div className="w-16 h-16 bg-ebay-gray-50 rounded-xl border border-ebay-gray-100 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${l.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline line-clamp-1">
                          {l.listg_title}
                        </Link>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className="font-bold text-foreground">${Number(price ?? 0).toFixed(2)}</span>
                          <span className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide">{l.listg_format}</span>
                          <span className="text-xs text-ebay-gray-400">Qty: {l.listg_quantity}</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? "bg-green-50 text-ebay-green" : "bg-ebay-gray-100 text-ebay-gray-400"}`}>
                            {l.listg_status}
                          </span>
                        </div>
                        <p className="text-xs text-ebay-gray-400 mt-1">
                          Ends {new Date(l.listg_enddate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0">
                        <Link href={`/listings/${l.listg_id}`} className="flex-1 sm:flex-none text-center text-sm font-bold border border-ebay-gray-300 text-foreground px-5 py-2.5 rounded-full hover:bg-ebay-gray-50 transition-colors">
                          View
                        </Link>
                        {isActive && (
                          <button onClick={() => endListing(l.listg_id)} className="flex-1 sm:flex-none text-sm font-bold border border-ebay-red text-ebay-red px-5 py-2.5 rounded-full hover:bg-red-50 transition-colors">
                            End listing
                          </button>
                        )}
                        {l.listg_status?.toLowerCase() === "sold" && l.listg_quantity <= 0 && (
                          <button onClick={() => { setRestockModal(l); setRestockQty("1"); }} className="flex-1 sm:flex-none text-sm font-bold border border-ebay-green text-ebay-green px-5 py-2.5 rounded-full hover:bg-green-50 transition-colors">
                            Restock
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {orders.length === 0 ? (
              <div className="text-center py-20 bg-ebay-gray-50/50 rounded-[24px] border border-ebay-gray-100">
                <Receipt className="w-16 h-16 mx-auto mb-4 text-ebay-gray-300" />
                <p className="text-xl font-bold text-foreground">No orders yet</p>
                <p className="text-ebay-gray-400 mt-2 mb-6">Looks like you haven&apos;t bought anything yet.</p>
                <Link href="/" className="bg-foreground text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-colors inline-block">Start shopping</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((o) => (
                  <div key={o.order_id} className="p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-1">
                          Order #{o.order_id}
                        </p>
                        {o.listg_title && (
                          <Link href={`/listings/${o.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline block line-clamp-1">
                            {o.listg_title}
                          </Link>
                        )}
                        <p className="text-[13px] text-ebay-gray-400 mt-2 flex items-center gap-2">
                          <span>{new Date(o.order_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                          {o.paymt_method && (
                            <>
                              <span>•</span>
                              <span>{o.paymt_method}</span>
                            </>
                          )}
                          {o.ordit_quantity && (
                            <>
                              <span>•</span>
                              <span>Qty: {o.ordit_quantity}</span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="text-left md:text-right flex flex-col md:items-end border-t md:border-t-0 border-ebay-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
                        <p className="text-xl font-bold text-foreground">${Number(o.order_totalamount).toFixed(2)}</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block ${orderBadgeClass(o)}`}>
                          {orderLabel(o)}
                        </span>
                        <div className="flex flex-wrap gap-2 justify-start md:justify-end mt-4">
                          <Link href={`/orders/${o.order_id}`} className="text-sm font-bold border border-ebay-gray-300 text-foreground px-4 py-2 rounded-full hover:bg-ebay-gray-50 transition-colors">
                            View order
                          </Link>
                          {isPaymentPaid(o) && o.listg_id && o.seller_user_id && !feedbackGiven.has(o.listg_id) && (
                            <button
                              onClick={() => setFeedbackModal({ listg_id: o.listg_id!, seller_user_id: o.seller_user_id! })}
                              className="text-sm font-bold border border-ebay-blue text-ebay-blue px-4 py-2 rounded-full hover:bg-ebay-blue/5 transition-colors"
                            >
                              Leave Feedback
                            </button>
                          )}
                          {o.order_status === "Open" && !o.shpmt_id && !hasCancelRequest(o) && (
                            <button
                              onClick={() => { setCancelModal(o); setCancelReason(""); }}
                              className="text-sm font-bold border border-ebay-red text-ebay-red px-4 py-2 rounded-full hover:bg-red-50 transition-colors"
                            >
                              Request cancellation
                            </button>
                          )}
                          {hasCancelRequest(o) && (
                            <span className="text-xs font-bold text-purple-700 px-3 py-2">
                              Cancellation requested — awaiting seller response
                            </span>
                          )}
                          {isPaymentPaid(o) && !isOrderFinished(o) && !hasCancelRequest(o) && (
                            <span className="text-xs font-bold text-ebay-gray-400 px-3 py-2">
                              You can leave feedback now. Delivery is still in progress.
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackModal && (
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Leave Feedback</h2>
                <button onClick={() => { setFeedbackModal(null); setFeedbackComment(""); setFeedbackType("Positive"); }} className="text-ebay-gray-400 hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Feedback</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Positive", "Neutral", "Negative"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFeedbackType(type)}
                        className={`text-sm font-bold rounded-xl border px-3 py-3 transition-colors ${
                          feedbackType === type
                            ? "border-ebay-blue bg-ebay-blue/10 text-ebay-blue"
                            : "border-ebay-gray-300 text-foreground hover:bg-ebay-gray-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Comment</label>
                  <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder="Share your experience..." className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base min-h-[120px] resize-none outline-none focus:border-ebay-blue bg-background" />
                </div>
                <div className="pt-4">
                  <button onClick={async () => {
                    if (!feedbackComment) return;
                    await fetch("/api/feedback", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        listg_id: feedbackModal.listg_id,
                        buyer_user_id: Number(userId),
                        seller_user_id: feedbackModal.seller_user_id,
                        comment: feedbackComment,
                        type: feedbackType,
                      }),
                    });
                    setFeedbackGiven((prev) => new Set(prev).add(feedbackModal.listg_id));
                    setFeedbackModal(null);
                    setFeedbackComment("");
                    setFeedbackType("Positive");
                  }} disabled={!feedbackComment} className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button">
                    Submit Feedback
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Modal */}
        {cancelModal && (
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Cancel Order</h2>
                  <p className="text-sm text-ebay-gray-400 mt-1">Order #{cancelModal.order_id}</p>
                </div>
                <button onClick={() => { setCancelModal(null); setCancelReason(""); }} className="text-ebay-gray-400 hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="text-sm text-ebay-gray-400 mb-4">Why do you want to cancel this order?</p>
              <div className="space-y-2 mb-6">
                {cancelReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelReason(reason)}
                    className={`w-full text-left text-sm font-bold rounded-xl border px-4 py-3 transition-colors ${
                      cancelReason === reason
                        ? "border-ebay-blue bg-ebay-blue/10 text-ebay-blue"
                        : "border-ebay-gray-300 text-foreground hover:bg-ebay-gray-50"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  if (!cancelReason) return;
                  await fetch("/api/orders", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      order_id: cancelModal.order_id,
                      user_id: Number(userId),
                      action: "cancel-request",
                      cancel_reason: cancelReason,
                    }),
                  });
                  setCancelModal(null);
                  setCancelReason("");
                  await refreshOrdersAndSales();
                }}
                disabled={!cancelReason}
                className="w-full bg-ebay-red hover:bg-red-600 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button"
              >
                Request cancellation
              </button>
              <p className="text-xs text-ebay-gray-400 text-center mt-4">
                The seller will review your request and respond.
              </p>
            </div>
          </div>
        )}

        {/* Sales Tab */}
        {tab === "sales" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {sales.length === 0 ? (
              <div className="text-center py-20 bg-ebay-gray-50/50 rounded-[24px] border border-ebay-gray-100">
                <TrendingUp className="w-16 h-16 mx-auto mb-4 text-ebay-gray-300" />
                <p className="text-xl font-bold text-foreground">No sales yet</p>
                <p className="text-ebay-gray-400 mt-2 mb-6">List items to start generating sales.</p>
                <Link href="/sell" className="bg-foreground text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-colors inline-block">List an item</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {sales.map((s) => (
                  <div key={`${s.order_id}-${s.listg_id ?? "order"}-${s.shpmt_id ?? "no-shipment"}`} className="p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-1">
                          Order #{s.order_id} — {(s as Order & { buyer_fname?: string; buyer_lname?: string }).buyer_fname} {(s as Order & { buyer_fname?: string; buyer_lname?: string }).buyer_lname}
                        </p>
                        {s.listg_title && (
                          <Link href={`/listings/${s.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline block line-clamp-1">
                            {s.listg_title}
                          </Link>
                        )}
                        <p className="text-[13px] text-ebay-gray-400 mt-2 flex items-center gap-2">
                          <span>{new Date(s.order_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                          {s.ordit_quantity && (
                            <>
                              <span>•</span>
                              <span>Qty: {s.ordit_quantity}</span>
                            </>
                          )}
                        </p>
                        {(s as Order & { baddr_street?: string }).baddr_street && (
                          <div className="mt-3 p-3 bg-ebay-gray-50 rounded-xl inline-block border border-ebay-gray-100">
                            <p className="text-xs font-bold text-ebay-gray-400 uppercase tracking-wide mb-1">Ship to</p>
                            <p className="text-sm text-foreground">
                              {(s as Order & { baddr_street?: string }).baddr_street}, {(s as Order & { baddr_city?: string }).baddr_city}, {(s as Order & { baddr_country?: string }).baddr_country} {(s as Order & { baddr_pcode?: string }).baddr_pcode}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="text-left md:text-right flex flex-col md:items-end border-t md:border-t-0 border-ebay-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
                        <p className="text-xl font-bold text-foreground">${Number(s.order_totalamount).toFixed(2)}</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full mt-2 inline-block ${orderBadgeClass(s)}`}>
                          {orderLabel(s)}
                        </span>
                        {s.paymt_status === "Pending" && s.order_status === "Open" && (
                          <div className="flex gap-2 mt-4">
                            <button onClick={async () => {
                              await fetch("/api/orders", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ order_id: s.order_id, seller_user_id: Number(userId), action: "approve" }),
                              });
                              await refreshOrdersAndSales();
                            }} className="flex-1 text-sm font-bold bg-ebay-green text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors">
                              Mark paid
                            </button>
                            <button onClick={async () => {
                              await fetch("/api/orders", {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ order_id: s.order_id, seller_user_id: Number(userId), action: "reject" }),
                              });
                              await refreshOrdersAndSales();
                            }} className="flex-1 text-sm font-bold border border-ebay-red text-ebay-red px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
                              Reject
                            </button>
                          </div>
                        )}
                        {hasCancelRequest(s) && (
                          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                            <p className="text-xs font-bold text-purple-700 uppercase tracking-wide mb-1">Cancellation requested</p>
                            <p className="text-sm text-purple-600 mb-3">Reason: {s.cancel_reason}</p>
                            <div className="flex gap-2">
                              <button onClick={async () => {
                                await fetch("/api/orders", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ order_id: s.order_id, seller_user_id: Number(userId), action: "cancel-approve" }),
                                });
                                await refreshOrdersAndSales();
                              }} className="flex-1 text-sm font-bold bg-ebay-green text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors">
                                Approve
                              </button>
                              <button onClick={async () => {
                                await fetch("/api/orders", {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ order_id: s.order_id, seller_user_id: Number(userId), action: "cancel-decline" }),
                                });
                                await refreshOrdersAndSales();
                              }} className="flex-1 text-sm font-bold border border-ebay-red text-ebay-red px-4 py-2 rounded-full hover:bg-red-50 transition-colors">
                                Decline
                              </button>
                            </div>
                          </div>
                        )}
                        {isPaymentPaid(s) && s.order_status !== "Cancelled" && (
                          <div className="flex flex-wrap gap-2 justify-start md:justify-end mt-4">
                            {!s.shpmt_id ? (
                              <button onClick={() => { setShipModal(s); setShipCourrier(""); setShipTracking(""); setShipExpectDate(""); }} className="text-sm font-bold border border-ebay-blue text-ebay-blue px-4 py-2 rounded-full hover:bg-ebay-blue/5 transition-colors">
                                Create Shipment
                              </button>
                            ) : isOrderFinished(s) ? (
                              <span className="text-xs font-bold bg-green-50 text-ebay-green px-3 py-2 rounded-full">
                                Delivered
                              </span>
                            ) : (
                              <button
                                onClick={async () => {
                                  await fetch("/api/shipments", {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      shpmt_id: s.shpmt_id,
                                      seller_user_id: Number(userId),
                                      status: "Delivered",
                                    }),
                                  });
                                  await refreshOrdersAndSales();
                                }}
                                className="text-sm font-bold border border-ebay-green text-ebay-green px-4 py-2 rounded-full hover:bg-green-50 transition-colors"
                              >
                                Mark delivered
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restock Modal */}
        {restockModal && (
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-sm p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Restock Item</h2>
                  <p className="text-sm text-ebay-gray-400 mt-1">{restockModal.listg_title}</p>
                </div>
                <button onClick={() => setRestockModal(null)} className="text-ebay-gray-400 hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="mb-6">
                <label className="text-sm font-bold text-foreground block mb-2">New quantity</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base font-bold outline-none focus:border-ebay-blue bg-background"
                />
                <p className="text-xs text-ebay-gray-400 mt-2">The listing will be reactivated and visible in search.</p>
              </div>
              <button
                onClick={async () => {
                  const qty = parseInt(restockQty, 10);
                  if (!qty || qty <= 0) return;
                  await fetch(`/api/listings/${restockModal.listg_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ quantity: qty }),
                  });
                  setRestockModal(null);
                  const [l] = await Promise.all([fetch(`/api/listings/user/${userId}`).then((r) => r.json())]);
                  setMyListings(l.data ?? []);
                }}
                disabled={!parseInt(restockQty, 10) || parseInt(restockQty, 10) <= 0}
                className="w-full bg-ebay-green hover:bg-green-600 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button"
              >
                Restock & Reactivate
              </button>
            </div>
          </div>
        )}

        {/* Shipment Modal */}
        {shipModal && (
          <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-[24px] shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Create Shipment</h2>
                  <p className="text-sm text-ebay-gray-400 mt-1">Order #{shipModal.order_id}</p>
                </div>
                <button onClick={() => setShipModal(null)} className="text-ebay-gray-400 hover:text-foreground">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Courier</label>
                  <input value={shipCourrier} onChange={(e) => setShipCourrier(e.target.value)} placeholder="e.g. FedEx, DHL, UPS" className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue bg-background" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Tracking Number</label>
                  <input value={shipTracking} onChange={(e) => setShipTracking(e.target.value)} placeholder="e.g. 1Z999AA10123456784" className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue bg-background" />
                </div>
                <div>
                  <label className="text-sm font-bold text-foreground block mb-2">Expected Delivery Date</label>
                  <input type="date" value={shipExpectDate} onChange={(e) => setShipExpectDate(e.target.value)} className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue bg-background" />
                </div>
                <div className="pt-4">
                  <button onClick={async () => {
                    if (!shipCourrier || !shipTracking || !shipExpectDate) return;
                    const today = new Date().toISOString().split("T")[0];
                    await fetch("/api/shipments", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        order_id: shipModal.order_id,
                        courier_name: shipCourrier,
                        trackingno: shipTracking,
                        shipdate: today,
                        expectdate: shipExpectDate,
                        status: "Shipped",
                      }),
                    });
                    setShipModal(null);
                    setShipCourrier("");
                    setShipTracking("");
                    setShipExpectDate("");
                    await refreshOrdersAndSales();
                  }} disabled={!shipCourrier || !shipTracking || !shipExpectDate} className="w-full bg-ebay-blue hover:bg-ebay-blue-hover text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 evo-button">
                    Create Shipment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Offers Tab */}
        {tab === "offers" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Offers Received (as seller) */}
            {offersReceived.length > 0 && (
              <div className="mb-10">
                <h2 className="text-xl font-bold text-foreground mb-4">Offers Received</h2>
                <div className="grid grid-cols-1 gap-4">
                  {offersReceived.map((o) => (
                    <div key={o.bstof_id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${o.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline line-clamp-1">
                          {o.listg_title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xl font-bold text-foreground">${Number(o.bstof_amount).toFixed(2)}</span>
                          <span className="text-sm text-ebay-gray-400">by <span className="font-medium text-foreground">{o.fname} {o.lname}</span></span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${o.bstof_status === "Pending" ? "bg-yellow-50 text-yellow-700" : o.bstof_status === "Accepted" ? "bg-green-50 text-ebay-green" : "bg-ebay-gray-100 text-ebay-gray-400"}`}>
                            {o.bstof_status}
                          </span>
                        </div>
                        <p className="text-xs text-ebay-gray-400 mt-2">
                          {new Date(o.bstof_date).toLocaleDateString()}
                        </p>
                      </div>
                      {o.bstof_status === "Pending" && (
                        <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0 flex-shrink-0">
                          <button onClick={() => updateOfferStatus(o.bstof_id, "Accepted")} className="flex-1 sm:flex-none text-sm font-bold bg-foreground text-white px-5 py-2.5 rounded-full hover:bg-black transition-colors">Accept</button>
                          <button onClick={() => updateOfferStatus(o.bstof_id, "Rejected")} className="flex-1 sm:flex-none text-sm font-bold border border-ebay-red text-ebay-red px-5 py-2.5 rounded-full hover:bg-red-50 transition-colors">Reject</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Offers (as buyer) */}
            {myOffers.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-foreground mb-4">Sent Offers</h2>
                <div className="grid grid-cols-1 gap-4">
                  {myOffers.map((o) => (
                    <div key={o.bstof_id} className="p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${o.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline line-clamp-1">
                          {o.listg_title}
                        </Link>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xl font-bold text-foreground">${Number(o.bstof_amount).toFixed(2)}</span>
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${o.bstof_status === "Pending" ? "bg-yellow-50 text-yellow-700" : o.bstof_status === "Accepted" ? "bg-green-50 text-ebay-green" : "bg-ebay-gray-100 text-ebay-gray-400"}`}>
                            {o.bstof_status}
                          </span>
                        </div>
                        <p className="text-xs text-ebay-gray-400 mt-2">
                          {new Date(o.bstof_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {offersReceived.length === 0 && myOffers.length === 0 && (
              <div className="text-center py-20 bg-ebay-gray-50/50 rounded-[24px] border border-ebay-gray-100">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-ebay-gray-300" />
                <p className="text-xl font-bold text-foreground">No offers yet</p>
                <p className="text-ebay-gray-400 mt-2">Offers you send or receive will appear here.</p>
              </div>
            )}
          </div>
        )}

        {/* Watchlist Tab */}
        {tab === "watchlist" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {watchlist.length === 0 ? (
              <div className="text-center py-20 bg-ebay-gray-50/50 rounded-[24px] border border-ebay-gray-100">
                <Heart className="w-16 h-16 mx-auto mb-4 text-ebay-gray-300" />
                <p className="text-xl font-bold text-foreground">Your watchlist is empty</p>
                <p className="text-ebay-gray-400 mt-2 mb-6">Keep track of items you love.</p>
                <Link href="/" className="bg-foreground text-white font-bold py-3 px-8 rounded-full hover:bg-black transition-colors inline-block">Browse listings</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {watchlist.map((w) => {
                  const price = w.listg_fixedprice ?? w.listg_startprice ?? 0;
                  return (
                    <div key={w.listg_id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 bg-background border border-ebay-gray-100 rounded-2xl evo-card">
                      <div className="w-16 h-16 bg-ebay-gray-50 rounded-xl border border-ebay-gray-100 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                      <div className="flex-1 min-w-0">
                        <Link href={`/listings/${w.listg_id}`} className="text-base font-bold text-foreground hover:text-ebay-blue hover:underline line-clamp-1">
                          {w.listg_title}
                        </Link>
                        <p className="text-lg font-bold text-foreground mt-1">${Number(price).toFixed(2)}</p>
                      </div>
                      <Link href={`/listings/${w.listg_id}`} className="w-full sm:w-auto text-center text-sm font-bold border border-ebay-blue text-ebay-blue px-6 py-3 rounded-full hover:bg-ebay-blue/5 transition-colors mt-4 sm:mt-0 flex-shrink-0">
                        View item
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
