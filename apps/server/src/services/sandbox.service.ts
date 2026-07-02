import { Sandbox } from "@e2b/code-interpreter";
import { client } from "db/client";
import { getProjectFiles } from "./files.service";

const PREVIEW_PORT = 5173;

function getE2bApiKey() {
  const apiKey = process.env.E2B_API_KEY;
  if (!apiKey) {
    throw new Error("E2B_API_KEY is not configured");
  }
  return apiKey;
}

async function connectE2bSandbox(e2bId: string) {
  return Sandbox.connect(e2bId, { apiKey: getE2bApiKey() });
}

export async function getOrCreateProjectSandbox(projectId: string) {
  const existing = await client.sandbox.findUnique({
    where: { projectId },
  });

  if (existing && existing.status !== "DESTROYED") {
    try {
      const e2b = await connectE2bSandbox(existing.e2bId);
      return { record: existing, e2b };
    } catch {
      await client.sandbox.update({
        where: { id: existing.id },
        data: { status: "DESTROYED", destroyedAt: new Date() },
      });
    }
  }

  const e2b = await Sandbox.create({ apiKey: getE2bApiKey() });

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
    },
  });

  return { record, e2b };
}

async function writeFilesToSandbox(
  e2b: Sandbox,
  files: { path: string; content: string }[],
) {
  for (const file of files) {
    const fullPath = file.path.startsWith("/")
      ? file.path
      : `/home/user/${file.path.replace(/^\.\//, "")}`;
    await e2b.files.write(fullPath, file.content);
  }
}

async function ensureDevServer(e2b: Sandbox) {
  const check = await e2b.commands.run(
  `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:${PREVIEW_PORT} || echo "down"`,
  );

  if (check.stdout.trim() === "200") {
    return;
  }

  await e2b.commands.run("npm install", { cwd: "/home/user" });
  await e2b.commands.run("nohup npm run dev > /tmp/vite.log 2>&1 &", {
    cwd: "/home/user",
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

export async function syncProjectPreview(projectId: string) {
  const files = await getProjectFiles(projectId);

  if (files.length === 0) {
    throw new Error("No files to preview. Send a chat message first.");
  }

  const { record, e2b } = await getOrCreateProjectSandbox(projectId);

  await writeFilesToSandbox(
    e2b,
    files.map((file) => ({ path: file.path, content: file.content })),
  );

  await ensureDevServer(e2b);

  const previewUrl = `https://${e2b.getHost(PREVIEW_PORT)}`;

  const updated = await client.sandbox.update({
    where: { id: record.id },
    data: {
      status: "RUNNING",
      previewUrl,
    },
  });

  await client.log.create({
    data: {
      projectId,
      type: "SYSTEM",
      message: `Preview ready at ${previewUrl}`,
    },
  });

  return {
    sandbox: updated,
    previewUrl,
  };
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
