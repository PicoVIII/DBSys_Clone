"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Category = {
  ctgry_id: number;
  ctgry_name: string;
};

export default function SearchBar({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-1 h-11 mx-4 max-w-4xl">
      <div className="flex flex-1 border-[2.5px] border-foreground rounded-full overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ebay-blue/20 transition-all duration-200 shadow-sm hover:shadow-soft">
        <div className="flex items-center pl-4 pr-2 text-ebay-gray-400">
          <Search size={18} strokeWidth={2.5} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anything"
          className="flex-1 bg-transparent border-none outline-none text-foreground text-base placeholder-ebay-gray-400"
        />
        <div className="flex items-center border-l border-ebay-gray-100 relative bg-ebay-gray-50/50 hover:bg-ebay-gray-50 transition-colors hidden sm:flex">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="appearance-none bg-transparent border-none text-ebay-gray-400 text-sm w-36 pl-4 pr-8 outline-none cursor-pointer h-full truncate focus:text-foreground"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.ctgry_id} value={c.ctgry_id}>
                {c.ctgry_name}
              </option>
            ))}
          </select>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute right-3 pointer-events-none text-ebay-gray-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <button
          type="submit"
          className="px-6 h-full border-none bg-ebay-blue text-white cursor-pointer flex items-center justify-center gap-1.5 font-bold text-sm flex-shrink-0 hover:bg-ebay-blue-hover transition-colors evo-button"
        >
          Search
        </button>
      </div>
    </form>
  );
}
