import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';

/** 
* Interface for creating a new user widget, including the widget ID, configuration, and optional position and size parameters.
**/
export interface CreateUserWidgetInput {
    widgetId: string;
    config: Record<string, unknown>;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
}

/** 
* Interface for updating an existing user widget, including the configuration and optional position and size parameters.
**/
export interface UpdateUserWidgetInput {
    config?: Record<string, unknown>;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
}

/**
* Fetches all widgets associated with a specific user, including the widget details and the service they belong to.
* @param userId - The ID of the user whose widgets are to be retrieved.
* @returns A promise that resolves to an array of user widgets with their associated widget and service details.
**/
export const getUserWidgets = async (userId: string) => {
    return prisma.userWidget.findMany({
        where: { userId },
        include: {
            widget: {
                include: {
                    service: true,
                },
            },
        },
        orderBy: { createdAt: 'asc' },
    });
};

/** 
* Creates a new user widget.
* @param userId - The ID of the user creating the widget.
* @param data - The data for the new user widget.
* @returns A promise that resolves to the created user widget.
**/
export const createUserWidget = async (userId: string, data: CreateUserWidgetInput) => {

    const widgetDefinition = await prisma.widget.findUnique({
        where: { id: data.widgetId },
    });

    if (!widgetDefinition) {
        throw new Error('WIDGET_NOT_FOUND');
    }

    return prisma.userWidget.create({
        data: {
            userId,
            widgetId: data.widgetId,
            config: data.config as Prisma.InputJsonValue,
            positionX: data.positionX ?? 0,
            positionY: data.positionY ?? 0,
            width: data.width ?? 2,
            height: data.height ?? 2,
        },
        include: {
            widget: {
                include: {
                    service: true,
                },
            },
        },
    });
};

/** 
* Updates an existing user widget.
* @param userId - The ID of the user who owns the widget.
* @param userWidgetId - The ID of the user widget to update.
* @param data - The new data for the user widget.
* @returns A promise that resolves to the updated user widget.
**/
export const updateUserWidget = async (userId: string, userWidgetId: string, data: UpdateUserWidgetInput) => {

    const existing = await prisma.userWidget.findFirst({
        where: { id: userWidgetId, userId },
    });

    if (!existing) {
        throw new Error('USER_WIDGET_NOT_FOUND');
    }

    return prisma.userWidget.update({
        where: { id: userWidgetId },
        data: {
            ...(data.config && { config: data.config as Prisma.InputJsonValue }),
            ...(data.positionX !== undefined && { positionX: data.positionX }),
            ...(data.positionY !== undefined && { positionY: data.positionY }),
            ...(data.width !== undefined && { width: data.width }),
            ...(data.height !== undefined && { height: data.height }),
        },
        include: {
            widget: {
                include: {
                    service: true,
                },
            },
        },
    });
};

/** 
* Deletes a user widget.
* @param userId - The ID of the user who owns the widget.
* @param userWidgetId - The ID of the user widget to delete.
* @returns A promise that resolves when the user widget is deleted.
**/
export const deleteUserWidget = async (userId: string, userWidgetId: string) => {

    const existing = await prisma.userWidget.findFirst({
        where: { id: userWidgetId, userId },
    });

    if (!existing) {
        throw new Error('USER_WIDGET_NOT_FOUND');
    }

    await prisma.userWidget.delete({
        where: { id: userWidgetId },
    });
};