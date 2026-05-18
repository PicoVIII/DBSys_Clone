export default function SearchLoading() {
  return (
    <div className="bg-background min-h-screen font-sans antialiased">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-8">
        <div className="flex gap-4 mb-6 animate-pulse">
          <div className="h-10 w-full max-w-[500px] bg-ebay-gray-100 rounded-full" />
          <div className="h-10 w-24 bg-ebay-gray-100 rounded-full" />
        </div>
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-4 border border-ebay-gray-100 rounded-lg p-3">
              <div className="w-36 h-36 bg-ebay-gray-100 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-4 bg-ebay-gray-100 rounded w-3/4" />
                <div className="h-3 bg-ebay-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
