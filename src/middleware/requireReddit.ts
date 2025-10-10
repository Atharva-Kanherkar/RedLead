// src/middleware/requireReddit.ts
import { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { log } from '../lib/logger';

/**
 * Middleware to ensure user has connected their Reddit account
 *
 * This prevents users from using features that require Reddit access
 * without actually connecting their account. All lead discovery features
 * MUST use the user's own Reddit account, not the app's account.
 */
export const requireRedditConnection: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                hasConnectedReddit: true,
                redditRefreshToken: true,
                redditUsername: true
            }
        });

        if (!user) {
            res.status(404).json({ message: 'User not found.' });
            return;
        }

        // Check if user has connected Reddit
        if (!user.hasConnectedReddit || !user.redditRefreshToken) {
            log.warn('User attempted Reddit feature without connection', { userId });

            res.status(403).json({
                error: 'Reddit account not connected',
                message: 'You must connect your Reddit account to use this feature.',
                action: 'connect_reddit',
                redirectUrl: '/connect-reddit'
            });
            return;
        }

        // Attach Reddit credentials to request for use in controllers
        req.redditRefreshToken = user.redditRefreshToken;
        req.redditUsername = user.redditUsername;

        log.debug('Reddit connection verified', { userId, username: user.redditUsername });
        next();

    } catch (error) {
        log.error('Error checking Reddit connection', error);
        next(error);
    }
};
