"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "../components/navbar";
import Link from "next/link";
import { Camera, Star, Package, MessageSquare, MapPin, ShoppingCart, Heart } from "lucide-react";

type FeedbackStats = {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  score: number;
};

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const userId = (session?.user as { id?: string } | null)?.id;
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<{
    user_id: number;
    fname: string;
    lname: string;
    phone: string;
    email: string;
    profile_picture: string | null;
  } | null>(null);
  const [feedback, setFeedback] = useState<FeedbackStats | null>(null);
  const [listingCount, setListingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [picUrl, setPicUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");

  const displayName = profile ? `${profile.fname} ${profile.lname}` : "";
  const username = profile ? `${profile.fname.toLowerCase()}${profile.lname[0]?.toLowerCase() ?? ""}` : "";
  const initials = profile ? (profile.fname[0] + profile.lname[0]).toUpperCase() : "?";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (!userId) return;
    Promise.all([
      fetch("/api/users/profile").then((r) => r.json()),
      fetch(`/api/feedback/seller/${userId}`).then((r) => r.json()),
      fetch(`/api/listings/user/${userId}`).then((r) => r.json()),
    ]).then(([prof, fb, listings]) => {
      setProfile(prof.data ?? null);
      if (prof.data) {
        setFname(prof.data.fname);
        setLname(prof.data.lname);
        setPhone(prof.data.phone);
        setPicUrl(prof.data.profile_picture || "");
      }
      setFeedback(fb.data ?? null);
      setListingCount((listings.data ?? []).length);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId]);

  async function handlePhotoUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setPicUrl(data.url);
    }
  }

  async function saveProfile() {
    setMsg("");
    const res = await fetch("/api/users/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fname, lname, phone, profile_picture: picUrl || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile((p) => p ? { ...p, fname, lname, phone, profile_picture: picUrl || null } : p);
      setEditing(false);
      setMsg("Profile updated");
      await update({ picture: picUrl || null });
    } else {
      setMsg(data.error || "Something went wrong");
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-10 text-center text-gray-500">Loading profile…</div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-10 text-center text-gray-500">Profile not found</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-[#f7f7f7] min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
            <Link href="/" className="hover:underline text-[#0064D2]">Home</Link>
            <span>/</span>
            <span className="text-gray-700">Profile</span>
          </nav>

          {/* eBay-style profile header */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4">
            <div className="h-24 bg-gradient-to-r from-[#0064D2] to-[#3d9ae8]" />
            <div className="px-6 pb-6 -mt-12">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-[120px] h-[120px] rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                    {(editing ? picUrl : profile.profile_picture) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={editing ? picUrl : profile.profile_picture!} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-[#0064D2]">{initials}</span>
                    )}
                  </div>
                  {editing && (
                    <>
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="absolute bottom-1 right-1 w-8 h-8 bg-[#0064D2] text-white rounded-full flex items-center justify-center shadow hover:bg-[#0053B3] disabled:opacity-50"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handlePhotoUpload(f);
                        }}
                      />
                    </>
                  )}
                </div>
                <div className="flex-1 pt-2 sm:pt-0">
                  <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                  <p className="text-sm text-gray-500 mt-0.5">@{username}</p>
                  <p className="text-sm text-gray-500 mt-1">eBay member</p>
                  {feedback && feedback.total > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-semibold text-gray-800">{feedback.score}% positive feedback</span>
                      <span className="text-sm text-gray-400">({feedback.total} ratings)</span>
                    </div>
                  )}
                </div>
                <div className="sm:pb-1">
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="border border-gray-300 text-sm font-medium px-5 py-2 rounded-full hover:bg-gray-50 transition"
                    >
                      Edit profile
                    </button>
                  ) : null}
                  <Link
                    href={`/seller/${profile.user_id}`}
                    className="block text-center text-sm text-[#0064D2] hover:underline mt-2 sm:mt-1"
                  >
                    View public profile
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {msg && (
            <div className={`mb-4 p-3 rounded text-sm border ${msg === "Profile updated" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
              {msg}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            {/* Stats */}
            <div className="md:col-span-1 space-y-4">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="font-bold text-gray-900 mb-3">Seller overview</h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><Package className="w-4 h-4" /> Active listings</span>
                    <span className="font-semibold">{listingCount}</span>
                  </div>
                  {feedback && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Positive</span>
                        <span className="font-semibold text-green-600">{feedback.positive}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Neutral</span>
                        <span className="font-semibold">{feedback.neutral}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Negative</span>
                        <span className="font-semibold text-red-600">{feedback.negative}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h2 className="font-bold text-gray-900 mb-3">Quick links</h2>
                <div className="space-y-2 text-sm">
                  <Link href="/my-ebay" className="flex items-center gap-2 text-[#0064D2] hover:underline"><Package className="w-4 h-4" /> My eBay</Link>
                  <Link href="/sell" className="flex items-center gap-2 text-[#0064D2] hover:underline"><Package className="w-4 h-4" /> Sell an item</Link>
                  <Link href="/watchlist" className="flex items-center gap-2 text-[#0064D2] hover:underline"><Heart className="w-4 h-4" /> Watchlist</Link>
                  <Link href="/cart" className="flex items-center gap-2 text-[#0064D2] hover:underline"><ShoppingCart className="w-4 h-4" /> Cart</Link>
                  <Link href="/addresses" className="flex items-center gap-2 text-[#0064D2] hover:underline"><MapPin className="w-4 h-4" /> Addresses</Link>
                  <Link href="/messages" className="flex items-center gap-2 text-[#0064D2] hover:underline"><MessageSquare className="w-4 h-4" /> Messages</Link>
                </div>
              </div>
            </div>

            {/* About / edit */}
            <div className="md:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-1">About</h2>
                <p className="text-sm text-gray-500 mb-5">
                  {editing
                    ? "Update your profile picture and personal details. Recommended photo size: 300×300 px."
                    : "This is how other eBay members see you. Add a photo and keep your details up to date."}
                </p>

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
                        <input value={fname} onChange={(e) => setFname(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0064D2]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
                        <input value={lname} onChange={(e) => setLname(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0064D2]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0064D2]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile picture URL</label>
                      <input value={picUrl} onChange={(e) => setPicUrl(e.target.value)} placeholder="Or upload with the camera button" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0064D2]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email (cannot be changed)</p>
                      <p className="text-sm text-gray-700">{profile.email}</p>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setFname(profile.fname);
                          setLname(profile.lname);
                          setPhone(profile.phone);
                          setPicUrl(profile.profile_picture || "");
                        }}
                        className="flex-1 border border-gray-300 text-sm py-2.5 rounded-full hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={!fname || !lname || uploading}
                        className="flex-1 bg-[#0064D2] hover:bg-[#0053B3] text-white text-sm font-bold py-2.5 rounded-full disabled:opacity-50"
                      >
                        {uploading ? "Uploading…" : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">First name</p>
                        <p className="text-sm font-medium text-gray-800">{profile.fname}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Last name</p>
                        <p className="text-sm font-medium text-gray-800">{profile.lname}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Email</p>
                      <p className="text-sm font-medium text-gray-800">{profile.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                      <p className="text-sm font-medium text-gray-800">{profile.phone || "—"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
