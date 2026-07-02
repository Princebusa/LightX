import type { Request, Response } from "express";
import { getOwnedProject } from "../utils/project";
import { asyncHandler } from "../utils/asyncHandler";
import {
  syncProjectPreview,
  getProjectPreview,
  destroyProjectSandbox,
} from "../services/sandbox.service";

export const startPreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const preview = await syncProjectPreview(id as string);

  return res.status(200).json({
    previewUrl: preview.previewUrl,
    status: preview.sandbox.status,
  });
});

export const getPreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const preview = await getProjectPreview(id as string);

  return res.status(200).json(preview);
});

export const stopPreview = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const sandbox = await destroyProjectSandbox(id as string);

  return res.status(200).json({
    message: "Preview stopped",
    sandbox,
  });
});
