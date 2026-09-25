import { prisma } from '../lib/prisma.js';

/**
* Retrieves a user by their ID from the database.
* @param userId - The ID of the user to retrieve.
* @returns A promise that resolves to the user object if found, or throws an error if not found.
* @throws An error if the user is not found.
**/
export const getUserById = async (userId: string) => {

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    return user;
};