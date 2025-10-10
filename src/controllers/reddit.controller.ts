// src/controllers/reddit.controller.ts
import { RequestHandler } from 'express';
import snoowrap from 'snoowrap';
import { clerkClient } from '@clerk/express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { SnoowrapExtended } from '../types/snoowrap.types';
import { log } from '../lib/logger';

// This function now generates a secure, random state and stores it.
export const getRedditAuthUrl: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        const state = crypto.randomBytes(16).toString('hex');
        await prisma.user.update({
            where: { id: userId },
            data: { redditAuthState: state }
        });

        const authUrl = snoowrap.getAuthUrl({
            clientId: process.env.REDDIT_CLIENT_ID!,
            scope: ['identity', 'read', 'submit', 'history', 'edit'], // Added 'edit' scope
            redirectUri: process.env.REDDIT_REDIRECT_URI!,
            permanent: true,
            state: state
        });

        res.json({ authUrl });
        return;
    } catch (error) {
        next(error);
    }
};

// This function now securely verifies the state and stores the refresh token.
export const handleRedditCallback: RequestHandler = async (req, res, next) => {
    const { code, state } = req.query;
    if (!code || !state) {
        res.status(400).json({ message: 'Missing authorization code or state' });
        return;
    }

    try {
        const user = await prisma.user.findFirst({
            where: { redditAuthState: state as string }
        });

        if (!user) {
            res.status(400).json({ message: 'Invalid state parameter. Authentication failed.' });
            return;
        }

        const r = await snoowrap.fromAuthCode({
            code: code as string,
            userAgent: process.env.REDDIT_USER_AGENT!,
            clientId: process.env.REDDIT_CLIENT_ID!,
            clientSecret: process.env.REDDIT_CLIENT_SECRET!,
            redirectUri: process.env.REDDIT_REDIRECT_URI!
        });
        const redditExt = r as unknown as SnoowrapExtended;
        const me = await redditExt.getMe();
        
        // Update user with tokens and mark reddit as connected
        await prisma.user.update({
            where: { id: user.id },
            data: {
                redditUsername: me.name,
                redditRefreshToken: r.refreshToken,
                redditAuthState: null, // Clear the state
                hasConnectedReddit: true // Mark as connected
            }
        });
        // Update Clerk's public metadata to reflect Reddit connection
        await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
                hasConnectedReddit: true, // Set the flag here
                redditUsername: me.name,
            }
        });
        const metadataPayload = {
            publicMetadata: {
                hasConnectedReddit: true,
                redditUsername: me.name,
            }
        };

        console.log(`[LOG] Backend: Attempting to update Clerk metadata for user ${user.id} with payload:`, metadataPayload);


        
        // Also update Clerk's public metadata for easy frontend access
        await clerkClient.users.updateUser(user.id, {
            publicMetadata: {
                redditUsername: me.name,
            }
        });

        console.log(`[LOG] Backend: Successfully called clerkClient.users.updateUser for user ${user.id}.`);
        

        console.log(`✅ Reddit account connected for user ${user.id}: u/${me.name}`);
        res.redirect(`${process.env.FRONTEND_URL}/connect-reddit?status=success`);
        return;
        
    } catch (error) {
        console.error('Error in Reddit callback:', error);
        res.redirect(`${process.env.FRONTEND_URL}/dashboard/settings?error=reddit`);
        return;
    }
};

/**
 * Disconnects user's Reddit account
 */
export const disconnectReddit: RequestHandler = async (req, res, next) => {
    const { userId } = req.params;
    
    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                redditUsername: null,
                redditRefreshToken: null,
                redditKarma: null,
                lastKarmaCheck: null
            }
        });

        res.json({ message: 'Reddit account disconnected successfully' });
    } catch (error) {
        console.error('Error disconnecting Reddit:', error);
        next(error);
    }
};