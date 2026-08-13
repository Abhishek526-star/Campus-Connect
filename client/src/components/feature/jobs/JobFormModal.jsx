import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateJobMutation, useUpdateJobMutation } from '../../../services/jobsApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Checkbox } from '../../ui/Checkbox.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { TagInput } from '../../ui/TagInput.jsx';
import { JOB_TYPE_LABELS } from './jobConstants.js';

const jobFormSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
  company: z.string().trim().min(2, 'Company is required').max(150),
  type: z.enum(['job', 'internship', 'freelance', 'hackathon', 'competition', 'training']),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
  location: z.string().trim().max(150).optional().or(z.literal('')),
  workMode: z.enum(['remote', 'hybrid', 'onsite']),
  salary: z.string().trim().max(120).optional().or(z.literal('')),
  experience: z.string().trim().max(120).optional().or(z.literal('')),
  eligibility: z.string().trim().max(1000).optional().or(z.literal('')),
  deadline: z.string().optional().or(z.literal('')),
  applicationLink: z
    .union([z.literal(''), z.string().trim().max(500).refine((v) => /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')])
    .optional(),
  applyThroughPlatform: z.boolean().optional(),
  skills: z.array(z.string()).max(30).optional(),
});

const TYPE_OPTIONS = Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }));

/** Create/edit opportunity modal (spec §14). */
export function JobFormModal({ open, onClose, job = null }) {
  const [createJob, { isLoading: creating }] = useCreateJobMutation();
  const [updateJob, { isLoading: updating }] = useUpdateJobMutation();
  const isEdit = Boolean(job);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(jobFormSchema),
    defaultValues: job
      ? {
          title: job.title,
          company: job.company,
          type: job.type,
          description: job.description,
          location: job.location ?? '',
          workMode: job.workMode ?? 'onsite',
          salary: job.salary ?? '',
          experience: job.experience ?? '',
          eligibility: job.eligibility ?? '',
          deadline: job.deadline ? new Date(job.deadline).toISOString().slice(0, 10) : '',
          applicationLink: job.applicationLink ?? '',
          applyThroughPlatform: job.applyThroughPlatform ?? false,
          skills: job.skills ?? [],
        }
      : {
          title: '',
          company: '',
          type: 'job',
          description: '',
          location: '',
          workMode: 'onsite',
          salary: '',
          experience: '',
          eligibility: '',
          deadline: '',
          applicationLink: '',
          applyThroughPlatform: false,
          skills: [],
        },
  });

  const applyThroughPlatform = useWatch({ control, name: 'applyThroughPlatform' });

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        company: values.company,
        type: values.type,
        description: values.description,
        location: values.location || undefined,
        workMode: values.workMode,
        salary: values.salary || undefined,
        experience: values.experience || undefined,
        eligibility: values.eligibility || undefined,
        deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
        applicationLink: values.applicationLink || undefined,
        applyThroughPlatform: values.applyThroughPlatform,
        skills: values.skills ?? [],
      };

      if (isEdit) {
        await updateJob({ id: job._id, body: payload }).unwrap();
        toast.success('Opportunity updated');
      } else {
        await createJob(payload).unwrap();
        toast.success('Opportunity posted');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? 'Could not update the opportunity.' : 'Could not post the opportunity.'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit opportunity' : 'Post an opportunity'} description="Share jobs, internships, and more with the community." size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Title" placeholder="e.g. SDE Intern" required error={errors.title?.message} {...register('title')} />
          <Input label="Company" placeholder="e.g. Google" required error={errors.company?.message} {...register('company')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Type" options={TYPE_OPTIONS} {...register('type')} />
          <Select
            label="Work mode"
            options={[
              { value: 'remote', label: 'Remote' },
              { value: 'hybrid', label: 'Hybrid' },
              { value: 'onsite', label: 'On-site' },
            ]}
            {...register('workMode')}
          />
          <Input label="Location" placeholder="Bengaluru, Remote…" error={errors.location?.message} {...register('location')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Salary / stipend" placeholder="₹20-28 LPA" error={errors.salary?.message} {...register('salary')} />
          <Input label="Experience" placeholder="0-2 years" error={errors.experience?.message} {...register('experience')} />
          <Input label="Application deadline" type="date" error={errors.deadline?.message} {...register('deadline')} />
        </div>

        <Textarea label="Description" rows={4} required placeholder="Role, responsibilities, what you're looking for…" error={errors.description?.message} {...register('description')} />
        <Textarea label="Eligibility (optional)" rows={2} {...register('eligibility')} />

        <Controller
          name="skills"
          control={control}
          render={({ field }) => <TagInput label="Skills" value={field.value ?? []} onChange={field.onChange} placeholder="React, Java, Python…" />}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="External application link"
            placeholder="https://company.careers/…"
            hint="For applications handled outside the platform"
            error={errors.applicationLink?.message}
            {...register('applicationLink')}
          />
          <div className="flex items-end pb-1">
              <Checkbox
              label="Apply through Campus Connect"
              description="Students apply here; you get notified."
              checked={applyThroughPlatform}
              onChange={(event) => setValue('applyThroughPlatform', event.target.checked)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || creating || updating}>
            {isEdit ? 'Save changes' : 'Post opportunity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
