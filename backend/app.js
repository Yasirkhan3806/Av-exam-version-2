import "./instrument.js";
import * as Sentry from "@sentry/node";

import express from "express";
import cookieParser from "cookie-parser";
import compression from "compression";
import path from "path";

import authRouter from "./routes/authRoutes.js";
import questionRouter from "./routes/questionRoutes.js";
import subjectRouter from "./routes/subjectRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import cafExamAnswerRoutes from "./routes/cafExamAnswerRoutes.js";
import prcExamRouter from "./routes/prcExamRoutes.js";
import eLibraryAuthRoutes from "./routes/eLibraryAuthRoutes.js";
import eLibraryRoomRoutes from "./routes/eLibraryRoomRoutes.js";
import logRoutes from "./routes/logs.js";
import onlyofficeRoutes from "./routes/onlyofficeRoutes.js";
import onlyofficeExamRoutes from "./routes/onlyofficeExamRoutes.js";
import { backendLogger } from "./utils/logger.js";

/**
 * Builds and returns a fully-wired Express app — middleware, routes, and
 * error handlers — without connecting to the database or binding a port.
 * That split lets tests (tests/rbac.integration.test.js) exercise real
 * routes/middleware via supertest without a live server process. server.js
 * is the actual entrypoint: it calls connectDB() then buildApp().listen(...).
 */
export function buildApp() {
  const app = express();

  // Middlewares
  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://www.localhost:3000",
      "http://localhost:3000",
      "https://academicvitality.org",
      "https://www.academicvitality.org",
      "https://testcbe.academicvitality.org",
      "https://www.testcbe.academicvitality.org",
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,OPTIONS,POST,PUT,DELETE",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  app.use(compression());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());

  app.get("/", (req, res) => {
    return res.status(200).json("server is running");
  });

  // Routes
  app.use("/auth", authRouter);
  app.use("/questions", questionRouter);
  app.use(
    "/TestQuestions",
    express.static(path.join(process.cwd(), "TestQuestions"), {
      maxAge: '1d', // Cache static questions for 1 day
      immutable: true
    })
  );

  app.use(
    "/Answer_pdfs",
    express.static(path.join(process.cwd(), "Answer_pdfs")),
  );
  app.use("/subjects", subjectRouter);
  app.use("/instructors", instructorRoutes);
  app.use("/caf-answers", cafExamAnswerRoutes);
  app.use("/prc-exams", prcExamRouter);
  app.use("/api/elibrary/auth", eLibraryAuthRoutes);
  app.use("/api/elibrary/rooms", eLibraryRoomRoutes);
  app.use("/api/logs", logRoutes);
  app.use("/api/onlyoffice/exam", onlyofficeExamRoutes);
  app.use("/api/onlyoffice", onlyofficeRoutes);

  // Global Error Handler Middleware
  Sentry.setupExpressErrorHandler(app);

  app.use((err, req, res, next) => {
    // Attempt to extract user info if attached via some auth middleware
    const userId = req.user ? req.user.id || req.user._id : 'Unauthenticated';
    const userName = req.user ? req.user.name || req.user.firstName : 'Unknown';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    backendLogger.error(err.message || 'Internal Server Error', {
        userId,
        userName,
        errorType: err.name || 'Error',
        stack: err.stack,
        endpoint: req.originalUrl,
        method: req.method,
        device: userAgent
    });

    // AppError (utils/AppError.js) — a service deliberately threw this with
    // a specific status code and a message that's safe to show the client
    // (e.g. "Student not found", 404). Anything else is an unexpected
    // error — keep hiding its message from the response, same as before.
    if (err.isOperational) {
      return res.status(err.statusCode || 500).json({ success: false, message: err.message });
    }

    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
