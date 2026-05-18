"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { ShoppingCart, Bell, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import eBayLogo from "../icons/eBayLogo.png";
import SearchBar from "./search-bar";
import UserMenu from "./user-menu";
import CategoryCard from "./CategoryCard";

type Category = {
  ctgry_id: number;
  ctgry_name: string;
  ctgry_image?: string | null;
};

export default function Navbar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const user = session?.user as { id?: string; role?: string } | null;

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.data ?? []));
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <nav className="font-sans border-b border-ebay-gray-100 bg-background">
      <div className="h-8 flex items-center justify-between px-5 text-xs border-b border-ebay-gray-100/50 bg-ebay-gray-50/30">
        <div className="flex items-center gap-3">
          <UserMenu />
          <div className="hidden md:flex items-center gap-3">
            <Link href="/search" className="text-foreground hover:underline">Daily Deals</Link>
            <Link href="/search" className="text-foreground hover:underline">Help & Contact</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/sell" className="text-foreground hover:underline hidden sm:block">Sell</Link>
          <Link href={user?.id ? "/watchlist" : "/login"} className="text-foreground hover:underline hidden sm:block">Watchlist</Link>
          <Link href={user?.id ? "/my-ebay" : "/login"} className="text-foreground hover:underline group flex items-center gap-1">
            My eBay <ChevronDown className="w-3 h-3 group-hover:rotate-180 transition-transform duration-200" />
          </Link>
          <NotifBell userId={user?.id} />
          <Link href={user?.id ? "/cart" : "/login"} className="text-foreground hover:text-ebay-blue transition-colors relative">
            <ShoppingCart className="w-5 h-5" />
          </Link>
        </div>
      </div>

      <div className="flex items-center px-5 py-3 lg:py-4 gap-4 max-w-[1440px] mx-auto">
        <Link href="/" className="flex-shrink-0 mr-2 lg:mr-6 transition-transform hover:scale-[1.02]">
          <Image src={eBayLogo} width={100} height={40} alt="eBay" priority className="w-[90px] lg:w-[110px]" />
        </Link>

        <div className="hidden lg:block relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setCatOpen(!catOpen)}
            className="flex items-center text-sm font-medium text-ebay-gray-400 hover:text-foreground group transition-colors"
          >
            Shop by category
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${catOpen ? "rotate-180" : ""}`} />
          </button>
          {catOpen && (
            <div className="absolute top-full left-0 mt-2 w-[560px] bg-white border border-ebay-gray-200 rounded-xl shadow-lg z-50 p-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {categories.slice(0, 12).map((c) => (
                  <CategoryCard
                    key={c.ctgry_id}
                    ctgry_id={c.ctgry_id}
                    ctgry_name={c.ctgry_name}
                    ctgry_image={c.ctgry_image}
                    onClick={() => {
                      setCatOpen(false);
                      router.push(`/search?category=${c.ctgry_id}`);
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          <SearchBar categories={categories} />
        </div>
      </div>

      <div className="px-5 border-t border-ebay-gray-100/50 hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar max-w-[1440px] mx-auto">
        <Link href="/" className="text-xs font-bold text-foreground py-2 px-3 border-b-2 border-foreground whitespace-nowrap">Home</Link>
        {categories.slice(0, 10).map((c) => (
          <Link
            key={c.ctgry_id}
            href={`/search?category=${c.ctgry_id}`}
            className="text-xs font-medium text-ebay-gray-400 hover:text-foreground py-2 px-3 border-b-2 border-transparent hover:border-ebay-gray-300 transition-colors whitespace-nowrap"
          >
            {c.ctgry_name}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function NotifBell({ userId }: { userId?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const fetchNotifs = () => {
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => setCount(d.unread ?? 0));
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <Link href="/messages" className="relative text-foreground hover:text-ebay-blue transition-colors flex items-center justify-center">
      <Bell className="w-5 h-5" />
      {count > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-ebay-red text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-background animate-in zoom-in">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
