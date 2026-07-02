import type { Request, Response } from "express";
import { ChatSchema } from "comman/types";
import { getOwnedProject } from "../utils/project";
import { asyncHandler } from "../utils/asyncHandler";
import { generateProjectFiles } from "../services/llm.service";
import { upsertProjectFiles } from "../services/files.service";
import { syncProjectPreview } from "../services/sandbox.service";
import { client } from "db/client";

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseResult = ChatSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const { message } = parseResult.data;

  await client.log.create({
    data: {
      projectId: id as string,
      type: "SYSTEM",
      message: `User: ${message}`,
    },
  });

  const { message: assistantMessage, files } =
    await generateProjectFiles(message);

  await upsertProjectFiles(id as string, files);

  await client.log.create({
    data: {
      projectId: id as string,
      type: "SYSTEM",
      message: `Assistant: ${assistantMessage}`,
    },
  });

  let preview = null;

  try {
    preview = await syncProjectPreview(id as string);
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Preview sync failed";
    await client.log.create({
      data: {
        projectId: id as string,
        type: "STDERR",
        message: errMsg,
      },
    });
  }

  return res.status(200).json({
    message: assistantMessage,
    fileCount: files.length,
    previewUrl: preview?.previewUrl ?? null,
    sandboxStatus: preview?.sandbox.status ?? null,
  });
});
