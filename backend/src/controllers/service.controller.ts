import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AVAILABLE_SERVICES } from '../config/services.config.js';

/**
* Lists all available services.
* @param _req - The Express request object (not used in this function).
* @param res - The Express response object used to send back the appropriate HTTP response.
* @returns A promise that resolves to void.
**/
export const listServices = async (_req: Request, res: Response): Promise<void> => {

    try {
        const dbServices = await prisma.service.findMany({
            include: {
                widgets: true,
            },
            orderBy: { name: 'asc' },
        });

        const services = dbServices.map((service) => {
        
            const staticService = AVAILABLE_SERVICES.find((s) => s.name === service.name);

            return {
                id: service.id,
                name: service.name,
                description: service.description,
                widgets: service.widgets.map((widget) => {
                    const staticWidget = staticService?.widgets.find((w) => w.name === widget.name);
                    return {
                        id: widget.id,
                        name: widget.name,
                        description: widget.description,
                        params: staticWidget?.params ?? widget.params ?? [],
                    };
                }),
            };
        });

        res.status(200).json({ services });
    } catch (error) {
        console.error('Error fetching services catalog:', error);
        res.status(500).json({ error: 'Internal server error while fetching services catalog.' });
    }
};