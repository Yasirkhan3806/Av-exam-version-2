"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";

// Dynamic import for Jitsi component to avoid SSR issues
const JitsiMeetComponent = dynamic(() => import("../JitsiMeeting"), {
  ssr: false,
  loading: () => <div className="text-white">Loading Jitsi Core...</div>,
});

export default function LibraryRoom() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const room = searchParams.get("room") || "GeneralStudyArea";
  const name = searchParams.get("name") || "Student";
  const BASE_URL = process.env.NEXT_PUBLIC_BASEURL;

  // Heartbeat logic
  React.useEffect(() => {
    const sendHeartbeat = async () => {
      try {
        await fetch(`${BASE_URL}/api/elibrary/rooms/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: room }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Heartbeat error:", error);
      }
    };

    const leaveRoom = async () => {
      try {
        // Use sendBeacon for more reliable exit logs on tab close, otherwise fetch
        // Note: sendBeacon doesn't support custom headers or credentials easily in some older contexts,
        // but modern browsers handle it.
        // However, for simplicity and Auth cookies, we'll try a standard fetch first.
        // If the component unmounts, fetch might be cancelled.
        // We'll trust the TTL (60s) as a fallback if this fails.
        await fetch(`${BASE_URL}/api/elibrary/rooms/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName: room }),
          credentials: "include",
        });
      } catch (error) {
        console.error("Leave error:", error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 10000); // 10 seconds

    return () => {
      clearInterval(interval);
      leaveRoom();
    };
  }, [room]);

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold text-lg">
              {room.replace(/([A-Z])/g, " $1").trim()}
            </h1>
            <p className="text-xs text-gray-400">24/7 E-Library Session</p>
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Logged in as{" "}
          <span className="text-emerald-400 font-medium">{name}</span>
        </div>
      </header>

      {/* Main Content (Jitsi) */}
      <main className="flex-1 relative overflow-hidden">
        <JitsiMeetComponent
          roomName={`ELibrary_${room}`}
          displayName={name}
          onLeave={() => router.push("/")}
        />
      </main>
    </div>
  );
}
