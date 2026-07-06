import { toolsConfig } from './toolConfig';
import { groqChat, type GroqChatMessage } from './providers/groq';
import type { SandboxTools } from '../tools';

function parseToolArgs(raw: string, toolName: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // fall through to recovery below
  }

  const pathMatch = raw.match(/(\/[\w./-]+)/);
  if (toolName === 'list_files' || toolName === 'read_file') {
    return { path: pathMatch?.[1] ?? '/home/user/app' };
  }

  throw new Error(`Invalid tool arguments for ${toolName}: ${raw}`);
}

export async function agentLoop({
  messages,
  toolsImpl,
  maxSteps = 20,
}: {
  messages: GroqChatMessage[];
  toolsImpl: SandboxTools;
  maxSteps?: number;
}) {
  for (let step = 0; step < maxSteps; step++) {
    const msg = await groqChat({ messages, tools: toolsConfig });

    messages.push(msg);

    if (msg.tool_calls?.length) {
      for (const toolCall of msg.tool_calls) {
        const name = toolCall.function.name as keyof SandboxTools;
        const args = parseToolArgs(toolCall.function.arguments, toolCall.function.name);

        const result = await toolsImpl[name](args as never);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    return msg.content;
  }

  return 'Max steps reached';
}
