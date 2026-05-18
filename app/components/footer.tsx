import Link from "next/link";
import Image from "next/image";
import eBayLogo from "../icons/eBayLogo.png";

const FOOTER_COLUMNS = [
  {
    title: "Buy",
    links: [
      { label: "Registration", href: "/register" },
      { label: "Bidding & buying help", href: "/search" },
      { label: "Stores", href: "/search" },
      { label: "Creator Collections", href: "/search" },
      { label: "eBay for Charity", href: "/search" },
      { label: "Charity Shop", href: "/search" },
      { label: "Seasonal Sales", href: "/search" },
      { label: "eBay Gift Cards", href: "/search" },
    ],
  },
  {
    title: "Sell",
    links: [
      { label: "Start selling", href: "/sell" },
      { label: "How to sell", href: "/sell" },
      { label: "Seller Dashboard", href: "/seller/dashboard" },
      { label: "Business sellers", href: "/sell" },
      { label: "Affiliates", href: "/search" },
    ],
  },
  {
    title: "Tools & apps",
    links: [
      { label: "eBay Mobile", href: "/search" },
      { label: "Downloads", href: "/search" },
      { label: "Security center", href: "/search" },
      { label: "Site map", href: "/" },
    ],
  },
  {
    title: "Stay connected",
    links: [
      { label: "Facebook", href: "https://www.facebook.com/eBay", external: true },
      { label: "X (Twitter)", href: "https://twitter.com/eBay", external: true },
      { label: "Instagram", href: "https://www.instagram.com/ebay", external: true },
    ],
  },
  {
    title: "About eBay",
    links: [
      { label: "Company info", href: "/search" },
      { label: "News", href: "/search" },
      { label: "Investors", href: "/search" },
      { label: "Careers", href: "/search" },
      { label: "Diversity & Inclusion", href: "/search" },
      { label: "Global Impact", href: "/search" },
      { label: "Government relations", href: "/search" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Announcements", href: "/search" },
      { label: "eBay Community", href: "/search" },
      { label: "eBay for Business", href: "/search" },
    ],
  },
  {
    title: "Help & Contact",
    links: [
      { label: "Help Center", href: "/search" },
      { label: "eBay Returns", href: "/my-ebay" },
      { label: "eBay Money Back Guarantee", href: "/search" },
      { label: "Contact us", href: "/messages" },
      { label: "eBay Accessibility", href: "/search" },
    ],
  },
] as const;

const LEGAL_LINKS = [
  { label: "Accessibility", href: "/search" },
  { label: "User Agreement", href: "/search" },
  { label: "Privacy", href: "/search" },
  { label: "Consumer Health Data", href: "/search" },
  { label: "Payments Terms of Use", href: "/search" },
  { label: "Cookies", href: "/search" },
  { label: "CA Privacy Notice", href: "/search" },
  { label: "Your Privacy Choices", href: "/search" },
  { label: "AdChoice", href: "/search" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-ebay-gray-100 bg-ebay-gray-50 font-sans">
      {/* Link columns */}
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-foreground mb-3">{col.title}</h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {"external" in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-ebay-gray-400 hover:text-ebay-blue hover:underline"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs text-ebay-gray-400 hover:text-ebay-blue hover:underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-ebay-gray-200 bg-background">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <Link href="/" className="inline-block flex-shrink-0">
              <Image src={eBayLogo} width={80} height={32} alt="eBay" className="opacity-90" />
            </Link>
            <p className="text-xs text-ebay-gray-400">
              Copyright © 1995–{year} eBay Clone. All Rights Reserved.
            </p>
          </div>
          <nav className="mt-4 flex flex-wrap gap-x-1 gap-y-2 text-xs text-ebay-gray-400">
            {LEGAL_LINKS.map((link, i) => (
              <span key={link.label} className="inline-flex items-center">
                {i > 0 && <span className="mx-1.5 text-ebay-gray-200">|</span>}
                <Link href={link.href} className="hover:text-ebay-blue hover:underline whitespace-nowrap">
                  {link.label}
                </Link>
              </span>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
