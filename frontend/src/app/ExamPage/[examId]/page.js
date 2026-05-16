"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import QuestionPanel from "./QuestionWindow";
import Editor from "./AnswerWindow";
import dynamic from 'next/dynamic';

const PracticeSheet = dynamic(() => import('./PracticeSheet'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50 text-gray-400 font-medium rounded-lg border border-dashed border-gray-300">
      <p>Loading Spreadsheet...</p>
    </div>
  )
});
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useExamStore from "../../../store/useExamStore";
import Navbar from "./Navbar";

// --- Offline Overlay Component ---
const OfflineOverlay = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      backgroundColor: "rgba(15, 23, 42, 0.75)",
    }}
  >
    {/* Pulsing wifi-off icon */}
    <div
      style={{
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: "rgba(239, 68, 68, 0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
        animation: "offlinePulse 2s ease-in-out infinite",
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#ef4444"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" />
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" />
        <path d="M10.71 5.05A16 16 0 0 1 22.56 9" />
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    </div>

    <h2
      style={{
        color: "#ffffff",
        fontSize: "1.75rem",
        fontWeight: 700,
        margin: 0,
        marginBottom: 12,
        letterSpacing: "-0.02em",
      }}
    >
      Connection Lost — Exam Paused
    </h2>

    <p
      style={{
        color: "rgba(255, 255, 255, 0.6)",
        fontSize: "1rem",
        margin: 0,
        maxWidth: 420,
        textAlign: "center",
        lineHeight: 1.6,
      }}
    >
      Your progress is safe. The timer will resume automatically when
      you&apos;re back online.
    </p>

    {/* Keyframe animation */}
    <style jsx global>{`
      @keyframes offlinePulse {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.12);
          opacity: 0.7;
        }
      }
    `}</style>
  </div>
);

const ExamPage = () => {
  const params = useParams();
  const { examId } = params;

  const { startExam, reset, finishExam, setOnline, isOnline } = useExamStore();

  // Start exam on mount
  useEffect(() => {
    startExam();

    return () => {
      reset();
    };
  }, []);

  // --- Connectivity monitoring ---
  useEffect(() => {
    // Initialize from current browser state (handles page load while already offline)
    setOnline(navigator.onLine);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Handle back button separately
  useEffect(() => {
    const handlePopState = (e) => {
      e.preventDefault();
      const confirmLeave = window.confirm(
        "Are you sure you want to leave the exam? Your progress may be lost."
      );

      if (confirmLeave) {
        finishExam();
        reset();
        window.history.back();
      } else {
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="min-h-screen">
      {/* Offline overlay — blocks entire exam when disconnected */}
      {!isOnline && <OfflineOverlay />}

      <Navbar />
      <PanelGroup direction="horizontal">
        {/* Left Panel */}
        <Panel defaultSize={50} minSize={25}>
          <div className="h-full z-0 ">
            <div className="h-full border-r-2 border-gray-300 p-2">
              <QuestionPanel examId={examId} />
            </div>
          </div>
        </Panel>

        {/* Divider (draggable) */}
        <PanelResizeHandle className="w-2 bg-gray-300 hover:bg-gray-400 cursor-col-resize" />

        {/* Right Panel with vertical split */}
        <Panel defaultSize={50} minSize={25}>
          <PanelGroup direction="vertical">
            {/* Editor */}
            <Panel defaultSize={50} minSize={20}>
              <div className="h-full flex flex-col border-b-2 border-gray-300 p-2">
                <Editor />
              </div>
            </Panel>

            {/* Drag Handle */}
            <PanelResizeHandle className="h-2 bg-gray-300 hover:bg-gray-400 cursor-row-resize" />

            {/* Practice Sheet */}
            <Panel defaultSize={50} minSize={20}>
              <div className="h-full flex flex-col p-2">
                <PracticeSheet />
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default ExamPage;
