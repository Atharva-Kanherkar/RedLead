import { RequestHandler } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

/**
 * Fetches market insights for a campaign, ensuring it belongs to the authenticated user.
 * Results are paginated and sorted by discovery date.
 */
export const getInsightsForCampaign: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { campaignId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!campaignId) {
         res.status(400).json({ message: 'Campaign ID is required.' });
         return;
    }

    try {
        // First, verify the user owns the campaign to prevent data leakage
        const campaign = await prisma.campaign.findFirst({
            where: { id: campaignId, userId: userId }
        });

        if (!campaign) {
            res.status(404).json({ message: 'Campaign not found.' });
            return;
        }

        const insights = await prisma.marketInsight.findMany({
            where: { 
                campaignId: campaignId,
                status: 'NEW'
            },
            orderBy: {
                discoveredAt: 'desc'
            },
            take: limit,
            skip: skip,
        });

        const totalInsights = await prisma.marketInsight.count({
            where: { campaignId: campaignId, status: 'NEW' }
        });

        res.status(200).json({
            data: insights,
            pagination: {
                total: totalInsights,
                page,
                limit,
                totalPages: Math.ceil(totalInsights / limit)
            }
        });
        return;

    } catch (error) {
        next(error);
    }
};

/**
 * Updates the status of a market insight, ensuring it belongs to the authenticated user.
 */
export const updateInsightStatus: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { insightId } = req.params;
    const { status } = req.body;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!insightId || !status) {
        res.status(400).json({ message: 'Insight ID and status are required.' });
        return;
    }

    const validStatuses = ['NEW', 'VIEWED', 'ACTIONED', 'IGNORED'];
    if (!validStatuses.includes(status)) {
        res.status(400).json({ message: 'Invalid status. Must be one of: NEW, VIEWED, ACTIONED, IGNORED' });
        return;
    }

    try {
        console.log(`📝 [Update Insight] User ${userId} attempting to update insight ${insightId} to: ${status}`);

        // Securely update only if the insight belongs to a campaign owned by the user
        const result = await prisma.marketInsight.updateMany({
            where: {
                id: insightId,
                campaign: {
                    userId: userId
                }
            },
            data: { status }
        });

        if (result.count === 0) {
            res.status(404).json({ message: 'Insight not found or you do not have permission to update it.' });
            return;
        }

        console.log(`✅ [Update Insight] Successfully updated insight status`);
        res.status(200).json({ message: 'Insight status updated successfully.' });
        return;

    } catch (error) {
        console.error('❌ [Update Insight] Error updating insight status:', error);
        next(error);
    }
};

/**
 * Adds a discovered competitor to the campaign's competitor list, ensuring ownership.
 */
export const addCompetitorToCampaign: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { insightId } = req.params;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!insightId) {
        res.status(400).json({ message: 'Insight ID is required.' });
        return;
    }

    try {
        console.log(`🏢 [Add Competitor] User ${userId} processing insight ${insightId}`);

        // Get the insight, but only if it belongs to a campaign owned by the authenticated user
        const insight = await prisma.marketInsight.findFirst({
            where: { 
                id: insightId,
                campaign: {
                    userId: userId
                }
            },
            include: { campaign: true }
        });

        if (!insight) {
            res.status(404).json({ message: 'Insight not found or you do not have permission to access it.' });
            return;
        }

        const currentCompetitors = insight.campaign.competitors.map(c => c.toLowerCase());
        const newCompetitorLower = insight.discoveredCompetitorName.toLowerCase();

        if (currentCompetitors.includes(newCompetitorLower)) {
            await prisma.marketInsight.update({
                where: { id: insightId },
                data: { status: 'ACTIONED' }
            });
            res.status(409).json({ message: 'Competitor is already being monitored.' });
            return;
        }

        const updatedCampaign = await prisma.campaign.update({
            where: { id: insight.campaignId },
            data: {
                competitors: {
                    push: insight.discoveredCompetitorName
                }
            }
        });

        const updatedInsight = await prisma.marketInsight.update({
            where: { id: insightId },
            data: { status: 'ACTIONED' }
        });

        console.log(`✅ [Add Competitor] Added "${insight.discoveredCompetitorName}" to campaign competitors`);
        res.status(200).json({
            message: 'Competitor added to campaign successfully',
            campaign: updatedCampaign,
            insight: updatedInsight
        });
        return;
        
    } catch (error) {
        console.error('❌ [Add Competitor] Error adding competitor to campaign:', error);
        next(error);
    }
};