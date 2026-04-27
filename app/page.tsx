import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/navbar";

export default function Home() {
  return (
    <>
      <Navbar />
          <div className="px-45 pt-2.5 pb-15 flex justify-center gap-10 text-xs">
              <Link href='/'>eBay Live</Link>
              <Link href='/'>Saved</Link>
              <Link href='/'>Motors</Link>
              <Link href='/'>Electronics</Link>
              <Link href='/'>Collectibles</Link>
              <Link href='/'>Home and Garden</Link>
              <Link href='/'>Clothing, shoes and accessories</Link>
              <Link href='/'>Toys</Link>
              <Link href='/'>Sporting goods</Link>
              <Link href='/'>Business and Industrial</Link>
              <Link href='/'>Jewelry and Watches</Link>
              <Link href='/'>Refurbished</Link>
          </div>
      <main className="p-6">
        <h1>Homepage</h1>
        
      </main>
    </>
  );
}
