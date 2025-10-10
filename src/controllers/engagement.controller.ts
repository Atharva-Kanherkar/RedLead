import { RequestHandler } from 'express';
import { generateReplyOptions, refineReply } from '../services/engagement.service';
// Removed: import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

export const getReplyOptions: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    // --- MODIFIED: Destructure 'funMode' from the request body ---
    const { leadId, funMode } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!leadId) {
        return res.status(400).json({ message: 'A leadId is required.' });
    }

    try {
        // --- MODIFIED: Pass 'funMode' to the service ---
        const replies = await generateReplyOptions(leadId, userId, funMode);
        res.status(200).json({ replies });
    } catch (error) {
        next(error);
    }
};



/**
 * Handles the request to refine an existing reply based on an instruction.
 * This is a protected action, requiring an authenticated user.
 */
export const postRefineReply: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID to ensure the action is performed by a valid user.
    const { userId } = req.auth;
    const { originalReply, instruction } = req.body;

    // Ensure the user is authenticated
    if (!userId) {
         res.status(401).json({ message: 'User not authenticated.' });
         return
    }

    if (!originalReply || !instruction) {
          res.status(400).json({ message: 'Both originalReply and instruction are required.' });
          return
    }

    try {
        const refinedReply = await refineReply(originalReply, instruction);
        res.status(200).json({ refinedReply });
    } catch (error) {
        next(error);
    }
};

 
 
/**
 * Creates a placeholder reply record so the worker can track a manually posted reply.
 */
export const prepareReplyForTracking: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { leadId, content } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }
    if (!leadId || !content) {
        return res.status(400).json({ message: 'leadId and content are required.' });
    }

    try {
        const lead = await prisma.lead.findFirst({
            where: { id: leadId, userId: userId }
        });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found.' });
        }

        // Create a reply record with a PENDING status
        await prisma.scheduledReply.create({
            data: {
                content,
                status: "POSTED",
                scheduledAt: new Date(), // Add scheduledAt as required
                lead: { connect: { id: lead.id } },
                user: { connect: { id: userId } },
                // Other fields like redditPostId and postedAt will be null initially
            }
        });

        // Update the lead's status to 'replied'
        await prisma.lead.update({
            where: { id: leadId },
            data: { status: 'replied' }
        });

        res.status(200).json({ message: 'Reply is now being tracked. Please post it on Reddit.' });
    } catch (error) {
        console.error('❌ [Prepare Tracking] Error:', error);
        next(error);
    }
};