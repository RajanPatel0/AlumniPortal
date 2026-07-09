import { Suspense } from 'react';
import AlumniLoginClient from './AlumniLoginClient';

function LoginSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-[#C41E3A] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-600">Loading login page...</p>
      </div>
    </div>
  );
}

export default function AlumniLoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <AlumniLoginClient />
    </Suspense>
  );
}