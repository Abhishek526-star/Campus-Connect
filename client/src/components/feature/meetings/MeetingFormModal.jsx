import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateMeetingMutation, useUpdateMeetingMutation } from '../../../services/meetingsApi.js';
import { useGetDirectoryQuery } from '../../../services/peopleApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { Checkbox } from '../../ui/Checkbox.jsx';

const meetingFormSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Valid time (HH:mm)'),
    endTime: z.string().regex(/^$|^([01]\d|2[0-3]):[0-5]\d$/, 'Valid time (HH:mm)').optional().or(z.literal('')),
    type: z.enum(['one_on_one', 'group']),
    description: z.string().trim().max(2000).optional().or(z.literal('')),
    location: z.string().trim().max(200).optional().or(z.literal('')),
    meetingLink: z
      .union([z.literal(''), z.string().trim().max(500).refine((v) => /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')])
      .optional(),
    participantIds: z.array(z.string()).min(1, 'Select at least one participant'),
  })
  .refine((data) => !data.endTime || data.endTime > data.startTime, {
    message: 'End time must be after the start time',
    path: ['endTime'],
  });

const toInputDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

/**
 * Schedule meeting modal (spec §8): title, date/time, type, description,
 * location, online link (Google Meet/Zoom), participant multi-select.
 */
export function MeetingFormModal({ open, onClose, meeting = null }) {
  const [createMeeting, { isLoading: creating }] = useCreateMeetingMutation();
  const [updateMeeting, { isLoading: updating }] = useUpdateMeetingMutation();
  const [selectedIds, setSelectedIds] = useState(() => meeting?.participants?.map((p) => String(p.user?._id ?? p.user)) ?? []);

  const { data: directoryData } = useGetDirectoryQuery({ role: 'all', page: 1, limit: 100, sort: 'name' });
  const people = directoryData?.data?.items ?? [];

  const isEdit = Boolean(meeting);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: meeting
      ? {
          title: meeting.title,
          date: toInputDate(meeting.date),
          startTime: meeting.startTime ?? '',
          endTime: meeting.endTime ?? '',
          type: meeting.type ?? 'one_on_one',
          description: meeting.description ?? '',
          location: meeting.location ?? '',
          meetingLink: meeting.meetingLink ?? '',
        }
      : {
          title: '',
          date: '',
          startTime: '10:00',
          endTime: '',
          type: 'one_on_one',
          description: '',
          location: '',
          meetingLink: '',
        },
  });

  const watchedType = useWatch({ control: control, name: 'type' });

  const toggleParticipant = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  };

  const onSubmit = async (values) => {
    if (selectedIds.length === 0) {
      toast.error('Select at least one participant.');
      return;
    }
    try {
      const payload = {
        title: values.title,
        date: new Date(values.date).toISOString(),
        startTime: values.startTime,
        endTime: values.endTime || undefined,
        type: values.type,
        description: values.description || undefined,
        location: values.location || undefined,
        meetingLink: values.meetingLink || undefined,
        participantIds: selectedIds,
      };

      if (isEdit) {
        await updateMeeting({ id: meeting._id, body: payload }).unwrap();
        toast.success('Meeting updated');
      } else {
        await createMeeting(payload).unwrap();
        toast.success('Meeting scheduled — invitations sent');
      }
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, isEdit ? 'Could not update the meeting.' : 'Could not schedule the meeting.'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit meeting' : 'Schedule meeting'}
      description="Invite participants — they can accept or reject the invitation."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Meeting title" placeholder="e.g. Mock interview practice" required error={errors.title?.message} {...register('title')} />

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Date" type="date" required error={errors.date?.message} {...register('date')} />
          <Input label="Start time" type="time" required error={errors.startTime?.message} {...register('startTime')} />
          <Input label="End time" type="time" error={errors.endTime?.message} {...register('endTime')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Meeting type"
            options={[
              { value: 'one_on_one', label: 'One-on-one' },
              { value: 'group', label: 'Group meeting' },
            ]}
            {...register('type')}
          />
          <Input
            label="Location (optional)"
            placeholder="Faculty cabin, Lab 3…"
            error={errors.location?.message}
            {...register('location')}
          />
        </div>

        <Input
          label="Online meeting link (Google Meet / Zoom)"
          placeholder="https://meet.google.com/…"
          hint="Paste your external meeting link — participants join with one click"
          error={errors.meetingLink?.message}
          {...register('meetingLink')}
        />

        <Textarea label="Description (optional)" rows={3} placeholder="Agenda, topics to cover…" {...register('description')} />

        {/* Participants */}
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">
            Participants <span className="text-red-500">*</span>
          </p>
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 p-3">
            {people.length === 0 ? (
              <p className="text-sm text-slate-400">Loading members…</p>
            ) : (
              <div className="grid gap-1 sm:grid-cols-2">
                {people.map((person) => (
                  <Checkbox
                    key={person._id}
                    label={person.name}
                    description={person.role}
                    checked={selectedIds.includes(person._id)}
                    onChange={() => toggleParticipant(person._id)}
                  />
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {selectedIds.length} selected · {watchedType === 'group' ? 'group meeting' : 'one-on-one'}
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || creating || updating}>
            {isEdit ? 'Save changes' : 'Schedule meeting'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
