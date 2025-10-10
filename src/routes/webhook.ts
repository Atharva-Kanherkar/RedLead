import { Router } from 'express';
import {
  createWebhook,
  getWebhooks,
  getWebhookStats,
  updateWebhook,
  deleteWebhook,
  testWebhook
} from '../controllers/webhook.controller';
import { gateKeeper } from '../middleware/gateKeeper';
import { validate, createWebhookSchema, updateWebhookSchema, idParamSchema } from '../middleware/validator';
import { webhookLimiter } from '../middleware/rateLimiter';

const webhookRouter = Router();

// All webhook routes are protected as a premium feature.

// Create a new webhook for the authenticated user
webhookRouter.post(
  '/',
  webhookLimiter,
  gateKeeper,
  validate(createWebhookSchema),
  createWebhook
);

// Get all webhooks for the authenticated user
webhookRouter.get('/', gateKeeper, getWebhooks);

// Get webhook stats for the authenticated user
webhookRouter.get('/stats', gateKeeper, getWebhookStats);

// Update a specific webhook owned by the authenticated user
webhookRouter.put(
  '/:webhookId',
  webhookLimiter,
  gateKeeper,
  validate(idParamSchema, 'params'),
  validate(updateWebhookSchema),
  updateWebhook
);

// Delete a specific webhook owned by the authenticated user
webhookRouter.delete(
  '/:webhookId',
  gateKeeper,
  validate(idParamSchema, 'params'),
  deleteWebhook
);

// Test a specific webhook owned by the authenticated user
webhookRouter.post(
  '/:webhookId/test',
  webhookLimiter,
  gateKeeper,
  validate(idParamSchema, 'params'),
  testWebhook
);

export default webhookRouter;