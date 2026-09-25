import type { Request, Response } from 'express';
import { AVAILABLE_SERVICES } from '../config/services.config.js';

export const getAboutJson = (req: Request, res: Response): void => {

    let clientIp = req.ip || req.socket.remoteAddress || '127.0.0.1';
    if (clientIp.startsWith('::ffff:')) {
        clientIp = clientIp.substring(7);
    }

    const services = AVAILABLE_SERVICES.map((service) => ({
        name: service.name,
        widgets: service.widgets.map((widget) => ({
            name: widget.name,
            description: widget.description,
            params: widget.params.map((param) => ({
                name: param.name,
                type: param.type,
            })),
        })),
    }));

    res.status(200).json({
        client: {
            host: clientIp,
        },
        server: {
            current_time: Math.floor(Date.now() / 1000),
            services,
        },
    });
};