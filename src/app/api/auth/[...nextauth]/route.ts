import NextAuth from 'next-auth';
import { alumniAuthConfig } from '@/lib/alumni/auth';

const handler = NextAuth(alumniAuthConfig);
export { handler as GET, handler as POST };
