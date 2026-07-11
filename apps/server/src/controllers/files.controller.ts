import type { Request, Response } from 'express';

import { listProjectFiles, readProjectFile } from '../services/files.service';
import { asyncHandler } from '../utils/asyncHandler';
import { getOwnedProject } from '../utils/project';

export const getProjectFiles = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const files = await listProjectFiles(id as string);
  return res.status(200).json({ files });
});

export const getProjectFileContent = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const path = typeof req.query.path === 'string' ? req.query.path : '';

    if (!path) {
      return res.status(400).json({ error: 'path query is required' });
    }

    const project = await getOwnedProject(id as string, req.userId as string);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    try {
      const file = await readProjectFile(id as string, path);
      return res.status(200).json(file);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to read file';
      return res.status(400).json({ error: message });
    }
  },
);
