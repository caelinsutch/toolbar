import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutShift, LayoutShiftSource } from '../types';
import { getElementPath } from '../utils/element-identification';

interface LayoutShiftAttribution {
  node: Node | null;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: LayoutShiftAttribution[];
}

function getElementSelector(node: Node | null): string | undefined {
  if (!node || !(node instanceof HTMLElement)) return undefined;
  return getElementPath(node);
}

function generateShiftDescription(sources: LayoutShiftSource[]): string {
  if (sources.length === 0) return 'Unknown shift';

  const descriptions = sources.map((source) => {
    const selector = source.nodeSelector || 'element';
    const deltaX = source.currentRect.x - source.previousRect.x;
    const deltaY = source.currentRect.y - source.previousRect.y;

    const movements: string[] = [];
    if (Math.abs(deltaX) > 1) {
      movements.push(`${deltaX > 0 ? 'right' : 'left'} ${Math.abs(Math.round(deltaX))}px`);
    }
    if (Math.abs(deltaY) > 1) {
      movements.push(`${deltaY > 0 ? 'down' : 'up'} ${Math.abs(Math.round(deltaY))}px`);
    }

    if (movements.length === 0) {
      const widthChange = source.currentRect.width - source.previousRect.width;
      const heightChange = source.currentRect.height - source.previousRect.height;
      if (Math.abs(widthChange) > 1 || Math.abs(heightChange) > 1) {
        return `${selector} resized`;
      }
      return `${selector} shifted`;
    }

    return `${selector} moved ${movements.join(' and ')}`;
  });

  return descriptions.slice(0, 2).join(', ');
}

export type ClsRating = 'good' | 'needs-improvement' | 'poor';

export function getClsRating(score: number): ClsRating {
  if (score < 0.1) return 'good';
  if (score < 0.25) return 'needs-improvement';
  return 'poor';
}

interface UseLayoutShiftDetectionOptions {
  enabled: boolean;
  filterThreshold?: number;
}

interface UseLayoutShiftDetectionResult {
  shifts: LayoutShift[];
  cumulativeCls: number;
  clsRating: ClsRating;
  clearShifts: () => void;
  replayShift: (shift: LayoutShift) => void;
  isReplaying: boolean;
  isSupported: boolean;
}

function checkLayoutShiftSupport(): boolean {
  if (typeof PerformanceObserver === 'undefined') return false;
  try {
    return PerformanceObserver.supportedEntryTypes.includes('layout-shift');
  } catch {
    return false;
  }
}

export function useLayoutShiftDetection({
  enabled,
  filterThreshold = 0.01,
}: UseLayoutShiftDetectionOptions): UseLayoutShiftDetectionResult {
  const [shifts, setShifts] = useState<LayoutShift[]>([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const replayCleanupRef = useRef<(() => void) | null>(null);
  const [isSupported] = useState(() => checkLayoutShiftSupport());

  const cumulativeCls = shifts.reduce((sum, shift) => sum + shift.value, 0);
  const clsRating = getClsRating(cumulativeCls);

  useEffect(() => {
    if (!enabled || !isSupported) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as LayoutShiftEntry[]) {
        // Skip shifts caused by user input
        if (entry.hadRecentInput) continue;

        // Skip very small shifts
        if (entry.value < filterThreshold) continue;

        const sources: LayoutShiftSource[] = [];

        if (entry.sources) {
          for (const source of entry.sources) {
            const node = source.node as Element | null;

            // Check for ignore attribute
            if (node instanceof HTMLElement) {
              if (node.hasAttribute('data-toolbar-ignore-shift')) continue;
              if (node.closest('[data-toolbar-ignore-shift]')) continue;
              if (node.closest('[data-feedback-toolbar]')) continue;
            }

            sources.push({
              node,
              nodeSelector: getElementSelector(node),
              previousRect: {
                x: source.previousRect.x,
                y: source.previousRect.y,
                width: source.previousRect.width,
                height: source.previousRect.height,
              },
              currentRect: {
                x: source.currentRect.x,
                y: source.currentRect.y,
                width: source.currentRect.width,
                height: source.currentRect.height,
              },
            });
          }
        }

        // Skip if all sources were filtered out
        if (sources.length === 0) continue;

        const shift: LayoutShift = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          value: entry.value,
          timestamp: performance.now(),
          hadRecentInput: entry.hadRecentInput,
          sources,
          description: generateShiftDescription(sources),
          scrollY: window.scrollY,
        };

        setShifts((prev) => [...prev, shift]);
      }
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch {
      return;
    }

    return () => observer.disconnect();
  }, [enabled, filterThreshold, isSupported]);

  const clearShifts = useCallback(() => {
    setShifts([]);
  }, []);

  const replayShift = useCallback((shift: LayoutShift) => {
    // Cleanup any existing replay
    if (replayCleanupRef.current) {
      replayCleanupRef.current();
    }

    setIsReplaying(true);

    const elements: HTMLElement[] = [];
    // Convert from viewport coords at capture time to current viewport coords
    const scrollOffset = shift.scrollY - window.scrollY;

    for (const source of shift.sources) {
      const prevTop = source.previousRect.y + scrollOffset;
      const currTop = source.currentRect.y + scrollOffset;

      // Create ghost element at previous position
      const ghost = document.createElement('div');
      ghost.className = 'toolbar-shift-ghost';
      ghost.style.cssText = `
        position: fixed;
        left: ${source.previousRect.x}px;
        top: ${prevTop}px;
        width: ${source.previousRect.width}px;
        height: ${source.previousRect.height}px;
        border: 2px dashed rgba(255, 152, 0, 0.8);
        background: rgba(255, 152, 0, 0.1);
        border-radius: 4px;
        pointer-events: none;
        z-index: 99999;
        transition: all 0.5s ease-in-out;
      `;
      document.body.appendChild(ghost);
      elements.push(ghost);

      // Create current position highlight
      const current = document.createElement('div');
      current.className = 'toolbar-shift-current';
      current.style.cssText = `
        position: fixed;
        left: ${source.currentRect.x}px;
        top: ${currTop}px;
        width: ${source.currentRect.width}px;
        height: ${source.currentRect.height}px;
        border: 2px solid rgba(255, 152, 0, 0.9);
        background: rgba(255, 152, 0, 0.15);
        border-radius: 4px;
        pointer-events: none;
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      `;
      document.body.appendChild(current);
      elements.push(current);

      // Animate ghost to current position
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ghost.style.left = `${source.currentRect.x}px`;
          ghost.style.top = `${currTop}px`;
          ghost.style.width = `${source.currentRect.width}px`;
          ghost.style.height = `${source.currentRect.height}px`;
          current.style.opacity = '1';
        });
      });
    }

    const cleanup = () => {
      for (const el of elements) {
        el.remove();
      }
      setIsReplaying(false);
      replayCleanupRef.current = null;
    };

    replayCleanupRef.current = cleanup;

    // Auto cleanup after animation
    setTimeout(cleanup, 1500);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (replayCleanupRef.current) {
        replayCleanupRef.current();
      }
    };
  }, []);

  return {
    shifts,
    cumulativeCls,
    clsRating,
    clearShifts,
    replayShift,
    isReplaying,
    isSupported,
  };
}
