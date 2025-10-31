"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import QuestionPanel from "./QuestionWindow";
import Editor from "./AnswerWindow";
import PracticeSheet from "./PracticeSheet";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import useExamStore from "./StateManagement";
import Navbar from "./Navbar";
import handleLogout from '../../Logout'

const ExamPage = () => {
  const params = useParams();
  const { examId } = params;


  const { startExam, reset, finishExam } = useExamStore();

  // useEffect(() => {
  //   fetchExam(examId);
  // }, [examId]);

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.hidden) {
        document.title = "Come back!";
        await finishExam();
        const BASEURL = process.env.NEXT_PUBLIC_BASEURL || 'http://localhost:5000';
        try {
          // ✅ 1. Call backend to destroy session
          const response = await fetch(`${BASEURL}/auth/logout`, {
            method: "POST",
            credentials: "include", // 👈 Sends cookies (including connect.sid)
            headers: {
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Logout failed: ${response.statusText}`);
          }

          // ✅ 2. Optional: Clear any client-side auth tokens (if you use them)
          localStorage.removeItem('authToken');
          localStorage.clear();

          // ✅ 3. Redirect after successful logout
          window.location.href = '/Login'; // or '/login' — make sure path matches your route

        } catch (error) {
          console.error("Logout error:", error);
        }
      } else {
        console.log("User came back.");
        document.title = "Exam Page";
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    startExam();
    return () => {
      reset();
    }
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
