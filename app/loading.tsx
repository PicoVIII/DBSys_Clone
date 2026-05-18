export default function RootLoading() {
  return (
    <div className="bg-background min-h-screen font-sans antialiased">
      <nav className="border-b border-ebay-gray-100 bg-background">
        <div className="h-8 flex items-center justify-between px-5 text-xs border-b border-ebay-gray-100/50 bg-ebay-gray-50/30">
          <div className="flex items-center gap-3">
            <div className="h-3 w-16 bg-ebay-gray-100 rounded animate-pulse" />
            <div className="hidden md:flex items-center gap-3">
              <div className="h-3 w-20 bg-ebay-gray-100 rounded animate-pulse" />
              <div className="h-3 w-16 bg-ebay-gray-100 rounded animate-pulse" />
              <div className="h-3 w-24 bg-ebay-gray-100 rounded animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-3 w-12 bg-ebay-gray-100 rounded animate-pulse" />
            <div className="h-3 w-16 bg-ebay-gray-100 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-16 flex items-center justify-between px-5 max-w-[1440px] mx-auto w-full">
          <div className="h-10 w-28 bg-ebay-gray-100 rounded animate-pulse" />
          <div className="hidden md:flex flex-1 max-w-[600px] mx-8 h-10 bg-ebay-gray-100 rounded-full animate-pulse" />
          <div className="flex items-center gap-4">
            <div className="h-5 w-5 bg-ebay-gray-100 rounded animate-pulse" />
            <div className="h-5 w-5 bg-ebay-gray-100 rounded animate-pulse" />
            <div className="h-8 w-8 bg-ebay-gray-100 rounded-full animate-pulse" />
          </div>
        </div>
      </nav>

      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-8 animate-pulse">
        <div className="h-8 w-48 bg-ebay-gray-100 rounded mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border border-ebay-gray-100 rounded-xl overflow-hidden bg-background">
              <div className="aspect-square bg-ebay-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-ebay-gray-100 rounded w-full" />
                <div className="h-3 bg-ebay-gray-100 rounded w-2/3" />
                <div className="h-5 bg-ebay-gray-100 rounded w-1/2 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
