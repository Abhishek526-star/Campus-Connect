import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

/** Confirmation dialog for destructive/important actions. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex items-start gap-3">
        <span
          className={
            tone === 'danger'
              ? 'flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50'
              : 'flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50'
          }
        >
          <AlertTriangle className={tone === 'danger' ? 'size-5 text-red-500' : 'size-5 text-primary-500'} aria-hidden="true" />
        </span>
        {description && <p className="pt-1.5 text-sm leading-relaxed text-slate-600">{description}</p>}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={tone} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
