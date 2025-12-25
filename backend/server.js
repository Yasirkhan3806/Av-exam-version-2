import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/database.js";
import path from "path";

import authRouter from "./routes/authRoutes.js";
import questionRouter from "./routes/questionRoutes.js";
import subjectRouter from "./routes/subjectRoutes.js";
import instructorRoutes from "./routes/instructorRoutes.js";
import cafExamAnswerRoutes from "./routes/cafExamAnswerRoutes.js";

const app = express();
const PORT = 5000;

(async () => {
  // Connect to database
  await connectDB();

  // Middlewares
  app.use((req, res, next) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "https://academicvitality.org",
    ];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET,HEAD,OPTIONS,POST,PUT,DELETE"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get("/", (req, res) => {
    return res.status(200).json("server is running");
  });

  // Routes
  app.use("/auth", authRouter);
  app.use("/questions", questionRouter);
  app.use(
    "/TestQuestions",
    express.static(path.join(process.cwd(), "TestQuestions"))
  );
  app.use(
    "/Answer_pdfs",
    express.static(path.join(process.cwd(), "Answer_pdfs"))
  );
  app.use("/subjects", subjectRouter);
  app.use("/instructors", instructorRoutes);
  app.use("/caf-answers", cafExamAnswerRoutes);

  // Start server
  app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}/`)
  );
})();
