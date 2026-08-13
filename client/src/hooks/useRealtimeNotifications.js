import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * Returns an incrementing counter each time a NEW real-time notification
 * arrives via the socket (watches the notificationSlice latest list).
 * Pages use it to trigger a refetch when the counter changes.
 */
export function useRealtimeNotificationCount() {
  const latest = useSelector((state) => state.notifications.latest);
  const lastIdRef = useRef(latest[0]?._id ?? null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const first = latest[0]?._id ?? null;
    if (first && first !== lastIdRef.current) {
      lastIdRef.current = first;
      setCount((value) => value + 1);
    }
  }, [latest]);

  return count;
}
