import { Link, useParams } from 'react-router';
import { ArrowLeft, CheckCircle2, Clock, ExternalLink } from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetRoadmapQuery } from '../services/roadmapsApi.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';

/**
 * Roadmap details (spec §29): step timeline with durations and resources.
 */
export function RoadmapDetailsPage() {
  useDocumentTitle('Roadmap');
  const { role } = useParams();
  const { data, isLoading, isError, refetch } = useGetRoadmapQuery(role);

  if (isError) {
    return <ErrorState title="Could not load this roadmap" onRetry={refetch} />;
  }

  if (isLoading || !data?.data) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-16" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { roadmap } = data.data;
  const steps = roadmap.steps ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" to="/roadmaps">
        <ArrowLeft className="size-4" aria-hidden="true" /> All roadmaps
      </Button>

      <Card>
        <CardContent className="p-6">
          <Badge tone="primary">{roadmap.role.replace(/_/g, ' ')}</Badge>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{roadmap.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{roadmap.description}</p>
          <p className="mt-3 text-xs text-slate-400">
            {steps.length} steps · {steps.reduce((sum, step) => sum + (step.duration ? 1 : 0), 0)} with estimated durations
          </p>
        </CardContent>
      </Card>

      <div className="relative space-y-4 pl-6">
        {/* Timeline line */}
        <div className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-primary-200" aria-hidden="true" />
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <span className="absolute -left-6 top-1 flex size-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white shadow-md">
              {index + 1}
            </span>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                  {step.duration && (
                    <Badge tone="accent" size="sm">
                      <Clock className="size-3" aria-hidden="true" /> {step.duration}
                    </Badge>
                  )}
                </div>
                {step.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.description}</p>
                )}
                {(step.resources ?? []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.resources.map((resource, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        <CheckCircle2 className="size-3 text-accent-500" aria-hidden="true" />
                        {resource}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <ExternalLink className="size-3.5" aria-hidden="true" />
        Combine this roadmap with the <Link to="/resources" className="font-semibold text-primary-600 hover:underline">Study Resources</Link> library.
      </p>
    </div>
  );
}
