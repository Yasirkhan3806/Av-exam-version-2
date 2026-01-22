"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Users, Volume2, Coffee } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("GeneralStudyArea");

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

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    router.push(
      `/library?room=${selectedRoom}&name=${encodeURIComponent(name)}`,
    );
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-gray-950 to-gray-950" />

      <div className="relative w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              24/7 E-Library
            </h1>
            <p className="text-gray-400 text-lg">
              Join students worldwide in our always-open virtual library. Study,
              discuss, and grow together.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">24/7</div>
              <div className="text-sm text-gray-500">Always Open</div>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800 backdrop-blur-sm">
              <div className="text-3xl font-bold text-white mb-1">Live</div>
              <div className="text-sm text-gray-500">Video & Audio</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md p-8 rounded-2xl border border-gray-800 shadow-2xl">
          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                What should we call you?
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                required
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-400">
                Choose a Room
              </label>
              <div className="grid gap-3">
                {rooms.map((room) => {
                  const Icon = room.icon;
                  const isSelected = selectedRoom === room.id;
                  return (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => setSelectedRoom(room.id)}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? "bg-blue-500/20 border-blue-500/50 ring-1 ring-blue-500/50"
                          : "bg-gray-800/30 border-gray-700 hover:bg-gray-800/50 hover:border-gray-600"
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${room.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {room.label}
                        </div>
                        <div className="text-xs text-gray-400">{room.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
            >
              Join Library
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
