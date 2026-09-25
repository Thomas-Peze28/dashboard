import type { Request, Response } from 'express';
import { getUserById } from '../services/user.service.js';

/**
* Retrieves the current user's information.
* @param req - The Express request object.
* @param res - The Express response object.
* @returns A promise that resolves to void.
**/
export const getMe = async (req: Request, res: Response): Promise<void> => {

    try {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        const user = await getUserById(req.user.userId);
        res.status(200).json({ user });
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
            res.status(404).json({ error: 'User not found.' });
            return;
        }

        console.error(error);
        res.status(500).json({ error: 'Internal server error.' });
    }
};