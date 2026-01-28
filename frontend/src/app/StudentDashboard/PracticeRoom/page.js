"use client";

import React, { useEffect } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import usePracticeStore from "../../../store/usePracticeStore";
import PracticeNavbar from "./components/PracticeNavbar";
import PracticeQuestionWindow from "./components/PracticeQuestionWindow";
import PracticeAnswerWindow from "./components/PracticeAnswerWindow";
import PracticeSheet from "./components/PracticeSheet";

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
