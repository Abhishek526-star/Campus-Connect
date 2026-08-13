import { useRef, useState } from 'react';
import { CloudUpload, FileText, X } from 'lucide-react';
import { cn } from '../../utils/cn.js';

/**
 * Drag-and-drop file picker with MIME + size validation and file list.
 * `onChange` receives the validated FileList (array).
 */
export function FileDropzone({
  accept = [],
  maxSize = 25 * 1024 * 1024,
  multiple = false,
  value = [],
  onChange,
  hint,
  className,
  icon: Icon = CloudUpload,
}) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  const validate = (files) => {
    const incoming = Array.from(files);
    for (const file of incoming) {
      if (accept.length > 0 && !accept.includes(file.type)) {
        setError(`"${file.name}" is not an allowed file type.`);
        return;
      }
      if (file.size > maxSize) {
        setError(`"${file.name}" exceeds the ${Math.round(maxSize / 1024 / 1024)} MB limit.`);
        return;
      }
    }
    setError('');
    onChange?.(multiple ? [...value, ...incoming] : [incoming[0]]);
  };

  const removeFile = (index) => {
    const next = [...value];
    next.splice(index, 1);
    onChange?.(next);
  };

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload files"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          validate(event.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors',
          dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-300 bg-slate-50 hover:border-primary-300 hover:bg-primary-50/40',
          className,
        )}
      >
        <Icon className="size-7 text-slate-400" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-600">
          Drag & drop files here, or <span className="text-primary-600">browse</span>
        </p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) validate(event.target.files);
            event.target.value = '';
          }}
        />
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((file, index) => (
            <li
              key={file.name + index}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <FileText className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">
                {file.size ? `${(file.size / 1024).toFixed(0)} KB` : ''}
              </span>
              <button
                type="button"
                onClick={() => removeFile(index)}
                aria-label={`Remove ${file.name}`}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
