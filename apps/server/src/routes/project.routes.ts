import {
  createProject,
  getProjects,
  getProjectById,
  deleteProject,
} from "../controllers/project.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { Router } from "express";

const router = Router();

router.post("/projects", authMiddleware, createProject);

// Get all projects
router.get("/projects", authMiddleware, getProjects);

// Get single project with files
router.get("/projects/:id", authMiddleware, getProjectById);

// Delete project
router.delete("/projects/:id", authMiddleware, deleteProject);


export default router;