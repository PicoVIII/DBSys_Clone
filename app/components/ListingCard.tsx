"use client";

import Link from "next/link";
import { Package } from "lucide-react";

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

export default function ListingCard({ listing }: { listing: Listing }) {
  const price =
    listing.listg_format?.toLowerCase() === "auction"
      ? listing.listg_startprice
      : listing.listg_fixedprice;

  const isAuction = listing.listg_format?.toLowerCase() === "auction";

  return (
    <Link
      href={`/listings/${listing.listg_id}`}
      className="group flex flex-col border border-ebay-gray-100 rounded-xl bg-background overflow-hidden evo-card hover:border-transparent h-full"
    >
      <div className="aspect-square bg-ebay-gray-50 overflow-hidden flex items-center justify-center relative shrink-0">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.listg_title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-ebay-gray-50">
            <Package className="w-10 h-10 text-ebay-gray-300" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 min-h-[120px]">
        <h3 className="text-[15px] font-medium text-foreground line-clamp-2 leading-tight mb-1 group-hover:underline">
          {listing.listg_title}
        </h3>

        {listing.prdct_cond && (
          <p className="text-xs text-ebay-gray-400 mb-2 truncate">{listing.prdct_cond}</p>
        )}

        <div className="mt-auto">
          {isAuction ? (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">
                ${Number(price ?? 0).toFixed(2)}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold text-ebay-gray-400 uppercase tracking-wider">
                  {Number(listing.bid_count ?? 0)} Bid{Number(listing.bid_count ?? 0) !== 1 ? "s" : ""}
                </span>
                <span className="text-[11px] text-ebay-red font-medium">
                  Ends {new Date(listing.listg_enddate).toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">
                ${Number(price ?? 0).toFixed(2)}
              </span>
              <span className="text-xs text-ebay-gray-400 mt-0.5">Buy It Now</span>
            </div>
          )}
        </div>

        {listing.listg_status?.toLowerCase() !== "active" && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase bg-ebay-red text-white px-2 py-1 rounded-full shadow-sm">
            {listing.listg_status}
          </span>
        )}
      </div>
    </Link>
  );
}
