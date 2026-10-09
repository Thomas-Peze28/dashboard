import type { Request, Response } from 'express';
import * as widgetService from '../services/widget.service.js';

const MIN_REFRESH_INTERVAL = 5;

/**
* Checks that a refresh interval is either omitted or an integer of at least MIN_REFRESH_INTERVAL seconds.
* @param value - The refresh interval received in the request body.
* @returns True if the value is undefined or a valid interval.
**/
const isValidRefreshInterval = (value: unknown): boolean => {
    return value === undefined || (Number.isInteger(value) && (value as number) >= MIN_REFRESH_INTERVAL);
};

/** 
* Lists all widgets for a specific user.
* @param req - The request object.
* @param res - The response object.
**/
export const listUserWidgets = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.user!.userId;
        const widgets = await widgetService.getUserWidgets(userId);
        res.status(200).json({ widgets });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error occurred while fetching widgets.' });
    }
};

/** 
* Adds a new widget to the user's dashboard.
* @param req - The request object.
* @param res - The response object.
**/
export const addUserWidget = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.user!.userId;
        const { widgetId, config, refreshInterval, positionX, positionY, width, height } = req.body;

        if (!widgetId || typeof config !== 'object' || config === null) {
            res.status(400).json({ error: 'widgetId and config are required.' });
            return;
        }

        if (!isValidRefreshInterval(refreshInterval)) {
            res.status(400).json({ error: `refreshInterval must be an integer >= ${MIN_REFRESH_INTERVAL} seconds.` });
            return;
        }

        const newWidget = await widgetService.createUserWidget(userId, {
            widgetId,
            config,
            refreshInterval,
            positionX,
            positionY,
            width,
            height,
        });

        res.status(201).json({ widget: newWidget });
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'WIDGET_NOT_FOUND') {
            res.status(404).json({ error: 'Widget not found in the catalog.' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error occurred while creating the widget.' });
    }
};

/** 
* Updates an existing widget on the user's dashboard.
* @param req - The request object.
* @param res - The response object.
**/
export const editUserWidget = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { widgetId, config, refreshInterval, positionX, positionY, width, height } = req.body;

        if (typeof id !== 'string') {
            res.status(400).json({ error: 'Widget id is required.' });
            return;
        }

        if (!isValidRefreshInterval(refreshInterval)) {
            res.status(400).json({ error: `refreshInterval must be an integer >= ${MIN_REFRESH_INTERVAL} seconds.` });
            return;
        }

        const updated = await widgetService.updateUserWidget(userId, id, {
            widgetId,
            config,
            refreshInterval,
            positionX,
            positionY,
            width,
            height,
        });

        res.status(200).json({ widget: updated });
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'USER_WIDGET_NOT_FOUND') {
            res.status(404).json({ error: 'Widget not found.' });
            return;
        }
        if (error instanceof Error && error.message === 'WIDGET_NOT_FOUND') {
            res.status(404).json({ error: 'Widget not found in the catalog.' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error occurred while updating the widget.' });
    }
};

/** 
* Removes a widget from the user's dashboard.
* @param req - The request object.
* @param res - The response object.
**/
export const removeUserWidget = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        if (typeof id !== 'string') {
            res.status(400).json({ error: 'Widget id is required.' });
            return;
        }

        await widgetService.deleteUserWidget(userId, id);
        res.status(204).send();
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'USER_WIDGET_NOT_FOUND') {
            res.status(404).json({ error: 'Widget not found.' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error occurred while deleting the widget.' });
    }
};

/**
* HTTP responses for the errors thrown by the widget handlers.
**/
const WIDGET_DATA_ERRORS: Record<string, { status: number; message: string }> = {
    USER_WIDGET_NOT_FOUND: { status: 404, message: 'Widget not found.' },
    NOT_IMPLEMENTED: { status: 501, message: 'Widget data not implemented.' },
    INVALID_WIDGET_CONFIG: { status: 400, message: 'Invalid widget configuration.' },
    CITY_NOT_FOUND: { status: 400, message: 'City not found.' },
    GITHUB_NOT_FOUND: { status: 400, message: 'GitHub resource not found.' },
    GITHUB_NOT_LINKED: { status: 403, message: 'No GitHub account linked. Please sign in with GitHub.' },
    GITHUB_TOKEN_INVALID: { status: 403, message: 'GitHub token expired or revoked. Please sign in with GitHub again.' },
    GITHUB_FORBIDDEN: { status: 403, message: 'Missing GitHub permissions. Please sign in with GitHub again.' },
    GITHUB_RATE_LIMITED: { status: 429, message: 'GitHub rate limit reached. Please try again later.' },
    POKEMON_CARD_NOT_FOUND: { status: 400, message: 'Pokémon card not found.' },
    UPSTREAM_ERROR: { status: 502, message: 'External service unavailable.' },
};

/** 
* Fetches the data of a specific widget.
* @param req - The request object.
* @param res - The response object.
**/
export const getWidgetData = async (req: Request, res: Response): Promise<void> => {

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        if (typeof id !== 'string') {
            res.status(400).json({ error: 'Widget ID is required.' });
            return;
        }

        const data = await widgetService.fetchUserWidgetData(userId, id);
        res.status(200).json({ data });
    } catch (error: unknown) {
        const known = error instanceof Error ? WIDGET_DATA_ERRORS[error.message] : undefined;

        if (known) {
            res.status(known.status).json({ error: known.message });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error occurred while fetching widget data.' });
    }
};