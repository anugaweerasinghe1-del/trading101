import { useEffect, useRef } from 'react';
import { useBlocker } from 'react-router-dom';

/** Native beforeunload does not cover SPA links or Back/Forward navigation. */
export function useAdminDraftNavigation(dirty: boolean) {
  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty &&
    (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search));
  const handling = useRef(false);
  useEffect(() => {
    if (blocker.state !== 'blocked') { handling.current = false; return; }
    if (handling.current) return;
    handling.current = true;
    if (window.confirm('Discard unsaved edits and leave this desk?')) blocker.proceed();
    else blocker.reset();
  }, [blocker]);
}
