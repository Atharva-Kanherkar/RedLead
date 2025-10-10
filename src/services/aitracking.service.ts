// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

const USAGE_LIMITS = {
    reply:    { free: 0, starter: 75, pro: 300 },
    intent:   { free: 0, starter: 200, pro: 1000 },
    sentiment:{ free: 0, starter: 200, pro: 1000 },
    keywords: { free: 5, starter: 15, pro: 50 },
    competitor: { free: 0, starter: 0, pro: 1000 },
    manual_discovery: { free: 1, starter: 10, pro: 30 }
    // ...add more as needed
  };

type UsageType = keyof typeof USAGE_LIMITS;

export class AIUsageService {
    private static instance: AIUsageService;

    private constructor() {}

    public static getInstance(): AIUsageService {
        if (!AIUsageService.instance) {
            AIUsageService.instance = new AIUsageService();
        }
        return AIUsageService.instance;
    }

    private getLimit(plan: string, type: UsageType): number {
        const planKey = plan as keyof typeof USAGE_LIMITS[UsageType];
        return USAGE_LIMITS[type][planKey] ?? 0;
    }

    public async trackAIUsage(userId: string, type: UsageType, userPlan: string): Promise<boolean> {
        const limit = this.getLimit(userPlan, type);
        if (limit === 0) return false;

        const month = new Date().toISOString().slice(0, 7); // YYYY-MM format

        const usage = await prisma.aIUsage.findUnique({
            where: { userId_month_type: { userId, month, type } },
        });

        if (usage && usage.count >= limit) {
            console.log(`[Usage Limit] User ${userId} reached limit for ${type} (${usage.count}/${limit})`);
            return false; // Limit reached
        }

        await prisma.aIUsage.upsert({
            where: { userId_month_type: { userId, month, type } },
            update: { count: { increment: 1 } },
            create: { userId, month, type, count: 1 },
        });

        return true; // Within limit
    }

    public async canUse(userId: string, type: UsageType, userPlan: string): Promise<boolean> {
        const limit = this.getLimit(userPlan, type);
        if (limit === 0 && type !== 'manual_discovery') return false; // Allow free discovery runs
        if (limit === 0 && type === 'manual_discovery' && userPlan !== 'free') return true; // Pro/Starter have higher limits

        const month = new Date().toISOString().slice(0, 7);

        const usage = await prisma.aIUsage.findUnique({
            where: { userId_month_type: { userId, month, type } },
        });

        return !usage || usage.count < limit;
    }
}