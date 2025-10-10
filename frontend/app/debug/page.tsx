"use client";

export default function DebugPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>

      <div className="space-y-4 bg-zinc-900 p-6 rounded-lg">
        <div>
          <strong>NEXT_PUBLIC_API_URL:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded overflow-auto">
            {apiUrl || "NOT SET (will use fallback)"}
          </pre>
        </div>

        <div>
          <strong>Actual value being used:</strong>
          <pre className="mt-2 bg-zinc-800 p-3 rounded overflow-auto">
            {apiUrl || 'https://redlead.onrender.com'}
          </pre>
        </div>

        <div>
          <strong>Test API Call:</strong>
          <button
            onClick={async () => {
              const url = apiUrl || 'https://redlead.onrender.com';
              const response = await fetch(`${url}/health`);
              const data = await response.json();
              alert(JSON.stringify(data, null, 2));
            }}
            className="bg-orange-500 px-4 py-2 rounded mt-2"
          >
            Test /health endpoint
          </button>
        </div>
      </div>
    </div>
  );
}
