"use client";

import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import usePrcExamStore from "@/store/prcExamStore";

import ExamIntro from "./components/ExamIntro";
import ExamInterface from "./components/ExamInterface";
import ExamResult from "./components/ExamResult";

const PRCExamPage = () => {
  const { id } = useParams();
  const {
    exam,
    isExamStarted,
    isFinished,
    isLoading,
    error,
    result,
    timeLeft,
    fetchExam,
    tickTimer,
    finishExam,
    reset,
  } = usePrcExamStore();

  useEffect(() => {
    if (id) {
      reset();
      fetchExam(id);
    }
  }, [id, fetchExam, reset]);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isExamStarted && !isFinished && timeLeft > 0) {
      timer = setInterval(() => {
        tickTimer();
      }, 1000);
    } else if (timeLeft === 0 && isExamStarted && !isFinished) {
      finishExam();
    }
    return () => clearInterval(timer);
  }, [isExamStarted, isFinished, timeLeft, tickTimer, finishExam]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading Exam...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        {error}
      </div>
    );
  if (!exam) return null;

  // 1. Intro Screen
  if (!isExamStarted && !isFinished) {
    return <ExamIntro />;
  }

  // 3. Result Screen
  if (isFinished && result) {
    return <ExamResult />;
  }

  // 2. Exam Interface
  return <ExamInterface />;
};

export default PRCExamPage;
