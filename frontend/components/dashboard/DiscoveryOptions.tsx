"use client";
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth, useUser } from '@clerk/nextjs';
import { Inter, Poppins } from 'next/font/google';
import { toast } from 'sonner';
import { RedditConnectionAlert } from './RedditConnectionAlert';
import { useRouter } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800']
});

interface DiscoveryButtonsProps {
  campaignId: string;
  targetSubreddits: string[];
  onLeadsDiscovered: () => void;
  lastDiscoveryAt?: Date | null;
}

export const DiscoveryButtons: React.FC<DiscoveryButtonsProps> = ({
  campaignId,
  targetSubreddits,
  onLeadsDiscovered,
  lastDiscoveryAt
}) => {
  const { getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [isRunningGlobal, setIsRunningGlobal] = useState(false);
  const [isRunningTargeted, setIsRunningTargeted] = useState(false);

  // Force refresh user data when component mounts to get latest Reddit connection status
  React.useEffect(() => {
    if (isLoaded && user) {
      user.reload();
    }
  }, [isLoaded, user]);

  // Check if user has connected Reddit
  const hasConnectedReddit = user?.publicMetadata?.hasConnectedReddit as boolean || false;

  const handleGlobalDiscovery = async () => {
    if (!hasConnectedReddit) {
      toast.error('Reddit Connection Required', {
        description: 'Please connect your Reddit account first'
      });
      router.push('/connect-reddit');
      return;
    }

    try {
      setIsRunningGlobal(true);
      const token = await getToken();
      const result = await api.runManualDiscovery(campaignId, token);

      toast.success(`Found ${result.length} global leads!`, {
        description: 'Discovered leads from across Reddit using global search'
      });

      onLeadsDiscovered();
    } catch (error: any) {
      console.error('Global discovery failed:', error);

      // Check if error is due to Reddit not being connected
      if (error.message?.includes('Reddit account not connected')) {
        toast.error('Reddit Connection Required', {
          description: 'Please connect your Reddit account to discover leads'
        });
        router.push('/connect-reddit');
      } else {
        toast.error('Global discovery failed', {
          description: error.message || 'Please try again later'
        });
      }
    } finally {
      setIsRunningGlobal(false);
    }
  };

  const handleTargetedDiscovery = async () => {
    if (!hasConnectedReddit) {
      toast.error('Reddit Connection Required', {
        description: 'Please connect your Reddit account first'
      });
      router.push('/connect-reddit');
      return;
    }

    try {
      setIsRunningTargeted(true);
      const token = await getToken();
      const result = await api.runTargetedDiscovery(campaignId, token);

      toast.success(`Found ${result.leads?.length || 0} targeted leads!`, {
        description: `Searched ${result.subredditsSearched?.length || 0} specific subreddits`
      });

      onLeadsDiscovered();
    } catch (error: any) {
      console.error('Targeted discovery failed:', error);

      if (error.message?.includes('Reddit account not connected')) {
        toast.error('Reddit Connection Required', {
          description: 'Please connect your Reddit account to discover leads'
        });
        router.push('/connect-reddit');
      } else if (error.message?.includes('No target subreddits')) {
        toast.error('No target subreddits configured', {
          description: 'Please add target subreddits to your campaign first'
        });
      } else {
        toast.error('Targeted discovery failed', {
          description: error.message || 'Please try again later'
        });
      }
    } finally {
      setIsRunningTargeted(false);
    }
  };

  const isAnyRunning = isRunningGlobal || isRunningTargeted;
  const hasTargetSubreddits = targetSubreddits && targetSubreddits.length > 0;

  // Show Reddit connection alert if not connected
  if (!hasConnectedReddit) {
    return (
      <div className="space-y-6">
        <RedditConnectionAlert message="Connect your Reddit account to start discovering leads. All lead discovery uses YOUR Reddit account to ensure compliance and proper attribution." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Discovery Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
      >
        {/* Global Discovery */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative h-full flex flex-col"
        >
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4 flex flex-col h-full min-h-[210px]">
            <div className="space-y-2 flex-1">
              <h3 className={`text-base sm:text-lg font-bold text-white ${poppins.className}`}>
                Global Search
              </h3>
              <p className={`text-white/60 text-sm ${inter.className}`}>
                AI-powered search across the entire Reddit platform for discovering new opportunities.
              </p>
            </div>
            <Button
              onClick={handleGlobalDiscovery}
              disabled={isAnyRunning}
              className={`
                w-full bg-white text-blue-600 hover:bg-gray-50 border-0
                shadow-sm hover:shadow-md transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                font-semibold h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base rounded-md
              `}
            >
              {isRunningGlobal ? (
                <span className={poppins.className}>Discovering Globally...</span>
              ) : (
                <span className={poppins.className}>Start Global Discovery</span>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Targeted Discovery */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative h-full flex flex-col"
        >
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-3 sm:p-4 flex flex-col h-full min-h-[210px]">
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <h3 className={`text-base sm:text-lg font-bold text-white ${poppins.className}`}>
                  Targeted Search
                </h3>
                <ArrowRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform duration-300" />
              </div>
              <p className={`text-white/60 text-sm ${inter.className}`}>
                {hasTargetSubreddits 
                  ? `Deep search across your ${targetSubreddits.length} configured subreddits for highly relevant leads.`
                  : 'Configure target subreddits in your campaign settings to unlock precision targeting.'
                }
              </p>
            </div>
            <Button
              onClick={handleTargetedDiscovery}
              disabled={isAnyRunning || !hasTargetSubreddits}
              className={`
                w-full bg-white text-red-600 hover:bg-gray-50 border-0 
                shadow-sm hover:shadow-md transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-200
                font-semibold h-9 sm:h-10 px-3 sm:px-4 text-sm sm:text-base rounded-md
              `}
            >
              {isRunningTargeted ? (
                <span className={poppins.className}>Targeting Leads...</span>
              ) : !hasTargetSubreddits ? (
                <span className={poppins.className}>Configure Subreddits</span>
              ) : (
                <span className={poppins.className}>Start Targeted Search</span>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>

      {/* Progress Indicator ...unchanged... */}

      {isAnyRunning && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-3"
        >
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
              animate={{
                width: ['0%', '100%'],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          <p className={`text-center text-white/60 text-sm ${inter.className}`}>
            {isRunningGlobal 
              ? 'Scanning Reddit globally for opportunities...' 
              : 'Analyzing targeted subreddits for leads...'
            }
          </p>
        </motion.div>
      )}

      {/* Last Discovery Info ...unchanged... */}
      {lastDiscoveryAt && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <p className={`text-white/50 text-sm ${inter.className}`}>
            Last discovery: {new Date(lastDiscoveryAt).toLocaleDateString()}
          </p>
        </motion.div>
      )}
    </div>
  );
};
