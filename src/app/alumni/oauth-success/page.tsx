import { Suspense } from 'react';
import OAuthSuccessClient from './OAuthSuccessClient';

function OAuthSkeleton() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
      Completing sign in…
    </div>
  );
}

export default function OAuthSuccessPage() {
  return (
    <Suspense fallback={<OAuthSkeleton />}>
      <OAuthSuccessClient />
    </Suspense>
  );
}