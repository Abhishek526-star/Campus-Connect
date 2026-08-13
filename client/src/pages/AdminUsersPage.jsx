import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Ban, CheckCircle2, Pencil, Trash2, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import {
  useGetAdminUsersQuery,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
} from '../services/adminApi.js';
import { getErrorMessage } from '../constants/index.js';
import { Avatar } from '../components/ui/Avatar.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { ErrorState } from '../components/ui/ErrorState.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Pagination } from '../components/ui/Pagination.jsx';
import { SearchInput } from '../components/ui/SearchInput.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Tabs } from '../components/ui/Tabs.jsx';
import { ListSkeleton } from '../components/ui/Skeleton.jsx';
import { RoleBadge } from '../components/common/RoleBadge.jsx';
import { formatDate } from '../utils/format.js';

/**
 * Admin user management (spec §20): role tabs, search, edit modal
 * (role/verify/approve/activate/badges), disable, soft delete.
 */
export function AdminUsersPage() {
  useDocumentTitle('User management');
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(() => (searchParams.get('status') === 'pending' ? 'pending' : 'all'));
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading, isFetching, isError, refetch } = useGetAdminUsersQuery(
    useMemo(
      () => ({
        search: search || undefined,
        role: tab === 'all' || tab === 'pending' ? undefined : tab,
        status: tab === 'pending' ? 'pending' : undefined,
        page,
        limit: 12,
      }),
      [tab, search, page],
    ),
  );
  const [updateUser, { isLoading: updating }] = useUpdateAdminUserMutation();
  const [deleteUser] = useDeleteAdminUserMutation();

  const items = data?.data?.items ?? [];
  const meta = data?.data?.meta;

  const openEdit = (user) => {
    setEditing(user);
    setEditForm({
      role: user.role,
      isVerified: user.isVerified,
      isApproved: user.isApproved,
      isActive: user.isActive,
      badges: user.badges ?? [],
      name: user.name,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      await updateUser({ id: editing._id, body: editForm }).unwrap();
      toast.success('User updated');
      setEditing(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not update the user.'));
    }
  };

  const quickAction = async (id, body, message) => {
    try {
      await updateUser({ id, body }).unwrap();
      toast.success(message);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Action failed.'));
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteUser(confirmDelete).unwrap();
      toast.success('User deleted (soft)');
      setConfirmDelete(null);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not delete the user.'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Users className="size-5 text-primary-600" aria-hidden="true" />
          User management
        </h2>
        <p className="mt-0.5 text-sm text-slate-500">Approve registrations, verify, disable, and manage roles.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={tab}
          onChange={(value) => { setTab(value); setPage(1); }}
          tabs={[
            { value: 'all', label: 'All' },
            { value: 'student', label: 'Students' },
            { value: 'faculty', label: 'Faculty' },
            { value: 'alumni', label: 'Alumni' },
            { value: 'pending', label: 'Pending approval' },
          ]}
        />
        <SearchInput value={search} onChange={(value) => { setSearch(value); setPage(1); }} placeholder="Search by name…" className="w-56" />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isLoading ? (
        <Card><CardContent><ListSkeleton rows={5} /></CardContent></Card>
      ) : items.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting the search or filters." />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3 font-semibold">User</th>
                      <th className="px-4 py-3 font-semibold">Role</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Joined</th>
                      <th className="px-4 py-3 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {items.map((user) => (
                      <tr key={user._id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={user.avatar?.url} name={user.name} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">{user.name}</p>
                              <p className="truncate text-xs text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} size="sm" />
                          {user.profile?.designation && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{user.profile.designation}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            <Badge tone={user.isVerified ? 'success' : 'warning'} size="sm">{user.isVerified ? 'Verified' : 'Unverified'}</Badge>
                            <Badge tone={user.isApproved ? 'success' : 'danger'} size="sm">{user.isApproved ? 'Approved' : 'Pending'}</Badge>
                            <Badge tone={user.isActive ? 'primary' : 'slate'} size="sm">{user.isActive ? 'Active' : 'Disabled'}</Badge>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {tab === 'pending' && !user.isApproved && (
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => quickAction(user._id, { isApproved: true }, `${user.name} approved`)}
                              >
                                <CheckCircle2 className="size-3.5" aria-hidden="true" /> Approve
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => openEdit(user)}>
                              <Pencil className="size-3.5" aria-hidden="true" />
                            </Button>
                            {user.isActive ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-amber-600 hover:bg-amber-50"
                                onClick={() => quickAction(user._id, { isActive: false }, 'User disabled')}
                                title="Disable account"
                              >
                                <Ban className="size-3.5" aria-hidden="true" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-accent-600 hover:bg-accent-50"
                                onClick={() => quickAction(user._id, { isActive: true }, 'User re-enabled')}
                                title="Enable account"
                              >
                                <UserCheck className="size-3.5" aria-hidden="true" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => setConfirmDelete(user._id)}
                              title="Delete user"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-col items-center gap-2">
            {isFetching && <p className="text-xs text-slate-400">Updating…</p>}
            <Pagination page={meta?.page ?? 1} totalPages={meta?.totalPages ?? 1} onChange={setPage} />
          </div>
        </>
      )}

      {/* Edit modal */}
      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`Edit: ${editing?.name ?? ''}`} size="md">
        {editing && (
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              value={editForm.name ?? ''}
              onChange={(event) => setEditForm({ ...editForm, name: event.target.value })}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25"
            />
            <Select
              label="Role"
              value={editForm.role}
              onChange={(event) => setEditForm({ ...editForm, role: event.target.value })}
              options={[
                { value: 'student', label: 'Student' },
                { value: 'faculty', label: 'Faculty' },
                { value: 'alumni', label: 'Alumni' },
                { value: 'admin', label: 'Admin' },
              ]}
            />
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editForm.isVerified ?? false} onChange={(event) => setEditForm({ ...editForm, isVerified: event.target.checked })} className="size-4 accent-primary-600" />
                Verified
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editForm.isApproved ?? false} onChange={(event) => setEditForm({ ...editForm, isApproved: event.target.checked })} className="size-4 accent-primary-600" />
                Approved
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={editForm.isActive ?? false} onChange={(event) => setEditForm({ ...editForm, isActive: event.target.checked })} className="size-4 accent-primary-600" />
                Active
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setEditing(null)} disabled={updating}>Cancel</Button>
              <Button onClick={handleSave} loading={updating}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete this user?"
        description="The account is deactivated and anonymized. This cannot be undone."
        confirmLabel="Delete user"
      />
    </div>
  );
}
