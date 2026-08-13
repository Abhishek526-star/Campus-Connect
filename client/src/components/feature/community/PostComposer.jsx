import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImagePlus, Link2, Paperclip, Send, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCreatePostMutation } from '../../../services/postsApi.js';
import { useUploadFileMutation } from '../../../services/uploadApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { POST_TYPE_OPTIONS } from './postConstants.js';
import { Avatar } from '../../ui/Avatar.jsx';
import { Button } from '../../ui/Button.jsx';
import { Card } from '../../ui/Card.jsx';
import { Select } from '../../ui/Select.jsx';
import { Textarea } from '../../ui/Textarea.jsx';

const IMAGE_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const FILE_ACCEPT = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
const MAX_SIZE = 25 * 1024 * 1024;

const postSchema = z.object({
  content: z.string().trim().min(2, 'Write something to post').max(5000),
  type: z.enum(POST_TYPE_OPTIONS.map((option) => option.value), 'Select a type'),
});

/**
 * Post composer (spec §16): text + type, images/documents uploads, links, tags.
 */
export function PostComposer() {
  const [createPost, { isLoading }] = useCreatePostMutation();
  const [uploadFile] = useUploadFileMutation();
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [linkDraft, setLinkDraft] = useState('');
  const [tags, setTags] = useState([]);
  const [tagDraft, setTagDraft] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(postSchema),
    defaultValues: { content: '', type: 'knowledge' },
  });

  const pickImages = async (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, 5 - images.length);
    event.target.value = '';
    const valid = files.filter((file) => file.size <= MAX_SIZE && IMAGE_ACCEPT.includes(file.type));
    if (valid.length < files.length) toast.error('Only JPG/PNG/WebP up to 25 MB are allowed.');
    setImages((current) => [...current, ...valid]);
  };

  const pickDocuments = async (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, 5 - documents.length);
    event.target.value = '';
    const valid = files.filter((file) => file.size <= MAX_SIZE && FILE_ACCEPT.includes(file.type));
    if (valid.length < files.length) toast.error('Only PDF/DOC/TXT up to 25 MB are allowed.');
    setDocuments((current) => [...current, ...valid]);
  };

  const addLink = () => {
    if (!/^https?:\/\//.test(linkDraft.trim())) {
      toast.error('Enter a valid URL (https://…).');
      return;
    }
    setLinks((current) => [...current, linkDraft.trim()]);
    setLinkDraft('');
  };

  const addTag = () => {
    const tag = tagDraft.trim().replace(/^#/, '');
    if (!tag) return;
    setTags((current) => [...new Set([...current, tag])].slice(0, 10));
    setTagDraft('');
  };

  const onSubmit = async (values) => {
    try {
      const uploadedImages = [];
      const uploadedDocs = [];
      for (const image of images) {
        const body = await uploadFile({ file: image, use: 'post' }).unwrap();
        uploadedImages.push(body.data.attachment);
      }
      for (const doc of documents) {
        const body = await uploadFile({ file: doc, use: 'post' }).unwrap();
        uploadedDocs.push(body.data.attachment);
      }

      await createPost({
        type: values.type,
        content: values.content,
        images: uploadedImages,
        documents: uploadedDocs,
        links: links.length ? links : undefined,
        tags: tags.length ? tags : undefined,
      }).unwrap();

      toast.success('Post published');
      reset();
      setImages([]);
      setDocuments([]);
      setLinks([]);
      setTags([]);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not publish the post.'));
    }
  };

  return (
    <Card className="p-4 sm:p-5">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="flex items-start gap-3">
          <Avatar name="You" size="md" />
          <div className="min-w-0 flex-1 space-y-3">
            <Textarea
              rows={3}
              placeholder="Share something with the community — knowledge, achievements, advice…"
              error={errors.content?.message}
              className="resize-none border-none bg-slate-50 px-4 shadow-none focus:ring-0"
              {...register('content')}
            />
            <Select
              label="Post type"
              options={POST_TYPE_OPTIONS}
              error={errors.type?.message}
              className="max-w-52"
              {...register('type')}
            />

            {/* Attachments */}
            <div className="flex flex-wrap gap-2">
              <input type="file" id="post-images" accept={IMAGE_ACCEPT.join(',')} multiple className="hidden" onChange={pickImages} />
              <input type="file" id="post-docs" accept={FILE_ACCEPT.join(',')} multiple className="hidden" onChange={pickDocuments} />
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('post-images')?.click()}>
                <ImagePlus className="size-4" aria-hidden="true" /> Images
              </Button>
              <Button variant="outline" size="sm" type="button" onClick={() => document.getElementById('post-docs')?.click()}>
                <Paperclip className="size-4" aria-hidden="true" /> Documents
              </Button>
            </div>

            {/* Pending attachments */}
            {(images.length > 0 || documents.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {images.map((image, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-xs text-primary-700">
                    🖼 {image.name}
                    <button type="button" onClick={() => setImages((current) => current.filter((_, i) => i !== index))} aria-label="Remove image">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {documents.map((doc, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    📄 {doc.name}
                    <button type="button" onClick={() => setDocuments((current) => current.filter((_, i) => i !== index))} aria-label="Remove document">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Links + tags */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-slate-200 px-2">
                <Link2 className="size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
                <input
                  type="url"
                  value={linkDraft}
                  onChange={(event) => setLinkDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addLink())}
                  placeholder="Add a link"
                  className="h-8 w-full min-w-0 border-none bg-transparent text-sm focus:outline-none"
                />
                <button type="button" onClick={addLink} className="text-xs font-semibold text-primary-600">Add</button>
              </div>
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-lg border border-slate-200 px-2">
                <span className="text-xs text-slate-400">#</span>
                <input
                  type="text"
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="h-8 w-full min-w-0 border-none bg-transparent text-sm focus:outline-none"
                />
                <button type="button" onClick={addTag} className="text-xs font-semibold text-primary-600">Add</button>
              </div>
            </div>

            {links.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {links.map((link, index) => (
                  <span key={index} className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs text-accent-700">
                    🔗 {link}
                    <button type="button" onClick={() => setLinks((current) => current.filter((_, i) => i !== index))} aria-label="Remove link">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, index) => (
                  <span key={index} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                    #{tag}
                    <button type="button" onClick={() => setTags((current) => current.filter((_, i) => i !== index))} aria-label="Remove tag">
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
          <Button type="submit" size="sm" loading={isSubmitting || isLoading}>
            <Send className="size-3.5" aria-hidden="true" /> Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
