"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import Link from "next/link";

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

type Sale = {
  order_id: number;
  order_totalamount: number;
  order_date: string;
  order_status: string;
  listg_title: string;
  listg_id: number;
  ordit_quantity: number;
  ordit_itemprice: number;
  buyer_fname: string;
  buyer_lname: string;
};

type OfferItem = {
  bstof_id: number;
  listg_id: number;
  bstof_amount: number;
  bstof_status: string;
  bstof_date: string;
  listg_title: string;
  fname: string;
  lname: string;
};

export default function SellerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [listings, setListings] = useState<Listing[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/listings/user/${userId}`).then((r) => r.json()),
      fetch(`/api/orders?seller_id=${userId}`).then((r) => r.json()),
      fetch(`/api/offers?seller_id=${userId}`).then((r) => r.json()),
    ]).then(([l, s, o]) => {
      setListings(l.data ?? []);
      setSales(s.data ?? []);
      setOffers(o.data ?? []);
      setLoading(false);
    });
  }, [userId]);

  const activeListings = listings.filter((l) => l.listg_status?.toLowerCase() === "active");
  const soldListings = listings.filter((l) => l.listg_status?.toLowerCase() === "sold");
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.order_totalamount), 0);
  const pendingOffers = offers.filter((o) => o.bstof_status === "Pending");

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-10 text-center text-gray-500">Loading dashboard…</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Seller Dashboard</h1>
          <Link href="/sell" className="bg-[#0064D2] hover:bg-[#0053B3] text-white text-sm font-bold px-5 py-2.5 rounded-full transition">
            + List an item
          </Link>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active listings", value: activeListings.length, color: "bg-blue-500" },
            { label: "Sold items", value: soldListings.length, color: "bg-green-500" },
            { label: "Total revenue", value: `$${totalRevenue.toFixed(2)}`, color: "bg-purple-500" },
            { label: "Pending offers", value: pendingOffers.length, color: "bg-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="border border-gray-200 rounded-lg p-5 bg-white">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Recent sales */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-sm">Recent Sales</h2>
              <Link href="/my-ebay" className="text-xs text-blue-600 hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {sales.length === 0 ? (
                <p className="text-sm text-gray-500 p-4">No sales yet</p>
              ) : (
                sales.slice(0, 5).map((s) => (
                  <div key={s.order_id} className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{s.listg_title}</p>
                      <p className="text-xs text-gray-500">
                        {s.buyer_fname} {s.buyer_lname} · {new Date(s.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">${Number(s.order_totalamount).toFixed(2)}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active listings */}
          <div className="border border-gray-200 rounded-lg bg-white">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-800 text-sm">Active Listings</h2>
              <Link href="/my-ebay" className="text-xs text-blue-600 hover:underline">Manage</Link>
            </div>
            <div className="divide-y divide-gray-100">
              {activeListings.length === 0 ? (
                <p className="text-sm text-gray-500 p-4">No active listings</p>
              ) : (
                activeListings.slice(0, 5).map((l) => (
                  <div key={l.listg_id} className="flex items-center gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center text-sm flex-shrink-0">📦</div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/listings/${l.listg_id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block">
                        {l.listg_title}
                      </Link>
                      <p className="text-xs text-gray-500">{l.listg_format} · Qty: {l.listg_quantity}</p>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">
                      ${Number(l.listg_fixedprice ?? l.listg_startprice ?? 0).toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending offers */}
        {pendingOffers.length > 0 && (
          <div className="mt-6 border border-gray-200 rounded-lg bg-white">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">Pending Offers ({pendingOffers.length})</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {pendingOffers.map((o) => (
                <div key={o.bstof_id} className="flex items-center gap-3 p-3">
                  <div className="flex-1 min-w-0">
                    <Link href={`/listings/${o.listg_id}`} className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate block">
                      {o.listg_title}
                    </Link>
                    <p className="text-xs text-gray-500">by {o.fname} {o.lname}</p>
                  </div>
                  <p className="font-bold text-gray-900">${Number(o.bstof_amount).toFixed(2)}</p>
                  <Link href="/my-ebay" className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700">
                    Review
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
