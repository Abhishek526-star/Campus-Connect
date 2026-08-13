import { Link } from 'react-router';
import { ArrowRight, Map, Rocket } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetRoadmapsQuery } from '../services/roadmapsApi.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Card } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { CardSkeleton } from '../components/ui/Skeleton.jsx';

const ROLE_LABELS = {
  software_engineer: 'Software Engineer',
  data_scientist: 'Data Scientist',
  ai_engineer: 'AI Engineer',
  web_developer: 'Web Developer',
  cloud_engineer: 'Cloud Engineer',
  devops_engineer: 'DevOps Engineer',
  cybersecurity: 'Cybersecurity',
  gate: 'GATE (CS/IT)',
  government_jobs: 'Government Jobs',
};

/**
 * Career roadmaps hub (spec §29): all 9 roles with step counts.
 */
export function RoadmapsPage() {
  useDocumentTitle('Career roadmaps');
  const { data, isLoading, isError, refetch } = useGetRoadmapsQuery();

  const items = data?.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Map className="size-5 text-primary-600" aria-hidden="true" />
          Career Roadmaps
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Step-by-step guides for the most sought-after careers — curated for our community.
        </p>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">Roadmaps are being prepared.</Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((roadmap) => (
            <Link key={roadmap.role} to={`/roadmaps/${roadmap.role}`} className="group">
              <Card className="flex h-full flex-col p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-50">
                  <Rocket className="size-5 text-primary-600" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-slate-900 group-hover:text-primary-700">
                  {ROLE_LABELS[roadmap.role] ?? roadmap.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{roadmap.description}</p>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <Badge tone="primary" size="sm">{roadmap.steps?.length ?? 0} steps</Badge>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600">
                    View roadmap <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
