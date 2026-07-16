'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch, BASE_PATH } from '@/lib/api';

export default function OAuthSuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const ran = useRef(false);

  const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    if (ran.current) return;

    const userId = (session?.user as { id?: string })?.id;

    if (status === 'loading') return;

    if (status === 'authenticated' && userId) {
      ran.current = true;
      apiFetch('/alumni/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alumniId: userId }),
      })
        .then(() => {
          try {
            document.cookie = 'invite_token=; path=/; max-age=0';
          } catch {
            /* ignore */
          }
          router.replace(`${BASE_PATH}/alumni/feed`);
        })
        .catch(() => {
          const resolvedToken = token || getCookieValue('invite_token');
          const failUrl = resolvedToken
            ? `${BASE_PATH}/alumni/login?token=${encodeURIComponent(resolvedToken)}&error=oauth_failed`
            : `${BASE_PATH}/alumni/login?error=oauth_failed`;
          router.replace(failUrl);
        });
      return;
    }

    if (status === 'unauthenticated') {
      ran.current = true;
      const resolvedToken = token || getCookieValue('invite_token');
      const failUrl = resolvedToken
        ? `${BASE_PATH}/alumni/login?token=${encodeURIComponent(resolvedToken)}&error=oauth_failed`
        : `${BASE_PATH}/alumni/login?error=oauth_failed`;
      router.replace(failUrl);
    }
  }, [status, session, router, token]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-600">
      Completing sign in…
    </div>
  );
}