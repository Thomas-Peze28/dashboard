import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { JWT_SECRET } from '../../config/env.js';

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
* @param linkUserId The connected user to link the third-party account to (null for a simple sign-in).
* @returns The generated JWT token.
**/
export const syncOAuthUserAndSignJwt = async (profile: OAuthUserProfile, linkUserId: string | null = null): Promise<string> => {

  const expiresAt = profile.expiresIn ? Math.floor(Date.now() / 1000) + profile.expiresIn : null;

  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: { provider: profile.provider, providerAccountId: profile.providerAccountId },
    },
  });

  let userId: string;

  if (linkUserId) {
  
    if (linkedAccount && linkedAccount.userId !== linkUserId) {
      throw new Error('OAUTH_ACCOUNT_ALREADY_LINKED');
    }
    userId = linkUserId;

    await prisma.account.deleteMany({
      where: { userId, provider: profile.provider, NOT: { providerAccountId: profile.providerAccountId } },
    });
  } else if (linkedAccount) {
    userId = linkedAccount.userId;
  } else {
    const user = await prisma.user.findUnique({ where: { email: profile.email } }) ?? await prisma.user.create({ data: { email: profile.email, name: profile.name ?? null, isVerified: true } });
    userId = user.id;
  }

  if (linkedAccount) {
    await prisma.account.update({
      where: { id: linkedAccount.id },
      data: {
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken ?? linkedAccount.refreshToken,
        expiresAt,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        userId,
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
        accessToken: profile.accessToken,
        refreshToken: profile.refreshToken ?? null,
        expiresAt,
      },
    });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};
