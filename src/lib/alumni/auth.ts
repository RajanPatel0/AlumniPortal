import type { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from '@/lib/prisma';

type OAuthUser = { email?: string | null; name?: string | null; image?: string | null };

async function completeOAuthInviteRegistration(
  alumni: {
    id: string;
    email: string;
    name: string;
    originalInvitedEmail: string | null;
  },
  user: OAuthUser,
  provider: string | undefined,
  providerAccountId: string
): Promise<boolean> {
  const newEmail = (user.email || '').toLowerCase().trim();
  if (!newEmail) {
    console.error('[ALUMNI_OAUTH] OAuth did not return an email');
    return false;
  }

  const updateData: Record<string, unknown> = {
    inviteStatus: 'REGISTERED',
    isRegistered: true,
    registeredAt: new Date(),
    lastLoginAt: new Date(),
    inviteToken: null, //Nullify token to invalidate it after OAuth registration
  };
  if (user.image) {
    updateData.avatarUrl = user.image;
  }

  if (provider === 'google') {
    updateData.googleId = providerAccountId;
  } else if (provider === 'linkedin') {
    updateData.linkedinId = providerAccountId;
  }

  if (newEmail !== alumni.email.toLowerCase()) {
    const existing = await prisma.alumni.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== alumni.id) {
      console.error('[ALUMNI_OAUTH] Email already used by another alumni');
      return false;
    }
    if (!alumni.originalInvitedEmail && alumni.email) {
      updateData.originalInvitedEmail = alumni.email;
    }
    updateData.email = newEmail;
  }

  if (user.name && user.name !== alumni.name) {
    updateData.name = user.name;
  }

  await prisma.alumni.update({
    where: { id: alumni.id },
    data: updateData ,
  });

  return true;
}

export const alumniAuthConfig: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: { params: { scope: 'openid email profile' } },
    }),
    //Custom LinkedIn Provider (OpenID Connect)
    {
      id: 'linkedin',
      name: 'LinkedIn',
      type: 'oauth',
      wellKnown: 'https://www.linkedin.com/oauth/.well-known/openid-configuration',
      issuer: 'https://www.linkedin.com/oauth',
      authorization: {
        url: 'https://www.linkedin.com/oauth/v2/authorization',
        params: { scope: 'openid profile email' },
      },
      token: 'https://www.linkedin.com/oauth/v2/accessToken',
      userinfo: 'https://api.linkedin.com/v2/userinfo',
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      client: {
        token_endpoint_auth_method: 'client_secret_post',
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    },
  ],
  // ... keep all your callbacks, pages, session, secret exactly as they are
  callbacks: {

    async signIn({ user, account, profile, request }: any) {
      // ... (your existing signIn logic – unchanged)
      const provider = account?.provider as string | undefined;
      const providerAccountId = (account?.providerAccountId || profile?.sub || profile?.id) as string | undefined;

      let tokenFromUrl: string | null = null;
      if (request) {
        try {
          const url = new URL(request.url);
          tokenFromUrl = url.searchParams.get('token');
        } catch {}
      }
      if (!tokenFromUrl && request?.headers) {
        const cookieHeader = request.headers.get('cookie') || '';
        const match = cookieHeader.match(/invite_token=([^;]+)/);
        if (match) tokenFromUrl = decodeURIComponent(match[1]);
      }

      const oauthEmail = (user.email || '').toLowerCase().trim();

      if (tokenFromUrl) {
        const alumni = await prisma.alumni.findFirst({
          where: { inviteToken: tokenFromUrl, inviteStatus: { in: ['PENDING', 'INVITED'] } },
        });
        if (!alumni) return false;
        if (!providerAccountId) return false;
        return completeOAuthInviteRegistration(
          { id: alumni.id, email: alumni.email, name: alumni.name, originalInvitedEmail: alumni.originalInvitedEmail },
          user,
          provider,
          providerAccountId
        );
      }

      if (oauthEmail) {
        const invitedByEmail = await prisma.alumni.findFirst({
          where: { email: oauthEmail, inviteStatus: { in: ['PENDING', 'INVITED'] }, isRegistered: false },
        });
        if (invitedByEmail && providerAccountId) {
          return completeOAuthInviteRegistration(
            { id: invitedByEmail.id, email: invitedByEmail.email, name: invitedByEmail.name, originalInvitedEmail: invitedByEmail.originalInvitedEmail },
            user,
            provider,
            providerAccountId
          );
        }
      }

      if (!providerAccountId || !provider) return false;

      let alumni = provider === 'google'
        ? await prisma.alumni.findUnique({ where: { googleId: providerAccountId } })
        : provider === 'linkedin'
          ? await prisma.alumni.findUnique({ where: { linkedinId: providerAccountId } })
          : null;

      if (!alumni && oauthEmail) {
        const byEmail = await prisma.alumni.findUnique({ where: { email: oauthEmail } });
        if (byEmail?.isRegistered) {
          if (provider === 'google') {
            if (byEmail.googleId && byEmail.googleId !== providerAccountId) return false;
            if (!byEmail.googleId) await prisma.alumni.update({ where: { id: byEmail.id }, data: { googleId: providerAccountId } });
            alumni = await prisma.alumni.findUnique({ where: { id: byEmail.id } });
          } else if (provider === 'linkedin') {
            if (byEmail.linkedinId && byEmail.linkedinId !== providerAccountId) return false;
            if (!byEmail.linkedinId) await prisma.alumni.update({ where: { id: byEmail.id }, data: { linkedinId: providerAccountId } });
            alumni = await prisma.alumni.findUnique({ where: { id: byEmail.id } });
          }
        }
      }

      if (!alumni || !alumni.isRegistered) return false;

      await prisma.alumni.update({
        where: { id: alumni.id },
        data: { lastLoginAt: new Date(), ...(user.image ? { avatarUrl: user.image } : {}) },
      });
      return true;
    },
    async jwt({ token, account, user }) {
      if (account && user?.email) {
        const alumni = await prisma.alumni.findUnique({ where: { email: String(user.email).toLowerCase().trim() } });
        if (alumni) {
          token.id = alumni.id;
          token.role = 'alumni';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.id) {
        session.user = { ...(session.user as any), id: token.id as string, role: 'alumni' };
      }
      return session;
    },
  },
  pages: { signIn: '/alumni/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};