import express from 'express';
import { analyzeWebsite, completeOnboarding } from '../controllers/onboarding.controller';
import { validate, websiteAnalysisSchema, completeOnboardingSchema } from '../middleware/validator';
import { aiLimiter } from '../middleware/rateLimiter';

const onboardingRouter = express.Router();

console.log("--- [ROUTER LOG] Loading onboarding.ts router file...");

// Analyze website - AI-powered, needs stricter rate limiting and validation
onboardingRouter.post(
  '/analyze',
  aiLimiter, // Stricter rate limit for AI endpoints
  validate(websiteAnalysisSchema),
  analyzeWebsite
);
console.log("--- [ROUTER LOG] Route POST /onboarding/analyze configured.");

// Complete onboarding - protected with validation
onboardingRouter.post(
  '/complete',
  validate(completeOnboardingSchema),
  completeOnboarding
);
console.log("--- [ROUTER LOG] Route POST /onboarding/complete configured.");

export default onboardingRouter;