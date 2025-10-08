import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './client.js';
import path from 'path';

  import authRouter from './AuthRoutes.js';
  import questionRouter from './QuestionRoutes.js';
  import SubjectRouter from './SubjectRoutes.js';

const app = express();
const PORT = 5000;


(async () => {
 
  // Middlewares
app.use((req, res, next) => {
    // Allow specific origin instead of *
    const allowedOrigins = ['http://localhost:3000', 'https://academicvitality.org'];
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
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
});

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());


 
  app.use('/auth', authRouter);
  app.use('/questions', questionRouter);
  app.use("/TestQuestions", express.static(path.join(process.cwd(), "TestQuestions")));
  app.use('/subjects', SubjectRouter);

  // Start server
  app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}/`));
})();
