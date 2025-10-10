import { RequestHandler } from 'express';
import { findLeadsGlobally, findLeadsOnReddit } from '../services/reddit.service';
import { enrichLeadsForUser } from '../services/enrichment.service';
import { summarizeTextContent } from '../services/summarisation.service';
import { calculateContentRelevance } from '../services/relevance.service';
import { AIUsageService } from '../services/aitracking.service';
import { sendNewLeadsNotification } from '../services/email.service';
import { prisma } from '../lib/prisma';
import { log } from '../lib/logger';

export const runManualDiscovery: RequestHandler = async (req: any, res, next) => {
    // Get the authenticated user's ID from Clerk
    const { userId } = req.auth;
    const { campaignId } = req.params;

    // Ensure the user is authenticated
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!campaignId) {
         res.status(400).json({ message: 'Campaign ID is required.' });
         return;
    }

    try {
        console.log(`🔍 [Manual Discovery] User ${userId} starting for campaign: ${campaignId}`);
        
        // Securely find the campaign, ensuring it belongs to the authenticated user
        const campaign = await prisma.campaign.findFirst({
            where: { 
                id: campaignId,
                userId: userId 
            },
            include: { user: true }
        });

        if (!campaign || !campaign.user) {
             res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
             return;
        }

        const user = campaign.user;
        const usageService = AIUsageService.getInstance();
        const canRun = await usageService.trackAIUsage(userId, 'manual_discovery', user.plan);
        if (!canRun) {
            return res.status(429).json({ message: "You've reached your monthly discovery limit. Please upgrade your plan for more." });
        }
        
        
        // CRITICAL: Check if user has connected Reddit
        if (!user.redditRefreshToken) {
            res.status(403).json({
                error: 'Reddit account not connected',
                message: 'You must connect your Reddit account to discover leads.',
                action: 'connect_reddit'
            });
            return;
        }

        log.info('Running global search with user Reddit account', {
            userId,
            campaignId,
            username: user.redditUsername
        });

        const rawLeads = await findLeadsGlobally(
            campaign.generatedKeywords,
            campaign.negativeKeywords || [],
            campaign.subredditBlacklist || [],
            user.redditRefreshToken // Use USER's Reddit account
        );
        
        console.log(`[Manual Discovery] Found ${rawLeads.length} unique raw leads.`);

        const enrichedLeads = await enrichLeadsForUser(rawLeads, user);
        
        const savedLeads = [];
        for (const lead of enrichedLeads) {
            try {
                // Use upsert to avoid creating duplicate leads based on URL
                const savedLead = await prisma.lead.upsert({
                    where: { url: lead.url },
                    update: {}, 
                    create: {
                        redditId: lead.id,
                        title: lead.title,
                        author: lead.author,
                        subreddit: lead.subreddit,
                        url: lead.url,
                        body: lead.body || '',
                        userId: user.id,
                        campaignId: campaignId,
                        opportunityScore: lead.opportunityScore,
                        intent: lead.intent || null,
                        status: 'new',
                        postedAt: new Date(lead.createdAt ? lead.createdAt * 1000 : Date.now()),
                        type: 'DIRECT_LEAD',
                    }
                });
                savedLeads.push(savedLead);
            } catch (error) {
                // Ignore unique constraint errors (P2002), but log others
                if ((error as any).code !== 'P2002') {
                    console.error(`❌ [Manual Discovery] Error saving lead "${lead.title}":`, error);
                }
            }
        }

        // ✨ SEND NOTIFICATION EMAIL IF NEW LEADS WERE FOUND ✨
        if (savedLeads.length > 0) {
            console.log(`[Manual Discovery] Found ${savedLeads.length} new leads. Triggering email notification.`);
            // Fire-and-forget the email notification
            sendNewLeadsNotification(user, savedLeads, campaign.name).catch(err => {
                console.error(`[Manual Discovery] Failed to send email notification for campaign ${campaign.id}:`, err);
            });
        }

        const sortedLeads = savedLeads.sort((a, b) => b.opportunityScore - a.opportunityScore);
        res.status(200).json(sortedLeads);
        return;
         
    } catch (error) {
        next(error);
    }
};

export const runTargetedDiscovery: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { campaignId } = req.params;
  
    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }
  
    if (!campaignId) {
        res.status(400).json({ message: 'Campaign ID is required.' });
        return;
    }
  
    try {
        console.log(`🎯 [Targeted Discovery] User ${userId} starting for campaign: ${campaignId}`);
        
        // Securely find the campaign
        const campaign = await prisma.campaign.findFirst({
            where: { 
                id: campaignId,
                userId: userId 
            },
            include: { user: true }
        });
  
        if (!campaign || !campaign.user) {
            res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
            return;
        }
  
        const user = campaign.user;
        const usageService = AIUsageService.getInstance();
        const canRun = await usageService.trackAIUsage(userId, 'manual_discovery', user.plan);
        if (!canRun) {
            return res.status(429).json({ message: "You've reached your monthly discovery limit. Please upgrade your plan for more." });
        }
  
        // Check if campaign has target subreddits
        if (!campaign.targetSubreddits || campaign.targetSubreddits.length === 0) {
            res.status(400).json({ 
                message: 'No target subreddits configured for this campaign. Please add target subreddits first.',
                needsSubreddits: true 
            });
            return;
        }
        
        // CRITICAL: Check if user has connected Reddit
        if (!user.redditRefreshToken) {
            res.status(403).json({
                error: 'Reddit account not connected',
                message: 'You must connect your Reddit account to discover leads.',
                action: 'connect_reddit'
            });
            return;
        }

        log.info('Running targeted search with user Reddit account', {
            userId,
            campaignId,
            username: user.redditUsername,
            subredditCount: campaign.targetSubreddits.length
        });

        // Use the targeted findLeadsOnReddit function with USER's account
        const rawLeads = await findLeadsOnReddit(
            campaign.generatedKeywords,
            campaign.targetSubreddits,
            user.redditRefreshToken // Use USER's Reddit account
        );
        
        console.log(`[Targeted Discovery] Found ${rawLeads.length} unique targeted leads.`);
  
        // Apply relevance filtering (but more lenient for targeted search)
        const relevantLeads = rawLeads.filter(lead => {
            const relevance = calculateContentRelevance(
                lead, 
                campaign.generatedKeywords, 
                campaign.generatedDescription
            );
            
            // Lower threshold for targeted search since we're already in specific subreddits
            return relevance.score >= 15; // Lower than global search threshold of 25
        });
  
        console.log(`[Targeted Discovery] Filtered to ${relevantLeads.length} relevant targeted leads`);
  
        const enrichedLeads = await enrichLeadsForUser(relevantLeads, user);
        
        const savedLeads = [];
        for (const lead of enrichedLeads) {
            try {
                const savedLead = await prisma.lead.upsert({
                    where: { url: lead.url },
                    update: {}, 
                    create: {
                        redditId: lead.id,
                        title: lead.title,
                        author: lead.author,
                        subreddit: lead.subreddit,
                        url: lead.url,
                        body: lead.body || '',
                        userId: user.id,
                        campaignId: campaignId,
                        opportunityScore: lead.opportunityScore,
                        intent: lead.intent || null,
                        status: 'new',
                        postedAt: new Date(lead.createdAt ? lead.createdAt * 1000 : Date.now()),
                        type: 'DIRECT_LEAD',
                    }
                });
                savedLeads.push(savedLead);
            } catch (error) {
                if ((error as any).code !== 'P2002') {
                    console.error(`❌ [Targeted Discovery] Error saving lead "${lead.title}":`, error);
                }
            }
        }
  
        // ✨ SEND NOTIFICATION EMAIL IF NEW LEADS WERE FOUND ✨
        if (savedLeads.length > 0) {
            console.log(`[Targeted Discovery] Found ${savedLeads.length} new leads. Triggering email notification.`);
            // Fire-and-forget the email notification
            sendNewLeadsNotification(user, savedLeads, campaign.name).catch(err => {
                console.error(`[Targeted Discovery] Failed to send email notification for campaign ${campaign.id}:`, err);
            });
        }

        // Update last manual discovery timestamp
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { lastManualDiscoveryAt: new Date() }
        });
  
        const sortedLeads = savedLeads.sort((a, b) => b.opportunityScore - a.opportunityScore);
        
        console.log(`✅ [Targeted Discovery] Completed for campaign ${campaignId}. Saved ${savedLeads.length} leads.`);
        
        res.status(200).json({
            success: true,
            message: `Found ${savedLeads.length} targeted leads from ${campaign.targetSubreddits.length} subreddits`,
            leads: sortedLeads,
            searchType: 'targeted',
            subredditsSearched: campaign.targetSubreddits
        });
        return;
         
    } catch (error) {
        console.error('❌ [Targeted Discovery] Error:', error);
        next(error);
    }
};
export const getLeadsForCampaign: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { campaignId } = req.params;
    const {
        page = '1',
        limit = '20',
        sortBy = 'opportunityScore',
        sortOrder = 'desc',
        status,
        intent,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    if (!campaignId) {
        res.status(400).json({ message: 'Campaign ID is required.' });
        return;
    }

    try {
        console.log(`📋 [Get Leads] User ${userId} fetching leads for campaign: ${campaignId}`);

        const where: any = { 
            campaignId,
            userId: userId
        };
        if (status && status !== 'all') {
            where.status = status as string;
        }
        if (intent && intent !== 'all') {
            where.intent = intent as string;
        }

        const orderBy: any = { [sortBy as string]: sortOrder as string };

        const leads = await prisma.lead.findMany({
            where,
            orderBy,
            take: limitNum,
            skip,
        });

        const totalLeads = await prisma.lead.count({ where });

        console.log(`📋 [Get Leads] Found ${leads.length} leads (${totalLeads} total) matching criteria`);

        // CORRECTED: The transformation now includes the isGoogleRanked field.
        const transformedLeads = leads.map(lead => ({
            id: lead.id,
            title: lead.title,
            author: lead.author,
            subreddit: lead.subreddit,
            url: lead.url,
            body: lead.body,
            createdAt: Math.floor(lead.postedAt.getTime() / 1000),
            numComments: 0, 
            upvoteRatio: 0.67,
            intent: lead.intent || 'information_seeking',
            opportunityScore: lead.opportunityScore,
            status: lead.status,
            // Ensure the isGoogleRanked field is included, defaulting to false if null/undefined
            isGoogleRanked: lead.isGoogleRanked ?? false,
        }));

        res.status(200).json({
            data: transformedLeads,
            pagination: {
                total: totalLeads,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(totalLeads / limitNum)
            }
        });
        return;
    } catch (error) {
        console.error(`❌ [Get Leads] Error:`, error);
        next(error);
    }
};

export const summarizeLead: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { id: leadId } = req.params;

    if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
    }

    try {
        // Securely find the lead, ensuring it belongs to the authenticated user
        const lead = await prisma.lead.findFirst({
            where: { 
                id: leadId,
                userId: userId
            },
        });

        if (!lead) {
             res.status(404).json({ message: 'Lead not found or you do not have permission to access it.' });
             return;
        }

        if (!lead.body || lead.body.trim().length === 0) {
             res.status(400).json({ message: 'Lead has no content to summarize.' });
             return;
        }

        console.log(`[SUMMARIZE] User ${userId} requesting summary for lead ${leadId}`);
        const summary = await summarizeTextContent(lead.body);

        await prisma.lead.update({
            where: { id: leadId },
            data: { summary },
        });

        res.status(200).json({ summary });
        return;

    } catch (error) {
        next(error);
    }
};

export const deleteAllLeads: RequestHandler = async (req: any, res, next) => {
    try {
      const { campaignId } = req.params;
      const userId = req.auth.userId;
  
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }
  
      if (!campaignId) {
        res.status(400).json({ message: 'Campaign ID is required.' });
        return;
      }
  
      // Verify campaign ownership
      const campaign = await prisma.campaign.findFirst({
        where: { 
          id: campaignId,
          userId: userId 
        }
      });
  
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
        return;
      }
  
      // Count leads before deletion
      const leadCount = await prisma.lead.count({
        where: {
          campaignId,
          userId
        }
      });
  
      // Delete all leads for the campaign
      const deleteResult = await prisma.lead.deleteMany({
        where: {
          campaignId,
          userId
        }
      });
  
      console.log(`Deleted ${deleteResult.count} leads for campaign ${campaignId} (user: ${userId})`);
  
      res.json({ 
        success: true, 
        message: `Successfully deleted ${deleteResult.count} leads`,
        deletedCount: deleteResult.count
      });
  
    } catch (error) {
      console.error('Error deleting leads:', error);
      next(error);
    }
  };
  
export const deleteLeadsByStatus: RequestHandler = async (req: any, res, next) => {
    try {
      const { campaignId } = req.params;
      const { status } = req.body; // 'ignored', 'replied', 'saved', etc.
      const userId = req.auth.userId;
  
      if (!userId) {
        res.status(401).json({ message: 'User not authenticated.' });
        return;
      }
  
      if (!campaignId || !status) {
        res.status(400).json({ message: 'Campaign ID and status are required.' });
        return;
      }
  
      // Verify campaign ownership
      const campaign = await prisma.campaign.findFirst({
        where: { 
          id: campaignId,
          userId: userId 
        }
      });
  
      if (!campaign) {
        res.status(404).json({ message: 'Campaign not found or you do not have permission to access it.' });
        return;
      }
  
      // Delete leads by status
      const deleteResult = await prisma.lead.deleteMany({
        where: {
          campaignId,
          userId,
          status
        }
      });
  
      console.log(`Deleted ${deleteResult.count} ${status} leads for campaign ${campaignId}`);
  
      res.json({ 
        success: true, 
        message: `Successfully deleted ${deleteResult.count} ${status} leads`,
        deletedCount: deleteResult.count
      });
  
    } catch (error) {
      console.error('Error deleting leads by status:', error);
      next(error);
    }
  };
 
export const updateLeadStatus: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { leadId } = req.params;
    const { status } = req.body;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!leadId || !status) {
        return res.status(400).json({ message: 'Lead ID and status are required.' });
    }

    const validStatuses = ["new", "replied", "saved", "ignored"];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    try {
        console.log(`[Lead Status] User ${userId} updating lead ${leadId} to status: ${status}`);

        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                userId: userId,
            },
        });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found or you do not have permission.' });
        }

        const updatedLead = await prisma.lead.update({
            where: {
                id: leadId,
            },
            data: {
                status: status,
            },
        });

        console.log(`✅ [Lead Status] Successfully updated lead ${leadId}`);
        res.status(200).json({
            success: true,
            message: 'Lead status updated successfully.',
            lead: updatedLead,
        });
    } catch (error) {
        console.error(`❌ [Lead Status] Error updating lead ${leadId}:`, error);
        next(error);
    }
};

export const deleteSingleLead: RequestHandler = async (req: any, res, next) => {
    const { userId } = req.auth;
    const { leadId } = req.params;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    try {
        // Verify the lead exists and belongs to the user before deleting
        const lead = await prisma.lead.findFirst({
            where: {
                id: leadId,
                userId: userId,
            },
        });

        if (!lead) {
            return res.status(404).json({ message: 'Lead not found or you do not have permission to delete it.' });
        }

        await prisma.lead.delete({
            where: { id: leadId },
        });

        res.status(200).json({ success: true, message: 'Lead deleted successfully.' });
    } catch (error) {
        console.error(`[Delete Lead] Error deleting lead ${leadId}:`, error);
    }
};
