"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import QuestionPanel from "./QuestionWindow";
import Editor from "./AnswerWindow";
import PracticeSheet from "./PracticeSheet";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import useExamStore from "../../../store/useExamStore";
import Navbar from "./Navbar";

const ExamPage = () => {
  const params = useParams();
  const { examId } = params;

  const { startExam, reset, finishExam } = useExamStore();
  const router = useRouter();

  useEffect(() => {
    startExam();

    // Push a state to history so we can catch the back button
    window.history.pushState(null, "", window.location.href);

    const handlePopState = async (event) => {
      const confirmLeave = window.confirm(
        "Are you sure you want to leave? Your exam will be finished and submitted automatically."
      );

      if (confirmLeave) {
        try {
          await finishExam();
          router.push("/StudentDashboard/MySubjects");
        } catch (error) {
          console.error("Error finishing exam on back button:", error);
          router.push("/StudentDashboard/MySubjects");
        }
      } else {
        // Re-push state to keep user on the same page
        window.history.pushState(null, "", window.location.href);
      }
    };

    const handleBeforeUnload = (event) => {
      const message =
        "Are you sure you want to leave? Your progress may be lost.";
      event.returnValue = message;
      return message;
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      reset();
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
