import express from 'express';
import { deleteAllLeads, deleteLeadsByStatus, deleteSingleLead, getLeadsForCampaign, runManualDiscovery, runTargetedDiscovery, updateLeadStatus } from '../controllers/lead.controller';
import { summarizeLead } from '../controllers/post.controller';
import { gateKeeper } from '../middleware/gateKeeper';
import { validate, campaignIdParamSchema, leadIdParamSchema, updateLeadStatusSchema, idSchema } from '../middleware/validator';
import { aiLimiter } from '../middleware/rateLimiter';

const leadRouter = express.Router();

// Get the "inbox" of saved leads for a specific campaign (Pro feature)
leadRouter.get(
  '/campaign/:campaignId',
  gateKeeper,
  validate(campaignIdParamSchema, 'params'),
  getLeadsForCampaign
);

// Manually trigger a new search for a campaign (Pro feature)
leadRouter.post(
  '/discover/manual/:campaignId',
  gateKeeper,
  validate(campaignIdParamSchema, 'params'),
  runManualDiscovery
);

// Targeted discovery
leadRouter.post(
  '/campaign/:campaignId/discover/targeted',
  gateKeeper,
  validate(campaignIdParamSchema, 'params'),
  runTargetedDiscovery
);

// Update a lead's status (Pro feature)
leadRouter.patch(
  '/:leadId/status',
  gateKeeper,
  validate(leadIdParamSchema, 'params'),
  validate(updateLeadStatusSchema),
  updateLeadStatus
);

// Summarize a lead using AI (Pro feature)
leadRouter.post(
  '/:id/summarize',
  aiLimiter, // AI endpoints need stricter rate limiting
  gateKeeper,
  validate(idSchema, 'params'),
  summarizeLead
);

// Delete operations
leadRouter.delete(
  '/campaign/:campaignId/all',
  gateKeeper,
  validate(campaignIdParamSchema, 'params'),
  deleteAllLeads
);

leadRouter.delete(
  '/campaign/:campaignId/status',
  gateKeeper,
  validate(campaignIdParamSchema, 'params'),
  deleteLeadsByStatus
);

leadRouter.delete(
  '/:leadId',
  gateKeeper,
  validate(leadIdParamSchema, 'params'),
  deleteSingleLead
);

export default leadRouter;