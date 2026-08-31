import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./middleware.js";

// Single source of truth for how long an ExamToken JWT stays valid and how
// long the cookie carrying it is allowed to live. These used to be defined
// independently — a 10h JWT but a 2h cookie (questionController.js) — and
// drifted: the cookie silently died 8 hours before the token did, so any
// exam running past 2h started failing every autosave with "No ExamToken
// provided" even though the token itself was still valid. Deriving both
// from one constant makes that class of bug impossible to reintroduce.
//
// 16h is a flat, generous ceiling (not tied to any one exam's duration —
// startExam() doesn't currently know which exam-type model a questionSet
// belongs to, so per-exam sizing would need that lookup threaded in too).
// submitAnswers() also reissues a fresh token on every successful autosave
// (see questionController.js), so in practice an actively-saving session
// never approaches this ceiling regardless of total exam length — it only
// matters for a student who goes idle without saving.
export const EXAM_TOKEN_LIFETIME_HOURS = 16;
export const EXAM_TOKEN_LIFETIME_SECONDS = EXAM_TOKEN_LIFETIME_HOURS * 60 * 60;
export const EXAM_TOKEN_COOKIE_MAX_AGE_MS = EXAM_TOKEN_LIFETIME_SECONDS * 1000;

export const signExamToken = ({ userId, ExamId }) =>
  jwt.sign({ userId, ExamId }, JWT_SECRET, {
    expiresIn: EXAM_TOKEN_LIFETIME_SECONDS,
  });
