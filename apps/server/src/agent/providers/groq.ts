import type { ChatCompletionTool } from '../toolConfig';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/** Best free Groq model for reliable tool calling. */
export const GROQ_CODING_MODEL = 'llama-3.3-70b-versatile';

export type GroqToolCall = {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
};

export type GroqChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: GroqToolCall[] }
  | { role: 'tool'; tool_call_id: string; name: string; content: string };

type GroqChatResponse = {
  choices: Array<{
    message: {
      role: 'assistant';
      content: string | null;
      tool_calls?: GroqToolCall[];
    };
  }>;
};

type GroqErrorBody = {
  error?: {
    message?: string;
    code?: string;
    failed_generation?: string;
  };
};

function getGroqApiKey() {
  const apiKey = process.env.GROQ_API_KEY ?? process.env.groq_api_key;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return apiKey;
}

function resolveModel() {
  const configured = process.env.GROQ_MODEL;
  if (!configured || configured === 'llama-3.1-8b-instant') {
    return GROQ_CODING_MODEL;
  }
  return configured;
}

export async function groqChat({
  messages,
  tools,
  model = resolveModel(),
}: {
  messages: GroqChatMessage[];
  tools: ChatCompletionTool[];
  model?: string;
}): Promise<GroqChatResponse['choices'][0]['message']> {
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getGroqApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        tools,
        tool_choice: 'auto',
        temperature: 0,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as GroqChatResponse;
      const message = data.choices[0]?.message;
      if (!message) {
        throw new Error('Groq API returned no message');
      }
      return message;
    }

    const errorText = await response.text();
    let errorBody: GroqErrorBody = {};
    try {
      errorBody = JSON.parse(errorText) as GroqErrorBody;
    } catch {
      // keep raw text
    }

    const isToolError =
      errorBody.error?.code === 'tool_use_failed' && attempt < maxAttempts - 1;

    if (isToolError) {
      messages.push({
        role: 'user',
        content: [
          'Your last tool call was invalid.',
          errorBody.error?.message ?? errorText,
          'Call tools with JSON arguments only.',
          'Example: {"path": "/home/user/app"}',
        ].join(' '),
      });
      continue;
    }

    throw new Error(`Groq API error (${response.status}): ${errorText}`);
  }

  throw new Error('Groq API failed after retries');
}
