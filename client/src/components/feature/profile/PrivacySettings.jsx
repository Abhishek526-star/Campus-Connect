import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, Lock, Users } from 'lucide-react';
import { useUpdatePrivacyMutation } from '../../../services/profileApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card.jsx';
import { cn } from '../../../utils/cn.js';

const PRIVACY_FIELDS = [
  { key: 'phone', label: 'Phone number', description: 'Shown on your public profile.' },
  { key: 'email', label: 'Email address', description: 'How other members can reach you.' },
  { key: 'location', label: 'Location', description: 'City/state shown on your profile.' },
  { key: 'company', label: 'Current company', description: 'Company name on your profile.' },
  { key: 'socialLinks', label: 'Social links', description: 'LinkedIn, GitHub, and portfolio links.' },
];

const LEVELS = [
  { value: 'public', icon: Eye, label: 'Public', description: 'Everyone on Campus Connect' },
  { value: 'connections', icon: Users, label: 'Connections only', description: 'Your accepted connections' },
  { value: 'private', icon: Lock, label: 'Private', description: 'Only you and administrators' },
];

/** Privacy settings editor (spec §41). */
export function PrivacySettings({ privacy, onDone }) {
  const [values, setValues] = useState(() => ({
    phone: privacy?.phone ?? 'public',
    email: privacy?.email ?? 'connections',
    location: privacy?.location ?? 'public',
    company: privacy?.company ?? 'public',
    socialLinks: privacy?.socialLinks ?? 'connections',
  }));
  const [updatePrivacy, { isLoading }] = useUpdatePrivacyMutation();

  const handleSave = async () => {
    try {
      await updatePrivacy(values).unwrap();
      toast.success('Privacy settings saved');
      onDone?.();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save privacy settings.'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Privacy settings</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-6 text-sm text-slate-500">
          Control who can see each part of your profile. These rules are enforced by the
          server — other members only receive the fields they're allowed to see.
        </p>

        <div className="space-y-6">
          {PRIVACY_FIELDS.map((field) => (
            <div key={field.key}>
              <p className="text-sm font-semibold text-slate-800">{field.label}</p>
              <p className="mb-3 text-xs text-slate-400">{field.description}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {LEVELS.map((level) => {
                  const selected = values[field.key] === level.value;
                  return (
                    <button
                      key={level.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setValues((prev) => ({ ...prev, [field.key]: level.value }))}
                      className={cn(
                        'flex items-start gap-2.5 rounded-xl border-2 p-3 text-left transition-all',
                        selected ? 'border-primary-500 bg-primary-50/70' : 'border-slate-200 bg-white hover:border-slate-300',
                      )}
                    >
                      <level.icon
                        className={cn('mt-0.5 size-4 shrink-0', selected ? 'text-primary-600' : 'text-slate-400')}
                        aria-hidden="true"
                      />
                      <span>
                        <span className={cn('block text-sm font-semibold', selected ? 'text-primary-700' : 'text-slate-700')}>
                          {level.label}
                        </span>
                        <span className="block text-[11px] leading-tight text-slate-400">{level.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <Button variant="outline" onClick={onDone} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={isLoading}>
            Save privacy settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
