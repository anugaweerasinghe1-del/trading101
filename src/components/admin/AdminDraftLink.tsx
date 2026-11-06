import { Link, type LinkProps } from 'react-router-dom';

/** Router links bypass beforeunload. Protect edits when replacing this desk;
 * opening a separate tab leaves the current editor intact. */
export function AdminDraftLink({ dirty, onClick, ...props }: LinkProps & { dirty: boolean }) {
  return <Link {...props} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || !dirty || event.button !== 0 || event.metaKey ||
        event.ctrlKey || event.shiftKey || event.altKey ||
        (event.currentTarget.target && event.currentTarget.target !== '_self')) return;
    if (!window.confirm('Discard unsaved edits and leave this desk?')) event.preventDefault();
  }} />;
}
