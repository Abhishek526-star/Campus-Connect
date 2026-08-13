import { useRef, useState } from 'react';
import { ImagePlus, Paperclip, SendHorizonal, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUploadChatFileMutation } from '../../../services/chatApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { cn } from '../../../utils/cn.js';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 25 * 1024 * 1024;

/**
 * Chat composer — text with Enter-to-send, image/file attachments
 * (uploaded to Cloudinary/local storage first, then sent as a message).
 */
export function MessageInput({ onSend, onTyping, disabled, disabledReason }) {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [uploadChatFile] = useUploadChatFileMutation();

  const pickFile = (event, isImage) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_SIZE) {
      toast.error('File exceeds the 25 MB limit.');
      return;
    }
    setPendingFile({ file, isImage });
  };

  const handleSend = async (content = text) => {
    const trimmed = content.trim();
    if (uploading) return;

    if (pendingFile) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', pendingFile.file);
        const body = await uploadChatFile(formData).unwrap();
        const attachment = body.data.attachment;
        await onSend({
          content: '',
          kind: pendingFile.isImage ? 'image' : 'file',
          attachment,
        });
      } catch (error) {
        toast.error(getErrorMessage(error, 'Could not upload the attachment.'));
      } finally {
        setUploading(false);
        setPendingFile(null);
      }
      return;
    }

    if (!trimmed) return;
    const ok = await onSend({ content: trimmed, kind: 'text', attachment: null });
    if (ok) setText('');
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white p-3">
      {/* Pending attachment chip */}
      {pendingFile && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
          <span className="min-w-0 flex-1 truncate font-medium text-slate-700">{pendingFile.file.name}</span>
          <span className="text-slate-400">{(pendingFile.file.size / 1024).toFixed(0)} KB</span>
          <button
            type="button"
            onClick={() => setPendingFile(null)}
            aria-label="Remove attachment"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-red-500"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input ref={imageInputRef} type="file" accept={IMAGE_TYPES.join(',')} className="hidden" onChange={(e) => pickFile(e, true)} />
        <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => pickFile(e, false)} />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Attach image"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600 disabled:opacity-50"
        >
          <ImagePlus className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Attach file"
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary-600 disabled:opacity-50"
        >
          <Paperclip className="size-5" aria-hidden="true" />
        </button>

        <textarea
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            onTyping?.(true);
          }}
          onBlur={() => onTyping?.(false)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled || uploading}
          placeholder={disabled ? disabledReason ?? 'Messaging unavailable' : 'Type a message…'}
          aria-label="Message"
          className={cn(
            'max-h-32 min-h-10 flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition-colors',
            'placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
            'disabled:cursor-not-allowed disabled:bg-slate-50',
          )}
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={disabled || uploading || (!text.trim() && !pendingFile)}
          aria-label="Send message"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-colors hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-40"
        >
          <SendHorizonal className="size-4.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
