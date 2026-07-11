import { Code2, Eye, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useProjectFiles } from '@/hooks/use-project-files';

type WorkspaceTab = 'code' | 'preview';

type ProjectWorkspaceSidebarProps = {
  projectId: string | undefined;
  previewUrl: string | null;
  filesRefreshKey?: number;
};

export function ProjectWorkspaceSidebar({
  projectId,
  previewUrl,
  filesRefreshKey = 0,
}: ProjectWorkspaceSidebarProps) {
  const [tab, setTab] = useState<WorkspaceTab>(previewUrl ? 'preview' : 'code');
  const {
    files,
    selectedPath,
    content,
    loadingFiles,
    loadingContent,
    error,
    setSelectedPath,
    reloadFiles,
  } = useProjectFiles(projectId, filesRefreshKey);

  useEffect(() => {
    if (previewUrl) {
      setTab('preview');
    }
  }, [previewUrl]);

  return (
    <aside className="flex h-full w-full min-w-[320px] flex-col border-l border-white/10 bg-background/60 backdrop-blur-md lg:w-[min(44vw,560px)]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
          <button
            type="button"
            onClick={() => setTab('code')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'code'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Code2 className="size-3.5" />
            Code
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Eye className="size-3.5" />
            Preview
          </button>
        </div>

        {tab === 'code' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              void reloadFiles();
            }}
            disabled={loadingFiles}
            aria-label="Refresh files"
          >
            <RefreshCw
              className={cn('size-4', loadingFiles && 'animate-spin')}
            />
          </Button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        {tab === 'code' ? (
          <div className="flex min-h-0 flex-1">
            <div className="w-44 shrink-0 overflow-y-auto border-r border-white/10">
              {loadingFiles ? (
                <p className="p-3 text-xs text-muted-foreground">
                  Loading files...
                </p>
              ) : files.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">
                  No files yet
                </p>
              ) : (
                <ul className="p-2">
                  {files.map((file) => (
                    <li key={file.path}>
                      <button
                        type="button"
                        onClick={() => setSelectedPath(file.path)}
                        className={cn(
                          'w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors',
                          selectedPath === file.path
                            ? 'bg-muted text-foreground'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                        )}
                        title={file.relativePath}
                      >
                        <span className="block truncate">{file.relativePath}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0 flex-1 overflow-hidden">
              {loadingContent ? (
                <p className="p-4 text-xs text-muted-foreground">
                  Loading file...
                </p>
              ) : selectedPath ? (
                <pre className="h-full overflow-auto p-4 text-xs leading-relaxed">
                  <code className="font-mono whitespace-pre-wrap break-words">
                    {content}
                  </code>
                </pre>
              ) : (
                <p className="p-4 text-xs text-muted-foreground">
                  Select a file to view its contents
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col p-3">
            {previewUrl ? (
              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-border/60 bg-background">
                <iframe
                  src={previewUrl}
                  title="Project preview"
                  className="h-full w-full"
                />
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Preview will appear here once the dev server is ready
                </p>
              </div>
            )}
          </div>
        )}

        {error ? (
          <p className="border-t border-white/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
