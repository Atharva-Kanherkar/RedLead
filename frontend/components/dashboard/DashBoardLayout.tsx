"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from './DashboardSidebar';
import { LeadFeed } from './LeadFeed';
import { AnalyticalDashboard } from './AnalyticalDashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { Inter, Poppins } from 'next/font/google';
import { RedLeadHeader } from './DashboardHeader';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingLeads from '../loading/LoadingLeads';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
});

interface Lead {
  id: string;
  title: string;
  author: string;
  subreddit: string;
  url: string;
  body: string;
  createdAt: number;
  numComments: number;
  upvoteRatio: number;
  intent: string;
  summary?: string | null;
  opportunityScore: number;
  status?: "new" | "replied" | "saved" | "ignored";
}

interface Campaign {
  id: string;
  userId: string;
  analyzedUrl: string;
  generatedKeywords: string[];
  generatedDescription: string;
  targetSubreddits: string[];
  competitors: string[];
  createdAt: string;
  _count?: {
    leads: number;
  };
}

export const DashboardLayout = () => {
  const { getToken } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDiscovery, setIsRunningDiscovery] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // New state for view management
  const [activeView, setActiveView] = useState<'dashboard' | 'leads'>('dashboard');
  const [activeFilter, setActiveFilter] = useState("all");
  const [intentFilter, setIntentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("opportunityScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Your existing fetch functions remain the same
  const fetchCampaigns = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await api.getCampaigns(token);
      setCampaigns(data || []);
      if (data && data.length > 0 && !activeCampaign) {
        setActiveCampaign(data[0].id);
      } else if (!data || data.length === 0) {
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(`Failed to load campaigns: ${err.message}`);
    }
  }, [getToken, activeCampaign]);

  const fetchLeads = useCallback(async (campaignId: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const allLeadsResponse = await api.getLeads(campaignId, {
        intent: intentFilter,
        sortBy,
        sortOrder,
        page: 1,
        limit: 1000,
      }, token);
      
      const leadsData = allLeadsResponse.data || [];
      setAllLeads(leadsData);
      
      if (activeFilter !== "all") {
        setLeads(leadsData.filter((lead: Lead) => (lead.status || 'new') === activeFilter));
      } else {
        setLeads(leadsData);
      }
    } catch (err: any) {
      setError(`Failed to load leads: ${err.message}`);
      setLeads([]);
      setAllLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [getToken, activeFilter, intentFilter, sortBy, sortOrder]);

  const handleManualDiscovery = async () => {
    if (!activeCampaign) return;
    setIsRunningDiscovery(true);
    try {
      const token = await getToken();
      await api.runManualDiscovery(activeCampaign, token);
      setTimeout(() => fetchLeads(activeCampaign), 2000);
    } catch (err: any) {
      setError(`Manual discovery failed: ${err.message}`);
    } finally {
      setIsRunningDiscovery(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  useEffect(() => {
    if (activeCampaign && activeView === 'leads') {
      fetchLeads(activeCampaign);
    }
  }, [activeCampaign, fetchLeads, activeFilter, activeView]);

  const leadStats = {
    new: allLeads.filter(l => (l.status || 'new') === 'new').length,
    replied: allLeads.filter(l => l.status === 'replied').length,
    saved: allLeads.filter(l => l.status === 'saved').length,
    all: allLeads.length
  };

  const handleLeadUpdate = (leadId: string, status: Lead['status']) => {
    setLeads(prevLeads =>
      prevLeads.map(lead =>
        lead.id === leadId ? { ...lead, status } : lead
      )
    );
    setAllLeads(prevAllLeads =>
      prevAllLeads.map(lead =>
        lead.id === leadId ? { ...lead, status } : lead
      )
    );
  };

  if (error && campaigns.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 w-full"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">

      <RedLeadHeader />
      <div className="flex">
        <motion.aside 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ 
            opacity: 1, 
            x: 0, 
            width: isSidebarCollapsed ? 80 : 280 
          }} 
          transition={{ duration: 0.3 }} 
          className="flex-shrink-0 border-r bg-card"
        >
          <DashboardSidebar 
            campaigns={campaigns} 
            activeCampaign={activeCampaign} 
            setActiveCampaign={setActiveCampaign} 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter} 
            stats={leadStats} 
            isCollapsed={isSidebarCollapsed} 
            setIsCollapsed={setIsSidebarCollapsed}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        </motion.aside>
        
        <main className="flex-1">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AnalyticalDashboard 
                  campaigns={campaigns}
                  activeCampaign={activeCampaign}
                  leadStats={leadStats}
                  allLeads={allLeads}
                />
              </motion.div>
            ) : (
              <motion.div
                key="leads"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
                    <p className="text-muted-foreground">
                      Discover and manage potential customers from Reddit
                    </p>
                  </div>
                  <Button 
                    onClick={handleManualDiscovery} 
                    disabled={isRunningDiscovery || !activeCampaign}
                  >
                    {isRunningDiscovery ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Discovering...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Discover Leads
                      </>
                    )}
                  </Button>
                </div>

                {isLoading ? (
                 <LoadingLeads />
                ) : (
                  <LeadFeed 
                    leads={leads} 
                    onManualDiscovery={handleManualDiscovery} 
                    isRunningDiscovery={isRunningDiscovery}
                    onLeadUpdate={handleLeadUpdate} 
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
