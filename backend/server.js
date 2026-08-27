import { buildApp } from "./app.js";
import connectDB from "./config/database.js";
import { backendLogger } from "./utils/logger.js";

// Top level process handlers
process.on('uncaughtException', (err) => {
  backendLogger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason, promise) => {
  backendLogger.error(`Unhandled Rejection: ${reason}`, { reason });
});

const PORT = process.env.PORT || 5000;

(async () => {
  // Connect to database
  await connectDB();

  const app = buildApp();

  // Start server
  app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}/`),
  );
})();
