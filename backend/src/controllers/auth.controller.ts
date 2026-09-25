import type { Request, Response } from 'express';
import { createUser, verifyUserEmail } from '../services/auth.service.js';

/**
* Registers a new user by creating an account and sending a verification email.
* @param req - The Express request object containing the user's email and name in the body.
* @param res - The Express response object used to send back the appropriate HTTP response.
* @returns A promise that resolves to void.
**/
export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: "Email and password are required." });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ error: "Password must be at least 8 characters long." });
            return;
        }

        const newUser = await createUser(email, password, name);

        res.status(201).json({
            message: "Account created successfully. Please check your emails.",
            user: { id: newUser.id, email: newUser.email, name: newUser.name }
        });
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ error: "This email is already in use." });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
};

/**
* Confirms a user's email address using a verification token.
* @param req - The Express request object containing the verification token in the URL parameters.
* @param res - The Express response object used to send back the appropriate HTTP response.
* @returns A promise that resolves to void.
**/
export const confirmEmail = async (req: Request, res: Response): Promise<void> => {

    try {
        const { token } = req.params;

        if (typeof token !== 'string') {
            res.status(400).json({ error: "Invalid token format." });
            return;
        }

        await verifyUserEmail(token);

        res.status(200).json({ message: "Email confirmed successfully." });

    } catch (error: any) {
        if (error.message === "INVALID_TOKEN") {
            res.status(400).json({ error: "Invalid token format." });
            return;
        }
        console.error(error);
        res.status(500).json({ error: "Internal server error." });
    }
};
