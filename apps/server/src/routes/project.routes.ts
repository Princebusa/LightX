import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from "../controllers/project.controller";
import { chat } from "../controllers/chat.controller";
import {
  startPreview,
  getPreview,
  stopPreview,
} from "../controllers/preview.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/", authMiddleware, createProject);
router.get("/", authMiddleware, getProjects);
router.get("/:id", authMiddleware, getProjectById);
router.patch("/:id", authMiddleware, updateProject);
router.delete("/:id", authMiddleware, deleteProject);

router.post("/:id/chat", authMiddleware, chat);
router.post("/:id/preview", authMiddleware, startPreview);
router.get("/:id/preview", authMiddleware, getPreview);
router.delete("/:id/preview", authMiddleware, stopPreview);

export default router;
