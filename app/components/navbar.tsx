import Link from 'next/link'
import Image from 'next/image';
import eBayLogo from '../icons/eBayLogo.png'
import { ChevronDown, ShoppingCart, Bell } from "lucide-react";

export default function Home() {
    return (
    <nav>
        <div className="border-b border-gray-300 px-45 py-2 flex items-center justify-between text-xs">
            <div className='flex items-center gap-6'>
                <p>Hi! <Link href='/' className='text-blue-700 underline'>Sign In</Link> or <Link href="/" className='text-blue-700 underline'>Register</Link></p>
                <Link href='/'>Deals</Link>
                <Link href='/'>Brand Outlet</Link>
                <Link href='/'>Gift Cards</Link>
                <Link href='/'>Help & Contact</Link>
            </div>
            <div className='flex items-center gap-10'>
                <Link href='/'>Sell</Link>
                <Link href='/' className='flex items-center'>Watchlist <ChevronDown className="w-3 h-3" /></Link>
                <Link href='/' className='flex items-center'>My eBay <ChevronDown className="w-3 h-3" /></Link>
                <Link href='/'><Bell className='w-4.5 h-4.5'/></Link>
                <Link href='/'><ShoppingCart className='w-4.5 h-4.5'/></Link>
            </div>
        </div>
        <div className="border-b border-gray-300 px-45 py-4 flex items-center justify-between text-xs">
            <Image
                src={eBayLogo}
                width={117}
                height={48}
                alt='eBay Logo'
            />
            <button className="px-4 flex items-center">
                <span className="leading-tight text-left">
                    Shop by<br />
                    <span className="flex items-center gap-1">
                    category
                    <ChevronDown className="w-3 h-3" />
                    </span>
                </span>
            </button>
            <div className='flex flex-1 border rounded-full overflow-hidden mx-2 border-1'>
                <div className="flex flex-1 border rounded-full overflow-hidden">
                    <input
                        type="text"
                        placeholder="Search for anything"
                        className="flex-1 px-4 py-3 outline-none"
                    />
                    <select className="border-l px-1.5 mx-10 text-sm">
                        <option>All Categories</option>
                    </select>
                </div>
            </div>

            <button className='rounded-3xl px-16 py-3.5 bg-blue-500 mx-2 text-white'><p className='font-bold'>Search</p></button>
            <Link href='/' className='text-gray-500'>Advanced</Link>
        </div>
    </nav>
  );
}
