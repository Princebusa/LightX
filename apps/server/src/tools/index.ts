import type { CommandResult, Sandbox } from '@e2b/code-interpreter';

export const SANDBOX_ROOT = '/home/user';
export const APP_DIR = `${SANDBOX_ROOT}/app`;

const DEFAULT_TIMEOUT_MS = 300_000;
const LONG_RUNNING_TIMEOUT_MS = 0;

export type ReadFileParams = { path: string };
export type WriteFileParams = { path: string; content: string };
export type ListFilesParams = { path: string };
export type RunCommandParams = {
  cmd: string;
  timeoutMs?: number;
  cwd?: string;
  background?: boolean;
};

export type SandboxTools = {
  read_file: (params: ReadFileParams) => Promise<string>;
  write_file: (params: WriteFileParams) => Promise<'File written'>;
  list_files: (params: ListFilesParams) => Promise<string>;
  run_command: (params: RunCommandParams) => Promise<CommandResult>;
};

function shouldRunInBackground(cmd: string) {
  if (/\s&\s*$/.test(cmd) || /nohup\s/i.test(cmd)) {
    return true;
  }

  return /\b(npm run dev|npm start|vite|next dev|yarn dev|pnpm dev)\b/i.test(cmd);
}

async function resolveWorkdir(sandbox: Sandbox, cwd?: string) {
  const preferred = cwd ?? APP_DIR;

  try {
    await sandbox.files.list(preferred);
    return preferred;
  } catch {
    return SANDBOX_ROOT;
  }
}

export function createTools(sandbox: Sandbox): SandboxTools {
  return {
    async read_file({ path }) {
      return sandbox.files.read(path);
    },

    async write_file({ path, content }) {
      await sandbox.files.write(path, content);
      return 'File written';
    },

    async list_files({ path }) {
      const files = await sandbox.files.list(path);
      return JSON.stringify(files);
    },

    async run_command({ cmd, timeoutMs, cwd, background }) {
      const workdir = await resolveWorkdir(sandbox, cwd);
      const runInBackground = background ?? shouldRunInBackground(cmd);

      if (runInBackground) {
        const shellCmd =
          /nohup\s/i.test(cmd) || /\s&\s*$/.test(cmd)
            ? cmd
            : `nohup ${cmd} > /tmp/cmd.log 2>&1 &`;

        await sandbox.commands.run(shellCmd, {
          cwd: workdir,
          background: true,
          timeoutMs: LONG_RUNNING_TIMEOUT_MS,
        });

        return {
          exitCode: 0,
          stdout: 'Command started in background',
          stderr: '',
        };
      }

      return sandbox.commands.run(cmd, {
        cwd: workdir,
        timeoutMs: timeoutMs ?? DEFAULT_TIMEOUT_MS,
        onStdout: (data) => console.log(data),
        onStderr: (data) => console.error(data),
      });
    },
  };
}
