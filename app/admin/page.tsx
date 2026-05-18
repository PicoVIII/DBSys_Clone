"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";

type AdminUser = {
  user_id: number;
  fname: string;
  lname: string;
  email: string;
  phone: string;
  role: string;
  is_banned: number;
};

type AdminListing = {
  listg_id: number;
  listg_title: string;
  listg_format: string;
  listg_fixedprice: number | null;
  listg_startprice: number | null;
  listg_status: string;
  listg_quantity: number;
  listg_startdate: string;
  listg_enddate: string;
  fname: string;
  lname: string;
  prdct_name: string;
  ctgry_name: string;
};

type AdminOrder = {
  order_id: number;
  order_date: string;
  order_status: string;
  order_totalamount: number;
  buyer_fname: string;
  buyer_lname: string;
  listg_title: string;
  paymt_method: string;
  paymt_status: string;
  paymt_amount: number;
};

type ReportItem = {
  rprt_id: number;
  reporter_user_id: number;
  reported_user_id: number | null;
  listg_id: number | null;
  rprt_reason: string;
  rprt_description: string | null;
  rprt_date: string;
  rprt_status: string;
  reporter_fname: string;
  reporter_lname: string;
  reported_fname: string | null;
  reported_lname: string | null;
  listg_title: string | null;
};

type Category = {
  ctgry_id: number;
  ctgry_name: string;
  ctgry_image: string | null;
  parent_id: number | null;
  parent_name: string | null;
};

type Stats = {
  users: { total: number; banned: number; admins: number };
  listings: { total: number; active: number; sold: number };
  orders: { total: number; revenue: number };
  reports: { total: number; pending: number };
  categories: number;
};

type Tab = "dashboard" | "users" | "listings" | "orders" | "reports" | "categories";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string } | null)?.role;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [listSearch, setListSearch] = useState("");

  const [newCatName, setNewCatName] = useState("");
  const [newCatParent, setNewCatParent] = useState("");
  const [newCatImage, setNewCatImage] = useState("");
  const [newCatFile, setNewCatFile] = useState<File | null>(null);
  const [catUploading, setCatUploading] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [editCatImage, setEditCatImage] = useState("");
  const [editCatFile, setEditCatFile] = useState<File | null>(null);
  const [catError, setCatError] = useState("");
  const [catSuccess, setCatSuccess] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/admin/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && role !== "admin") router.push("/");
  }, [status, role, router]);

  useEffect(() => {
    if (role !== "admin") return;
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/listings").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([s, u, l, o, r, c]) => {
      setStats(s.data ?? null);
      setUsers(u.data ?? []);
      setListings(l.data ?? []);
      setOrders(o.data ?? []);
      setReports(r.data ?? []);
      setCategories(c.data ?? []);
      setLoading(false);
    });
  }, [role]);

  async function toggleBan(userId: number, currentlyBanned: number) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, is_banned: currentlyBanned ? 0 : 1 }),
    });
    setUsers((prev) => prev.map((u) => u.user_id === userId ? { ...u, is_banned: currentlyBanned ? 0 : 1 } : u));
  }

  async function updateListingStatus(listgId: number, status: string) {
    await fetch("/api/admin/listings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listg_id: listgId, listg_status: status }),
    });
    setListings((prev) => prev.map((l) => l.listg_id === listgId ? { ...l, listg_status: status } : l));
  }

  async function updateReportStatus(rprtId: number, status: string) {
    await fetch("/api/admin/reports", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rprt_id: rprtId, rprt_status: status }),
    });
    setReports((prev) => prev.map((r) => r.rprt_id === rprtId ? { ...r, rprt_status: status } : r));
  }

  async function uploadImage(file: File): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? null;
  }

  async function addCategory() {
    if (!newCatName) return;
    setCatUploading(true);
    setCatError("");
    setCatSuccess("");
    let imageUrl = newCatImage || null;
    if (newCatFile) {
      imageUrl = await uploadImage(newCatFile);
    }
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newCatName,
        parent_id: newCatParent ? Number(newCatParent) : null,
        image: imageUrl,
      }),
    });
    setCatUploading(false);
    if (res.ok) {
      const data = await res.json();
      setCategories((prev) => [...prev, {
        ctgry_id: data.id,
        ctgry_name: newCatName,
        ctgry_image: imageUrl,
        parent_id: newCatParent ? Number(newCatParent) : null,
        parent_name: newCatParent ? categories.find((c) => c.ctgry_id === Number(newCatParent))?.ctgry_name ?? null : null,
      }]);
      setNewCatName("");
      setNewCatParent("");
      setNewCatImage("");
      setNewCatFile(null);
      setCatSuccess("Category added successfully!");
      setTimeout(() => setCatSuccess(""), 3000);
    } else {
      const errData = await res.json();
      setCatError(errData.error ?? "Failed to add category");
    }
  }

  async function updateCategoryImage(ctgryId: number) {
    setCatUploading(true);
    setCatError("");
    let imageUrl = editCatImage || null;
    if (editCatFile) {
      imageUrl = await uploadImage(editCatFile);
    }
    const res = await fetch("/api/categories", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ctgry_id: ctgryId, image: imageUrl }),
    });
    setCatUploading(false);
    if (res.ok) {
      setCategories((prev) =>
        prev.map((c) => (c.ctgry_id === ctgryId ? { ...c, ctgry_image: imageUrl } : c))
      );
      setEditingCatId(null);
      setEditCatImage("");
      setEditCatFile(null);
    } else {
      const errData = await res.json();
      setCatError(errData.error ?? "Failed to update category image");
    }
  }

  async function deleteCategory(ctgryId: number) {
    if (!confirm("Delete this category? Subcategories will be unlinked.")) return;
    setCatError("");
    const res = await fetch(`/api/categories?ctgry_id=${ctgryId}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.ctgry_id !== ctgryId));
    } else {
      const errData = await res.json();
      setCatError(errData.error ?? "Failed to delete category");
    }
  }

  const filteredUsers = users.filter((u) =>
    !search || u.fname.toLowerCase().includes(search.toLowerCase()) ||
    u.lname.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredListings = listings.filter((l) =>
    !listSearch || l.listg_title.toLowerCase().includes(listSearch.toLowerCase()) ||
    l.fname.toLowerCase().includes(listSearch.toLowerCase()) ||
    l.lname.toLowerCase().includes(listSearch.toLowerCase())
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "dashboard", label: "Dashboard" },
    { key: "users", label: "Users" },
    { key: "listings", label: "Listings" },
    { key: "orders", label: "Orders" },
    { key: "reports", label: "Reports" },
    { key: "categories", label: "Categories" },
  ];

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <Navbar />
        <div className="max-w-[1440px] mx-auto px-5 py-10 text-center text-ebay-gray-400 font-medium">Loading admin panel…</div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-8">
        <h1 className="text-[28px] font-bold text-foreground mb-6">Admin Panel</h1>

        {/* Tabs */}
        <div className="flex border-b border-ebay-gray-100 mb-8 overflow-x-auto no-scrollbar">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-5 py-3 text-sm font-bold border-b-[3px] transition-colors whitespace-nowrap ${
                tab === key
                  ? "border-foreground text-foreground"
                  : "border-transparent text-ebay-gray-400 hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ─── DASHBOARD TAB ─── */}
        {tab === "dashboard" && stats && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <DashboardCard label="Total Users" value={stats.users.total} sub={`${stats.users.banned} banned`} color="bg-blue-500" />
              <DashboardCard label="Total Listings" value={stats.listings.total} sub={`${stats.listings.active} active, ${stats.listings.sold} sold`} color="bg-green-500" />
              <DashboardCard label="Orders" value={stats.orders.total} sub={`Revenue $${stats.orders.revenue.toFixed(2)}`} color="bg-purple-500" />
              <DashboardCard label="Reports" value={stats.reports.total} sub={`${stats.reports.pending} pending`} color={stats.reports.pending > 0 ? "bg-red-500" : "bg-amber-500"} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DashboardCard label="Categories" value={stats.categories} color="bg-indigo-500" />
              <DashboardCard label="Admin Users" value={stats.users.admins} color="bg-gray-500" />
            </div>
          </div>
        )}

        {/* ─── USERS TAB ─── */}
        {tab === "users" && (
          <div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users by name or email…"
              className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue mb-6 bg-background shadow-soft"
            />
            <div className="border border-ebay-gray-100 rounded-[20px] overflow-hidden bg-background shadow-soft">
              <table className="w-full text-sm">
                <thead className="bg-ebay-gray-50/50 border-b border-ebay-gray-100">
                  <tr>
                    <th className="text-left px-5 py-4 font-bold text-foreground">ID</th>
                    <th className="text-left px-5 py-4 font-bold text-foreground">Name</th>
                    <th className="text-left px-5 py-4 font-bold text-foreground">Email</th>
                    <th className="text-left px-5 py-4 font-bold text-foreground">Role</th>
                    <th className="text-left px-5 py-4 font-bold text-foreground">Status</th>
                    <th className="text-right px-5 py-4 font-bold text-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ebay-gray-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.user_id} className="hover:bg-ebay-gray-50/30 transition-colors">
                      <td className="px-5 py-4 text-ebay-gray-400 font-medium">{u.user_id}</td>
                      <td className="px-5 py-4 font-bold text-foreground">{u.fname} {u.lname}</td>
                      <td className="px-5 py-4 text-foreground">{u.email}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-ebay-gray-50 text-ebay-gray-400 border border-ebay-gray-200"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${u.is_banned ? "bg-[#fef2f3] text-ebay-red border border-ebay-red/20" : "bg-[#e5f5e8] text-ebay-green border border-ebay-green/20"}`}>
                          {u.is_banned ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {u.role !== "admin" && (
                            <button
                              onClick={() => toggleBan(u.user_id, u.is_banned)}
                              className={`text-xs font-bold px-4 py-2 rounded-full border transition-colors ${
                                u.is_banned
                                  ? "border-ebay-green text-ebay-green hover:bg-[#e5f5e8]"
                                  : "border-ebay-red text-ebay-red hover:bg-[#fef2f3]"
                              }`}
                            >
                              {u.is_banned ? "Unban" : "Ban"}
                            </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── LISTINGS TAB ─── */}
        {tab === "listings" && (
          <div>
            <input
              value={listSearch}
              onChange={(e) => setListSearch(e.target.value)}
              placeholder="Search listings by title or seller…"
              className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3 text-base outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue mb-6 bg-background shadow-soft"
            />
            {filteredListings.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-ebay-gray-200 rounded-[20px] bg-ebay-gray-50/30">
                <p className="text-5xl mb-4 opacity-50">📦</p>
                <p className="text-lg font-bold text-foreground">No listings</p>
              </div>
            ) : (
              <div className="border border-ebay-gray-100 rounded-[20px] overflow-hidden bg-background shadow-soft">
                <table className="w-full text-sm">
                  <thead className="bg-ebay-gray-50/50 border-b border-ebay-gray-100">
                    <tr>
                      <th className="text-left px-5 py-4 font-bold text-foreground">ID</th>
                      <th className="text-left px-5 py-4 font-bold text-foreground">Title</th>
                      <th className="text-left px-5 py-4 font-bold text-foreground">Seller</th>
                      <th className="text-left px-5 py-4 font-bold text-foreground">Price</th>
                      <th className="text-left px-5 py-4 font-bold text-foreground">Status</th>
                      <th className="text-right px-5 py-4 font-bold text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ebay-gray-100">
                    {filteredListings.map((l) => (
                      <tr key={l.listg_id} className="hover:bg-ebay-gray-50/30 transition-colors">
                        <td className="px-5 py-4 text-ebay-gray-400 font-medium">{l.listg_id}</td>
                        <td className="px-5 py-4 max-w-[200px]">
                          <Link href={`/listings/${l.listg_id}`} className="font-bold text-foreground hover:text-ebay-blue hover:underline line-clamp-1">
                            {l.listg_title}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-foreground">{l.fname} {l.lname}</td>
                        <td className="px-5 py-4 font-bold text-foreground">
                          ${Number(l.listg_fixedprice ?? l.listg_startprice ?? 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            l.listg_status === "active" ? "bg-[#e5f5e8] text-ebay-green border border-ebay-green/20" :
                            l.listg_status === "sold" ? "bg-blue-100 text-blue-700" :
                            "bg-ebay-gray-50 text-ebay-gray-400 border border-ebay-gray-200"
                          }`}>
                            {l.listg_status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {l.listg_status === "active" && (
                            <button
                              onClick={() => updateListingStatus(l.listg_id, "Ended")}
                              className="text-xs font-bold px-4 py-2 rounded-full border border-ebay-red text-ebay-red hover:bg-[#fef2f3] transition-colors"
                            >
                              End listing
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {tab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <p className="text-4xl mb-3">🧾</p>
                <p className="text-lg font-medium">No orders yet</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Order ID</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Buyer</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Item</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Total</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Payment</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((o) => (
                      <tr key={o.order_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">#{o.order_id}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{o.buyer_fname} {o.buyer_lname}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-48 truncate">{o.listg_title}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">${Number(o.order_totalamount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-600">{o.paymt_method}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            o.order_status === "Completed" ? "bg-green-100 text-green-700" :
                            o.order_status === "Cancelled" || o.order_status === "Returned" ? "bg-red-100 text-red-700" :
                            o.paymt_status === "Paid" ? "bg-blue-100 text-blue-700" :
                            "bg-yellow-100 text-yellow-700"
                          }`}>
                            {o.order_status === "Completed" ? "Completed" : o.paymt_status === "Paid" ? "Paid" : o.order_status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(o.order_date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── REPORTS TAB ─── */}
        {tab === "reports" && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-ebay-gray-200 rounded-[20px] bg-ebay-gray-50/30">
                <p className="text-5xl mb-4 opacity-50">🚩</p>
                <p className="text-lg font-bold text-foreground">No reports yet</p>
              </div>
            ) : (
              reports.map((r) => (
                <div key={r.rprt_id} className="border border-ebay-gray-100 rounded-[20px] p-6 bg-background shadow-soft evo-card">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-bold text-foreground mb-1">
                        Report #{r.rprt_id} — {r.rprt_reason}
                      </p>
                      <p className="text-sm text-ebay-gray-400 font-medium">
                        Reported by {r.reporter_fname} {r.reporter_lname}
                        {r.reported_fname && <> against {r.reported_fname} {r.reported_lname}</>}
                        {r.listg_title && <> on listing: <span className="font-bold text-foreground">{r.listg_title}</span></>}
                      </p>
                      {r.rprt_description && (
                        <p className="text-sm text-foreground mt-3 bg-ebay-gray-50/50 p-3 rounded-xl border border-ebay-gray-100">{r.rprt_description}</p>
                      )}
                      <p className="text-xs text-ebay-gray-300 mt-2 font-medium">{new Date(r.rprt_date).toLocaleDateString()}</p>
                    </div>
                    <div className="md:text-right flex-shrink-0">
                      <span className={`text-xs px-3 py-1.5 rounded-full font-bold inline-block border ${
                        r.rprt_status === "Pending" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                        r.rprt_status === "Resolved" ? "bg-[#e5f5e8] text-ebay-green border-ebay-green/20" :
                        "bg-ebay-gray-50 text-ebay-gray-400 border-ebay-gray-200"
                      }`}>
                        {r.rprt_status}
                      </span>
                      {r.rprt_status === "Pending" && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => updateReportStatus(r.rprt_id, "Resolved")} className="text-xs font-bold bg-ebay-green hover:bg-green-700 text-white px-4 py-2 rounded-full transition-colors shadow-sm">Resolve</button>
                          <button onClick={() => updateReportStatus(r.rprt_id, "Dismissed")} className="text-xs font-bold border border-ebay-gray-200 text-foreground px-4 py-2 rounded-full hover:bg-ebay-gray-50 transition-colors">Dismiss</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── CATEGORIES TAB ─── */}
        {tab === "categories" && (
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-4">Existing Categories</h2>
              {categories.length === 0 ? (
                <p className="text-sm text-ebay-gray-400 font-medium">No categories yet.</p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {categories.map((c) => (
                    <div key={c.ctgry_id} className="border border-ebay-gray-100 rounded-[20px] p-4 bg-background shadow-soft">
                      <div className="flex flex-col items-center gap-2 p-3 rounded-xl border border-ebay-gray-100 bg-ebay-gray-50/30 mb-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-ebay-gray-100 flex items-center justify-center">
                          {c.ctgry_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={c.ctgry_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl text-ebay-gray-300">📦</span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-foreground text-center">{c.ctgry_name}</span>
                        {c.parent_name && <span className="text-xs text-ebay-gray-400">Subcategory of {c.parent_name}</span>}
                      </div>
                      {editingCatId === c.ctgry_id ? (
                        <div className="space-y-2 text-sm">
                          <input type="file" accept="image/*" onChange={(e) => setEditCatFile(e.target.files?.[0] ?? null)} className="w-full text-xs" />
                          <input value={editCatImage} onChange={(e) => setEditCatImage(e.target.value)} placeholder="Or image URL" className="w-full border border-ebay-gray-300 rounded-lg px-3 py-2 text-xs" />
                          <div className="flex gap-2">
                            <button onClick={() => updateCategoryImage(c.ctgry_id)} disabled={catUploading} className="flex-1 bg-ebay-blue text-white text-xs font-bold py-2 rounded-full disabled:opacity-50">{catUploading ? "Saving…" : "Save"}</button>
                            <button onClick={() => { setEditingCatId(null); setEditCatFile(null); setEditCatImage(""); }} className="flex-1 border text-xs py-2 rounded-full">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingCatId(c.ctgry_id); setEditCatImage(c.ctgry_image ?? ""); setEditCatFile(null); }} className="flex-1 text-xs font-bold border border-ebay-gray-200 py-2 rounded-full hover:bg-ebay-gray-50">Change image</button>
                          <button onClick={() => deleteCategory(c.ctgry_id)} className="text-xs font-bold text-ebay-red px-3 py-2 hover:underline">Delete</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="border border-ebay-gray-100 rounded-[20px] p-6 bg-background shadow-soft sticky top-4">
                <h2 className="text-xl font-bold text-foreground mb-4">Add Category</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <input
                      id="catname"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder=" "
                      className="peer w-full border border-ebay-gray-300 rounded-xl px-4 pt-6 pb-2 text-sm outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background transition-colors placeholder-transparent"
                    />
                    <label htmlFor="catname" className="absolute left-4 top-4 text-ebay-gray-400 text-sm transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-4 peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-ebay-blue peer-focus:font-medium peer-valid:top-1.5 peer-valid:text-xs">
                      Category Name
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      value={newCatParent}
                      onChange={(e) => setNewCatParent(e.target.value)}
                      className="w-full border border-ebay-gray-300 rounded-xl px-4 py-3.5 text-sm outline-none focus:border-ebay-blue focus:ring-1 focus:ring-ebay-blue bg-background appearance-none"
                    >
                      <option value="">Top-level category (None)</option>
                      {categories.filter((c) => !c.parent_id).map((c) => (
                        <option key={c.ctgry_id} value={c.ctgry_id}>{c.ctgry_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-ebay-gray-400 mb-1.5 uppercase tracking-wide">Category image</label>
                    <input type="file" accept="image/*" onChange={(e) => setNewCatFile(e.target.files?.[0] ?? null)} className="w-full text-sm mb-2" />
                    <input value={newCatImage} onChange={(e) => setNewCatImage(e.target.value)} placeholder="Or paste image URL" className="w-full border border-ebay-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-ebay-blue" />
                    {(newCatImage || newCatFile) && (
                      <div className="mt-3 flex justify-center p-3 border border-ebay-gray-100 rounded-xl bg-ebay-gray-50/50">
                        <div className="w-14 h-14 rounded-lg overflow-hidden border border-ebay-gray-100 bg-white flex items-center justify-center">
                          {newCatFile ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={URL.createObjectURL(newCatFile)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={newCatImage} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {catError && <p className="text-xs text-ebay-red font-medium bg-red-50 p-3 rounded-xl border border-red-200">{catError}</p>}
                  {catSuccess && <p className="text-xs text-ebay-green font-medium bg-green-50 p-3 rounded-xl border border-green-200">{catSuccess}</p>}
                  <button
                    onClick={addCategory}
                    disabled={!newCatName || catUploading}
                    className="w-full bg-foreground hover:bg-black text-white text-sm font-bold py-3.5 rounded-full transition-colors disabled:opacity-50 evo-button"
                  >
                    {catUploading ? "Adding…" : "Add Category"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DashboardCard({ label, value, sub, color }: { label: string; value: number; sub?: string; color: string }) {
  return (
    <div className="border border-ebay-gray-100 rounded-[20px] p-6 bg-background shadow-soft evo-card">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <p className="text-sm font-bold text-ebay-gray-400">{label}</p>
      </div>
      <p className="text-4xl font-bold text-foreground tracking-tight">{value}</p>
      {sub && <p className="text-xs font-bold text-ebay-gray-300 mt-2">{sub}</p>}
    </div>
  );
}
