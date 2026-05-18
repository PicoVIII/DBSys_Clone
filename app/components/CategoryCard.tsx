"use client";

import Link from "next/link";
import { Package } from "lucide-react";

type CategoryCardProps = {
  ctgry_id: number;
  ctgry_name: string;
  ctgry_image?: string | null;
  href?: string;
  className?: string;
  onClick?: () => void;
};

export default function CategoryCard({
  ctgry_id,
  ctgry_name,
  ctgry_image,
  href,
  className = "",
  onClick,
}: CategoryCardProps) {
  const linkHref = href ?? `/search?category=${ctgry_id}`;

  const inner = (
    <div className={`flex flex-col items-center justify-center gap-2 p-3 sm:p-4 min-h-[100px] rounded-xl border border-ebay-gray-100 bg-background hover:border-ebay-blue hover:shadow-soft transition-all group ${className}`}>
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-ebay-gray-50 border border-ebay-gray-100 flex items-center justify-center flex-shrink-0">
        {ctgry_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ctgry_image} alt="" className="w-full h-full object-cover" />
        ) : (
                          <Package className="w-6 h-6 sm:w-7 sm:h-7 text-ebay-gray-300" />
        )}
      </div>
      <span className="text-xs sm:text-sm font-medium text-foreground text-center line-clamp-2 group-hover:text-ebay-blue leading-tight px-1">
        {ctgry_name}
      </span>
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  }

  return (
    <Link href={linkHref} className="block w-full">
      {inner}
    </Link>
  );
}
