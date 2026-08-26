"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from 'next/dynamic';
import Editor from "./AnswerWindow";
import { logExamEvent } from "../../../utils/examDebugTrail";

const QuestionPanel = dynamic(() => import('./QuestionWindow'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full p-4 flex flex-col gap-4 animate-pulse">
      <div className="h-12 bg-gray-200 rounded-lg w-full shadow-sm opacity-70"></div>
      <div className="flex-1 bg-gray-200 rounded-lg w-full shadow-sm opacity-50 flex items-center justify-center">
        <span className="text-gray-500">Loading Question Viewer...</span>
      </div>
    </div>
  )
});

const PracticeSheet = dynamic(() => import('./PracticeSheet'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
      <div className="w-64 flex flex-col items-center space-y-4">
        <div className="p-3 bg-blue-100 rounded-full animate-pulse">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="text-center w-full">
          <h3 className="text-sm font-semibold text-gray-700">Loading Spreadsheet</h3>
          <p className="text-xs text-gray-400 mt-1">Downloading resources...</p>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden relative">
            <div className="absolute top-0 h-full bg-blue-500 rounded-full" 
                 style={{ width: '40%', animation: 'spreadsheet-loading 1.5s infinite ease-in-out' }}>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spreadsheet-loading {
          0% { left: -40%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  )
});
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useExamStore from "../../../store/useExamStore";
import Navbar from "./Navbar";
import Watchdog from "../../../components/Watchdog";

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

  const { startExam, reset, finishExam, setOnline, isOnline, currentQuestion, remainingTime } = useExamStore();

  // Start exam on mount
  useEffect(() => {
    logExamEvent("exam_started", { examId });
    startExam();

    return () => {
      reset();
    };
  }, [startExam, reset, examId]);

  // --- Connectivity monitoring ---
  useEffect(() => {
    // Initialize from current browser state (handles page load while already offline)
    setOnline(navigator.onLine);

    const handleOnline = () => {
      logExamEvent("connectivity_restored", { examId });
      setOnline(true);
    };
    const handleOffline = () => {
      logExamEvent("connectivity_lost", { examId });
      setOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  // Set Sentry context
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.__examContext = { 
        examId, 
        currentQuestion, 
        isOnline,
        timeRemaining: remainingTime,
      };
    }
  }, [examId, currentQuestion, isOnline, remainingTime]);

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
  }, [finishExam, reset]);

  return (
    <div className="min-h-screen">
      <Watchdog thresholdMs={3000} context={{ examId }} />
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
