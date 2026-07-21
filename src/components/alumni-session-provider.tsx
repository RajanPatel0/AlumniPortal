'use client';

import { SessionProvider } from 'next-auth/react';

export function AlumniSessionProvider({ children }: { children: React.ReactNode }) {
  const authBasePath = process.env.NEXT_PUBLIC_BASE_PATH
    ? `${process.env.NEXT_PUBLIC_BASE_PATH}/api/auth`
    : '/api/auth';

  return <SessionProvider basePath={authBasePath}>{children}</SessionProvider>;
}