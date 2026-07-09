export type ChatMessageRecord = {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
};

const projectMessages = new Map<string, ChatMessageRecord[]>();

export function getProjectMessages(projectId: string) {
  return projectMessages.get(projectId) ?? [];
}

export function addProjectMessage(
  projectId: string,
  role: ChatMessageRecord['role'],
  content: string,
) {
  const message: ChatMessageRecord = {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };

  const existing = projectMessages.get(projectId) ?? [];
  projectMessages.set(projectId, [...existing, message]);

  return message;
}
