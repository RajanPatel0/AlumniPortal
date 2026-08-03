export default function FeedLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-8">
      {/* Left Sidebar Skeleton (Hidden on mobile) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
          <div className="h-24 bg-slate-200 rounded-xl"></div>
          <div className="w-2/3 h-5 bg-slate-200 rounded"></div>
          <div className="w-1/2 h-4 bg-slate-200 rounded"></div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-3 animate-pulse">
          <div className="w-1/3 h-5 bg-slate-200 rounded"></div>
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="w-20 h-7 bg-slate-200 rounded-full"></div>
            <div className="w-28 h-7 bg-slate-200 rounded-full"></div>
            <div className="w-24 h-7 bg-slate-200 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Right Feed Skeleton */}
      <div className="lg:col-span-8 space-y-6">
        {/* Composer Skeleton */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 space-y-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
            <div className="flex-1 h-10 bg-slate-200 rounded-full"></div>
          </div>
        </div>

        {/* Feed Post Skeletons */}
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-slate-200"></div>
              <div className="space-y-2 flex-1">
                <div className="w-1/4 h-4 bg-slate-200 rounded"></div>
                <div className="w-1/6 h-3 bg-slate-200 rounded"></div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <div className="w-full h-4 bg-slate-200 rounded"></div>
              <div className="w-11/12 h-4 bg-slate-200 rounded"></div>
              <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
            </div>
            <div className="h-48 bg-slate-200 rounded-xl pt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
