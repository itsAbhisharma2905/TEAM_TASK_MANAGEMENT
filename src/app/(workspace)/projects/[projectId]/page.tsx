import { ProjectWorkspace } from "@/components/tasks/ProjectWorkspace";

type Props = {
  params: Promise<{ projectId: string }>;
};

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  return <ProjectWorkspace projectId={projectId} />;
}
