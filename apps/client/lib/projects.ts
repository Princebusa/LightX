import { apiFetch } from "./api";
import type { ChatStreamEvent } from "./stream";

export type ProjectMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
};

export type StreamEvent = ChatStreamEvent;

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

export type ProjectFileEntry = {
  path: string;
  name: string;
  relativePath: string;
};

export type ProjectFileContent = {
  path: string;
  content: string;
  size: number;
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

export async function getProjectFiles(projectId: string) {
  return apiFetch<{ files: ProjectFileEntry[] }>(
    `/projects/${projectId}/files`,
  );
}

export async function getProjectFileContent(projectId: string, path: string) {
  const params = new URLSearchParams({ path });
  return apiFetch<ProjectFileContent>(
    `/projects/${projectId}/files/content?${params.toString()}`,
  );
}

export function toUiMessage(message: ProjectMessage) {
  return {
    id: message.id,
    role: message.role === "USER" ? ("user" as const) : ("assistant" as const),
    content: message.content,
    createdAt: message.createdAt,
  };
}
