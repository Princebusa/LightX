import { API_BASE, ApiError, getAuthToken } from './api';

export type ChatStreamEventType =
  | 'agent_thinking'
  | 'agent_complete'
  | 'preview_ready'
  | 'error';

export type ChatStreamEvent = {
  type: ChatStreamEventType;
  data: Record<string, unknown>;
  timestamp: string;
};

function parseSSEBlock(block: string): ChatStreamEvent | null {
  const lines = block.split('\n');
  let data = '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      data = line.slice(6);
    }
  }

  if (!data) return null;

  try {
    return JSON.parse(data) as ChatStreamEvent;
  } catch {
    return null;
  }
}

export async function streamChat(
  projectId: string,
  message: string,
  onEvent: (event: ChatStreamEvent) => void,
  options?: { signal?: AbortSignal },
) {
  const token = getAuthToken();

  const response = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
    signal: options?.signal,
  });

  if (response.status === 401) {
    window.dispatchEvent(new CustomEvent('lightx:unauthorized'));
    throw new ApiError(401, 'Unauthorized');
  }

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const data = await response.json();
      errorMessage =
        typeof data.error === 'string'
          ? data.error
          : JSON.stringify(data.error ?? errorMessage);
    } catch {
      // ignore parse errors
    }
    throw new ApiError(response.status, String(errorMessage));
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    throw new Error('Server did not return an event stream');
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Streaming is not supported in this browser');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      const event = parseSSEBlock(part);
      if (event) onEvent(event);
    }
  }

  if (buffer.trim()) {
    const event = parseSSEBlock(buffer);
    if (event) onEvent(event);
  }
}
