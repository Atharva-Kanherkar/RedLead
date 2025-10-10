import snoowrap from 'snoowrap';
// Removed: import { PrismaClient } from '@prisma/client';
import { generateCultureNotes } from './ai.service';

import { prisma } from '../lib/prisma';

// Initialize snoowrap with credentials from environment variables
const r = new snoowrap({
    userAgent: process.env.REDDIT_USER_AGENT!,
    clientId: process.env.REDDIT_CLIENT_ID!,
    clientSecret: process.env.REDDIT_CLIENT_SECRET!,
    refreshToken: process.env.REDDIT_REFRESH_TOKEN!
});

/**
 * Fetches details for a given subreddit, analyzes them using AI, and saves the profile to the database.
 * This function is designed to be resilient to errors.
 * @param subredditName The name of the subreddit to analyze (e.g., "solana").
 */
export const analyzeAndSaveSubredditProfile = async (subredditName: string): Promise<void> => {
    console.log(`Analyzing subreddit: r/${subredditName}`);
    try {
        const subreddit = r.getSubreddit(subredditName);

        // Fetch raw data from Reddit in parallel
        const [description, rulesResult] = await Promise.all([
            subreddit.fetch().then(s => s.public_description),
            subreddit.getRules()
        ]);

        // Gracefully handle cases where there is no description
        if (!description) {
            console.warn(`⚠️  No description found for r/${subredditName}. Skipping AI culture analysis.`);
            return; // Exit early if there's nothing to analyze
        }

        const rules = rulesResult.rules.map(rule => rule.short_name);

        // Call the AI to generate cultural notes (the expensive part)
        const cultureNotes = await generateCultureNotes(description, rules);

        // Use `upsert` to create a new profile or update an existing one.
        // This is idempotent and prevents duplicates.
        await prisma.subredditProfile.upsert({
            where: { name: subredditName },
            update: {
                rules: rules,
                cultureNotes: cultureNotes,
            },
            create: {
                name: subredditName,
                rules: rules,
                cultureNotes: cultureNotes,
            }
        });

        console.log(`✅ Successfully analyzed and saved profile for r/${subredditName}.`);

    } catch (error: any) {
        // This catch block handles critical errors like the subreddit not existing,
        // being banned, or the Reddit API being down.
        console.error(`❌ Failed to analyze r/${subredditName}. Reason: ${error.message}`);
    }
};