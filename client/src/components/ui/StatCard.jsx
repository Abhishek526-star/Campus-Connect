import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from './Card.jsx';
import { cn } from '../../utils/cn.js';

/** KPI card used across dashboards. */
export function StatCard({ label, value, icon: Icon, trend, trendDirection = 'up', loading = false, className }) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {Icon && (
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="size-4.5 text-primary-600" aria-hidden="true" />
          </span>
        )}
      </div>
      {loading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-slate-200" aria-hidden="true" />
      ) : (
        <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      )}
      {trend !== undefined && (
        <p className={cn('mt-2 inline-flex items-center gap-1 text-xs font-medium', trendDirection === 'up' ? 'text-accent-600' : 'text-red-600')}>
          {trendDirection === 'up' ? <TrendingUp className="size-3.5" aria-hidden="true" /> : <TrendingDown className="size-3.5" aria-hidden="true" />}
          {trend}
        </p>
      )}
    </Card>
  );
}
