// frontend/lib/api.ts

const API_BASE_URL = 'http://localhost:5000';

/**
 * A helper function to create standardized authentication headers.
 * @param token The session token from Clerk.
 * @returns A HeadersInit object with the Authorization header.
 */
const getAuthHeaders = (token: string | null): HeadersInit => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const api = {
  // Campaign endpoints
  getCampaigns: async (token: string | null) => {
    // The backend now infers the user from the token, so we don't need a userId in the URL.
    const response = await fetch(`${API_BASE_URL}/api/campaigns`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch campaigns');
    return response.json();
  },

  getCampaign: async (campaignId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/campaigns/${campaignId}`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch campaign');
    return response.json();
  },

  generateSummary: async (leadId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/summarize`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to generate summary');
    return response.json();
  },

  updateLeadStatus: async (leadId: string, status: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/${leadId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update lead status');
    return response.json();
  },

  // Lead endpoints
  getLeads: async (campaignId: string, params: Record<string, any>, token: string | null) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/api/leads/campaign/${campaignId}?${query}`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch leads');
    return response.json();
  },

  // Manual discovery
  runManualDiscovery: async (campaignId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/leads/discover/manual/${campaignId}`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to run manual discovery');
    return response.json();
  },

  // Engagement endpoints
  generateReply: async (leadId: string, context: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/engagement/generate`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ leadId, context }),
    });
    if (!response.ok) throw new Error('Failed to generate reply');
    return response.json();
  },

  postReply: async (leadId: string, replyContent: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/engagement/post-reply`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ leadId, content: replyContent }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to post reply');
    }
    return response.json();
  },

  refineReply: async (originalReply: string, instruction: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/engagement/refine`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ originalReply, instruction }),
    });
    if (!response.ok) throw new Error('Failed to refine reply');
    return response.json();
  },

  getMarketInsights: async (campaignId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/insights/campaign/${campaignId}`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch market insights');
    return response.json();
  },

  updateInsightStatus: async (insightId: string, status: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/insights/${insightId}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update insight status');
    return response.json();
  },

  addCompetitorToCampaign: async (insightId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/insights/${insightId}/add-competitor`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to add competitor to campaign');
    return response.json();
  },

  // Performance Analytics endpoints
  getReplyPerformance: async (token: string | null) => {
    // The backend now infers the user from the token.
    const response = await fetch(`${API_BASE_URL}/api/performance`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch reply performance');
    return response.json();
  },

  getReplyDetails: async (replyId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/performance/reply/${replyId}`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch reply details');
    return response.json();
  },

  // Reddit authentication
  getRedditAuthUrl: async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/reddit/auth`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to get Reddit auth URL');
    return response.json();
  },

  disconnectReddit: async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/reddit/disconnect`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to disconnect Reddit account');
    return response.json();
  },

  // Webhook endpoints
  createWebhook: async (webhookData: any, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(webhookData),
    });
    if (!response.ok) throw new Error('Failed to create webhook');
    return response.json();
  },

  getWebhooks: async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch webhooks');
    return response.json();
  },

  getWebhookStats: async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks/stats`, {
        headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to fetch webhook stats');
    return response.json();
  },

  updateWebhook: async (webhookId: string, updates: any, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks/${webhookId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update webhook');
    return response.json();
  },

  deleteWebhook: async (webhookId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to delete webhook');
    return response.json();
  },

  testWebhook: async (webhookId: string, token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/webhooks/${webhookId}/test`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) throw new Error('Failed to test webhook');
    return response.json();
  },
  deleteCurrentUser: async (token: string | null) => {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });
    if (!response.ok) throw new Error('Failed to delete account');
    return response.json();
  },
};