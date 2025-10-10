// src/middleware/gateKeeper.ts
import { RequestHandler } from 'express';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';
const activePlans = ['pro', 'free']; // Keep 'free' here for testing

export const gateKeeper: RequestHandler = async (req: any, res, next) => {
    console.log('--- 🛡️ GateKeeper Middleware Triggered 🛡️ ---');
    
    const { userId } = req.auth;

    if (!userId) {
        console.log('[LOG] GateKeeper Check: FAILED - No userId in req.auth.');
        
        res.status(401).json({ message: 'Unauthorized: User ID not provided.' });
        return
    }
    
    console.log(`[LOG] GateKeeper Check: Authenticated with userId: ${userId}`);

    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        
        // Log the entire user object we found (or didn't find)
        console.log('[LOG] GateKeeper Check: User object from database:', user);

        if (!user) {
            console.log('[LOG] GateKeeper Check: FAILED - User not found in database.');
             res.status(404).json({ message: 'User not found.' });
             return
        }

        const userPlan = user.plan;
        console.log(`[LOG] GateKeeper Check: User plan is "${userPlan}". Checking against active plans: [${activePlans.join(', ')}]`);

        const hasAccess = user.plan && activePlans.includes(user.plan) && user.subscriptionStatus === 'active';

        if (hasAccess) {
            console.log('[LOG] GateKeeper Check: PASSED - User has access.');
            next();
        } else {
            console.log('[LOG] GateKeeper Check: FAILED - User does not have an active, valid plan.');
             res.status(403).json({
                message: 'Forbidden: This feature requires a Pro subscription.',
                upgradeUrl: '/billing'
            });return;
        }//
    } catch (error) {
        console.error('❌ [ERROR] GateKeeper crashed:', error);
        next(error);
    }
};

console.log("Hello")