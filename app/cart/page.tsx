"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";

type CartItem = {
  cart_id: number;
  listg_id: number;
  quantity: number;
  listg_title: string;
  listg_fixedprice: number;
  available_quantity: number;
  image_url?: string;
};

type Address = {
  baddr_id: number;
  baddr_street: string;
  baddr_city: string;
  baddr_country: string;
  baddr_pcode: string;
};

export default function CartPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;

  const [items, setItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutItem, setCheckoutItem] = useState<CartItem | null>(null);
  const [selectedAddr, setSelectedAddr] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [newAddr, setNewAddr] = useState({ street: "", city: "", country: "", pcode: "" });
  const [showNewAddr, setShowNewAddr] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch(`/api/cart?user_id=${userId}`).then((r) => r.json()),
      fetch(`/api/addresses?user_id=${userId}`).then((r) => r.json()),
    ]).then(([cart, addr]) => {
      setItems(cart.data ?? []);
      setAddresses(addr.data ?? []);
      if (addr.data?.[0]) setSelectedAddr(String(addr.data[0].baddr_id));
      setLoading(false);
    });
  }, [userId]);

  async function removeItem(listg_id: number) {
    await fetch(`/api/cart?user_id=${userId}&listg_id=${listg_id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.listg_id !== listg_id));
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
      const newA: Address = {
        baddr_id: data.id,
        baddr_street: newAddr.street,
        baddr_city: newAddr.city,
        baddr_country: newAddr.country,
        baddr_pcode: newAddr.pcode,
      };
      setAddresses((prev) => [newA, ...prev]);
      setSelectedAddr(String(data.id));
      setShowNewAddr(false);
      setNewAddr({ street: "", city: "", country: "", pcode: "" });
    }
  }

  async function placeOrder() {
    if (!checkoutItem || !selectedAddr) return;
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: Number(userId),
        baddr_id: Number(selectedAddr),
        listg_id: checkoutItem.listg_id,
        quantity: checkoutItem.quantity,
        payment_method: paymentMethod,
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setMsg("✅ Order placed successfully!");
      setItems((prev) => prev.filter((i) => i.listg_id !== checkoutItem.listg_id));
      setCheckoutItem(null);
    } else {
      setMsg(`❌ ${data.error}`);
    }
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.listg_fixedprice, 0);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-10 text-center text-gray-500">Loading cart…</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Shopping Cart</h1>

        {msg && (
          <div className={`mb-4 p-3 rounded text-sm ${msg.startsWith("✅") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
            {msg}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-5xl mb-4">🛒</p>
            <p className="text-lg font-medium">Your cart is empty</p>
          </div>
        ) : (
          <div className="flex gap-8">
            {/* Items list */}
            <div className="flex-1 space-y-3">
              {items.map((item) => (
                <div key={item.listg_id} className="border border-gray-200 rounded-lg p-4 flex gap-4 bg-white">
                  <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">{item.listg_title}</p>
                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      ${(item.quantity * item.listg_fixedprice).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setCheckoutItem(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1.5 rounded-full"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={() => removeItem(item.listg_id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="w-72 flex-shrink-0">
              <div className="border border-gray-200 rounded-lg p-5 bg-white sticky top-4">
                <h2 className="font-bold text-gray-800 mb-3">Order Summary</h2>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Items ({items.length})</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-100 my-3" />
                <div className="flex justify-between font-bold text-gray-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Checkout modal */}
        {checkoutItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
              <h2 className="text-lg font-bold mb-4">Checkout</h2>
              <p className="text-sm text-gray-600 mb-1 truncate">{checkoutItem.listg_title}</p>
              <p className="font-bold text-lg mb-4">
                ${(checkoutItem.quantity * checkoutItem.listg_fixedprice).toFixed(2)}
              </p>

              <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
              {addresses.length === 0 ? (
                <p className="text-sm text-gray-500 mb-2">No saved addresses.</p>
              ) : (
                <select
                  value={selectedAddr}
                  onChange={(e) => setSelectedAddr(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-2"
                >
                  {addresses.map((a) => (
                    <option key={a.baddr_id} value={a.baddr_id}>
                      {a.baddr_street}, {a.baddr_city}, {a.baddr_country} {a.baddr_pcode}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={() => setShowNewAddr((v) => !v)}
                className="text-xs text-blue-600 hover:underline mb-3"
              >
                {showNewAddr ? "Cancel" : "+ Add new address"}
              </button>

              {showNewAddr && (
                <div className="space-y-2 mb-3">
                  {(["street", "city", "country", "pcode"] as const).map((f) => (
                    <input
                      key={f}
                      placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                      value={newAddr[f]}
                      onChange={(e) => setNewAddr((p) => ({ ...p, [f]: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                    />
                  ))}
                  <button
                    onClick={addAddress}
                    className="w-full bg-gray-800 text-white text-sm py-1.5 rounded hover:bg-gray-700"
                  >
                    Save Address
                  </button>
                </div>
              )}

              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
              >
                {["Credit Card", "Debit Card", "PayPal", "Bank Transfer"].map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>

              {msg && (
                <p className={`text-sm mb-3 ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>{msg}</p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => { setCheckoutItem(null); setMsg(""); }}
                  className="flex-1 border border-gray-300 text-sm py-2 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={placeOrder}
                  disabled={busy || !selectedAddr}
                  className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {busy ? "Placing…" : "Place Order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
