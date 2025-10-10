// Removed: import { PrismaClient } from '@prisma/client';
import { getAppAuthenticatedInstance } from '../services/reddit.service';
import snoowrap from 'snoowrap';
import { distance } from 'fastest-levenshtein';

import { prisma } from '../lib/prisma';

// --- CONFIGURATION ---
const PENDING_REPLY_CHECK_INTERVAL_SECONDS = 60; 
const PERFORMANCE_CHECK_INTERVAL_HOURS = 4;
const PENDING_REPLY_TIMEOUT_HOURS = 24;

/**
 * A high-frequency worker that finds and links manually posted replies.
 */
export const findPendingRepliesWorker = async (): Promise<void> => {
    console.log('⚡ [High-Frequency Worker] Starting run...');
    
    const timeoutCutoff = new Date();
    timeoutCutoff.setHours(timeoutCutoff.getHours() - PENDING_REPLY_TIMEOUT_HOURS);

    const pendingReplies = await prisma.scheduledReply.findMany({
        where: {
            status: 'PENDING_MANUAL_POST',
            createdAt: { gte: timeoutCutoff }
        },
        include: {
            lead: true,
            user: true,
        }
    });

    if (pendingReplies.length === 0) {
        console.log('⚡ [High-Frequency Worker] No pending replies to link.');
        return;
    }
    
    console.log(`⚡ [High-Frequency Worker] Found ${pendingReplies.length} pending replies to link.`);
    const r = await getAppAuthenticatedInstance();

    for (const pending of pendingReplies) {
        try {
            if (!pending.lead.redditId || !pending.user.redditUsername) continue;

            const submission = r.getSubmission(pending.lead.redditId);
            // FIX: Use fetchMore with an amount to limit the initial API call.
            const comments = await submission.comments.fetchMore({ amount: 200 });

            const userComments = comments.filter(comment => 
                comment.author.name === pending.user.redditUsername &&
                new Date(comment.created_utc * 1000) > pending.createdAt
            );

            if (userComments.length === 0) continue;

            let bestMatch: snoowrap.Comment | null = null;
            let lowestDistance = Infinity;

            for (const comment of userComments) {
                const similarity = distance(comment.body, pending.content);
                if (similarity < lowestDistance) {
                    lowestDistance = similarity;
                    bestMatch = comment;
                }
            }

            if (bestMatch && lowestDistance < (pending.content.length * 0.2)) {
                await prisma.scheduledReply.update({
                    where: { id: pending.id },
                    data: {
                        status: 'POSTED',
                        redditPostId: bestMatch.name,
                        postedAt: new Date(bestMatch.created_utc * 1000),
                        upvotes: bestMatch.score,
                        lastCheckedAt: new Date(),
                    }
                });
                console.log(`✅ [High-Frequency Worker] Successfully linked pending reply ${pending.id} to comment ${bestMatch.name}`);
            }
        } catch (error) {
            console.error(`❌ [High-Frequency Worker] Error processing pending reply ${pending.id}:`, error);
        }
    }
    console.log('⚡ [High-Frequency Worker] Run finished.');
};

/**
 * A low-frequency worker that checks the performance of already posted replies.
 */
export const trackPostedReplyPerformanceWorker = async (): Promise<void> => {
    console.log('📊 [Low-Frequency Worker] Starting run...');
    const checkCutoff = new Date();
    checkCutoff.setHours(checkCutoff.getHours() - PERFORMANCE_CHECK_INTERVAL_HOURS);

    const repliesToTrack = await prisma.scheduledReply.findMany({
        where: {
            status: 'POSTED',
            redditPostId: { not: null },
            OR: [
                { lastCheckedAt: null },
                { lastCheckedAt: { lte: checkCutoff } }
            ]
        },
        include: {
            lead: true
        },
        take: 100,
    });

    if (repliesToTrack.length === 0) {
        console.log('📊 [Low-Frequency Worker] No posted replies need a performance check.');
        return;
    }

    console.log(`📊 [Low-Frequency Worker] Found ${repliesToTrack.length} posted replies to track.`);
    const r = await getAppAuthenticatedInstance();
    const replyIds = repliesToTrack.map(reply => reply.redditPostId).filter((id): id is string => id !== null);

    try {
        // FIX: Fetch comments individually using Promise.allSettled for better error handling
        const commentResults = await Promise.allSettled(
            replyIds.map(async (id) => {
                try {
                    //@ts-expect-error
                    const comment = await r.getComment(id);
                    return { id, comment };
                } catch (error) {
                    console.warn(`Failed to fetch comment ${id}:`, error);
                    return { id, comment: null };
                }
            })
        );

        // Create a map for successful fetches only
        const commentsMap = new Map<string, snoowrap.Comment>();
        commentResults.forEach((result) => {
            if (result.status === 'fulfilled' && result.value && result.value.comment) {
                commentsMap.set(result.value.id, result.value.comment);
            }
        });

        for (const reply of repliesToTrack) {
            try {
                const redditComment = commentsMap.get(reply.redditPostId!);
                if (!redditComment) {
                    await prisma.scheduledReply.update({
                        where: { id: reply.id },
                        data: { 
                            status: 'FAILED', 
                            failReason: 'Comment not found (likely deleted).', 
                            lastCheckedAt: new Date() 
                        }
                    });
                    continue;
                }

                const upvotes = redditComment.score;
                
                // FIX: Properly fetch replies with error handling
                let authorReplied = false;
                try {
                //@ts-expect-error
                    await redditComment.refresh(); // Ensure we have the latest data
                    const commentReplies = await (redditComment as any).replies.fetchAll();
                    authorReplied = commentReplies.some((r: any) => r.author && r.author.name === reply.lead.author);
                } catch (repliesError) {
                    console.warn(`Failed to fetch replies for comment ${reply.redditPostId}:`, repliesError);
                    // authorReplied remains false, which is acceptable fallback
                }

                await prisma.scheduledReply.update({
                    where: { id: reply.id },
                    data: {
                        upvotes,
                        authorReplied,
                        lastCheckedAt: new Date(),
                    }
                });
                console.log(`✅ [Low-Frequency Worker] Tracked reply ${reply.id}: Upvotes=${upvotes}, Author Replied=${authorReplied}`);
            } catch (error) {
                console.error(`❌ [Low-Frequency Worker] Error processing reply ${reply.id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ [Low-Frequency Worker] A critical error occurred during batch reply tracking:', error);
    }
    console.log('📊 [Low-Frequency Worker] Run finished.');
};

// In a real production environment, you would use a proper cron job manager (like node-cron)
// or a serverless function with a time-based trigger.
setInterval(findPendingRepliesWorker, PENDING_REPLY_CHECK_INTERVAL_SECONDS * 1000);
setInterval(trackPostedReplyPerformanceWorker, PERFORMANCE_CHECK_INTERVAL_HOURS * 60 * 60 * 1000);
