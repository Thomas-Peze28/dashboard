import { prisma } from '../lib/prisma.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendVerificationEmail } from './mail.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

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
    await sendVerificationEmail(user.email, token);

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

/**
* Logs in a user by verifying their credentials and generating a JWT.
* @param email - The user's email address.
* @param password - The user's password.
* @returns A promise that resolves to an object containing the JWT and user information.
* @throws An error if the credentials are invalid or the email is not verified.
**/
export const loginUser = async (email: string, password: string) => {

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user || !user.password) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.isVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
    }

    const token = jwt.sign(
        { userId: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );

    return {
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
};