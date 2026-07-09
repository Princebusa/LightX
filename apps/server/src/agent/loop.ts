import { toolsConfig } from './toolConfig';
import { groqChat, type GroqChatMessage } from './providers/groq';
import type { SandboxTools } from '../tools';

export type AgentStreamEvent =
  | { type: 'agent_thinking'; data: { message: string } }
  | { type: 'agent_complete'; data: { message: string } }
  | { type: 'preview_ready'; data: { previewUrl: string } }
  | { type: 'error'; data: { message: string } };

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
  onEvent,
}: {
  messages: GroqChatMessage[];
  toolsImpl: SandboxTools;
  maxSteps?: number;
  onEvent?: (event: AgentStreamEvent) => void;
}) {
  for (let step = 0; step < maxSteps; step++) {
    onEvent?.({
      type: 'agent_thinking',
      data: { message: `Thinking (step ${step + 1})...` },
    });

    const msg = await groqChat({ messages, tools: toolsConfig });

    messages.push(msg);

    if (msg.tool_calls?.length) {
      for (const toolCall of msg.tool_calls) {
        const name = toolCall.function.name;

        onEvent?.({
          type: 'agent_thinking',
          data: { message: `Running ${name}...` },
        });

        const args = parseToolArgs(toolCall.function.arguments, name);

        const result = await toolsImpl[name as keyof SandboxTools](args as never);

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          content: JSON.stringify(result),
        });
      }

      continue;
    }

    const finalMessage = msg.content ?? 'Done.';
    onEvent?.({
      type: 'agent_complete',
      data: { message: finalMessage },
    });

    return finalMessage;
  }

  const fallback = 'Max steps reached';
  onEvent?.({
    type: 'agent_complete',
    data: { message: fallback },
  });

  return fallback;
}
