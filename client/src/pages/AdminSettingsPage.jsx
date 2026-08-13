import { useState } from 'react';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '../services/operationsApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { Switch } from '../components/ui/Switch.jsx';
import { TagInput } from '../components/ui/TagInput.jsx';

/**
 * System settings (spec §20): registration policies, moderation toggles,
 * and admin-extensible resource categories.
 */
export function AdminSettingsPage() {
  useDocumentTitle('Settings');
  const { data, isLoading, isError, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const [draft, setDraft] = useState(null); // { key: value }
  const current = draft ?? data?.data ?? {};

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isLoading || !current || Object.keys(current).length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const set = (key, value) => setDraft({ ...current, [key]: value });

  const toggle = (key) => set(key, !current[key]);

  const save = async () => {
    try {
      await updateSettings(draft).unwrap();
      toast.success('Settings saved');
      setDraft(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not save settings.'));
    }
  };

  const booleanSettings = [
    { key: 'allowStudentRegistration', label: 'Allow student registration', description: 'New students can create accounts.' },
    { key: 'allowFacultyRegistration', label: 'Allow faculty registration', description: 'New faculty can register (pending approval).' },
    { key: 'allowAlumniRegistration', label: 'Allow alumni registration', description: 'New alumni can register (pending approval).' },
    { key: 'studentPostingAllowed', label: 'Allow students to post', description: 'Students can publish community posts.' },
    { key: 'requireResourceApproval', label: 'Require resource approval', description: 'Uploaded resources need admin approval.' },
    { key: 'requireJobApproval', label: 'Require job approval', description: 'Job postings need admin approval.' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Settings className="size-5 text-primary-600" aria-hidden="true" />
          System settings
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Platform-wide configuration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registration & posting policies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {booleanSettings.map((setting) => (
            <div key={setting.key} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{setting.label}</p>
                <p className="text-xs text-slate-400">{setting.description}</p>
              </div>
              <Switch checked={Boolean(current[setting.key])} onChange={() => toggle(setting.key)} label={setting.label} className="[&>span:last-child]:sr-only" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Resource categories <Badge tone="accent" size="sm">admin-extensible</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TagInput
            label="Categories"
            value={current.resourceCategories ?? []}
            onChange={(value) => set('resourceCategories', value)}
            placeholder="Add a category…"
            hint="Add, remove, or rename categories — they appear in the resource library instantly."
          />
        </CardContent>
      </Card>

      {draft && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-800">Unsaved changes — apply them to take effect.</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setDraft(null)}>Discard</Button>
            <Button size="sm" onClick={save} loading={saving}>Save changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
