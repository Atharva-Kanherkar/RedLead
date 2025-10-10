import { RequestHandler } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

/**
 * Fetches reply performance metrics for the authenticated user
 */
export const getReplyPerformance: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID from Clerk
    const { userId } = req.auth;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Ensure user is authenticated
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        console.log(`📊 [Performance] Fetching reply performance for user: ${userId}`);

        // Securely query for replies belonging to the authenticated user
        const whereClause = { 
            lead: {
                userId: userId
            }
        };

        const replies = await prisma.scheduledReply.findMany({
            where: whereClause,
            include: {
                lead: {
                    select: {
                        id: true,
                        title: true,
                        subreddit: true,
                        url: true,
                        author: true
                    }
                }
            },
            orderBy: {
                postedAt: 'desc'
            },
            take: limit,
            skip: skip,
        });

        const totalReplies = await prisma.scheduledReply.count({
            where: whereClause
        });

        const totalUpvotes = replies.reduce((sum, reply) => sum + (reply.upvotes || 0), 0);
        const repliesWithAuthorResponse = replies.filter(reply => reply.authorReplied).length;
        const averageUpvotes = replies.length > 0 ? totalUpvotes / replies.length : 0;
        const responseRate = replies.length > 0 ? (repliesWithAuthorResponse / replies.length) * 100 : 0;

        console.log(`📊 [Performance] Found ${replies.length} replies with ${totalUpvotes} total upvotes`);

        res.status(200).json({
            data: replies,
            pagination: {
                total: totalReplies,
                page,
                limit,
                totalPages: Math.ceil(totalReplies / limit)
            },
            metrics: {
                totalReplies,
                totalUpvotes,
                averageUpvotes: Math.round(averageUpvotes * 10) / 10,
                responseRate: Math.round(responseRate * 10) / 10,
                repliesWithAuthorResponse
            }
        });
        return;

    } catch (error) {
        console.error('❌ [Performance] Error fetching reply performance:', error);
        next(error);
    }
};

/**
 * Fetches detailed performance for a specific reply, ensuring it belongs to the authenticated user
 */
export const getReplyDetails: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID from Clerk
    const { userId } = req.auth;
    const { replyId } = req.params;

    // Ensure user is authenticated
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!replyId) {
        res.status(400).json({ message: 'Reply ID is required.' });
        return;
    }

    try {
        // Securely find the reply, ensuring it belongs to the authenticated user
        const reply = await prisma.scheduledReply.findFirst({
            where: { 
                id: replyId,
                lead: {
                    userId: userId
                } 
            },
            include: {
                lead: {
                    include: {
                        campaign: {
                            select: {
                                id: true,
                                name: true,
                                generatedDescription: true
                            }
                        }
                    }
                }
            }
        });

        if (!reply) {
            res.status(404).json({ message: 'Reply not found or you do not have permission to access it.' });
            return;
        }

        res.status(200).json(reply);
        return;
        
    } catch (error) {
        console.error('❌ [Performance] Error fetching reply details:', error);
        next(error);
    }
};