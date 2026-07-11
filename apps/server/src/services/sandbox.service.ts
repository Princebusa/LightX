import { Sandbox } from "@e2b/code-interpreter";
import { client } from "db/client";
import { initReactProject, ensureSandboxViteAllowedHosts } from "../utils/boilerplat";
import { createTools } from "../tools";
import {
  maybeArchiveSandbox,
  restoreSandboxFromS3,
} from "./archive.service";

const PREVIEW_PORT = 5173;
/** E2B default is 5m; keep alive for the project session (Hobby max = 1h). */
const SANDBOX_TIMEOUT_MS = Number(
  process.env.SANDBOX_TTL_MS ?? 3_600_000,
);

type SandboxRecord = NonNullable<
  Awaited<ReturnType<typeof client.sandbox.findUnique>>
>;

type ProjectSandbox = {
  record: SandboxRecord;
  e2b: Sandbox;
};

const sandboxLocks = new Map<string, Promise<ProjectSandbox>>();

function getE2bApiKey() {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    throw new Error("E2B_API_KEY is not configured");
  }
  return apiKey;
}

async function connectE2bSandbox(e2bId: string) {
  // timeoutMs on connect renews the TTL so follow-up messages reuse this sandbox
  return Sandbox.connect(e2bId, {
    apiKey: getE2bApiKey(),
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });
}

async function createProjectSandbox(projectId: string): Promise<ProjectSandbox> {
  const previous = await client.sandbox.findUnique({
    where: { projectId },
  });

  const e2b = await Sandbox.create({
    apiKey: getE2bApiKey(),
    timeoutMs: SANDBOX_TIMEOUT_MS,
  });
  const toolsImpl = createTools(e2b);

  if (previous?.s3ArchiveKey) {
    try {
      await restoreSandboxFromS3(e2b, previous.s3ArchiveKey);
    } catch {
      await initReactProject(toolsImpl);
    }
  } else {
    await initReactProject(toolsImpl);
  }

  const record = await client.sandbox.upsert({
    where: { projectId },
    create: {
      projectId,
      e2bId: e2b.sandboxId,
      status: "CREATED",
    },
    update: {
      e2bId: e2b.sandboxId,
      status: "CREATED",
      previewUrl: null,
      destroyedAt: null,
      archivedAt: null,
    },
  });

  return { record, e2b };
}

async function resolveProjectSandbox(projectId: string): Promise<ProjectSandbox> {
  const existing = await client.sandbox.findUnique({
    where: { projectId },
  });

  if (existing && existing.status !== "DESTROYED") {
    try {
      const e2b = await connectE2bSandbox(existing.e2bId);

      void maybeArchiveSandbox(
        {
          id: existing.id,
          projectId: existing.projectId,
          createdAt: existing.createdAt,
          s3ArchiveKey: existing.s3ArchiveKey,
          archivedAt: existing.archivedAt,
        },
        e2b,
      ).catch(() => undefined);

      return { record: existing, e2b };
    } catch {
      await client.sandbox.update({
        where: { id: existing.id },
        data: { status: "DESTROYED", destroyedAt: new Date() },
      });
    }
  }

  return createProjectSandbox(projectId);
}

export async function getOrCreateProjectSandbox(projectId: string) {
  const inflight = sandboxLocks.get(projectId);
  if (inflight) {
    return inflight;
  }

  const promise = resolveProjectSandbox(projectId).finally(() => {
    sandboxLocks.delete(projectId);
  });

  sandboxLocks.set(projectId, promise);
  return promise;
}

export async function startProjectPreview(projectId: string, e2b: Sandbox) {
  await ensureDevServer(e2b);

  const previewUrl = `https://${e2b.getHost(PREVIEW_PORT)}`;

  await client.sandbox.update({
    where: { projectId },
    data: {
      status: 'RUNNING',
      previewUrl,
    },
  });

  return previewUrl;
}

async function ensureDevServer(e2b: Sandbox) {
  const tools = createTools(e2b);
  const viteConfigPatched = await ensureSandboxViteAllowedHosts(tools);

  const check = await e2b.commands.run(
  `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PREVIEW_PORT} || echo "down"`,
  );

  if (check.stdout.trim() === "200" && !viteConfigPatched) {
    return;
  }

  if (viteConfigPatched) {
    await e2b.commands.run('pkill -f "vite" || true', {
      cwd: "/home/user",
      timeoutMs: 10_000,
    });
  } else if (check.stdout.trim() === "200") {
    return;
  }

  await e2b.commands.run("cd app && npm install", {
    cwd: "/home/user",
    timeoutMs: 0,
  });
  await e2b.commands.run("cd app && nohup npm run dev > /tmp/vite.log 2>&1 &", {
    cwd: "/home/user",
    background: true,
    timeoutMs: 0,
  });

  for (let attempt = 0; attempt < 30; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const probe = await e2b.commands.run(
      `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PREVIEW_PORT} || echo "down"`,
    );
    if (probe.stdout.trim() === "200") {
      return;
    }
  }

  throw new Error("Dev server failed to start in sandbox");
}

export async function getProjectPreview(projectId: string) {
  const sandbox = await client.sandbox.findUnique({
    where: { projectId },
  });

  if (!sandbox || sandbox.status === "DESTROYED" || !sandbox.previewUrl) {
    return { previewUrl: null, status: sandbox?.status ?? null };
  }

  return {
    previewUrl: sandbox.previewUrl,
    status: sandbox.status,
  };
}

export async function destroyProjectSandbox(projectId: string) {
  const sandbox = await client.sandbox.findUnique({
    where: { projectId },
  });

  if (!sandbox || sandbox.status === "DESTROYED") {
    return null;
  }

  try {
    const e2b = await connectE2bSandbox(sandbox.e2bId);
    await e2b.kill();
  } catch {
    // Sandbox may already be gone on E2B side
  }

  return client.sandbox.update({
    where: { id: sandbox.id },
    data: {
      status: "DESTROYED",
      destroyedAt: new Date(),
      previewUrl: null,
    },
  });
}
