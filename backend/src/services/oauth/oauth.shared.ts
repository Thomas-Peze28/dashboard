import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
* Represents the OAuth user profile information.
**/
export interface OAuthUserProfile {
  provider: string;
  providerAccountId: string;
  email: string;
  name?: string | null;
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number;
}

/**
* Synchronise an OAuth user profile with the database and generate a session JWT.
* @param profile The OAuth user profile.
* @returns The generated JWT token.
**/
export const syncOAuthUserAndSignJwt = async (profile: OAuthUserProfile): Promise<string> => {

  const expiresAt = profile.expiresIn ? Math.floor(Date.now() / 1000) + profile.expiresIn : null;

  const existingUser = await prisma.user.findUnique({
    where: { email: profile.email },
    include: { accounts: true },
  });

  let currentUserId: string;
  let currentUserRole: string;

  if (!existingUser) {
    const newUser = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name ?? null,
        isVerified: true,
        accounts: {
          create: {
            provider: profile.provider,
            providerAccountId: profile.providerAccountId,
            accessToken: profile.accessToken,
            refreshToken: profile.refreshToken ?? null,
            expiresAt,
          },
        },
      },
    });
    currentUserId = newUser.id;
    currentUserRole = newUser.role;
  } else {
    currentUserId = existingUser.id;
    currentUserRole = existingUser.role;

    const hasAccount = existingUser.accounts.some(
      (acc) => acc.provider === profile.provider && acc.providerAccountId === profile.providerAccountId
    );

    if (!hasAccount) {
      await prisma.account.create({
        data: {
          userId: existingUser.id,
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken ?? null,
          expiresAt,
        },
      });
    }
  }

  return jwt.sign(
    { userId: currentUserId, role: currentUserRole },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};