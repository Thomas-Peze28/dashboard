import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
* Creates a new user in the database with a verification token.
* @param email -User's email address.
* @param name - User's name.
* @returns A promise that resolves to the created user object.
* @throws An error if the user cannot be created.
**/
export const createUser = async (email: string, password: string, name: string) => {

    const hashedPassword = await bcrypt.hash(password, 10);
    const token = crypto.randomBytes(32).toString('hex');

    const user = await prisma.user.create({
        data: {
            email,
            name,
            password: hashedPassword,
            verificationToken: token
        }
    });

    console.log(`\n[DEV] Lien de confirmation pour ${email} :\nhttp://localhost:8080/api/auth/confirm/${token}\n`);

    return user;
};

/**
* Verifies a user's email address using a verification token.
* @param token - The verification token.
* @returns A promise that resolves to the updated user object.
* @throws An error if the token is invalid or the user is not found.
**/
export const verifyUserEmail = async (token: string) => {

    const user = await prisma.user.findUnique({
        where: { verificationToken: token }
    });

    if (!user)
        throw new Error("INVALID_TOKEN");

    return prisma.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null
        }
    });
};