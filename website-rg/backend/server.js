import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { closeDb, initDb } from "./db.js";
import { isMailConfigured, verifyMailer } from "./utils/mailer.js";
import authRouter from "./routes/auth.js";
import projectsRouter from "./routes/projects.js";
import documentsRouter from "./routes/documents.js";
import eventsRouter from "./routes/events.js";
import dashboardRouter from "./routes/dashboard.js";
import mediaRouter from "./routes/media.js";
import contactRouter from "./routes/contact.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

const primaryEnv = dotenv.config({ path: path.join(ROOT_DIR, ".env") });
if (primaryEnv.error) {
  dotenv.config({ path: path.join(__dirname, ".env") });
}

const app = express();
const PORT = process.env.PORT || 4010;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(ROOT_DIR, "uploads")));

const FRONTEND_DIR = path.join(ROOT_DIR, "frontend");
app.use(express.static(FRONTEND_DIR));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/documents", documentsRouter);
app.use("/api/events", eventsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/media", mediaRouter);
app.use("/api/contact", contactRouter);

initDb()
  .then(async () => {
    if (isMailConfigured()) {
      try {
        await verifyMailer();
        console.log("SMTP transport verified and ready");
      } catch (err) {
        console.error("SMTP verification failed", err);
      }
    } else {
      console.warn(
        "SMTP transport is not configured. Email functionality is disabled."
      );
    }

    const server = app.listen(PORT, () =>
      console.log(`API listening on port ${PORT}`)
    );

    const shutdown = async () => {
      console.log("\nShutting down server...");
      server.close(async () => {
        await closeDb().catch((err) =>
          console.error("Failed to close MongoDB connection", err)
        );
        process.exit(0);
      });
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
