// Removed: import { PrismaClient } from '@prisma/client';
// Import the new 'generateFunReplies' function alongside the existing ones
import { generateAIReplies, refineAIReply, generateFunReplies } from './ai.service';

import { prisma } from '../lib/prisma';

/**
 * Generates reply options for a given lead.
 * Can operate in standard mode or "Fun Mode".
 *
 * @param leadId - The ID of the lead to generate replies for.
 * @param userId - The ID of the user requesting the replies.
 * @param funMode - A boolean flag to enable "Fun Mode".
 * @returns A promise that resolves to an array of reply strings.
 */
export const generateReplyOptions = async (leadId: string, userId: any, funMode: boolean = false): Promise<string[]> => {
    // Fetch the lead ensuring it belongs to the authenticated user
    const lead = await prisma.lead.findUnique({
        where: {
            id: leadId,
            userId: userId // Security: Ensure the lead belongs to the user
        },
        include: {
            campaign: {
                include: {
                    user: true
                }
            }
        }
    });

    if (!lead) {
        throw new Error('Lead not found or you do not have permission to access it.');
    }

    const companyDescription = lead.campaign.generatedDescription || "our awesome product";

    // --- Fun Mode Logic ---
    // If funMode is enabled, generate witty, off-topic replies.
    if (funMode) {
        console.log(`[Fun Mode] Generating replies for lead: "${lead.title}"`);
        // Call the new function for generating fun replies
        return await generateFunReplies(lead.title, lead.body, companyDescription);
    }

    // --- Standard Mode Logic ---
    // Fetch subreddit-specific context for generating relevant replies.
    const subredditProfile = await prisma.subredditProfile.findUnique({
        where: { name: lead.subreddit }
    });

    const cultureNotes = subredditProfile?.cultureNotes ?? "Be generally respectful and helpful.";
    const rules = subredditProfile?.rules ?? ["No spam."];

    // Generate standard, context-aware replies.
    const replies = await generateAIReplies(
        lead.title,
        lead.body,
        companyDescription,
        cultureNotes,
        rules
    );

    return replies;
};

/**
 * Refines a given reply based on a user's instruction.
 *
 * @param originalReply - The reply string to be refined.
 * @param instruction - The user's instruction for how to change the reply.
 * @returns A promise that resolves to the refined reply string.
 */
export const refineReply = async (originalReply: string, instruction: string): Promise<string> => {
    if (!originalReply || !instruction) {
        throw new Error("Original reply and instruction are required.");
    }
    
    // Call the AI service to refine the text based on instructions.
    const refinedText = await refineAIReply(originalReply, instruction);

    return refinedText;
};