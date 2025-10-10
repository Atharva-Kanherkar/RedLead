import express from 'express';
import { getReplyOptions, postRefineReply, prepareReplyForTracking } from '../controllers/engagement.controller';
import { gateKeeper } from '../middleware/gateKeeper';
import { validate, generateReplySchema, refineReplySchema, prepareReplyTrackingSchema } from '../middleware/validator';
import { aiLimiter } from '../middleware/rateLimiter';

const engagementRouter = express.Router();

// Generate AI reply options (Pro feature)
engagementRouter.post(
  '/generate',
  aiLimiter, // Stricter rate limit for AI endpoints
  gateKeeper,
  validate(generateReplySchema),
  getReplyOptions
);

// Refine an AI reply (Pro feature)
engagementRouter.post(
  '/refine',
  aiLimiter, // Stricter rate limit for AI endpoints
  gateKeeper,
  validate(refineReplySchema),
  postRefineReply
);

// Prepare a reply for manual posting and tracking (Pro feature)
engagementRouter.post(
  '/prepare-tracking',
  gateKeeper,
  validate(prepareReplyTrackingSchema),
  prepareReplyForTracking
);

export default engagementRouter;