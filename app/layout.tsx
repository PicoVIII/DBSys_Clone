import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Footer from "./components/footer";

export const metadata: Metadata = {
  title: "eBay Clone",
  description: "A full-featured eBay clone marketplace built with Next.js",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex flex-col min-h-full flex-1">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
