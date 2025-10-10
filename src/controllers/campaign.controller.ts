import { RequestHandler } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

/**
 * Fetches all campaigns for the currently authenticated user
 */
export const getCampaignsForUser: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID from Clerk
    const { userId } = req.auth;

    // Ensure the user is authenticated
    if (!userId) {
         res.status(401).json({ message: 'User not authenticated.' });
         return;
    }

    try {
        const campaigns = await prisma.campaign.findMany({
            where: { userId }, // Use the authenticated userId
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        plan: true,
                        subscriptionStatus: true
                    }
                },
                _count: {
                    select: {
                        leads: true
                    }
                }
            }
        });

        res.status(200).json(campaigns);
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        next(error);
    }
};

/**
 * Fetches a specific campaign by ID, ensuring it belongs to the authenticated user
 */
export const getCampaignById: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID from Clerk
    const { userId } = req.auth;
    const { campaignId } = req.params;

    // Ensure the user is authenticated
    if (!userId) {
         res.status(401).json({ message: 'User not authenticated.' });
         return
    }

    if (!campaignId) {
         res.status(400).json({ message: 'Campaign ID is required.' });
         return
    }

    try {
        const campaign = await prisma.campaign.findUnique({
            // Secure the query by checking for both campaignId AND userId
            where: { 
                id: campaignId,
                userId: userId 
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        plan: true,
                        subscriptionStatus: true
                    }
                },
                _count: {
                    select: {
                        leads: true
                    }
                }
            }
        });

        if (!campaign) {
            // Return 404 whether the campaign doesn't exist or doesn't belong to the user
            // This prevents leaking information about the existence of campaigns.
             res.status(404).json({ message: 'Campaign not found.' });
             return
        }

        res.status(200).json(campaign);
    } catch (error) {
        console.error('Error fetching campaign:', error);
        next(error);
    }
};