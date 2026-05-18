"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "../../components/navbar";
import ListingCard from "../../components/ListingCard";
import Link from "next/link";
import { Star } from "lucide-react";

type Seller = {
  user_id: number;
  fname: string;
  lname: string;
  profile_picture: string | null;
};

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

type FeedbackStats = {
  total: number;
  averageRating: number;
  five: number;
  four: number;
  three: number;
  two: number;
  one: number;
  score: number;
};

type Review = {
  fdbck_id: number;
  fdbck_comment: string;
  fdbck_rating: number | null;
  fdbck_date: string;
  listg_id: number;
  listg_title: string;
  buyer_fname: string;
  buyer_lname: string;
};

export default function SellerProfilePage() {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<Seller | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [feedback, setFeedback] = useState<FeedbackStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    Promise.all([
      fetch(`/api/users/${sellerId}`).then((r) => r.json()),
      fetch(`/api/listings/user/${sellerId}`).then((r) => r.json()),
      fetch(`/api/feedback/seller/${sellerId}`).then((r) => r.json()),
      fetch(`/api/feedback?seller_id=${sellerId}`).then((r) => r.json()),
    ]).then(([user, list, fb, reviewData]) => {
      setSeller(user.data ?? null);
      const active = (list.data ?? []).filter(
        (l: Listing) => l.listg_status?.toLowerCase() === "active"
      );
      setListings(active);
      setFeedback(fb.data ?? null);
      setReviews(reviewData.data ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-500">Loading seller profile…</div>
      </>
    );
  }

  if (!seller) {
    return (
      <>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-16 text-center text-gray-500">
          <p className="text-4xl mb-3">👤</p>
          <p className="text-lg font-medium">Seller not found</p>
          <Link href="/" className="text-[#0064D2] hover:underline text-sm mt-2 inline-block">Back to home</Link>
        </div>
      </>
    );
  }

  const displayName = `${seller.fname} ${seller.lname}`;
  const username = `${seller.fname.toLowerCase()}${seller.lname[0]?.toLowerCase() ?? ""}`;
  const initials = (seller.fname[0] + seller.lname[0]).toUpperCase();

  return (
    <>
      <Navbar />
      <div className="bg-[#f7f7f7] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <nav className="text-xs text-gray-500 mb-4 flex items-center gap-1">
            <Link href="/" className="hover:underline text-[#0064D2]">Home</Link>
            <span>/</span>
            <span className="text-gray-700">{displayName}</span>
          </nav>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-6">
            <div className="h-20 bg-gradient-to-r from-[#0064D2] to-[#3d9ae8]" />
            <div className="px-6 pb-6 -mt-10 flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-[100px] h-[100px] rounded-full border-4 border-white bg-white shadow overflow-hidden flex items-center justify-center flex-shrink-0">
                {seller.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seller.profile_picture} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[#0064D2]">{initials}</span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <p className="text-sm text-gray-500">@{username} · eBay member</p>
                {feedback && feedback.total > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-semibold">{feedback.averageRating.toFixed(1)} out of 5</span>
                    <span className="text-sm text-gray-400">({feedback.total} reviews)</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600 sm:text-right">
                <p><span className="font-semibold text-gray-900">{listings.length}</span> items for sale</p>
              </div>
            </div>
          </div>

          {feedback && feedback.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6 max-w-2xl">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{feedback.five}</p>
                <p className="text-xs text-gray-500 mt-1">5 star</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{feedback.four}</p>
                <p className="text-xs text-gray-500 mt-1">4 star</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{feedback.three}</p>
                <p className="text-xs text-gray-500 mt-1">3 star</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{feedback.two}</p>
                <p className="text-xs text-gray-500 mt-1">2 star</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{feedback.one}</p>
                <p className="text-xs text-gray-500 mt-1">1 star</p>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews from past orders</h2>
            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-white border border-gray-200 rounded-lg text-gray-500">
                <p>No reviews from past orders yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.fdbck_id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Star
                              key={rating}
                              className={`w-4 h-4 ${rating <= Number(review.fdbck_rating ?? 0) ? "fill-yellow-400" : "fill-none text-gray-300"}`}
                            />
                          ))}
                          <span className="ml-2 text-xs font-semibold text-gray-600">{review.fdbck_rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{review.fdbck_comment}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          By {review.buyer_fname} {review.buyer_lname} for{" "}
                          <Link href={`/listings/${review.listg_id}`} className="text-[#0064D2] hover:underline">
                            {review.listg_title}
                          </Link>
                        </p>
                      </div>
                      <p className="text-xs text-gray-400 flex-shrink-0">
                        {new Date(review.fdbck_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">Items for sale</h2>
          {listings.length === 0 ? (
            <div className="text-center py-16 bg-white border border-gray-200 rounded-lg text-gray-500">
              <p className="text-4xl mb-2">📭</p>
              <p>No active listings from this seller</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.listg_id} listing={l} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
