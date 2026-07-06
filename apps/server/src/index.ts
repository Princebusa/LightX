import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import auth from "./routes/auth.routes";
import projectRoutes from "./routes/project.routes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/auth", auth);
app.use("/projects", projectRoutes);

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  },
);

const port = Number(process.env.PORT) || 3001;

const server = app.listen(port);

server.on("listening", () => {
  console.log(`Server running on port ${port}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${port} is already in use. Stop the other process or set a different PORT in .env`,
    );
  } else {
    console.error("Server failed to start:", err.message);
  }
  process.exit(1);
});
