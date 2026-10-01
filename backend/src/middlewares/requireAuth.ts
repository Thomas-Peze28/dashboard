import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { TokenPayload } from '../types/express.d.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
* Middleware to require authentication for a route.
* @param req - The Express request object.
* @param res - The Express response object.
* @param next - The Express next function.
**/
export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Access denied: token missing.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'Access denied: token malformed.' });
        return;
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Access denied: token invalid or expired.' });
    }
};