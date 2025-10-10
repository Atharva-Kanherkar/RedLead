import { User } from '@prisma/client';
import { analyzeAndSaveSubredditProfile } from '../services/subreddit.service';
import { prisma } from '../lib/prisma';
const ANALYSIS_EXPIRATION_DAYS = 7;

/**
 * A background worker that finds all unique subreddits targeted by active campaigns
 * from PAYING users and creates or updates their intelligence profiles.
 */
export const runSubredditAnalysisWorker = async (): Promise<void> => {
    console.log('Starting subreddit analysis worker run...');

    // 1. Get all campaigns for paying users to find which subreddits to analyze.
    const campaigns = await prisma.campaign.findMany({
        where: {
            isActive: true,
            user: {
                plan: { in: ['starter', 'pro'] } // Only analyze for paying users
            }
        },
        select: {
            targetSubreddits: true
        }
    });

    const uniqueSubreddits = new Set<string>();
    campaigns.forEach(campaign => {
        campaign.targetSubreddits.forEach(sub => uniqueSubreddits.add(sub));
    });

    const subredditsToProcess = Array.from(uniqueSubreddits);

    if (subredditsToProcess.length === 0) {
        console.log('No subreddits from paying users to analyze. Worker run finished.');
        return;
    }

    console.log(`Found ${subredditsToProcess.length} unique subreddits from paying users to process.`);

    for (const subredditName of subredditsToProcess) {
        try {
            const existingProfile = await prisma.subredditProfile.findUnique({
                where: { name: subredditName }
            });

            if (existingProfile) {
                const profileAge = Date.now() - existingProfile.lastAnalyzedAt.getTime();
                const expirationPeriod = ANALYSIS_EXPIRATION_DAYS * 24 * 60 * 60 * 1000;

                if (profileAge < expirationPeriod) {
                    console.log(`  -> Skipping r/${subredditName}, profile is still fresh.`);
                    continue;
                }
            }

            // If the profile doesn't exist or is stale, analyze it.
            await analyzeAndSaveSubredditProfile(subredditName);

        } catch (error) {
            console.error(`An unexpected error occurred while processing r/${subredditName}:`, error);
        }
    }

    console.log('Subreddit analysis worker run finished.');
};