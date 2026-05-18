"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";

type Address = {
  baddr_id: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
};

export default function AddressesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newAddr, setNewAddr] = useState({ street: "", city: "", country: "", pcode: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/addresses?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        setAddresses(d.data ?? []);
        setLoading(false);
      });
  }, [userId]);

  async function addAddress() {
    if (!newAddr.street || !newAddr.city || !newAddr.country || !newAddr.pcode) return;
    setMsg("");
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), ...newAddr }),
    });
    const data = await res.json();
    if (res.ok) {
      const a: Address = {
        baddr_id: data.id,
        baddr_street: newAddr.street,
        baddr_city: newAddr.city,
        baddr_country: newAddr.country,
        baddr_pcode: newAddr.pcode,
      };
      setAddresses((prev) => [a, ...prev]);
      setNewAddr({ street: "", city: "", country: "", pcode: "" });
      setShowForm(false);
      setMsg("Address added!");
    } else {
      setMsg(data.error ?? "Failed to add address");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10 text-center text-gray-500">Loading addresses…</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
          <Link href="/" className="hover:underline text-blue-600">Home</Link>
          <span>/</span>
          <Link href="/my-ebay" className="hover:underline text-blue-600">My eBay</Link>
          <span>/</span>
          <span className="text-gray-700">Addresses</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Addresses</h1>
          <button onClick={() => setShowForm((v) => !v)} className="bg-[#0064D2] hover:bg-[#0053B3] text-white text-sm font-bold px-5 py-2.5 rounded-full transition">
            + Add address
          </button>
        </div>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm border ${msg === "Address added!" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
            {msg}
          </div>
        )}

        {showForm && (
          <div className="border border-gray-200 rounded-lg p-5 bg-white mb-6">
            <h2 className="font-bold text-gray-800 mb-3">New Address</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input value={newAddr.street} onChange={(e) => setNewAddr((p) => ({ ...p, street: e.target.value }))} placeholder="Street address" className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <input value={newAddr.city} onChange={(e) => setNewAddr((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <input value={newAddr.country} onChange={(e) => setNewAddr((p) => ({ ...p, country: e.target.value }))} placeholder="Country" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
              <input value={newAddr.pcode} onChange={(e) => setNewAddr((p) => ({ ...p, pcode: e.target.value }))} placeholder="Postal code" className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-sm py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={addAddress} disabled={!newAddr.street || !newAddr.city || !newAddr.country || !newAddr.pcode} className="flex-1 bg-[#0064D2] hover:bg-[#0053B3] text-white text-sm font-bold py-2 rounded-lg disabled:opacity-50">
                Save
              </button>
            </div>
          </div>
        )}

        {addresses.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-lg font-medium">No addresses saved</p>
            <p className="text-sm mt-1">Add an address to use during checkout.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div key={a.baddr_id} className="border border-gray-200 rounded-lg p-5 bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 flex-shrink-0">📍</div>
                  <div>
                    <p className="font-medium text-gray-800">{a.baddr_street}</p>
                    <p className="text-sm text-gray-500">{a.baddr_city}, {a.baddr_country} {a.baddr_pcode}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
