import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateEventMutation, useUpdateEventMutation } from '../../../services/eventsApi.js';
import { useUploadFileMutation } from '../../../services/uploadApi.js';
import { getErrorMessage, EVENT_CATEGORIES, DEPARTMENTS, EVENT_CATEGORY_LABELS } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { FileDropzone } from '../../ui/FileDropzone.jsx';
import { formatDate } from '../../../utils/format.js';

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const IMAGE_MAX = 5 * 1024 * 1024;

const eventFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    description: z.string().trim().min(10, 'Description must be at least 10 characters').max(5000),
    date: z.string().min(1, 'Event date is required'),
    startTime: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Valid time (HH:mm)')
      .optional()
      .or(z.literal('')),
    endTime: z
      .string()
      .regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Valid time (HH:mm)')
      .optional()
      .or(z.literal('')),
    venue: z.string().trim().max(200).optional().or(z.literal('')),
    mode: z.enum(['online', 'offline', 'hybrid']),
    meetingLink: z
      .union([z.literal(''), z.string().trim().max(500).refine((v) => /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')])
      .optional(),
    maxParticipants: z.coerce.number().int().min(1).max(10000),
    registrationDeadline: z.string().optional().or(z.literal('')),
    department: z.union([z.literal(''), z.enum(DEPARTMENTS)]).optional(),
    category: z.enum(EVENT_CATEGORIES, 'Select a category'),
  })
  .refine(
    (data) => !data.registrationDeadline || new Date(data.registrationDeadline) < new Date(data.date),
    { message: 'Registration deadline must be before the event date', path: ['registrationDeadline'] },
  );

/** Create/Edit event modal (spec §9) — real persistence + optional image. */
export function EventFormModal({ open, onClose, event = null }) {
  const [createEvent, { isLoading: creating }] = useCreateEventMutation();
  const [updateEvent, { isLoading: updating }] = useUpdateEventMutation();
  const [uploadFile] = useUploadFileMutation();
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImage, setExistingImage] = useState(event?.image ?? null);

  const isEdit = Boolean(event);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          date: formatDate(event.date) ? toInputDate(event.date) : '',
          startTime: event.startTime ?? '',
          endTime: event.endTime ?? '',
          venue: event.venue ?? '',
          mode: event.mode ?? 'offline',
          meetingLink: event.meetingLink ?? '',
          maxParticipants: event.maxParticipants ?? 100,
          registrationDeadline: event.registrationDeadline ? toInputDate(event.registrationDeadline) : '',
          department: event.department ?? '',
          category: event.category,
        }
      : {
          title: '',
          description: '',
          date: '',
          startTime: '',
          endTime: '',
          venue: '',
          mode: 'offline',
          meetingLink: '',
          maxParticipants: 100,
          registrationDeadline: '',
          department: '',
          category: 'workshop',
        },
  });

  const onSubmit = async (values) => {
    try {
      let image = null;
      if (imageFiles.length > 0) {
        const body = await uploadFile({ file: imageFiles[0], use: 'event' }).unwrap();
        image = body.data.attachment;
      } else if (isEdit) {
        image = existingImage;
      }

      const payload = {
        title: values.title,
        description: values.description,
        date: new Date(values.date).toISOString(),
        startTime: values.startTime || undefined,
        endTime: values.endTime || undefined,
        venue: values.venue || undefined,
        mode: values.mode,
        meetingLink: values.meetingLink || undefined,
        maxParticipants: values.maxParticipants,
        registrationDeadline: values.registrationDeadline ? new Date(values.registrationDeadline).toISOString() : undefined,
        department: values.department || undefined,
        category: values.category,
        image,
      };

      if (isEdit) {
        await updateEvent({ id: event._id, body: payload }).unwrap();
        toast.success('Event updated');
      } else {
        await createEvent(payload).unwrap();
        toast.success('Event created — students can now register');
      }
      setImageFiles([]);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? 'Could not update the event.' : 'Could not create the event.'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event' : 'Create event'}
      description="Fill in the details — students will see it in the events list."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Event title" placeholder="e.g. MERN Stack Workshop" required error={errors.title?.message} {...register('title')} />
        <Textarea label="Description" rows={4} required placeholder="What is this event about?" error={errors.description?.message} {...register('description')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
          <Input label="Start time" type="time" error={errors.startTime?.message} {...register('startTime')} />
          <Input label="End time" type="time" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Mode"
            options={[
              { value: 'offline', label: 'Offline' },
              { value: 'online', label: 'Online' },
              { value: 'hybrid', label: 'Hybrid' },
            ]}
            {...register('mode')}
          />
          <Input
            label="Venue"
            placeholder="Auditorium, Lab 3…"
            hint="Required for offline events"
            error={errors.venue?.message}
            {...register('venue')}
          />
        </div>

        <Input label="Online meeting link" placeholder="https://meet.google.com/…" hint="For online/hybrid events (Google Meet / Zoom)" error={errors.meetingLink?.message} {...register('meetingLink')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Max participants" type="number" min={1} required error={errors.maxParticipants?.message} {...register('maxParticipants')} />
          <Select
            label="Category"
            required
            placeholder="Select category"
            options={EVENT_CATEGORIES.map((c) => ({ value: c, label: EVENT_CATEGORY_LABELS[c] ?? c }))}
            error={errors.category?.message}
            {...register('category')}
          />
          <Select
            label="Department"
            placeholder="All departments"
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            {...register('department')}
          />
        </div>

        <Input label="Registration deadline" type="date" hint="Leave empty to keep registration open until the event" error={errors.registrationDeadline?.message} {...register('registrationDeadline')} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Event image (optional)</p>
          {existingImage && !imageFiles.length && (
            <div className="mb-2 flex items-center gap-3 rounded-lg border border-slate-200 p-2">
              <img src={existingImage.url} alt="Current event image" className="h-12 w-20 rounded object-cover" />
              <button
                type="button"
                onClick={() => setExistingImage(null)}
                className="text-xs font-medium text-red-600 hover:underline"
              >
                Remove image
              </button>
            </div>
          )}
          <FileDropzone
            accept={IMAGE_ACCEPT}
            maxSize={IMAGE_MAX}
            value={imageFiles}
            onChange={setImageFiles}
            hint="JPG, PNG or WebP up to 5 MB"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || creating || updating}>
            {isEdit ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** "YYYY-MM-DD" (date input) ↔ Date conversion. */
function toInputDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}
