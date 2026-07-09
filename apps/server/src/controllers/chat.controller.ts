import type { Request, Response } from 'express';
import { ChatSchema } from 'comman/types';
import { getOwnedProject } from '../utils/project';
import { asyncHandler } from '../utils/asyncHandler';
import { createTools } from '../tools';
import { systemPrompt } from '../System_prompt';
import {
  getOrCreateProjectSandbox,
  startProjectPreview,
} from '../services/sandbox.service';
import {
  addProjectMessage,
  getProjectMessages,
} from '../services/chat.service';
import { agentLoop } from '../agent/loop';
import type { GroqChatMessage } from '../agent/providers/groq';
import { initSSE, sendSSE } from '../utils/sse';

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  return res.status(200).json(getProjectMessages(project.id));
});

export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const parseResult = ChatSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const project = await getOwnedProject(id as string, req.userId as string);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }

  const { message } = parseResult.data;

  initSSE(res);

  let clientClosed = false;
  req.on('close', () => {
    clientClosed = true;
  });

  const emit = (type: string, data: Record<string, unknown>) => {
    if (!clientClosed && !res.writableEnded) {
      sendSSE(res, type, data);
    }
  };

  try {
    addProjectMessage(project.id, 'USER', message);

    const sandbox = await getOrCreateProjectSandbox(project.id);
    const toolsImpl = createTools(sandbox.e2b);

    const messages: GroqChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ];

    const result = await agentLoop({
      messages,
      toolsImpl,
      onEvent: (event) => emit(event.type, event.data),
    });

    addProjectMessage(project.id, 'ASSISTANT', result);

    try {
      emit('agent_thinking', { message: 'Starting preview server...' });
      const previewUrl = await startProjectPreview(project.id, sandbox.e2b);
      emit('preview_ready', { previewUrl });
    } catch (previewError) {
      const previewMessage =
        previewError instanceof Error
          ? previewError.message
          : 'Preview failed to start';
      emit('error', { message: previewMessage });
    }

    if (!res.writableEnded) {
      res.end();
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Something went wrong';

    emit('error', { message: errorMessage });

    if (!res.writableEnded) {
      res.end();
    }
  }
});
