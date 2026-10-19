import ProjectList from './ProjectList';
import NewProject from './NewProject';
import ProjectWorkspace from './ProjectWorkspace';

/** /projects, /projects/new and /projects/:id. */
export default function ProjectsHub({ projectId }: { projectId?: string }) {
  if (projectId === 'new') return <NewProject />;
  if (projectId) return <ProjectWorkspace projectId={projectId} />;
  return <ProjectList />;
}
