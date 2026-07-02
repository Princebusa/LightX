import { client } from "db/client";
import type { GeneratedFile } from "comman/types";

export async function upsertProjectFiles(
  projectId: string,
  files: GeneratedFile[],
) {
  return client.$transaction(async (tx) => {
    const results = [];

    for (const file of files) {
      results.push(
        await tx.file.upsert({
          where: {
            projectId_path: {
              projectId,
              path: file.path,
            },
          },
          create: {
            ...file,
            projectId,
          },
          update: {
            name: file.name,
            content: file.content,
            language: file.language,
          },
        }),
      );
    }

    return results;
  });
}

export async function getProjectFiles(projectId: string) {
  return client.file.findMany({
    where: { projectId },
    orderBy: { path: "asc" },
  });
}
