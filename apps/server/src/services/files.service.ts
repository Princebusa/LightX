import type { Sandbox } from '@e2b/code-interpreter';

import { APP_DIR } from '../tools';
import { getOrCreateProjectSandbox } from './sandbox.service';

const MAX_FILE_BYTES = 512_000;

export type ProjectFileEntry = {
  path: string;
  name: string;
  relativePath: string;
};

export async function listProjectFiles(projectId: string) {
  const { e2b } = await getOrCreateProjectSandbox(projectId);
  const paths = await listSandboxFilePaths(e2b);

  return paths.map((path) => ({
    path,
    name: path.slice(path.lastIndexOf('/') + 1),
    relativePath: path.startsWith(`${APP_DIR}/`)
      ? path.slice(APP_DIR.length + 1)
      : path,
  }));
}

export async function readProjectFile(projectId: string, filePath: string) {
  if (!filePath.startsWith('/') || filePath.includes('..')) {
    throw new Error('Invalid file path');
  }

  if (!filePath.startsWith(APP_DIR)) {
    throw new Error('File path outside project directory');
  }

  const { e2b } = await getOrCreateProjectSandbox(projectId);
  const stat = await e2b.commands.run(
    `stat -c%s "${filePath}" 2>/dev/null || echo 0`,
  );
  const size = Number.parseInt(stat.stdout.trim(), 10) || 0;

  if (size > MAX_FILE_BYTES) {
    throw new Error('File too large to display');
  }

  const content = await e2b.files.read(filePath);
  return { path: filePath, content, size };
}

async function listSandboxFilePaths(e2b: Sandbox): Promise<string[]> {
  const result = await e2b.commands.run(
    `find "${APP_DIR}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/dist/*" 2>/dev/null | sort`,
    { cwd: '/home/user', timeoutMs: 30_000 },
  );

  if (result.exitCode !== 0) {
    return [];
  }

  return result.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
