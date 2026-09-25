import type { Request, Response } from 'express';

export const getAboutJson = (req: Request, res: Response): void => {

    let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }

    res.status(200).json({
        client: {
            host: clientIp,
        },
        server: {
            current_time: Math.floor(Date.now() / 1000),
            services: [],
        },
    });
};