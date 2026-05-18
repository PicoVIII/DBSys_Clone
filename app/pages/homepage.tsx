"use client";

import { useEffect, useState } from "react";
import Navbar from "../components/navbar";
import ListingCard from "../components/ListingCard";
import Link from "next/link";
import { ArrowRight, Pause, Play, Package, Clock, Store, TrendingUp, Sparkles } from "lucide-react";
import CategoryCard from "../components/CategoryCard";

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

type Category = {
  ctgry_id: number;
  ctgry_name: string;
  ctgry_image?: string | null;
};

const HERO_SLIDES = [
  {
    bg: "from-[#0053A0] to-[#2B80D8]",
    emoji: "🛒",
    title: "Get more with an eBay account",
    subtitle: "Enjoy exclusive benefits — deals, app-only coupons, and more.",
    cta: "Sign in",
    href: "/login",
  },
  {
    bg: "from-[#D32F2F] to-[#EF5350]",
    emoji: "⚡",
    title: "Deals that won't last long",
    subtitle: "Shop limited-time offers across all categories.",
    cta: "See deals",
    href: "/search",
  },
  {
    bg: "from-[#212121] to-[#424242]",
    emoji: "📦",
    title: "Shop with confidence",
    subtitle: "eBay Money Back Guarantee on eligible items.",
    cta: "Learn more",
    href: "/search",
  },
];



export default function Homepage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [deals, setDeals] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [slide, setSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState<Listing[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/listings?limit=42").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/listings?sort=ending&limit=6").then((r) => r.json()),
    ]).then(([l, c, d]) => {
      setListings(l.data ?? []);
      setCategories(c.data ?? []);
      setDeals(d.data ?? []);
      setLoading(false);
    });
    const stored = localStorage.getItem("recentlyViewed");
    if (stored) {
      try {
        setRecentlyViewed(JSON.parse(stored));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(t);
  }, [isPaused]);

  const current = HERO_SLIDES[slide];
  const topCategories = categories.slice(0, 12);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <main className="max-w-[1440px] mx-auto px-5 lg:px-8 pb-16">
        {/* Hero */}
        <div className={`bg-gradient-to-r ${current.bg} rounded-[20px] text-white mt-6 mb-10 px-10 py-12 flex items-center justify-between relative overflow-hidden shadow-soft transition-all duration-700`}>
          <div className="relative z-10 max-w-lg animate-in slide-in-from-left-4 fade-in duration-700" key={slide}>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{current.title}</h1>
            <p className="text-white/90 mb-8 text-lg font-medium">{current.subtitle}</p>
            <Link href={current.href} className="bg-white text-foreground font-bold px-8 py-3.5 rounded-full text-base hover:bg-ebay-gray-50 transition-colors inline-block evo-button">
              {current.cta}
            </Link>
          </div>
          <div className="hidden md:block text-[12rem] leading-none select-none opacity-90 absolute -right-4 -bottom-8 animate-in slide-in-from-right-8 fade-in duration-700" key={`emoji-${slide}`}>
            {current.emoji}
          </div>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${i === slide ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"}`} aria-label={`Go to slide ${i + 1}`} />
            ))}
          </div>
          <div className="absolute bottom-5 right-5 flex items-center gap-2 z-20">
            <button onClick={() => setIsPaused(!isPaused)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm" aria-label={isPaused ? "Play" : "Pause"}>
              {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4 fill-current" />}
            </button>
            <button onClick={() => setSlide((s) => (s + 1) % HERO_SLIDES.length)} className="p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors backdrop-blur-sm" aria-label="Next slide">
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>



        {/* Shop by category */}
        {topCategories.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-foreground">Shop by category</h2>
              <Link href="/search" className="text-sm font-medium text-ebay-blue hover:text-ebay-blue-hover flex items-center gap-1 group">
                Shop all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {topCategories.map((c) => (
                <CategoryCard
                  key={c.ctgry_id}
                  ctgry_id={c.ctgry_id}
                  ctgry_name={c.ctgry_name}
                  ctgry_image={c.ctgry_image}
                />
              ))}
            </div>
          </section>
        )}

        {/* Daily Deals section */}
        {deals.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-ebay-yellow" /> Daily Deals
              </h2>
              <Link href="/search?sort=ending" className="text-sm font-medium text-ebay-blue hover:text-ebay-blue-hover flex items-center gap-1 group">
                See all deals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {deals.slice(0, 6).map((l) => (
                <div key={l.listg_id} className="relative h-full">
                  <div className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-ebay-yellow text-foreground text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                    <Clock className="w-3 h-3" /> Deal
                  </div>
                  <div className="h-full">
                    <ListingCard listing={l} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* "Shopping made easy" banner */}
        <div className="border border-ebay-gray-100 rounded-2xl px-10 py-8 mb-12 flex flex-col sm:flex-row items-center justify-between bg-ebay-gray-50/50 shadow-sm relative overflow-hidden">
          <div className="relative z-10 text-center sm:text-left mb-6 sm:mb-0">
            <p className="font-bold text-foreground text-2xl mb-1">Shopping made easy</p>
            <p className="text-base text-ebay-gray-400 font-medium">Enjoy reliability, secure deliveries and hassle-free returns.</p>
          </div>
          <Link href="/search" className="bg-foreground hover:bg-black text-white font-bold px-8 py-3 rounded-full text-sm transition-colors relative z-10 evo-button">
            Start now
          </Link>
        </div>

        {/* Trending picks section */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Trending picks</h2>
            <Link href="/search" className="text-sm font-medium text-ebay-blue hover:text-ebay-blue-hover flex items-center gap-1 group">
              See all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="border border-ebay-gray-100 rounded-xl animate-pulse overflow-hidden bg-background flex flex-col">
                  <div className="aspect-square bg-ebay-gray-100 shrink-0" />
                  <div className="p-4 flex-1 flex flex-col justify-end space-y-3">
                    <div className="h-4 bg-ebay-gray-100 rounded w-full" />
                    <div className="h-3 bg-ebay-gray-100 rounded w-2/3" />
                    <div className="h-5 bg-ebay-gray-100 rounded w-1/2 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-ebay-gray-200 rounded-2xl text-ebay-gray-400 bg-ebay-gray-50/30">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-bold text-foreground">No listings found</p>
              <p className="text-base mt-2"><Link href="/sell" className="text-ebay-blue hover:underline font-medium">List your first item</Link></p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {listings.slice(0, 18).map((l) => (
                <ListingCard key={l.listg_id} listing={l} />
              ))}
            </div>
          )}
        </section>

        {/* More listings */}
        {listings.length > 18 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">More from eBay</h2>
              <Link href="/search" className="text-sm font-medium text-ebay-blue hover:text-ebay-blue-hover flex items-center gap-1 group">
                See all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {listings.slice(18, 36).map((l) => (
                <ListingCard key={l.listg_id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* Recently viewed */}
        {recentlyViewed.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Clock className="w-5 h-5" /> Recently viewed
              </h2>
              <Link href="/search" className="text-sm font-medium text-ebay-blue hover:text-ebay-blue-hover flex items-center gap-1 group">
                See all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 auto-rows-fr">
              {recentlyViewed.slice(0, 6).map((l) => (
                <ListingCard key={l.listg_id} listing={l} />
              ))}
            </div>
          </section>
        )}

        {/* Start Selling promo */}
        <section className="mb-10">
          <div className="bg-gradient-to-r from-[#0a4b8c] to-[#1a6bc4] rounded-[20px] px-10 py-10 flex flex-col sm:flex-row items-center justify-between text-white relative overflow-hidden">
            <div className="relative z-10 text-center sm:text-left mb-6 sm:mb-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-3">
                <Store className="w-6 h-6" />
                <span className="text-sm font-bold uppercase tracking-wider opacity-80">Seller Hub</span>
              </div>
              <p className="text-3xl sm:text-4xl font-bold mb-2 leading-tight">Turn your items into cash</p>
              <p className="text-white/80 text-base max-w-md">Reach millions of buyers and sell your items with confidence.</p>
            </div>
            <Link href="/sell" className="relative z-10 bg-white text-[#0a4b8c] font-bold px-10 py-3.5 rounded-full text-base hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg">
              <TrendingUp className="w-5 h-5" /> Start Selling
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
