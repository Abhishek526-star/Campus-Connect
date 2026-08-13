import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateScholarshipMutation } from '../../../services/scholarshipsApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { TagInput } from '../../ui/TagInput.jsx';
import { Controller } from 'react-hook-form';

const createSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    eligibility: z.string().trim().min(10, 'Eligibility must be at least 10 characters').max(2000),
    amount: z.coerce.number().min(1, 'Amount must be positive'),
    targetAmount: z.coerce.number().min(1, 'Target must be positive'),
    deadline: z.string().min(1, 'Deadline is required'),
    maxApplicants: z.coerce.number().int().min(1).max(10000),
    category: z.enum(['need_based', 'merit_based', 'special']),
    minimumRequirements: z.array(z.string()).max(20).optional(),
    requiredDocuments: z.array(z.string()).max(20).optional(),
  })
  .refine((data) => new Date(data.deadline) > new Date(), {
    message: 'Deadline must be in the future',
    path: ['deadline'],
  });

/** Create scholarship campaign modal (alumni/faculty/admin — spec §11). */
export function CreateScholarshipModal({ open, onClose }) {
  const [createScholarship, { isLoading }] = useCreateScholarshipMutation();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      description: '',
      eligibility: '',
      amount: '',
      targetAmount: '',
      deadline: '',
      maxApplicants: 50,
      category: 'need_based',
      minimumRequirements: [],
      requiredDocuments: [],
    },
  });

  const onSubmit = async (values) => {
    try {
      await createScholarship({
        ...values,
        deadline: new Date(values.deadline).toISOString(),
      }).unwrap();
      toast.success('Scholarship campaign created!');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not create the campaign.'));
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create scholarship campaign" description="Fund a scholarship and support deserving students." size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Scholarship name" required error={errors.name?.message} {...register('name')} />
        <Textarea label="Description" rows={3} required error={errors.description?.message} {...register('description')} />
        <Textarea label="Eligibility criteria" rows={3} required placeholder="Who can apply? Income/criteria…" error={errors.eligibility?.message} {...register('eligibility')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Amount per student (₹)" type="number" min={1} required error={errors.amount?.message} {...register('amount')} />
          <Input label="Funding target (₹)" type="number" min={1} required hint="Total you aim to raise" error={errors.targetAmount?.message} {...register('targetAmount')} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Application deadline" type="date" required error={errors.deadline?.message} {...register('deadline')} />
          <Input label="Max applicants" type="number" min={1} required error={errors.maxApplicants?.message} {...register('maxApplicants')} />
        </div>

        <Select
          label="Category"
          options={[
            { value: 'need_based', label: 'Need-based' },
            { value: 'merit_based', label: 'Merit-based' },
            { value: 'special', label: 'Special' },
          ]}
          {...register('category')}
        />

        <Controller
          name="minimumRequirements"
          control={control}
          render={({ field }) => (
            <TagInput label="Minimum requirements" value={field.value ?? []} onChange={field.onChange} placeholder="CGPA ≥ 7.5, income ≤ ₹3L…" />
          )}
        />
        <Controller
          name="requiredDocuments"
          control={control}
          render={({ field }) => (
            <TagInput label="Required documents" value={field.value ?? []} onChange={field.onChange} placeholder="Income certificate, academic records…" />
          )}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || isLoading}>
            Create campaign
          </Button>
        </div>
      </form>
    </Modal>
  );
}
