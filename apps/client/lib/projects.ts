import { apiFetch, getAuthToken, ApiError, API_BASE } from "./api";

export type ProjectMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type StreamEvent = {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
};

export type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  sandbox: {
    status: string;
    previewUrl: string | null;
    createdAt: string;
  } | null;
  messages: ProjectMessage[];
};

export type ProjectSummary = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  sandbox: {
    status: string;
    previewUrl: string | null;
  } | null;
  _count: { files: number };
};

export async function createProject(input: {
  name: string;
  description?: string;
}) {
  return apiFetch<ProjectSummary>("/projects", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getProject(projectId: string) {
  return apiFetch<ProjectDetail>(`/projects/${projectId}`);
}

export async function getProjectMessages(projectId: string) {
  return apiFetch<ProjectMessage[]>(`/projects/${projectId}/messages`);
}

function parseSSEChunk(
  chunk: string,
  onEvent: (event: StreamEvent) => void,
) {
  const blocks = chunk.split("\n\n").filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n");
    let data = "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        data = line.slice(6);
      }
    }

    if (!data) continue;

    try {
      onEvent(JSON.parse(data) as StreamEvent);
    } catch {
      // ignore malformed frames
    }
  }
}

export async function streamProjectChat(
  projectId: string,
  message: string,
  onEvent: (event: StreamEvent) => void,
) {
  const token = getAuthToken();
  const response = await fetch(`${API_BASE}/projects/${projectId}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const data = await response.json();
      errorMessage = data.error ?? errorMessage;
    } catch {
      // ignore
    }
    throw new ApiError(response.status, String(errorMessage));
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Streaming is not supported in this browser");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      parseSSEChunk(`${part}\n\n`, onEvent);
    }
  }

  if (buffer.trim()) {
    parseSSEChunk(`${buffer}\n\n`, onEvent);
  }
}

export function toUiMessage(message: ProjectMessage) {
  return {
    id: message.id,
    role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: message.content,
    createdAt: message.createdAt,
  };
}
