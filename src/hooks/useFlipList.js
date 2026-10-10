import { useCallback, useEffect, useRef } from 'react';

/**
 * FLIP reorder for a live-sorted clinical list.
 *
 * The triage queue re-sorts itself whenever acuity or arrival time changes, including from
 * WebSocket pushes. Without this, the row a nurse was reading teleports to a new position and the
 * eye loses it, so the reordering itself becomes invisible. FLIP measures every row before the
 * browser paints the new order, then inverts the delta so each row appears to travel from its old
 * position to its new one. The change then reads as movement rather than a repaint.
 *
 * Each row is moved with a transform only, so the animation stays on the compositor and cannot be
 * mistaken for the cc-attention ring, which marks a value change rather than a reorder.
 *
 * Honours prefers-reduced-motion by measuring nothing, so the list simply snaps to its new order.
 */
const useFlipList = (items, idOf) => {
  const positions = useRef(new Map());
  const nodes = useRef(new Map());
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      positions.current.clear();
      return;
    }

    const next = new Map();
    for (const item of items) {
      const id = idOf(item);
      const node = nodes.current.get(id);
      if (!node?.isConnected) continue;

      const top = node.getBoundingClientRect().top;
      next.set(id, top);

      const previous = positions.current.get(id);
      if (previous === undefined || Math.abs(top - previous) < 1) continue;

      node.animate(
        [{ transform: `translateY(${previous - top}px)` }, { transform: 'translateY(0)' }],
        { duration: 420, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
      );
    }
    positions.current = next;
  }, [items, idOf]);

  return useCallback((id) => (node) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  }, []);
};

export default useFlipList;