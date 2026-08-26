"use client";

import React, { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import usePracticeStore from "../../../store/usePracticeStore";
import PracticeNavbar from "./components/PracticeNavbar";
import PracticeAnswerWindow from "./components/PracticeAnswerWindow";
import dynamic from 'next/dynamic';

const PracticeQuestionWindow = dynamic(() => import('./components/PracticeQuestionWindow'), {
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

const PracticeSheet = dynamic(() => import('./components/PracticeSheet'), {
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

const PracticeRoomPage = () => {
  const { initializePractice, reset } = usePracticeStore();

  // useEffect(() => {
  //   // window.location.reload();

  //   if (sessionStorage.getItem("firstLoad") !== "true") {
  //     sessionStorage.setItem("firstLoad", "true");
  //     window.location.reload();
  //   }

  //   return () => {
  //     sessionStorage.removeItem("firstLoad");
  //   };
  // }, []);

  useEffect(() => {
    initializePractice();
    return () => reset();
  }, [initializePractice, reset]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col h-screen w-screen overflow-hidden">
      {/* Navbar */}
      <div className="flex-none z-10">
        <PracticeNavbar />
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full h-full relative">
        <PanelGroup direction="horizontal" autoSaveId="practice-panels">
          {/* Left Panel - Question PDF */}
          <Panel defaultSize={50} minSize={25}>
            <div className="h-full z-0 ">
              <div className="h-full border-r-2 border-gray-300 p-2">
                <PracticeQuestionWindow />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-2 bg-gray-300 hover:bg-gray-400 cursor-col-resize z-20" />

          {/* Right Panel - Editors */}
          <Panel defaultSize={50} minSize={25}>
            <PanelGroup direction="vertical">
              {/* Text Editor */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full flex flex-col border-b-2 border-gray-300 p-2">
                  <PracticeAnswerWindow />
                </div>
              </Panel>

              <PanelResizeHandle className="h-2 bg-gray-300 hover:bg-gray-400 cursor-row-resize z-20" />

              {/* Spreadsheet */}
              <Panel defaultSize={50} minSize={20}>
                <div className="h-full flex flex-col p-2">
                  <PracticeSheet />
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default PracticeRoomPage;
