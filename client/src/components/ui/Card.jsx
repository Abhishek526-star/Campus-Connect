import { cn } from '../../utils/cn.js';

/** White rounded card with subtle shadow. */
export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4', className)}>{children}</div>;
}

export function CardTitle({ className, children }) {
  return <h3 className={cn('text-base font-semibold text-slate-900', className)}>{children}</h3>;
}

export function CardContent({ className, children }) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}
