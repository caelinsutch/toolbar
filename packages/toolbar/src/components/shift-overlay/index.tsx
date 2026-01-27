import { createPortal } from 'react-dom';
import type { LayoutShift } from '../../types';
import styles from './shift-overlay.module.scss';

interface ShiftOverlayProps {
  shift: LayoutShift;
  scrollY: number;
}

export function ShiftOverlay({ shift, scrollY }: ShiftOverlayProps) {
  // Convert from viewport coords at capture time to current viewport coords
  const scrollOffset = shift.scrollY - scrollY;

  return createPortal(
    <div className={styles.shiftOverlay}>
      {shift.sources.map((source, idx) => {
        // Try to get current rect from the actual element if it still exists
        let currentRect = source.currentRect;
        let useScrollOffset = true;

        if (source.node && document.contains(source.node)) {
          const liveRect = source.node.getBoundingClientRect();
          currentRect = {
            x: liveRect.x,
            y: liveRect.y,
            width: liveRect.width,
            height: liveRect.height,
          };
          useScrollOffset = false;
        }

        return (
          <div key={`${shift.id}-${idx}`}>
            <div
              className={styles.shiftPreviousRect}
              style={{
                left: source.previousRect.x,
                top: source.previousRect.y + scrollOffset,
                width: source.previousRect.width,
                height: source.previousRect.height,
              }}
            />
            <div
              className={`${styles.shiftCurrentRect} ${styles.enter}`}
              style={{
                left: currentRect.x,
                top: useScrollOffset ? currentRect.y + scrollOffset : currentRect.y,
                width: currentRect.width,
                height: currentRect.height,
              }}
            />
          </div>
        );
      })}
    </div>,
    document.body
  );
}
