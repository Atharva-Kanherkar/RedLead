import { Request, Response, NextFunction } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export const getUserUsage = async (req: any, res: Response, next: NextFunction) => {
    // Get the authenticated user's ID from Clerk's middleware
    const { userId } = req.auth;

    // Ensure the user is authenticated
    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                AIUsage: {
                    where: {
                        month: new Date().toISOString().slice(0, 7)
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const limits = getPlanLimits(user.plan);
        
        const currentUsage = user.AIUsage.reduce((acc, usage) => {
            (acc as any)[usage.type] = usage.count;
            return acc;
        }, {} as Record<string, number>);

        const leadCount = await getCurrentMonthLeadCount(userId);
        const keywordCount = await getCurrentKeywordCount(userId);

        res.json({
            leads: {
                current: leadCount,
                limit: limits.leads
            },
            replies: {
                current: currentUsage.reply || 0,
                limit: limits.replies
            },
            keywords: {
                current: keywordCount,
                limit: limits.keywords
            }
        });
    } catch (error) {
        console.error('Error fetching usage:', error);
        next(error);
    }
};

function getPlanLimits(plan: string) {
    switch (plan) {
        case 'free': return { leads: 25, replies: 0, keywords: 5 };
        case 'starter': return { leads: 200, replies: 75, keywords: 15 };
        case 'pro': return { leads: 1000, replies: 300, keywords: 50 };
        default: return { leads: 25, replies: 0, keywords: 5 };
    }
}

async function getCurrentMonthLeadCount(userId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return await prisma.lead.count({
        where: {
            userId,
            createdAt: { gte: startOfMonth }
        }
    });
}

async function getCurrentKeywordCount(userId: string): Promise<number> {
    const campaigns = await prisma.campaign.findMany({
        where: { userId },
        select: { generatedKeywords: true }
    });

    return campaigns.reduce((total, campaign) => 
        total + (campaign.generatedKeywords?.length || 0), 0
    );
}