// src/services/subscription.service.ts

// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

/**
 * Checks for any active pro trials that have expired and reverts them to the 'free' plan.
 * This should be run periodically (e.g., once every 24 hours).
 */
export const expireUserTrials = async () => {
    console.log('[Subscription Service] Running job to expire user trials...');

    const now = new Date();

    // Find all users on the 'pro' plan with a subscription end date in the past
    const expiredTrialUsers = await prisma.user.findMany({
        where: {
            plan: 'pro',
            subscriptionEndsAt: {
                lte: now, // lte = less than or equal to
            },
        },
    });

    if (expiredTrialUsers.length === 0) {
        console.log('[Subscription Service] No trials to expire.');
        return;
    }

    console.log(`[Subscription Service] Found ${expiredTrialUsers.length} user(s) with expired trials.`);

    // Revert each user back to the 'free' plan
    for (const user of expiredTrialUsers) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                plan: 'free',
                subscriptionEndsAt: null, // Clear the expiration date
            },
        });
        console.log(`[Subscription Service] Reverted user ${user.id} to the free plan.`);
    }

    console.log('[Subscription Service] Finished expiring trials.');
};