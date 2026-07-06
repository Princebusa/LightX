import type { Request, Response } from "express";
import { ChatSchema } from "comman/types";
import { getOwnedProject } from "../utils/project";
import { asyncHandler } from "../utils/asyncHandler";
import { createTools } from "../tools";
import { systemPrompt } from "../System_prompt";
import { getOrCreateProjectSandbox } from "../services/sandbox.service";
import { agentLoop } from "../agent/loop";
import type { GroqChatMessage } from "../agent/providers/groq";

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
  const sandbox = await getOrCreateProjectSandbox(project.id);

   const toolsImpl = createTools(sandbox.e2b);

  

    const messages: GroqChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];

  const result = await agentLoop({
    messages,
    toolsImpl,
  });



 




 res.status(200).json({ result });
});
