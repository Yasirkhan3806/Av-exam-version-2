import {
  Questions,
  CafExamQuestions,
  PRCExam,
  Answer,
  CafExamAnswer,
  PRCAnswer,
} from "../models/index.js";

/**
 * The "pick the right model for this exam type" branch was reimplemented
 * ad-hoc 5+ times across instructorService.js/questionService.js/
 * subjectService.js, in slightly different shapes. This file is the single
 * source of truth for it — each function below is a drop-in replacement for
 * one of those shapes, chosen to match its call sites' exact prior
 * behavior (no behavior change, pure de-duplication).
 */

/**
 * Exam/question-definition model + its answer model, for all three exam
 * verticals. Used where a caller needs to locate and clean up an exam and
 * its answers together (e.g. deleting a question cascades to its answers).
 */
export function getExamAndAnswerModels(subjectType) {
  switch (subjectType) {
    case "CAF":
      return { Q: CafExamQuestions, A: CafExamAnswer };
    case "PRC":
      return { Q: PRCExam, A: PRCAnswer };
    default:
      return { Q: Questions, A: Answer };
  }
}

/** Exam/question-definition model only, for all three verticals. */
export function getExamModel(subjectType) {
  return getExamAndAnswerModels(subjectType).Q;
}

/**
 * Answer/result model only, for all three verticals — includes PRCAnswer.
 * Use this (not getAnswerModel below) for anything that just needs to know
 * "does a result exist" or which collection to look in, across every exam
 * type (e.g. subjectService's completed-exam check).
 */
export function getResultModel(subjectType) {
  return getExamAndAnswerModels(subjectType).A;
}

/**
 * Exam/question-definition model, scoped to the instructor-grading tooling
 * (getExamsBySubject, getSubmissionsByQuestion) — CAF/regular only. PRC was
 * never wired into instructor grading (see getAnswerModel below for why),
 * so it isn't a case here; don't add one without also building that out.
 */
export function getGradableExamModel(subjectType) {
  return subjectType === "CAF" ? CafExamQuestions : Questions;
}

/**
 * Answer model, scoped to the instructor-grading tooling (getStudentAnswers,
 * updateStudentMarks, deleteSubmission, and the submission counts in
 * getExamsBySubject/getSubmissionsByQuestion) — CAF/regular only.
 *
 * PRC is deliberately excluded: PrcExamAnswer is a write-once, auto-graded
 * document with no draft/submitted/checked lifecycle and none of the
 * {answers, marksObtained, status} shape these callers read/write — it was
 * never built to support manual instructor grading. Use getResultModel
 * above if you just need "does a PRC result exist", not this.
 */
export function getAnswerModel(subjectType) {
  return subjectType === "CAF" ? CafExamAnswer : Answer;
}
