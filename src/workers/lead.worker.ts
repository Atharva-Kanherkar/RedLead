import { PrismaClient, LeadType, User, Campaign, Lead } from '@prisma/client';
import { findLeadsInSubmissions, findLeadsInComments, RawLead } from '../services/reddit.service';
import { enrichLeadsForUser, EnrichedLead } from '../services/enrichment.service';
import { analyzeSentiment } from '../services/ai.service';
import { calculateLeadScore } from '../services/scoring.service';
import { webhookService } from '../services/webhook.service';
import { AIUsageService } from '../services/aitracking.service';
// Import the email notification service
import { sendNewLeadsNotification } from '../services/email.service';


import { prisma } from '../lib/prisma';
const BATCH_SIZE = 50; // Process 50 campaigns at a time
const MAX_RETRIES = 3;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Saves leads to the database, sends webhooks, and returns the successfully saved leads.
 * @returns A promise that resolves to an array of the leads that were saved.
 */
const saveLeadsToDatabase = async (
    leads: EnrichedLead[],
    campaignId: string,
    userId: string,
    leadType: LeadType
): Promise<Lead[]> => {
    const savedLeads: Lead[] = [];
    const highQualityLeadsForWebhook: (EnrichedLead & { id: string })[] = [];

    for (const lead of leads) {
        try {
            // Use upsert to prevent duplicates based on the lead's URL
            const savedLead = await prisma.lead.upsert({
                where: { url: lead.url },
                update: {}, // Don't update if it already exists
                create: {
                    redditId: lead.id,
                    title: lead.title,
                    author: lead.author,
                    subreddit: lead.subreddit,
                    url: lead.url,
                    body: lead.body,
                    postedAt: new Date(lead.createdAt * 1000),
                    opportunityScore: lead.opportunityScore,
                    campaignId: campaignId,
                    userId: userId,
                    type: leadType,
                    intent: lead.intent,
                    sentiment: (lead as any).sentiment || null,
                }
            });
            
            // This logic assumes a lead returned from upsert is one we should notify about
            // A more complex check could be added here if needed (e.g., checking created vs updated)
            savedLeads.push(savedLead);

            if (lead.opportunityScore >= 70) {
                highQualityLeadsForWebhook.push({ ...lead, id: savedLead.id });
            }
        } catch (error: any) {
            // Prisma's P2002 code for unique constraint violation is expected and can be ignored.
            if (error.code !== 'P2002') {
                console.error(`Failed to save lead ${lead.id}:`, error.message);
            }
        }
    }

    // Broadcast high-quality leads via webhooks
    for (const lead of highQualityLeadsForWebhook) {
        try {
            await webhookService.broadcastEvent('lead.discovered', {
                title: lead.title,
                subreddit: lead.subreddit,
                author: lead.author,
                opportunityScore: lead.opportunityScore,
                intent: lead.intent,
                url: lead.url,
                numComments: (lead as any).numComments,
                upvoteRatio: (lead as any).upvoteRatio,
                createdAt: lead.createdAt,
                body: lead.body,
                id: lead.id,
                campaignId: campaignId
            }, userId, campaignId, getPriorityFromScore(lead.opportunityScore));
        } catch (webhookError) {
            console.error(`Failed to broadcast webhook for lead ${lead.id}:`, webhookError);
        }
    }

    return savedLeads;
};

const getPriorityFromScore = (score: number): 'low' | 'medium' | 'high' | 'urgent' => {
    if (score >= 90) return 'urgent';
    if (score >= 80) return 'high';
    if (score >= 70) return 'medium';
    return 'low';
};

export const runLeadDiscoveryWorker = async (): Promise<void> => {
    console.log('Starting lead discovery worker run...');
    let cursor: string | null = null;

    while (true) {
        const campaigns: (Campaign & { user: User })[] = await prisma.campaign.findMany({
            take: BATCH_SIZE,
            ...(cursor && { skip: 1, cursor: { id: cursor } }),
            where: {
                isActive: true,
                user: {
                    subscriptionStatus: { in: ['active', 'trialing'] },
                    hasConnectedReddit: true, // CRITICAL: Only process users with Reddit connected
                    redditRefreshToken: { not: null }
                }
            },
            include: { user: true },
            orderBy: { id: 'asc' }
        });

        if (campaigns.length === 0) {
            console.log('No more active campaigns to process. Worker run finished.');
            break;
        }

        for (const campaign of campaigns) {
            let retries = 0;
            while (retries < MAX_RETRIES) {
                try {
                    const user = campaign.user;
                    if (!user) {
                        console.log(`Skipping campaign ${campaign.id} as it has no associated user.`);
                        break;
                    }

                    const currentLeadCount = await getCurrentMonthLeadCount(user.id);
                    const leadLimit = getUserLeadLimit(user);

                    if (currentLeadCount >= leadLimit) {
                        console.log(`⚠️  User ${user.id} has reached lead limit (${currentLeadCount}/${leadLimit})`);
                        break;
                    }

                    console.log(`Processing campaign ${campaign.id} for user ${user.id}`);

                    // CRITICAL: Ensure user has Reddit connected
                    if (!user.redditRefreshToken) {
                        console.log(`⚠️  Skipping campaign ${campaign.id} - user ${user.id} has not connected Reddit`);
                        break;
                    }

                    if (user.plan === 'pro' && campaign.competitors && campaign.competitors.length > 0) {
                        const aiUsage = AIUsageService.getInstance();
                        const canUseCompetitorAI = await aiUsage.trackAIUsage(user.id, 'competitor', user.plan);

                        if (canUseCompetitorAI) {
                            console.log(`[Worker] Running TARGETED competitor search for campaign ${campaign.id} using user's Reddit account...`);
                            const [submissionLeads, commentLeads] = await Promise.all([
                                findLeadsInSubmissions(campaign.competitors, campaign.targetSubreddits, user.redditRefreshToken),
                                findLeadsInComments(campaign.competitors, campaign.targetSubreddits, user.redditRefreshToken)
                            ]);

                            const competitorLeads = [...submissionLeads, ...commentLeads];
                            const uniqueCompetitorLeadsMap = new Map<string, RawLead>();
                            competitorLeads.forEach(lead => {
                                if(!uniqueCompetitorLeadsMap.has(lead.url)) {
                                    uniqueCompetitorLeadsMap.set(lead.url, lead);
                                }
                            });
                            const uniqueCompetitorLeads = Array.from(uniqueCompetitorLeadsMap.values());

                            if (uniqueCompetitorLeads.length > 0) {
                                const enrichedCompetitorLeads = await Promise.all(
                                    uniqueCompetitorLeads.map(async (lead): Promise<EnrichedLead> => {
                                        const sentiment = await analyzeSentiment(lead.title, lead.body, user.id, user.plan);
                                        const opportunityScore = calculateLeadScore({ ...lead, sentiment, type: 'COMPETITOR_MENTION' });
                                        return { ...lead, sentiment, opportunityScore, intent: 'competitor_mention' };
                                    })
                                );
                                
                                // Save leads and get the ones that were newly created
                                const savedLeads = await saveLeadsToDatabase(enrichedCompetitorLeads, campaign.id, user.id, 'COMPETITOR_MENTION');
                                console.log(`  -> Saved ${savedLeads.length} competitor leads for user ${user.id}`);

                                // ✨ SEND NOTIFICATION EMAIL IF NEW LEADS WERE SAVED ✨
                                if (savedLeads.length > 0) {
                                    await sendNewLeadsNotification(user, savedLeads, campaign.name);
                                }
                            } else {
                                console.log(`  -> No new competitor leads found for campaign ${campaign.id}`);
                            }
                        } else {
                            console.log(`[Worker] Skipping competitor search for user ${user.id} due to usage limits.`);
                        }
                    }

                    break; // Success, exit retry loop
                } catch (error) {
                    retries++;
                    console.error(`Error processing campaign ${campaign.id} (attempt ${retries}/${MAX_RETRIES}):`, error);
                    if (retries >= MAX_RETRIES) {
                        console.error(`Failed to process campaign ${campaign.id} after ${MAX_RETRIES} attempts.`);
                    } else {
                        await delay(1000 * Math.pow(2, retries)); // Exponential backoff
                    }
                }
            }
        }
        cursor = campaigns[campaigns.length - 1].id;
    }
};

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

const getUserLeadLimit = (user: User): number => {
    switch (user.plan) {
        case 'free': return 25;
        case 'starter': return 200;
        case 'pro': return 1000;
        default: return 25;
    }
};