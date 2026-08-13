import { useState } from 'react';
import { toast } from 'sonner';
import { Check, UserCheck, UserMinus, UserPlus } from 'lucide-react';
import {
  useSendConnectionRequestMutation,
  useAcceptConnectionRequestMutation,
  useRejectConnectionRequestMutation,
  useCancelConnectionRequestMutation,
  useRemoveConnectionMutation,
} from '../../../services/peopleApi.js';
import { getErrorMessage } from '../../../constants/index.js';
import { Button } from '../../ui/Button.jsx';
import { ConfirmDialog } from '../../ui/ConfirmDialog.jsx';

/**
 * Connection state-machine button (spec §6):
 * none → Connect · outgoing → Pending (cancel) · incoming → Accept/Reject ·
 * accepted → Connected (remove with confirmation).
 */
export function ConnectionButton({ connection, userId, size = 'sm', showLabel = true }) {
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [sendRequest, { isLoading: sending }] = useSendConnectionRequestMutation();
  const [accept, { isLoading: accepting }] = useAcceptConnectionRequestMutation();
  const [reject, { isLoading: rejecting }] = useRejectConnectionRequestMutation();
  const [cancel, { isLoading: cancelling }] = useCancelConnectionRequestMutation();
  const [remove, { isLoading: removing }] = useRemoveConnectionMutation();

  const status = connection?.status ?? 'none';
  const direction = connection?.direction;

  const handle = async (action, payload) => {
    try {
      await action(payload).unwrap();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Action failed. Please try again.'));
    }
  };

  if (status === 'accepted') {
    return (
      <>
        <Button
          variant="outline"
          size={size}
          onClick={() => setConfirmRemove(true)}
          loading={removing}
          title="Remove connection"
        >
          <UserCheck className="size-3.5" aria-hidden="true" /> {showLabel ? 'Connected' : ''}
        </Button>
        <ConfirmDialog
          open={confirmRemove}
          onClose={() => setConfirmRemove(false)}
          onConfirm={() => handle(remove, connection.id)}
          title="Remove connection?"
          description="You will no longer be connected with this person."
          confirmLabel="Remove"
        />
      </>
    );
  }

  if (status === 'pending' && direction === 'incoming') {
    return (
      <div className="flex gap-2">
        <Button variant="success" size={size} loading={accepting} onClick={() => handle(accept, connection.id)}>
          <Check className="size-3.5" aria-hidden="true" /> Accept
        </Button>
        <Button variant="outline" size={size} loading={rejecting} onClick={() => handle(reject, connection.id)}>
          Reject
        </Button>
      </div>
    );
  }

  if (status === 'pending' && direction === 'outgoing') {
    return (
      <Button variant="secondary" size={size} loading={cancelling} onClick={() => handle(cancel, connection.id)}>
        <UserMinus className="size-3.5" aria-hidden="true" /> {showLabel ? 'Pending' : ''}
      </Button>
    );
  }

  return (
    <Button variant="primary" size={size} loading={sending} onClick={() => handle(sendRequest, { recipientId: userId })}>
      <UserPlus className="size-3.5" aria-hidden="true" /> {showLabel ? 'Connect' : ''}
    </Button>
  );
}
