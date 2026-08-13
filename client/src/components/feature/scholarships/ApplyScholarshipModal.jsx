import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useApplyForScholarshipMutation } from '../../../services/scholarshipsApi.js';
import { useUploadFileMutation } from '../../../services/uploadApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { FileDropzone } from '../../ui/FileDropzone.jsx';

const DOC_ACCEPT = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const DOC_MAX = 25 * 1024 * 1024;

const applySchema = z.object({
  rollNumber: z.string().trim().min(2, 'Roll number is required').max(20),
  department: z.string().trim().min(2, 'Department is required').max(80),
  familyIncome: z.coerce.number().min(0, 'Enter a valid amount'),
  academicPerformance: z.coerce.number().min(0, 'Minimum 0').max(100, 'Maximum 100'),
  reason: z.string().trim().min(10, 'Please explain your reason (at least 10 characters)').max(2000),
});

/**
 * Scholarship application modal (spec §11): student details, family income,
 * academic performance, reason, and document uploads.
 */
export function ApplyScholarshipModal({ scholarship, open, onClose, onApplied }) {
  const [apply] = useApplyForScholarshipMutation();
  const [uploadFile] = useUploadFileMutation();
  const [docFiles, setDocFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(applySchema),
    defaultValues: {
      rollNumber: '',
      department: '',
      familyIncome: '',
      academicPerformance: '',
      reason: '',
    },
  });

  const onSubmit = async (values) => {
    if (docFiles.length === 0) {
      toast.error('Upload at least one supporting document.');
      return;
    }
    setUploading(true);
    try {
      // Upload each document first.
      const documents = [];
      for (const file of docFiles) {
        const body = await uploadFile({ file, use: 'scholarship' }).unwrap();
        documents.push(body.data.attachment);
      }

      await apply({
        scholarshipId: scholarship._id,
        rollNumber: values.rollNumber,
        department: values.department,
        familyIncome: values.familyIncome,
        academicPerformance: values.academicPerformance,
        reason: values.reason,
        documents,
      }).unwrap();

      toast.success('Application submitted — the sponsor has been notified.');
      setDocFiles([]);
      onApplied?.();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not submit the application.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Apply: ${scholarship?.name ?? 'Scholarship'}`}
      description={`Amount ${scholarship?.amount ? `₹${Number(scholarship.amount).toLocaleString('en-IN')}` : ''} · Deadline ${scholarship?.deadline ? new Date(scholarship.deadline).toLocaleDateString('en-IN') : ''}`}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Roll number" required error={errors.rollNumber?.message} {...register('rollNumber')} />
          <Input label="Department" required error={errors.department?.message} {...register('department')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Annual family income (₹)"
            type="number"
            min={0}
            required
            hint="As per your income certificate"
            error={errors.familyIncome?.message}
            {...register('familyIncome')}
          />
          <Input
            label="Academic performance (%)"
            type="number"
            min={0}
            max={100}
            required
            hint="CGPA × 10 or percentage"
            error={errors.academicPerformance?.message}
            {...register('academicPerformance')}
          />
        </div>
        <Textarea
          label="Reason for scholarship"
          rows={4}
          required
          placeholder="Tell the sponsor about your situation and goals…"
          error={errors.reason?.message}
          {...register('reason')}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">
            Supporting documents <span className="text-red-500">*</span>
          </p>
          <FileDropzone
            accept={DOC_ACCEPT}
            maxSize={DOC_MAX}
            multiple
            value={docFiles}
            onChange={setDocFiles}
            hint="Income certificate, academic records, and other documents (PDF/JPG/PNG, up to 25 MB each)"
          />
          <p className="mt-1 text-xs text-slate-400">
            Required: {scholarship?.requiredDocuments?.length ? scholarship.requiredDocuments.join(' · ') : 'check the campaign details'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || uploading}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || uploading}>
            Submit application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
