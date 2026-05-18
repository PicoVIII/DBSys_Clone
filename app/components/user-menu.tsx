"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, LogOut, Settings, Package, Heart } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function UserMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dropdownPos, setDropdownPos] = useState<"left-0 origin-top-left" | "right-0 origin-top-right">("right-0 origin-top-right");

  const user = session?.user as { id?: string; name?: string; email?: string; role?: string; picture?: string } | null;
  const role = user?.role;
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const dropdownWidth = 240;
      const distanceToRightEdge = window.innerWidth - rect.left;
      if (distanceToRightEdge < dropdownWidth) {
        setDropdownPos("right-0 origin-top-right");
      } else {
        setDropdownPos("left-0 origin-top-left");
      }
    }
  }, [isOpen]);

  if (!session) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden sm:inline text-foreground">Hi!</span>
        <Link href="/login" className="text-ebay-blue font-medium hover:underline">Sign in</Link>
        <span className="hidden sm:inline text-foreground">or</span>
        <Link href="/register" className="text-ebay-blue font-medium hover:underline hidden sm:inline">register</Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen((o) => !o)} 
        className="flex items-center gap-2 cursor-pointer border-none bg-transparent p-0 text-sm focus:outline-none"
      >
        <div className="hidden sm:block text-foreground mr-1">
          Hi <span className="font-bold">{user?.name?.split(' ')[0]}</span>!
        </div>
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover border border-ebay-gray-100 shadow-sm transition-transform hover:scale-105" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ebay-blue/10 flex items-center justify-center text-[13px] font-bold text-ebay-blue border border-ebay-blue/20 shadow-sm transition-transform hover:scale-105">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-11 z-50 bg-background border border-ebay-gray-100 rounded-xl shadow-hover py-2 min-w-[240px] animate-in fade-in zoom-in-95 duration-100 ${dropdownPos}`}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-ebay-gray-100 mb-2">
            {user?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.picture} alt="" className="w-12 h-12 rounded-full object-cover shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-ebay-blue/10 flex items-center justify-center text-lg font-bold text-ebay-blue">
                {initials}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-foreground font-bold text-sm truncate">{user?.name}</span>
              <span className="text-ebay-gray-400 text-xs truncate">{user?.email}</span>
            </div>
          </div>

          <div className="flex flex-col px-2">
            <Link href="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-ebay-gray-50 transition-colors">
              <Settings className="w-4 h-4 text-ebay-gray-400" /> My Profile
            </Link>
            <Link href="/my-ebay" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-ebay-gray-50 transition-colors">
              <Package className="w-4 h-4 text-ebay-gray-400" /> My Orders
            </Link>
            <Link href="/watchlist" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-ebay-gray-50 transition-colors">
              <Heart className="w-4 h-4 text-ebay-gray-400" /> Watchlist
            </Link>
            {role !== "admin" && (
              <Link href="/seller/dashboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-ebay-gray-50 transition-colors">
                <User className="w-4 h-4 text-ebay-gray-400" /> Seller Dashboard
              </Link>
            )}
          </div>

          <div className="border-t border-ebay-gray-100 mt-2 px-2 pt-2">
            <button 
              onClick={() => { setIsOpen(false); signOut(); }} 
              className="flex items-center gap-3 px-3 py-2 text-sm text-ebay-red w-full text-left rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
