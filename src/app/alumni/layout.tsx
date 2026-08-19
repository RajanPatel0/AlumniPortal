import { AlumniSessionProvider } from '@/components/alumni-session-provider';
import { SentryPageViewTracker } from '@/components/SentryPageViewTracker';

export default function AlumniLayout({ children }: { children: React.ReactNode }) {
  // This layout wraps all /alumni routes but doesn't protect them
  // Protection is handled by the (protected)/layout.tsx for /alumni/dashboard
  return (
    <AlumniSessionProvider>
      <SentryPageViewTracker />
      {children}
    </AlumniSessionProvider>
  );
}