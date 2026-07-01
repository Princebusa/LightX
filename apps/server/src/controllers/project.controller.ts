import type { Request, Response } from "express";
import { client } from "db/client";

export const createProject = async (req: Request, res: Response) => {
  const { name, description } = req.body as any;

  const project = await client.project.create({
    data: {
      name,
      description,
      userId: req.userId, 
    },
  });
  return project;
};

export const getProjects = async (req: Request, res: Response) => {
  return client.project.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
};

export const getProjectById = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  return client.project.findUnique({
    where: { id },
    include: { files: true },
  });
};

export const deleteProject = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  return client.project.delete({
    where: { id },
  });
};