// Removed: import { PrismaClient } from '@prisma/client';
import { checkKarmaThreshold, getUserKarma, postReplyAsUser } from '../services/reddit.service';
import { RequestHandler } from 'express';
import { summarizeTextContent } from '../services/summarisation.service';

import { prisma } from '../lib/prisma';
const MINIMUM_KARMA_TO_POST = 1;

export const postReplyToLead: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { leadId, content } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!leadId || !content) {
        return res.status(400).json({ message: 'leadId and content are required.' });
    }

    try {
        // 1. Fetch user and lead data securely
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const lead = await prisma.lead.findFirst({ 
            where: { id: leadId, userId: userId } 
        });

        if (!user || !lead) {
            return res.status(404).json({ message: 'User or Lead not found.' });
        }

        if (!user.redditRefreshToken) {
            return res.status(403).json({ 
                message: 'Reddit account not connected. Please connect your account in settings.',
                requiresRedditAuth: true 
            });
        }

        if (!lead.redditId) {
            return res.status(400).json({ message: 'Lead does not have a valid Reddit ID to reply to.' });
        }

        // 2. Check karma threshold before attempting to post
        const hasEnoughKarma = await checkKarmaThreshold(user.redditRefreshToken, MINIMUM_KARMA_TO_POST);
        if (!hasEnoughKarma) {
            const currentKarma = await getUserKarma(user.redditRefreshToken);
            return res.status(403).json({ 
                message: `Your Reddit karma is too low. You need at least ${MINIMUM_KARMA_TO_POST} karma to post.`,
                currentKarma: currentKarma
            });
        }

        // 3. Post the reply to Reddit using the user's own account
        console.log(`[POST REPLY] User ${user.redditUsername} posting to lead ${lead.redditId}`);
        const newRedditPostId = await postReplyAsUser(lead.redditId, content, user.redditRefreshToken);
        console.log(`[POST REPLY] Successfully posted to Reddit. New comment ID: ${newRedditPostId}`);

        // 4. Record the action for performance tracking with all necessary fields
        await prisma.scheduledReply.create({
            data: {
                content,
                status: 'POSTED',
                postedAt: new Date(),
                scheduledAt: new Date(), // Add this line to satisfy the required property
                redditPostId: newRedditPostId,
                upvotes: 1, // Start with 1 upvote (the user's own)
                authorReplied: false,
                lastCheckedAt: new Date(),
                lead: { connect: { id: lead.id } },
                user: { connect: { id: user.id } },
            }
        });
        
        // 5. Update the original lead's status to 'replied'
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: 'replied' }
        });

        return res.status(201).json({ 
            message: 'Reply posted and tracking initiated!', 
            redditPostId: newRedditPostId,
            postedAs: user.redditUsername
        });

    } catch (error: any) {
        console.error('❌ [POST REPLY] Error posting reply:', error);
        
        const leadForError = await prisma.lead.findUnique({ where: { id: leadId } });
        const redditUrl = leadForError?.redditId 
            ? `https://reddit.com${leadForError.url}`
            : 'https://reddit.com';

        if (error.message.includes('403')) {
            return res.status(403).json({ 
                message: 'Reddit blocked this post. Your account may be restricted, shadowbanned, or banned from this subreddit.',
                error: 'REDDIT_FORBIDDEN',
                redditUrl: redditUrl
            });
        } 
        if (error.message.includes('429')) {
            return res.status(429).json({ 
                message: 'Rate limited by Reddit. Please wait before posting again.',
                error: 'REDDIT_RATE_LIMIT'
            });
        } 
        
        return res.status(500).json({ 
            message: 'An unexpected error occurred while trying to post the reply.',
            error: error.message
        });
    }
};

export const summarizeLead: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { id: leadId } = req.params;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    try {
        const lead = await prisma.lead.findFirst({
            where: { 
                id: leadId,
                userId: userId
            },
        });

        if (!lead) {
              return res.status(404).json({ message: 'Lead not found or you do not have permission to access it.' });
        }

        if (!lead.body || lead.body.trim().length === 0) {
             return res.status(400).json({ message: 'Lead has no content to summarize.' });
        }

        console.log(`[SUMMARIZE] User ${userId} requesting summary for lead ${leadId}`);
        const summary = await summarizeTextContent(lead.body);

        const updatedLead = await prisma.lead.update({
            where: { id: leadId },
            data: { summary },
        });

        return res.status(200).json({ summary: updatedLead.summary });

    } catch (error) {
        next(error);
    }
};