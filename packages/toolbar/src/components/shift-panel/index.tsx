import type { ClsRating } from '../../hooks/use-layout-shift-detection';
import type { LayoutShift } from '../../types';
import styles from './shift-panel.module.scss';

interface ShiftPanelProps {
  shifts: LayoutShift[];
  filteredShifts: LayoutShift[];
  cumulativeCls: number;
  clsRating: ClsRating;
  filterThreshold: number;
  onFilterChange: (threshold: number) => void;
  onClearShifts: () => void;
  onReplayShift: (shift: LayoutShift) => void;
  onHoverShift: (shiftId: string | null) => void;
  style?: React.CSSProperties;
}

function getClsRatingClass(rating: ClsRating): string {
  switch (rating) {
    case 'good':
      return styles.good ?? '';
    case 'needs-improvement':
      return styles.needsImprovement ?? '';
    case 'poor':
      return styles.poor ?? '';
  }
}

function formatTime(timestamp: number): string {
  const seconds = Math.floor(timestamp / 1000);
  const ms = Math.floor(timestamp % 1000);
  return `${seconds}.${ms.toString().padStart(3, '0')}s`;
}

export function ShiftPanel({
  shifts,
  filteredShifts,
  cumulativeCls,
  clsRating,
  filterThreshold,
  onFilterChange,
  onClearShifts,
  onReplayShift,
  onHoverShift,
  style,
}: ShiftPanelProps) {
  return (
    <div className={styles.shiftPanel} style={style}>
      <div className={styles.shiftPanelHeader}>
        <span className={styles.shiftPanelTitle}>Layout Shifts</span>
        <span className={`${styles.shiftPanelScore} ${getClsRatingClass(clsRating)}`}>
          CLS: {cumulativeCls.toFixed(3)}
        </span>
      </div>
      <div className={styles.shiftPanelControls}>
        <select
          className={styles.shiftFilterSelect}
          value={filterThreshold}
          onChange={(e) => onFilterChange(Number(e.target.value))}
        >
          <option value={0.001}>Show all shifts</option>
          <option value={0.01}>Minor+ (&gt; 0.01)</option>
          <option value={0.1}>Moderate+ (&gt; 0.1)</option>
          <option value={0.25}>Severe (&gt; 0.25)</option>
        </select>
        <button
          type="button"
          className={styles.shiftClearButton}
          onClick={onClearShifts}
          disabled={shifts.length === 0}
        >
          Clear
        </button>
      </div>
      <div className={styles.shiftList}>
        {filteredShifts.length === 0 ? (
          <div className={styles.shiftListEmpty}>
            {shifts.length === 0
              ? 'No layout shifts detected yet'
              : 'No shifts match the current filter'}
          </div>
        ) : (
          filteredShifts.map((shift) => (
            <div
              key={shift.id}
              className={styles.shiftItem}
              onClick={() => onReplayShift(shift)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onReplayShift(shift);
                }
              }}
              onMouseEnter={() => onHoverShift(shift.id)}
              onMouseLeave={() => onHoverShift(null)}
              onFocus={() => onHoverShift(shift.id)}
              onBlur={() => onHoverShift(null)}
              role="button"
              tabIndex={0}
            >
              <span className={styles.shiftItemValue}>{shift.value.toFixed(3)}</span>
              <div className={styles.shiftItemContent}>
                <div className={styles.shiftItemDescription}>{shift.description}</div>
                <div className={styles.shiftItemTime}>{formatTime(shift.timestamp)}</div>
              </div>
              <button
                type="button"
                className={styles.shiftItemReplay}
                onClick={(e) => {
                  e.stopPropagation();
                  onReplayShift(shift);
                }}
                aria-label="Replay shift"
              >
                <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path d="M4 4L12 10L4 16V4Z" fill="currentColor" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
