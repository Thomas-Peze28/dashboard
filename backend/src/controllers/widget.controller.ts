import type { Request, Response } from 'express';
import * as widgetService from '../services/widget.service.js';

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
        const { config, positionX, positionY, width, height } = req.body;

        if (typeof id !== 'string') {
            res.status(400).json({ error: 'Widget id is required.' });
            return;
        }

        const updated = await widgetService.updateUserWidget(userId, id, {
            config,
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
        if (error instanceof Error && error.message === 'USER_WIDGET_NOT_FOUND') {
            res.status(404).json({ error: 'Widget not found.' });
            return;
        }
        if (error instanceof Error && error.message === 'NOT_IMPLEMENTED') {
            res.status(501).json({ error: 'Widget data not implemented.' });
            return;
        }
        console.error(error);
        res.status(500).json({ error: 'Error occurred while fetching widget data.' });
    }
};