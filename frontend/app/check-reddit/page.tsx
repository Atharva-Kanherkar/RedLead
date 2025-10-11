"use client";

import { useUser } from '@clerk/nextjs';

export default function CheckRedditPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="p-8 bg-black text-white">Loading...</div>;
  }

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Debug: Reddit Connection Status</h1>

      <div className="space-y-4 bg-zinc-900 p-6 rounded-lg">
        <div>
          <strong>User ID:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded">{user?.id}</pre>
        </div>

        <div>
          <strong>Public Metadata:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded overflow-auto">
            {JSON.stringify(user?.publicMetadata, null, 2)}
          </pre>
        </div>

        <div>
          <strong>hasConnectedReddit:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded">
            {String(user?.publicMetadata?.hasConnectedReddit)}
          </pre>
        </div>

        <div>
          <strong>Reddit Username:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded">
            {String(user?.publicMetadata?.redditUsername) || 'Not set'}
          </pre>
        </div>

        <button
          onClick={() => user?.reload()}
          className="bg-orange-500 px-4 py-2 rounded mt-4"
        >
          Reload User Data
        </button>
      </div>
    </div>
  );
}
