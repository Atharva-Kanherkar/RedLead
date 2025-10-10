import fetch from 'node-fetch';
// Removed: import { PrismaClient } from '@prisma/client';

import { prisma } from '../lib/prisma';

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  userId?: string;
  campaignId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  type: 'discord' | 'slack' | 'generic' | 'email' | 'sms';
  isActive: boolean;
  events: string[];
  userId: string;
  createdAt: Date;
  lastTriggered?: Date;
  filters?: {
    minOpportunityScore?: number;
    subreddits?: string[];
    keywords?: string[];
    priority?: string[];
  };
  rateLimitMinutes?: number;
  lastSentAt?: Date;
}

class WebhookService {
  private webhooks: Map<string, WebhookConfig> = new Map();
  private eventQueue: WebhookPayload[] = [];
  private processing = false;

  constructor() {
    this.initializeFromDatabase();
    this.startQueueProcessor();
  }

  /**
   * Initialize webhooks from database on startup
   */
  private async initializeFromDatabase(): Promise<void> {
    try {
      const webhooks = await prisma.webhook.findMany({
        where: { isActive: true }
      });

      for (const webhook of webhooks) {
        this.webhooks.set(webhook.id, {
          id: webhook.id,
          name: webhook.name,
          url: webhook.url,
          type: webhook.type as 'discord' | 'slack' | 'generic' | 'email' | 'sms',
          isActive: webhook.isActive,
          events: webhook.events,
          userId: webhook.userId,
          createdAt: webhook.createdAt,
          lastTriggered: webhook.lastTriggered || undefined,
          filters: webhook.filters ? (webhook.filters as any) : undefined,
          rateLimitMinutes: webhook.rateLimitMinutes || undefined,
          lastSentAt: webhook.lastSentAt || undefined,
        });
      }

      console.log(`🔄 Initialized ${webhooks.length} webhooks from database`);
    } catch (error) {
      console.error('❌ Failed to initialize webhooks from database:', error);
    }
  }

  /**
   * Process webhook queue
   */
  private startQueueProcessor(): void {
    setInterval(async () => {
      if (this.processing || this.eventQueue.length === 0) return;

      this.processing = true;
      const batch = this.eventQueue.splice(0, 10);

      for (const payload of batch) {
        await this.processWebhookPayload(payload);
      }

      this.processing = false;
    }, 1000);
  }



  /**
   * Enhanced broadcast with business logic
   */
  async broadcastEvent(
    event: string, 
    data: any, 
    userId?: string, 
    campaignId?: string, 
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'
  ): Promise<void> {
    const payload: WebhookPayload = {
      event,
      data,
      timestamp: Date.now(),
      userId,
      campaignId,
      priority,
      metadata: {
        source: 'redlead',
        version: '1.0',
      },
    };

    // Add to queue for processing
    this.eventQueue.push(payload);

    // Log business metrics
    await this.logBusinessEvent(event, data, userId, campaignId, priority);
  }

  /**
   * Process individual webhook payload
   */
  private async processWebhookPayload(payload: WebhookPayload): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`🔔 Processing event: ${payload.event} for user: ${payload.userId || 'N/A'}`);
    const matchingWebhooks = Array.from(this.webhooks.values()).filter(webhook => 
      this.shouldTriggerWebhook(webhook, payload)
    );

    console.log(`📢 Processing event '${payload.event}' for ${matchingWebhooks.length} webhooks`);

    for (const webhook of matchingWebhooks) {
      await this.sendWebhook(webhook.id, payload);
    }
  }

  /**
   * Enhanced filtering logic
   */
  private shouldTriggerWebhook(webhook: WebhookConfig, payload: WebhookPayload): boolean {
    // Basic checks
    if (!webhook.isActive || !webhook.events.includes(payload.event)) {
      return false;
    }

    // User filtering
    if (payload.userId && webhook.userId !== payload.userId) {
      return false;
    }

    // Rate limiting
    if (webhook.rateLimitMinutes && webhook.lastSentAt) {
      const timeSinceLastSent = Date.now() - webhook.lastSentAt.getTime();
      if (timeSinceLastSent < webhook.rateLimitMinutes * 60 * 1000) {
        return false;
      }
    }

    // Business filters
    if (webhook.filters) {
      const { minOpportunityScore, subreddits, keywords, priority } = webhook.filters;

      if (minOpportunityScore && payload.data.opportunityScore < minOpportunityScore) {
        return false;
      }

      if (subreddits && subreddits.length > 0 && !subreddits.includes(payload.data.subreddit)) {
        return false;
      }

      if (keywords && keywords.length > 0) {
        const text = `${payload.data.title || ''} ${payload.data.body || ''}`.toLowerCase();
        if (!keywords.some(keyword => text.includes(keyword.toLowerCase()))) {
          return false;
        }
      }

      if (priority && priority.length > 0 && !priority.includes(payload.priority || 'medium')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Enhanced webhook sending with retry logic
   */
  async sendWebhook(webhookId: string, payload: WebhookPayload, retryCount = 0): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    try {
      let formattedPayload: any;
      
      switch (webhook.type) {
        case 'discord':
          formattedPayload = this.formatDiscordPayload(payload);
          break;
        case 'slack':
          formattedPayload = this.formatSlackPayload(payload);
          break;
        case 'email':
          formattedPayload = this.formatEmailPayload(payload);
          break;
        default:
          formattedPayload = payload;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RedLead-Webhook/1.0',
        },
        body: JSON.stringify(formattedPayload),
      });

      if (response.ok) {
        webhook.lastTriggered = new Date();
        webhook.lastSentAt = new Date();
        
        // Update database - FIXED: Only update if webhook exists in DB
        try {
          await prisma.webhook.update({
            where: { id: webhookId },
            data: { 
              lastTriggered: webhook.lastTriggered,
              lastSentAt: webhook.lastSentAt,
            },
          });
        } catch (dbError: any) {
          if (dbError.code === 'P2025') {
            console.warn(`⚠️ Webhook ${webhookId} not found in database - skipping update`);
          } else {
            console.error('Failed to update webhook in database:', dbError);
          }
        }

        console.log(`✅ Webhook sent successfully: ${webhook.name}`);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error(`❌ Webhook error: ${webhook.name}`, error);
      
      if (retryCount < 3 && payload.priority === 'urgent') {
        console.log(`🔄 Retrying webhook ${webhook.name} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount)));
        return this.sendWebhook(webhookId, payload, retryCount + 1);
      }

      return false;
    }
  }

  /**
   * Enhanced Discord formatting with business context
   */
  private formatDiscordPayload(payload: WebhookPayload): any {
    const { event, data, timestamp, priority } = payload;
    
    const embeds = [];
    let color = 0x0099ff;
    
    const priorityColors: Record<string, number> = {
      urgent: 0xff0000,
      high: 0xff6600,
      medium: 0x0099ff,
      low: 0x888888,
    };
    
    color = priorityColors[priority || 'medium'] || color;
    
    switch (event) {
      case 'lead.discovered':
        embeds.push({
          title: `🎯 ${priority === 'urgent' ? 'URGENT' : 'New'} Lead Discovered!`,
          description: `**${data.title || 'No title'}**\n\n📊 **Opportunity Score**: ${data.opportunityScore || 'N/A'}%\n🎯 **Intent**: ${(data.intent || 'unknown').replace('_', ' ')}\n👤 **Author**: u/${data.author || 'unknown'} (${data.authorKarma || 'N/A'} karma)\n📍 **Subreddit**: r/${data.subreddit || 'unknown'}\n💬 **Comments**: ${data.numComments || 0}\n⬆️ **Upvote Ratio**: ${Math.round((data.upvoteRatio || 0) * 100)}%`,
          color,
          fields: [
            { name: '⏰ Posted', value: data.createdAt ? `<t:${Math.floor(data.createdAt)}:R>` : 'Unknown', inline: true },
            { name: '🔗 Actions', value: `[View Post](${data.url || '#'}) | [Reply](${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard)`, inline: true },
          ],
          timestamp: new Date(timestamp).toISOString(),
          footer: {
            text: `RedLead • Priority: ${(priority || 'medium').toUpperCase()}`,
            icon_url: 'https://i.imgur.com/AfFp7pu.png',
          },
        });
        break;
        
      default:
        embeds.push({
          title: `🔔 ${event}`,
          description: JSON.stringify(data, null, 2),
          color,
          timestamp: new Date(timestamp).toISOString(),
        });
    }

    return {
      username: 'RedLead Bot',
      avatar_url: 'https://i.imgur.com/AfFp7pu.png',
      embeds,
    };
  }

  /**
   * Enhanced Slack formatting
   */
  private formatSlackPayload(payload: WebhookPayload): any {
    const { event, data, timestamp, priority } = payload;
    
    let color = '#0099ff';
    let text = '';
    let blocks: any[] = [];
    
    switch (event) {
      case 'lead.discovered':
        color = priority === 'urgent' ? '#ff0000' : '#00ff00';
        text = `🎯 *${priority === 'urgent' ? 'URGENT' : 'New'} Lead Discovered!*\n\n*${data.title || 'No title'}*\n\n📊 *Opportunity Score*: ${data.opportunityScore || 'N/A'}%\n🎯 *Intent*: ${(data.intent || 'unknown').replace('_', ' ')}\n👤 *Author*: u/${data.author || 'unknown'}\n📍 *Subreddit*: r/${data.subreddit || 'unknown'}`;
        break;
        
      default:
        text = `🔔 *${event}*\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``;
    }

    return {
      username: 'RedLead Bot',
      icon_emoji: ':robot_face:',
      text,
      attachments: [{
        color,
        ts: Math.floor(timestamp / 1000),
      }],
    };
  }

  /**
   * Email formatting for business notifications
   */
  private formatEmailPayload(payload: WebhookPayload): any {
    const { event, data, timestamp, priority } = payload;
    
    let subject = '';
    let htmlBody = '';
    
    switch (event) {
      case 'lead.discovered':
        subject = `${priority === 'urgent' ? '[URGENT] ' : ''}New Lead: ${data.title || 'No title'}`;
        htmlBody = `
          <h2>🎯 New Lead Discovered</h2>
          <p><strong>Title:</strong> ${data.title || 'No title'}</p>
          <p><strong>Opportunity Score:</strong> ${data.opportunityScore || 'N/A'}%</p>
          <p><strong>Subreddit:</strong> r/${data.subreddit || 'unknown'}</p>
          <p><strong>Author:</strong> u/${data.author || 'unknown'}</p>
          <p><strong>Intent:</strong> ${(data.intent || 'unknown').replace('_', ' ')}</p>
          <p><a href="${data.url || '#'}">View Original Post</a></p>
        `;
        break;
        
      default:
        subject = `${event} - ${new Date(timestamp).toLocaleDateString()}`;
        htmlBody = `
          <h2>${event}</h2>
          <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
    }

    return {
      subject,
      htmlBody,
      textBody: htmlBody.replace(/<[^>]*>/g, ''),
    };
  }

  /**
   * Log business events for analytics
   */
  private async logBusinessEvent(event: string, data: any, userId?: string, campaignId?: string, priority?: string): Promise<void> {
    try {
      console.log(`📊 Business Event: ${event}`, {
        userId,
        campaignId,
        priority,
        dataKeys: Object.keys(data),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to log business event:', error);
    }
  }

  /**
   * Get webhook statistics for business dashboard
   */
  async getWebhookStats(userId: string): Promise<any> {
    const userWebhooks = Array.from(this.webhooks.values()).filter(w => w.userId === userId);
    
    const webhooksByType = userWebhooks.reduce((acc: Record<string, number>, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {});

    const sortedWebhooks = userWebhooks
      .filter(w => w.lastTriggered)
      .sort((a, b) => {
        const aTime = a.lastTriggered?.getTime() || 0;
        const bTime = b.lastTriggered?.getTime() || 0;
        return bTime - aTime;
      });
    
    return {
      totalWebhooks: userWebhooks.length,
      activeWebhooks: userWebhooks.filter(w => w.isActive).length,
      webhooksByType,
      lastTriggered: sortedWebhooks[0]?.lastTriggered || null,
    };
  }

  /**
   * Get all webhooks for a user
   */
  getWebhooks(userId: string): WebhookConfig[] {
    return Array.from(this.webhooks.values()).filter(webhook => webhook.userId === userId);
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(webhookId: string, updates: Partial<WebhookConfig>): Promise<boolean> {
    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    try {
      // Update database
      await prisma.webhook.update({
        where: { id: webhookId },
        data: {
          ...(updates.name && { name: updates.name }),
          ...(updates.url && { url: updates.url }),
          ...(updates.type && { type: updates.type }),
          ...(updates.events && { events: updates.events }),
          ...(updates.isActive !== undefined && { isActive: updates.isActive }),
          ...(updates.filters && { filters: updates.filters as any }),
          ...(updates.rateLimitMinutes !== undefined && { rateLimitMinutes: updates.rateLimitMinutes }),
        },
      });

      // Update in-memory
      Object.assign(webhook, updates);
      return true;
    } catch (error) {
      console.error('Failed to update webhook:', error);
      return false;
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    try {
      await prisma.webhook.delete({
        where: { id: webhookId },
      });
      return this.webhooks.delete(webhookId);
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      return false;
    }
  }

  /**
   * Test webhook connection
   */
  async testWebhook(webhookId: string): Promise<boolean> {
    const testPayload: WebhookPayload = {
      event: 'webhook.test',
      data: {
        message: 'This is a test message from RedLead!',
        timestamp: new Date().toISOString(),
      },
      timestamp: Date.now(),
      priority: 'medium',
    };

    return await this.sendWebhook(webhookId, testPayload);
  }
  // Add this method to the WebhookService class

/**
 * Force reload webhooks from database
 */
public async reloadWebhooks(): Promise<void> {
    await this.initializeFromDatabase();
  }
  
  /**
   * Register a new webhook - NOW SAVES TO DATABASE AND RELOADS
   */
  async registerWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt'>): Promise<string> {
    try {
      // Save to database first
      const dbWebhook = await prisma.webhook.create({
        data: {
          name: config.name,
          url: config.url,
          type: config.type,
          isActive: config.isActive,
          events: config.events,
          userId: config.userId,
          filters: config.filters || undefined,
          rateLimitMinutes: config.rateLimitMinutes || null,
        },
      });
  
      // Then add to in-memory map
      const webhook: WebhookConfig = {
        id: dbWebhook.id,
        createdAt: dbWebhook.createdAt,
        name: config.name,
        url: config.url,
        type: config.type,
        isActive: config.isActive,
        events: config.events,
        userId: config.userId,
        filters: config.filters,
        rateLimitMinutes: config.rateLimitMinutes,
      };
  
      this.webhooks.set(dbWebhook.id, webhook);
      console.log(`🎯 Webhook registered: ${webhook.name} (${webhook.type})`);
      
      // Force reload to ensure sync
      await this.reloadWebhooks();
      
      return dbWebhook.id;
    } catch (error) {
      console.error('❌ Failed to register webhook:', error);
      throw error;
    }
  }

/**
 * Force process all queued events immediately (for testing)
 */
public async processQueuedEvents(): Promise<void> {
    if (this.processing) {
      console.log('⏳ Queue already processing, waiting...');
      while (this.processing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  
    if (this.eventQueue.length === 0) {
      console.log('📭 No events in queue to process');
      return;
    }
  
    console.log(`🔄 Force processing ${this.eventQueue.length} queued events...`);
    
    this.processing = true;
    const batch = this.eventQueue.splice(0, this.eventQueue.length);
  
    for (const payload of batch) {
      await this.processWebhookPayload(payload);
    }
  
    this.processing = false;
    console.log('✅ Queue processing completed');
  }
}

export const webhookService = new WebhookService();