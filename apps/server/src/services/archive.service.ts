import type { Sandbox } from '@e2b/code-interpreter';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { client } from 'db/client';

const SANDBOX_TTL_MS = Number(process.env.SANDBOX_TTL_MS ?? 3_600_000);
const ARCHIVE_LEAD_MS = Number(process.env.SANDBOX_ARCHIVE_LEAD_MS ?? 300_000);
const ARCHIVE_TAR_PATH = '/tmp/project-archive.tar.gz';

type SandboxRecord = {
  id: string;
  projectId: string;
  createdAt: Date;
  s3ArchiveKey: string | null;
  archivedAt: Date | null;
};

function isS3Configured() {
  return Boolean(
    process.env.AWS_S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_REGION,
  );
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });
}

function getArchiveKey(projectId: string) {
  return `projects/${projectId}/sandbox.tar.gz`;
}

export function isSandboxNearExpiry(createdAt: Date) {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs >= SANDBOX_TTL_MS - ARCHIVE_LEAD_MS;
}

export async function maybeArchiveSandbox(
  sandboxRecord: SandboxRecord,
  e2b: Sandbox,
) {
  if (!isS3Configured()) return;
  if (sandboxRecord.s3ArchiveKey) return;
  if (!isSandboxNearExpiry(sandboxRecord.createdAt)) return;

  await archiveSandboxToS3(sandboxRecord.projectId, e2b);
}

export async function archiveSandboxToS3(projectId: string, e2b: Sandbox) {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }

  await e2b.commands.run(
    `tar czf ${ARCHIVE_TAR_PATH} -C /home/user app --exclude=node_modules --exclude=dist 2>/dev/null || true`,
    { cwd: '/home/user', timeoutMs: 120_000 },
  );

  const encoded = await e2b.commands.run(
    `base64 -w0 ${ARCHIVE_TAR_PATH} 2>/dev/null || base64 ${ARCHIVE_TAR_PATH}`,
    { timeoutMs: 120_000 },
  );

  if (encoded.exitCode !== 0 || !encoded.stdout.trim()) {
    throw new Error('Failed to package sandbox files for archive');
  }

  const archiveBytes = Buffer.from(encoded.stdout.trim(), 'base64');
  const key = getArchiveKey(projectId);

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: archiveBytes,
      ContentType: 'application/gzip',
    }),
  );

  await client.sandbox.update({
    where: { projectId },
    data: {
      s3ArchiveKey: key,
      archivedAt: new Date(),
      status: 'ARCHIVED',
      previewUrl: null,
    },
  });
}

export async function restoreSandboxFromS3(e2b: Sandbox, s3ArchiveKey: string) {
  if (!isS3Configured()) {
    throw new Error('S3 is not configured');
  }

  const response = await getS3Client().send(
    new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3ArchiveKey,
    }),
  );

  const body = await response.Body?.transformToByteArray();
  if (!body?.length) {
    throw new Error('Archive object is empty');
  }

  await e2b.files.write(ARCHIVE_TAR_PATH, new Blob([body]));
  await e2b.commands.run(`tar xzf ${ARCHIVE_TAR_PATH} -C /home/user`, {
    cwd: '/home/user',
    timeoutMs: 120_000,
  });
}
