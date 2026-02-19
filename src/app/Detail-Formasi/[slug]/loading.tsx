export default function LoadingDetailFormasi() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="w-32 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Header skeleton */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#7F1D1D]/50 to-[#B91C1C]/50 px-8 py-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-3">
                <div className="w-96 h-10 bg-white/30 rounded animate-pulse"></div>
                <div className="flex gap-3">
                  <div className="w-24 h-8 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-24 h-8 bg-white/30 rounded-full animate-pulse"></div>
                  <div className="w-32 h-8 bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="w-40 h-12 bg-white/30 rounded-xl animate-pulse"></div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-4">
                    <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-4/6 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl p-6">
                    <div className="w-32 h-5 bg-gray-200 rounded mb-4 animate-pulse"></div>
                    <div className="space-y-3">
                      <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-5/6 h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-4/6 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
