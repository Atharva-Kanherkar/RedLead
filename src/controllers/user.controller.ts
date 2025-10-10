// src/controllers/user.controller.ts
import { RequestHandler } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/express';

import { prisma } from '../lib/prisma';

export const deleteCurrentUser: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        await prisma.user.delete({
            where: { id: userId },
        });
        console.log(`✅ Successfully deleted user ${userId} from local database.`);

        await clerkClient.users.deleteUser(userId);
        console.log(`✅ Successfully deleted user ${userId} from Clerk.`);

        res.status(200).json({ message: 'User account deleted successfully.' });
        return;

    } catch (error) {
        console.error(`❌ Error deleting user ${userId}:`, error);
        next(error);
    }
};

export const updateCurrentUser: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { firstName, lastName, publicMetadata } = req.body;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        // Update Clerk user
        const clerkUser = await clerkClient.users.updateUser(userId, {
            firstName,
            lastName,
            publicMetadata,
        });

        // Update your database
        const dbUser = await prisma.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
            },
        });

        res.status(200).json({ clerkUser, dbUser });
    } catch (error) {
        console.error(`Error updating user ${userId}:`, error);
        next(error);
    }
};