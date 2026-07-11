import { client } from "db/client";

export async function getOwnedProject(projectId: string, userId: string) {
  return client.project.findFirst({
    where: { id: projectId, userId },
  });
}

export async function getOwnedProjectWithSandbox(
  projectId: string,
  userId: string,
) {
  return client.project.findFirst({
    where: { id: projectId, userId },
    include: {
      sandbox: true,
    },
  });
}
