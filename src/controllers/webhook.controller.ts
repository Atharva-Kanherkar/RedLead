import { Request, Response } from 'express';
import { webhookService } from '../services/webhook.service';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export const createWebhook = async (req: any, res: Response) => {
  const { userId } = req.auth;
  const webhookData = req.body;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const webhookId = await webhookService.registerWebhook({
      ...webhookData,
      userId // Use the authenticated userId
    });
    
    res.json({ success: true, webhookId });
    return;
  } catch (error) {
    console.error('Failed to create webhook:', error);
    res.status(500).json({ error: 'Failed to create webhook' });
    return;
  }
};

export const getWebhooks = async (req: any, res: Response) => {
  const { userId } = req.auth;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const webhooks = webhookService.getWebhooks(userId);
    res.json({ webhooks });
    return;
  } catch (error) {
    console.error('Failed to get webhooks:', error);
    res.status(500).json({ error: 'Failed to get webhooks' });
    return;
  }
};

export const getWebhookStats = async (req: any, res: Response) => {
  const { userId } = req.auth;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const stats = await webhookService.getWebhookStats(userId);
    res.json(stats);
    return;
  } catch (error) {
    console.error('Failed to get webhook stats:', error);
    res.status(500).json({ error: 'Failed to get webhook stats' });
    return;
  }
};

// Helper function to verify webhook ownership
const verifyWebhookOwner = async (webhookId: string, userId: string): Promise<boolean> => {
    const webhook = await prisma.webhook.findFirst({
        where: {
            id: webhookId,
            userId: userId,
        },
    });
    return !!webhook;
};


export const updateWebhook = async (req: any, res: Response) => {
  const { userId } = req.auth;
  const { webhookId } = req.params;
  const updates = req.body;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const isOwner = await verifyWebhookOwner(webhookId, userId);
    if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to update this webhook.' });
        return;
    }

    const success = await webhookService.updateWebhook(webhookId, updates);
    res.json({ success });
    return;
  } catch (error) {
    console.error('Failed to update webhook:', error);
    res.status(500).json({ error: 'Failed to update webhook' });
    return;
  }
};

export const deleteWebhook = async (req: any, res: Response) => {
  const { userId } = req.auth;
  const { webhookId } = req.params;

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated.' });
    return;
  }

  try {
    const isOwner = await verifyWebhookOwner(webhookId, userId);
    if (!isOwner) {
        res.status(403).json({ error: 'You do not have permission to delete this webhook.' });
        return;
    }

    const success = await webhookService.deleteWebhook(webhookId);
    res.json({ success });
    return;
  } catch (error) {
    console.error('Failed to delete webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
    return;
  }
};

export const testWebhook = async (req: any, res: Response) => {
    const { userId } = req.auth;
    const { webhookId } = req.params;

    if (!userId) {
        res.status(401).json({ error: 'User not authenticated.' });
        return;
    }

    try {
        const isOwner = await verifyWebhookOwner(webhookId, userId);
        if (!isOwner) {
            res.status(403).json({ error: 'You do not have permission to test this webhook.' });
            return;
        }

        const success = await webhookService.testWebhook(webhookId);
        res.json({ success });
        return;

    } catch (error) {
        console.error('Failed to test webhook:', error);
        res.status(500).json({ error: 'Failed to test webhook' });
        return;
    }
};