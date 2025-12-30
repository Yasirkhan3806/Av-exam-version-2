"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import QuestionPanel from "./QuestionWindow";
import Editor from "./AnswerWindow";
import PracticeSheet from "./PracticeSheet";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useExamStore from "../../../store/useExamStore";
import Navbar from "./Navbar";

const ExamPage = () => {
  const params = useParams();
  const { examId } = params;

  const { startExam, reset ,finishExam} = useExamStore();

// Start exam on mount
useEffect(() => {
  startExam();
  
  return () => {
    reset();
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
