import { useState } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useCreateResourceMutation } from '../../../services/resourcesApi.js';
import { useUploadFileMutation } from '../../../services/uploadApi.js';
import { getErrorMessage, RESOURCE_CATEGORIES } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Input } from '../../ui/Input.jsx';
import { Modal } from '../../ui/Modal.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';
import { FileDropzone } from '../../ui/FileDropzone.jsx';
import { TagInput } from '../../ui/TagInput.jsx';

const FILE_ACCEPT = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain'];
const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ALL = [...FILE_ACCEPT, ...IMAGE_ACCEPT];
const MAX_SIZE = 25 * 1024 * 1024;

const resourceSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().trim().max(3000).optional().or(z.literal('')),
    category: z.enum(RESOURCE_CATEGORIES, 'Select a category'),
    subCategory: z.string().trim().max(120).optional().or(z.literal('')),
    subject: z.string().trim().max(120).optional().or(z.literal('')),
    semester: z.string().trim().max(20).optional().or(z.literal('')),
    fileType: z.enum(['pdf', 'doc', 'ppt', 'video', 'external', 'notes']),
    externalUrl: z
      .union([z.literal(''), z.string().trim().max(500).refine((v) => /^https?:\/\//.test(v), 'Enter a valid URL (https://…)')])
      .optional(),
    tags: z.array(z.string()).max(20).optional(),
  })
  .refine((data) => data.fileType !== 'external' || Boolean(data.externalUrl), {
    message: 'Provide the external URL',
    path: ['externalUrl'],
  });

/** Upload resource modal (spec §15): file upload OR external link, pending approval. */
export function UploadResourceModal({ open, onClose }) {
  const [createResource, { isLoading: creating }] = useCreateResourceMutation();
  const [uploadFile] = useUploadFileMutation();
  const [file, setFile] = useState([]);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'Semester',
      subCategory: '',
      subject: '',
      semester: '',
      fileType: 'pdf',
      externalUrl: '',
      tags: [],
    },
  });

  const fileType = useWatch({ control, name: 'fileType' });
  const isExternal = fileType === 'external';

  const onSubmit = async (values) => {
    setUploading(true);
    try {
      let fileAttachment = null;
      if (!isExternal) {
        if (file.length === 0) {
          toast.error('Attach the resource file.');
          setUploading(false);
          return;
        }
        const body = await uploadFile({ file: file[0], use: 'resource' }).unwrap();
        fileAttachment = body.data.attachment;
      }

      await createResource({
        title: values.title,
        description: values.description || undefined,
        category: values.category,
        subCategory: values.subCategory || undefined,
        subject: values.subject || undefined,
        semester: values.semester || undefined,
        fileType: values.fileType,
        file: fileAttachment,
        externalUrl: values.externalUrl || undefined,
        tags: values.tags ?? [],
      }).unwrap();

      toast.success('Resource uploaded — pending admin approval');
      setFile([]);
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not upload the resource.'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload study resource" description="Approved resources appear in the library for everyone." size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Title" placeholder="e.g. OS Unit 3 Notes" required error={errors.title?.message} {...register('title')} />
        <Textarea label="Description (optional)" rows={2} {...register('description')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            required
            options={RESOURCE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            error={errors.category?.message}
            {...register('category')}
          />
          <Select
            label="File type"
            options={[
              { value: 'pdf', label: 'PDF' },
              { value: 'doc', label: 'DOC' },
              { value: 'ppt', label: 'PPT' },
              { value: 'video', label: 'Video' },
              { value: 'external', label: 'External link' },
              { value: 'notes', label: 'Notes' },
            ]}
            {...register('fileType')}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Sub-category" placeholder="e.g. Unit-wise notes, DSA…" {...register('subCategory')} />
          <Input label="Subject" placeholder="e.g. Operating Systems" {...register('subject')} />
          <Input label="Semester" placeholder="e.g. Sem 4" {...register('semester')} />
        </div>

        {isExternal ? (
          <Input
            label="External URL"
            placeholder="https://…"
            hint="Video, article, or any external resource"
            error={errors.externalUrl?.message}
            {...register('externalUrl')}
          />
        ) : (
          <FileDropzone
            accept={ACCEPT_ALL}
            maxSize={MAX_SIZE}
            value={file}
            onChange={setFile}
            hint="PDF, DOC, PPT, or notes — up to 25 MB"
          />
        )}

        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagInput label="Tags" value={field.value ?? []} onChange={field.onChange} placeholder="gate, os, pyq…" />}
        />

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting || uploading}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting || uploading || creating}>
            Upload resource
          </Button>
        </div>
      </form>
    </Modal>
  );
}
