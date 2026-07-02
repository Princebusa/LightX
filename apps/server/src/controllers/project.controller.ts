import type { Request, Response } from "express";
import { client } from "db/client";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
} from "comman/types";
import { getOwnedProject } from "../utils/project";
import { asyncHandler } from "../utils/asyncHandler";

export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const parseResult = CreateProjectSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const { name, description } = parseResult.data;

  const project = await client.project.create({
    data: {
      name,
      description,
      userId: req.userId,
    },
  });

  return res.status(201).json(project);
});

export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await client.project.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    include: {
      sandbox: { select: { status: true, previewUrl: true } },
      _count: { select: { files: true } },
    },
  });

  return res.status(200).json(projects);
});

export const getProjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const fullProject = await client.project.findUnique({
    where: { id: id as string },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      sandbox: {
        select: {
          status: true,
          previewUrl: true,
          createdAt: true,
        },
      },
      logs: {
        orderBy: { timestamp: "asc" },
        take: 100,
        select: {
          id: true,
          message: true,
          type: true,
          timestamp: true,
        },
      },
      _count: { select: { files: true } },
    },
  });

  return res.status(200).json(fullProject);
});

export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseResult = UpdateProjectSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const updated = await client.project.update({
    where: { id: id as string },
    data: parseResult.data,
  });

  return res.status(200).json(updated);
});

export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  await client.project.delete({
    where: { id: id as string },
  });

  return res.status(200).json({ message: "Project deleted successfully" });
});
