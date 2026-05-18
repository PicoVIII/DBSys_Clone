export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased">
      <div className="max-w-[1440px] mx-auto px-5 lg:px-8 py-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="h-4 w-24 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
