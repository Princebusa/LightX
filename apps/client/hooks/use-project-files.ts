import { useCallback, useEffect, useState } from 'react';

import { ApiError } from '@/lib/api';
import {
  getProjectFileContent,
  getProjectFiles,
  type ProjectFileEntry,
} from '@/lib/projects';

export function useProjectFiles(
  projectId: string | undefined,
  refreshKey = 0,
) {
  const [files, setFiles] = useState<ProjectFileEntry[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    if (!projectId) return;

    setLoadingFiles(true);
    setError(null);

    try {
      const response = await getProjectFiles(projectId);
      setFiles(response.files);

      if (response.files.length === 0) {
        setSelectedPath(null);
        setContent('');
        return;
      }

      setSelectedPath((current) => {
        if (current && response.files.some((file) => file.path === current)) {
          return current;
        }
        return response.files[0]?.path ?? null;
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Failed to load files';
      setError(message);
      setFiles([]);
      setSelectedPath(null);
      setContent('');
    } finally {
      setLoadingFiles(false);
    }
  }, [projectId]);

  const loadContent = useCallback(
    async (path: string) => {
      if (!projectId) return;

      setLoadingContent(true);
      setError(null);

      try {
        const file = await getProjectFileContent(projectId, path);
        setContent(file.content);
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Failed to read file';
        setError(message);
        setContent('');
      } finally {
        setLoadingContent(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    void loadFiles();
  }, [loadFiles, refreshKey]);

  useEffect(() => {
    if (!selectedPath) {
      setContent('');
      return;
    }

    void loadContent(selectedPath);
  }, [selectedPath, loadContent]);

  return {
    files,
    selectedPath,
    content,
    loadingFiles,
    loadingContent,
    error,
    setSelectedPath,
    reloadFiles: loadFiles,
  };
}
