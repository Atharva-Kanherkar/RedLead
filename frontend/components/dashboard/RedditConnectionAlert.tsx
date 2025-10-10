"use client";

import { AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';

interface RedditConnectionAlertProps {
  message?: string;
}

/**
 * Alert component shown when user tries to use Reddit features without connecting
 *
 * This enforces that all lead discovery uses the user's own Reddit account,
 * not the application's account.
 */
export function RedditConnectionAlert({ message }: RedditConnectionAlertProps) {
  const router = useRouter();

  return (
    <Alert className="bg-orange-500/10 border-orange-500/30">
      <AlertCircle className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-400 font-semibold">
        Reddit Connection Required
      </AlertTitle>
      <AlertDescription className="text-white/90 mt-2">
        {message || 'You must connect your Reddit account to discover leads. This ensures all activity happens through your account, not ours.'}

        <div className="mt-4">
          <Button
            onClick={() => router.push('/connect-reddit')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Connect Reddit Account
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
