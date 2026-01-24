"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, Volume2, Coffee, LogOut, User } from "lucide-react";
import useELibraryAuthStore from "@/store/useELibraryAuthStore";
import ELibraryProtectedRoute from "@/components/ELibraryProtectedRoute";

function ELibraryContent() {
  const router = useRouter();
  const { eLibraryUser, logoutELibrary, isELibraryAuthenticated } =
    useELibraryAuthStore();
  const [selectedRoom, setSelectedRoom] = useState("GeneralStudyArea");
  const [roomCounts, setRoomCounts] = useState({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // Since this is a client component, we should fetch via absolute path or rely on proxy (assumed set up)
        // or just relative path if on same domain. Here attempting relative.
        // Assuming your NEXT_PUBLIC_BACKEND_URL is available or configured in next.config.
        // For now, I'll attempt a direct fetch to the backend port if relative fails, but let's assume proxy or CORS is fine.
        // Actually, looking at the user's setup, they usually fetch from localhost:5000.
        // I'll use the standard fetch pattern seen in this codebase.
        // However, I don't see a visible "api" helper imported here. I'll use native fetch to localhost:5000 for now.

        const res = await fetch(
          "http://localhost:5000/api/elibrary/rooms/counts",
          {
            headers: {
              // Include credentials to handle cookie auth if needed, but counts might be public?
              // eLibraryAuthToken is httponly cookie, so credentials: 'include' is important.
            },
            credentials: "include",
          },
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRoomCounts(data.counts);
          }
        }
      } catch (error) {
        console.error("Failed to fetch room counts", error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const rooms = [
    {
      id: "GeneralStudyArea",
      label: "General Study Area",
      desc: "Quiet study with occasional discussion.",
      icon: BookOpen,
      color: "bg-blue-500/10 border-blue-500/20 text-blue-400",
    },
    {
      id: "GroupDiscussionZone",
      label: "Group Discussion",
      desc: "Open floor for collaboration and talks.",
      icon: Users,
      color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    },
    {
      id: "SilentFocusRoom",
      label: "Silent Focus",
      desc: "Absolute silence for deep work.",
      icon: Volume2,
      color: "bg-purple-500/10 border-purple-500/20 text-purple-400",
    },
    {
      id: "BreakRoom",
      label: "Coffee Break",
      desc: "Chill, relax and chat freely.",
      icon: Coffee,
      color: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    },
  ];

  const handleLogout = async () => {
    await logoutELibrary();
    router.push("/elibrary/login");
  };

  const handleJoin = (e) => {
    e.preventDefault();
    const userName = eLibraryUser?.firstName || "Student";
    router.push(
      `/elibrary/components/library?room=${selectedRoom}&name=${encodeURIComponent(userName)}`,
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900 flex flex-col relative overflow-hidden">
      {/* Header with User Info and Logout */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                eLibrary
              </h1>
              <p className="text-xs text-gray-500">24/7 Study Space</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-100">
              <User className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {eLibraryUser?.firstName} {eLibraryUser?.lastName}
                </span>
                <p className="text-xs text-gray-500">{eLibraryUser?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 hover:border-red-300"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome Back!
              </h2>
              <p className="text-gray-600 text-lg">
                Join students worldwide in our always-open virtual library.
                Study, discuss, and grow together.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  24/7
                </div>
                <div className="text-sm text-gray-600">Always Open</div>
              </div>
              <div className="p-4 rounded-xl bg-white/80 backdrop-blur-sm border border-blue-100 shadow-sm">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  Live
                </div>
                <div className="text-sm text-gray-600">Video & Audio</div>
              </div>
            </div>
          </div>

          {/* Right Side - Room Selection */}
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl border border-blue-100 shadow-xl">
            <form onSubmit={handleJoin} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Choose a Study Room
                </label>
                <div className="grid gap-3">
                  {rooms.map((room) => {
                    const Icon = room.icon;
                    const isSelected = selectedRoom === room.id;
                    const count = roomCounts[room.id] || 0;

                    return (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => setSelectedRoom(room.id)}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-all text-left ${
                          isSelected
                            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
                            : "bg-white/50 border-gray-200 hover:bg-blue-50/50 hover:border-blue-200"
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${room.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <div className="font-medium text-gray-900">
                              {room.label}
                            </div>
                            <div className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                              {count} {count === 1 ? "User" : "Users"}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {room.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-lg transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40"
              >
                Join Library
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <ELibraryProtectedRoute>
      <ELibraryContent />
    </ELibraryProtectedRoute>
  );
}
