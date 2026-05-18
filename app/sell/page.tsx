"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import { ImagePlus, Trash2, ChevronUp, ChevronDown, Link } from "lucide-react";

type Category = { ctgry_id: number; ctgry_name: string };

type Step = "product" | "listing" | "done";

export default function SellPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;
  const role = (session?.user as { role?: string } | null)?.role;

  const [step, setStep] = useState<Step>("product");
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Step 1 – Product
  const [pName, setPName] = useState("");
  const [pBrand, setPBrand] = useState("");
  const [pCond, setPCond] = useState("New");
  const [pDesc, setPDesc] = useState("");
  const [productId, setProductId] = useState<number | null>(null);

  type ImageItem = { id: string; file?: File; url: string; sortorder: number };
  const [images, setImages] = useState<ImageItem[]>([]);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const addImageFile = useCallback((file: File) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const preview = URL.createObjectURL(file);
    setImages((prev) => [...prev, { id, file, url: preview, sortorder: prev.length }]);
  }, []);

  const addImageUrl = useCallback((url: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setImages((prev) => [...prev, { id, url, sortorder: prev.length }]);
    setUrlInput("");
    setShowUrlInput(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img?.file) URL.revokeObjectURL(img.url);
      const filtered = prev.filter((i) => i.id !== id);
      return filtered.map((i, idx) => ({ ...i, sortorder: idx }));
    });
  }, []);

  const moveImage = useCallback((id: string, dir: -1 | 1) => {
    setImages((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      if (idx === -1) return prev;
      const to = idx + dir;
      if (to < 0 || to >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return arr.map((i, idx) => ({ ...i, sortorder: idx }));
    });
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    files.forEach(addImageFile);
    if (e.target) e.target.value = "";
  }, [addImageFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    files.forEach(addImageFile);
  }, [addImageFile]);

  // Step 2 – Listing
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [format, setFormat] = useState("fixed");
  const [fixedPrice, setFixedPrice] = useState("");
  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [bestOffer, setBestOffer] = useState("No");
  const [quantity, setQuantity] = useState("1");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [listingId, setListingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => {
        setCategories(d.data ?? []);
        if (d.data?.[0]) setCategoryId(String(d.data[0].ctgry_id));
      });
    return () => { imagesRef.current.forEach((img) => { if (img.file) URL.revokeObjectURL(img.url); }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!pName || !pCond) return;
    setBusy(true); setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: Number(userId), name: pName, brand: pBrand || undefined, condition: pCond, description: pDesc || undefined }),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setProductId(data.id);
      setTitle(pName);
      setStep("listing");
    } else {
      setError(data.error ?? "Failed to create product");
    }
  }

  async function createListing(e: React.FormEvent) {
    e.preventDefault();
    if (!productId || !categoryId || !title || !format || !quantity || !startDate || !endDate) return;
    if (format === "fixed" && !fixedPrice) { setError("Fixed price is required"); return; }
    if (format === "auction" && !startPrice) { setError("Starting price is required"); return; }
    setBusy(true); setError("");
    const body = {
      prdct_id: productId,
      user_id: Number(userId),
      ctgry_id: Number(categoryId),
      title,
      format,
      fixedprice: format === "fixed" ? Number(fixedPrice) : undefined,
      startprice: format === "auction" ? Number(startPrice) : undefined,
      reserveprice: reservePrice ? Number(reservePrice) : undefined,
      bestoffer: bestOffer,
      quantity: Number(quantity),
      startdate: startDate,
      enddate: endDate,
    };
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setBusy(false);
    if (res.ok) {
      setListingId(data.id);
      if (images.length > 0) {
        setUploading(true);
        for (const img of images) {
          let finalUrl = img.url;
          if (img.file) {
            const fd = new FormData();
            fd.append("file", img.file);
            const upRes = await fetch("/api/upload", { method: "POST", body: fd });
            if (upRes.ok) {
              const upData = await upRes.json();
              finalUrl = upData.url;
            } else {
              continue;
            }
          }
          await fetch("/api/listing-images", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listg_id: data.id, image_url: finalUrl, sortorder: img.sortorder }),
          });
        }
        setUploading(false);
      }
      setStep("done");
    } else {
      setError(data.error ?? "Failed to create listing");
    }
  }

  if (role === "admin") {
    return (
      <>
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-5xl mb-4">🚫</p>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Admins cannot sell</h1>
          <p className="text-sm text-gray-500">The admin account is for managing the platform only.</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Create a listing</h1>

        {/* Step indicator */}
        <div className="flex items-center gap-3 mb-8">
          {(["product", "listing", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${step === s ? "bg-[#0064D2] text-white" : i < ["product", "listing", "done"].indexOf(step) ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                {i < ["product", "listing", "done"].indexOf(step) ? "✓" : i + 1}
              </div>
              <span className={`text-sm ${step === s ? "font-semibold text-gray-800" : "text-gray-400"}`}>
                {s === "product" ? "Item details" : s === "listing" ? "Listing info" : "Done"}
              </span>
              {i < 2 && <div className="w-10 h-px bg-gray-300" />}
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        {/* Step 1: Product */}
        {step === "product" && (
          <form onSubmit={createProduct} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Item name *</label>
              <input value={pName} onChange={(e) => setPName(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" placeholder="e.g. Apple iPhone 14 Pro Max" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
              <input value={pBrand} onChange={(e) => setPBrand(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" placeholder="e.g. Apple" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Condition *</label>
              <select value={pCond} onChange={(e) => setPCond(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]">
                {["New", "Like New", "Good", "Used", "For Parts or Not Working", "Refurbished"].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
              <textarea value={pDesc} onChange={(e) => setPDesc(e.target.value)} rows={4} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2] resize-none" placeholder="Describe your item's condition, features, included accessories…" />
            </div>
            <button type="submit" disabled={busy} className="w-full bg-[#0064D2] hover:bg-[#0053B3] text-white font-bold py-3.5 rounded-full text-sm transition disabled:opacity-50">
              {busy ? "Saving…" : "Continue to listing details →"}
            </button>
          </form>
        )}

        {/* Step 2: Listing */}
        {step === "listing" && (
          <form onSubmit={createListing} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Listing title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]">
                {categories.map((c) => <option key={c.ctgry_id} value={c.ctgry_id}>{c.ctgry_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Images (optional — add up to 12)</label>

              <div
                ref={dropRef}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition cursor-pointer ${dragOver ? "border-[#0064D2] bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="w-10 h-10 mx-auto text-gray-400" />
                <p className="text-sm text-gray-600 mt-2 font-medium">Click to upload or drag & drop</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP</p>
                <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>

              <div className="flex items-center gap-2 mt-2">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-[#0064D2] hover:underline font-medium">Browse files</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setShowUrlInput((v) => !v)} className="text-sm text-[#0064D2] hover:underline font-medium flex items-center gap-1">
                  <Link className="w-3.5 h-3.5" /> Add from URL
                </button>
              </div>

              {showUrlInput && (
                <div className="flex gap-2 mt-2">
                  <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://example.com/image.jpg" className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0064D2]" />
                  <button type="button" onClick={() => { if (urlInput) addImageUrl(urlInput); }} disabled={!urlInput} className="bg-[#0064D2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0053B3] disabled:opacity-50">Add</button>
                </div>
              )}

              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-3">
                  {images.map((img, i) => (
                    <div key={img.id} className="relative aspect-square border border-gray-200 rounded-lg overflow-hidden bg-gray-50 group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(img.id, -1); }} disabled={i === 0} className="p-1 bg-white/90 rounded hover:bg-white disabled:opacity-30">
                          <ChevronUp className="w-4 h-4 text-gray-700" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); moveImage(img.id, 1); }} disabled={i === images.length - 1} className="p-1 bg-white/90 rounded hover:bg-white disabled:opacity-30">
                          <ChevronDown className="w-4 h-4 text-gray-700" />
                        </button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); removeImage(img.id); }} className="p-1 bg-red-500 rounded hover:bg-red-600">
                          <Trash2 className="w-4 h-4 text-white" />
                        </button>
                      </div>
                      <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">{i + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Format *</label>
              <div className="flex gap-3">
                {["fixed", "auction"].map((f) => (
                  <label key={f} className={`flex-1 border-2 rounded-lg p-3 cursor-pointer text-center text-sm transition ${format === f ? "border-[#0064D2] bg-blue-50 text-[#0064D2] font-semibold" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} className="sr-only" />
                    {f === "fixed" ? "Buy It Now" : "Auction"}
                  </label>
                ))}
              </div>
            </div>
            {format === "fixed" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($) *</label>
                <input type="number" step="0.01" min="0.01" value={fixedPrice} onChange={(e) => setFixedPrice(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" placeholder="0.00" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Starting price ($) *</label>
                  <input type="number" step="0.01" min="0.01" value={startPrice} onChange={(e) => setStartPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Reserve price ($)</label>
                  <input type="number" step="0.01" min="0.01" value={reservePrice} onChange={(e) => setReservePrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" placeholder="Optional" />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Quantity *</label>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Best Offer</label>
                <select value={bestOffer} onChange={(e) => setBestOffer(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Start date *</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">End date *</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#0064D2]" />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("product")} className="flex-1 border border-gray-300 text-gray-700 font-medium py-3 rounded-full text-sm hover:bg-gray-50 transition">
                ← Back
              </button>
              <button type="submit" disabled={busy} className="flex-1 bg-[#0064D2] hover:bg-[#0053B3] text-white font-bold py-3 rounded-full text-sm transition disabled:opacity-50">
                {busy ? "Listing…" : "List item"}
              </button>
            </div>
          </form>
        )}

        {/* Done */}
        {step === "done" && (
          <div className="text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your item is listed!</h2>
            <p className="text-gray-500 text-sm mb-6">Listing ID: #{listingId}</p>
            <div className="flex gap-3 justify-center">
              <a href={`/listings/${listingId}`} className="border border-[#0064D2] text-[#0064D2] px-6 py-2.5 rounded-full text-sm hover:bg-blue-50 transition">
                View listing
              </a>
              <button onClick={() => { images.forEach((img) => { if (img.file) URL.revokeObjectURL(img.url); }); setStep("product"); setPName(""); setPBrand(""); setPDesc(""); setImages([]); setProductId(null); setTitle(""); setFixedPrice(""); setStartPrice(""); setReservePrice(""); setError(""); }} className="bg-[#0064D2] text-white px-6 py-2.5 rounded-full text-sm hover:bg-[#0053B3] transition">
                List another item
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
