import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';
import {
  getProject,
  getProjectMessages,
  toUiMessage,
} from '@/lib/projects';
import { streamChat } from '@/lib/stream';

export type UiMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
};

export function useProjectChat(projectId: string | undefined) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filesRefreshKey, setFilesRefreshKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const loadChat = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const [history, project] = await Promise.all([
        getProjectMessages(projectId),
        getProject(projectId),
      ]);

      setMessages(history.map(toUiMessage));
      setPreviewUrl(project.sandbox?.previewUrl ?? null);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load chat';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!projectId || !content.trim() || sending) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSending(true);
      setError(null);
      setStatusText('Connecting...');

      const optimisticId = `temp-${crypto.randomUUID()}`;
      setMessages((prev) => [
        ...prev,
        { id: optimisticId, role: 'user', content },
      ]);

      try {
        await streamChat(
          projectId,
          content,
          (event) => {
            switch (event.type) {
              case 'agent_thinking': {
                const text =
                  typeof event.data.message === 'string'
                    ? event.data.message
                    : '';
                if (text) setStatusText(text);
                break;
              }
              case 'agent_complete': {
                setStatusText('');
                break;
              }
              case 'preview_ready': {
                const url =
                  typeof event.data.previewUrl === 'string'
                    ? event.data.previewUrl
                    : null;
                if (url) {
                  setPreviewUrl(url);
                  setFilesRefreshKey((value) => value + 1);
                }
                break;
              }
              case 'error': {
                const text =
                  typeof event.data.message === 'string'
                    ? event.data.message
                    : 'Something went wrong';
                setError(text);
                break;
              }
            }
          },
          { signal: controller.signal },
        );

        const history = await getProjectMessages(projectId);
        setMessages(history.map(toUiMessage));
        setFilesRefreshKey((value) => value + 1);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        const message =
          err instanceof ApiError ? err.message : 'Failed to send message';
        setError(message);
        setMessages((prev) => prev.filter((item) => item.id !== optimisticId));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setSending(false);
        setStatusText('');
      }
    },
    [projectId, sending],
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setSending(false);
    setStatusText('');
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    messages,
    loading,
    sending,
    statusText,
    error,
    previewUrl,
    filesRefreshKey,
    loadChat,
    sendMessage,
    cancelStream,
  };
}
