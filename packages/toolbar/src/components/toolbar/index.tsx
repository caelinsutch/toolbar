import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { getElement, useAccessibilityAudit } from '../../hooks/use-accessibility-audit';
import { type ClsRating, useLayoutShiftDetection } from '../../hooks/use-layout-shift-detection';
import { useScreenReaderPreview } from '../../hooks/use-screen-reader-preview';
import type { Annotation } from '../../types';
import {
  getElementClasses,
  getNearbyText,
  identifyElement,
} from '../../utils/element-identification';
import { AccessibilityPanel, accessibilityPanelStyles } from '../accessibility-panel';
import { AnnotationPopup, type AnnotationPopupHandle } from '../annotation-popup';
import { ScreenReaderPreview } from '../screen-reader-preview';
import styles from './toolbar.module.scss';

let hasPlayedEntranceAnimation = false;

type HoverInfo = {
  element: string;
  elementPath: string;
  rect: DOMRect | null;
  reactComponent: string | null;
  reactHierarchy: string[];
};

type PendingAnnotation = {
  x: number;
  y: number;
  clientY: number;
  element: string;
  elementPath: string;
  selectedText?: string;
  boundingBox?: { x: number; y: number; width: number; height: number };
  nearbyText?: string;
  cssClasses?: string;
  isFixed?: boolean;
  reactComponent?: string | null;
  reactHierarchy?: string[];
};

function isElementFixed(element: HTMLElement): boolean {
  let current: HTMLElement | null = element;
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current);
    if (style.position === 'fixed' || style.position === 'sticky') {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

export default function Toolbar() {
  const [isActive, setIsActive] = useState(false);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [markersVisible, setMarkersVisible] = useState(false);
  const [markersExiting, setMarkersExiting] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null);
  const [pendingExiting, setPendingExiting] = useState(false);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
  const [animatedMarkers, setAnimatedMarkers] = useState<Set<string>>(new Set());
  const [exitingMarkers, setExitingMarkers] = useState<Set<string>>(new Set());
  const [isClearing, setIsClearing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false);
  const [animationsPaused, setAnimationsPaused] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{
    x: number;
    y: number;
    toolbarX: number;
    toolbarY: number;
  } | null>(null);
  const [activeMode, setActiveMode] = useState<'select' | 'cls' | 'a11y' | 'screenReader' | null>(
    null
  );
  const [clsFilterThreshold, setClsFilterThreshold] = useState(0.01);
  const [hoveredShiftId, setHoveredShiftId] = useState<string | null>(null);
  const didDragRef = useRef(false);
  const popupRef = useRef<AnnotationPopupHandle>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    shifts,
    cumulativeCls,
    clsRating,
    clearShifts,
    replayShift,
    isSupported: clsSupported,
  } = useLayoutShiftDetection({
    enabled: activeMode === 'cls',
    filterThreshold: clsFilterThreshold,
  });

  const {
    issues: a11yIssues,
    summary: a11ySummary,
    isRunning: a11yIsRunning,
    runAudit: a11yRunAudit,
    clearIssues: a11yClearIssues,
    highlightedIssueId,
    highlightElement: a11yHighlightElement,
    clearHighlight: a11yClearHighlight,
    scrollToAndLogElement: a11yScrollToElement,
    isRecording: a11yIsRecording,
    recordedStates: a11yRecordedStates,
    startRecording: a11yStartRecording,
    stopRecording: a11yStopRecording,
    captureCurrentState: a11yCaptureState,
    activeFilter: a11yActiveFilter,
    setActiveFilter: a11ySetActiveFilter,
  } = useAccessibilityAudit({
    enabled: activeMode === 'a11y',
  });

  const [srHighlightedElement, setSrHighlightedElement] = useState<Element | null>(null);
  const {
    nodes: srNodes,
    isGenerating: srIsGenerating,
    generatePreview: srGeneratePreview,
    clearPreview: srClearPreview,
  } = useScreenReaderPreview();

  const filteredShifts = shifts.filter((shift) => shift.value >= clsFilterThreshold);

  // Derived states for convenience
  const isSelecting = activeMode === 'select';
  const clsDetectionActive = activeMode === 'cls';
  const a11yAuditActive = activeMode === 'a11y';
  const screenReaderActive = activeMode === 'screenReader';

  useEffect(() => {
    if (!hasPlayedEntranceAnimation) {
      setShowEntranceAnimation(true);
      hasPlayedEntranceAnimation = true;
      setTimeout(() => setShowEntranceAnimation(false), 750);
    }
    setScrollY(window.scrollY);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {}, 150);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const shouldShowMarkers = isActive && showMarkers;
  useEffect(() => {
    if (shouldShowMarkers) {
      setMarkersExiting(false);
      setMarkersVisible(true);
      setAnimatedMarkers(new Set());
      const timer = setTimeout(() => {
        setAnimatedMarkers((prev) => {
          const newSet = new Set(prev);
          for (const a of annotations) {
            newSet.add(a.id);
          }
          return newSet;
        });
      }, 350);
      return () => clearTimeout(timer);
    } else if (markersVisible) {
      setMarkersExiting(true);
      const timer = setTimeout(() => {
        setMarkersVisible(false);
        setMarkersExiting(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [shouldShowMarkers, annotations, markersVisible]);

  useEffect(() => {
    if (!isActive) {
      setPendingAnnotation(null);
      setHoverInfo(null);
      setActiveMode(null);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isSelecting) return;

    const style = document.createElement('style');
    style.id = 'toolbar-cursor-styles';
    style.textContent = `
      body * { cursor: crosshair !important; }
      body p, body span, body h1, body h2, body h3, body h4, body h5, body h6,
      body li, body td, body th, body label, body a, body pre, body code,
      body p *, body span *, body h1 *, body h2 *, body h3 *, body h4 *,
      body h5 *, body h6 *, body li *, body a *, body label *, body pre *, body code * {
        cursor: text !important;
      }
      [data-feedback-toolbar], [data-feedback-toolbar] * { cursor: default !important; }
      [data-annotation-popup], [data-annotation-popup] * { cursor: auto !important; }
      [data-annotation-popup] button { cursor: pointer !important; }
      [data-annotation-popup] button:disabled { cursor: not-allowed !important; }
      [data-annotation-popup] textarea { cursor: text !important; }
      [data-annotation-marker], [data-annotation-marker] * { cursor: pointer !important; }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById('toolbar-cursor-styles');
      if (existing) existing.remove();
    };
  }, [isSelecting]);

  useEffect(() => {
    if (!isSelecting || pendingAnnotation) return;

    const handleMouseMove = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-feedback-toolbar]')) {
        setHoverInfo(null);
        return;
      }
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!elementUnder || elementUnder.closest('[data-feedback-toolbar]')) {
        setHoverInfo(null);
        return;
      }
      const { name, path, reactComponent, reactHierarchy } = identifyElement(elementUnder);
      const rect = elementUnder.getBoundingClientRect();
      setHoverInfo({ element: name, elementPath: path, rect, reactComponent, reactHierarchy });
      setHoverPosition({ x: e.clientX, y: e.clientY });
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isSelecting, pendingAnnotation]);

  useEffect(() => {
    if (!isSelecting) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-feedback-toolbar]')) return;
      if (target.closest('[data-annotation-popup]')) return;
      if (target.closest('[data-annotation-marker]')) return;

      if (pendingAnnotation) {
        e.preventDefault();
        popupRef.current?.shake();
        return;
      }

      e.preventDefault();
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
      if (!elementUnder) return;

      const { name, path, reactComponent, reactHierarchy } = identifyElement(elementUnder);
      const rect = elementUnder.getBoundingClientRect();
      const x = (e.clientX / window.innerWidth) * 100;
      const isFixed = isElementFixed(elementUnder);
      const y = isFixed ? e.clientY : e.clientY + window.scrollY;

      const selection = window.getSelection();
      let selectedText: string | undefined;
      if (selection && selection.toString().trim().length > 0) {
        selectedText = selection.toString().trim().slice(0, 500);
      }

      setPendingAnnotation({
        x,
        y,
        clientY: e.clientY,
        element: name,
        elementPath: path,
        selectedText,
        boundingBox: {
          x: rect.left,
          y: isFixed ? rect.top : rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
        },
        nearbyText: getNearbyText(elementUnder),
        cssClasses: getElementClasses(elementUnder),
        isFixed,
        reactComponent,
        reactHierarchy,
      });
      setHoverInfo(null);
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [isSelecting, pendingAnnotation]);

  const addAnnotation = useCallback(
    (comment: string) => {
      if (!pendingAnnotation) return;
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        x: pendingAnnotation.x,
        y: pendingAnnotation.y,
        comment,
        element: pendingAnnotation.element,
        elementPath: pendingAnnotation.elementPath,
        timestamp: Date.now(),
        selectedText: pendingAnnotation.selectedText,
        boundingBox: pendingAnnotation.boundingBox,
        nearbyText: pendingAnnotation.nearbyText,
        cssClasses: pendingAnnotation.cssClasses,
        isFixed: pendingAnnotation.isFixed,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setTimeout(() => {
        setAnimatedMarkers((prev) => new Set(prev).add(newAnnotation.id));
      }, 250);
      setPendingExiting(true);
      setTimeout(() => {
        setPendingAnnotation(null);
        setPendingExiting(false);
      }, 150);
      window.getSelection()?.removeAllRanges();
    },
    [pendingAnnotation]
  );

  const cancelAnnotation = useCallback(() => {
    setPendingExiting(true);
    setTimeout(() => {
      setPendingAnnotation(null);
      setPendingExiting(false);
    }, 150);
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setExitingMarkers((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id));
      setExitingMarkers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 150);
  }, []);

  const clearAll = useCallback(() => {
    if (annotations.length === 0) return;
    setIsClearing(true);
    const totalTime = annotations.length * 30 + 200;
    setTimeout(() => {
      setAnnotations([]);
      setAnimatedMarkers(new Set());
      setIsClearing(false);
    }, totalTime);
  }, [annotations.length]);

  const handleToolbarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return;
      const toolbarParent = (e.currentTarget as HTMLElement).parentElement;
      if (!toolbarParent) return;
      const rect = toolbarParent.getBoundingClientRect();
      const currentX = toolbarPosition?.x ?? rect.left;
      const currentY = toolbarPosition?.y ?? rect.top;
      didDragRef.current = false;
      setDragStartPos({
        x: e.clientX,
        y: e.clientY,
        toolbarX: currentX,
        toolbarY: currentY,
      });
    },
    [toolbarPosition]
  );

  useEffect(() => {
    if (!dragStartPos) return;
    const DRAG_THRESHOLD = 10;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > DRAG_THRESHOLD) {
        if (!isDragging) {
          setIsDragging(true);
        }
        didDragRef.current = true;

        let newX = dragStartPos.toolbarX + deltaX;
        let newY = dragStartPos.toolbarY + deltaY;
        const padding = 20;
        const containerWidth = 257;
        const circleWidth = 44;
        const toolbarHeight = 44;
        if (isActive) {
          newX = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX));
        } else {
          const circleOffset = containerWidth - circleWidth;
          const minX = padding - circleOffset;
          const maxX = window.innerWidth - padding - circleOffset - circleWidth;
          newX = Math.max(minX, Math.min(maxX, newX));
        }
        newY = Math.max(padding, Math.min(window.innerHeight - toolbarHeight - padding, newY));
        setToolbarPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragStartPos(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragStartPos, isDragging, isActive]);

  const handleToggle = () => {
    if (didDragRef.current) return;
    setIsActive(!isActive);
  };

  const toggleSelecting = () => {
    setActiveMode(activeMode === 'select' ? null : 'select');
  };

  const toggleMarkers = () => {
    setShowMarkers(!showMarkers);
  };

  const toggleAnimations = () => {
    setAnimationsPaused(!animationsPaused);
  };

  const handleClsButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMode(activeMode === 'cls' ? null : 'cls');
  };

  const getClsRatingClass = (rating: ClsRating): string => {
    switch (rating) {
      case 'good':
        return styles.good ?? '';
      case 'needs-improvement':
        return styles.needsImprovement ?? '';
      case 'poor':
        return styles.poor ?? '';
    }
  };

  const formatTime = (timestamp: number): string => {
    const seconds = Math.floor(timestamp / 1000);
    const ms = Math.floor(timestamp % 1000);
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  };

  useEffect(() => {
    if (!animationsPaused) return;

    const style = document.createElement('style');
    style.id = 'toolbar-animation-pause';
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.001ms !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      const existing = document.getElementById('toolbar-animation-pause');
      if (existing) existing.remove();
    };
  }, [animationsPaused]);

  return (
    <>
      {isSelecting &&
        createPortal(
          <div className={styles.overlay}>
            {hoverInfo?.rect && (
              <>
                <div
                  className={`${styles.hoverHighlight} ${styles.enter}`}
                  style={{
                    left: hoverInfo.rect.left,
                    top: hoverInfo.rect.top,
                    width: hoverInfo.rect.width,
                    height: hoverInfo.rect.height,
                  }}
                />
                <div
                  className={`${styles.hoverTooltip} ${styles.enter}`}
                  style={{
                    left: hoverPosition.x,
                    top: hoverPosition.y + 20,
                  }}
                >
                  {hoverInfo.element}
                  {hoverInfo.reactComponent && (
                    <span className={styles.reactComponent}>
                      {' '}
                      &lt;{hoverInfo.reactComponent}&gt;
                    </span>
                  )}
                  {hoverInfo.reactHierarchy.length > 1 && (
                    <span className={styles.reactHierarchy}>
                      {' '}
                      in {hoverInfo.reactHierarchy.slice(1, 3).join(' → ')}
                    </span>
                  )}
                </div>
              </>
            )}

            {pendingAnnotation?.boundingBox && (
              <div
                className={`${styles.singleSelectOutline} ${pendingExiting ? styles.exit : styles.enter}`}
                style={{
                  left: pendingAnnotation.boundingBox.x,
                  top: pendingAnnotation.boundingBox.y - scrollY,
                  width: pendingAnnotation.boundingBox.width,
                  height: pendingAnnotation.boundingBox.height,
                }}
              />
            )}
          </div>,
          document.body
        )}

      {markersVisible &&
        createPortal(
          <div className={styles.markersLayer}>
            {annotations.map((annotation, index) => {
              const isEntering = !animatedMarkers.has(annotation.id) && !markersExiting;
              const isExiting = exitingMarkers.has(annotation.id) || markersExiting;
              const clearingDelay = isClearing ? index * 30 : 0;

              return (
                <button
                  key={annotation.id}
                  type="button"
                  className={`${styles.marker} ${isEntering ? styles.enter : ''} ${
                    isExiting ? styles.exit : ''
                  } ${isClearing ? styles.clearing : ''} ${
                    hoveredMarkerId === annotation.id ? styles.hovered : ''
                  } ${annotation.isFixed ? styles.fixed : ''}`}
                  style={{
                    left: `${annotation.x}%`,
                    top: annotation.isFixed ? annotation.y : annotation.y - scrollY,
                    animationDelay: isClearing ? `${clearingDelay}ms` : undefined,
                    background: hoveredMarkerId === annotation.id ? '#ff3b30' : undefined,
                  }}
                  data-annotation-marker
                  onMouseEnter={() => setHoveredMarkerId(annotation.id)}
                  onMouseLeave={() => setHoveredMarkerId(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAnnotation(annotation.id);
                  }}
                  aria-label={`Annotation ${index + 1}: ${annotation.comment}`}
                >
                  {index + 1}
                  {hoveredMarkerId === annotation.id && (
                    <div className={`${styles.markerTooltip} ${styles.enter}`}>
                      {annotation.selectedText && (
                        <span className={styles.markerQuote}>
                          &ldquo;{annotation.selectedText.slice(0, 40)}
                          {annotation.selectedText.length > 40 ? '...' : ''}&rdquo;
                        </span>
                      )}
                      <span className={styles.markerNote}>{annotation.comment}</span>
                      <span className={styles.markerHint}>Click to delete</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}

      {pendingAnnotation &&
        createPortal(
          <AnnotationPopup
            ref={popupRef}
            element={pendingAnnotation.element}
            selectedText={pendingAnnotation.selectedText}
            onSubmit={addAnnotation}
            onCancel={cancelAnnotation}
            isExiting={pendingExiting}
            style={{
              left: `${pendingAnnotation.x}%`,
              top:
                pendingAnnotation.clientY > window.innerHeight / 2
                  ? pendingAnnotation.clientY - 200
                  : pendingAnnotation.clientY + 30,
            }}
          />,
          document.body
        )}

      {clsDetectionActive &&
        isActive &&
        createPortal(
          <div
            className={styles.shiftPanel}
            style={{
              position: 'fixed',
              bottom: toolbarPosition
                ? `calc(100vh - ${toolbarPosition.y}px + 14px)`
                : 'calc(1.25rem + 44px + 14px)',
              right: toolbarPosition ? `calc(100vw - ${toolbarPosition.x}px - 257px)` : '1.25rem',
            }}
          >
            <div className={styles.shiftPanelHeader}>
              <span className={styles.shiftPanelTitle}>Layout Shifts</span>
              <span className={`${styles.shiftPanelScore} ${getClsRatingClass(clsRating)}`}>
                CLS: {cumulativeCls.toFixed(3)}
              </span>
            </div>
            <div className={styles.shiftPanelControls}>
              <select
                className={styles.shiftFilterSelect}
                value={clsFilterThreshold}
                onChange={(e) => setClsFilterThreshold(Number(e.target.value))}
              >
                <option value={0.001}>Show all shifts</option>
                <option value={0.01}>Minor+ (&gt; 0.01)</option>
                <option value={0.1}>Moderate+ (&gt; 0.1)</option>
                <option value={0.25}>Severe (&gt; 0.25)</option>
              </select>
              <button
                type="button"
                className={styles.shiftClearButton}
                onClick={clearShifts}
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
                    onClick={() => replayShift(shift)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        replayShift(shift);
                      }
                    }}
                    onMouseEnter={() => setHoveredShiftId(shift.id)}
                    onMouseLeave={() => setHoveredShiftId(null)}
                    onFocus={() => setHoveredShiftId(shift.id)}
                    onBlur={() => setHoveredShiftId(null)}
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
                        replayShift(shift);
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
          </div>,
          document.body
        )}

      {hoveredShiftId &&
        createPortal(
          <div className={styles.shiftOverlay}>
            {filteredShifts
              .filter((shift) => shift.id === hoveredShiftId)
              .map((shift) => {
                // Convert from viewport coords at capture time to current viewport coords
                const scrollOffset = shift.scrollY - scrollY;
                return shift.sources.map((source, idx) => {
                  // Try to get current rect from the actual element if it still exists
                  let currentRect = source.currentRect;
                  if (source.node && document.contains(source.node)) {
                    const liveRect = source.node.getBoundingClientRect();
                    currentRect = {
                      x: liveRect.x,
                      y: liveRect.y,
                      width: liveRect.width,
                      height: liveRect.height,
                    };
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
                        className={`${styles.shiftHighlight} ${styles.enter}`}
                        style={{
                          left: currentRect.x,
                          top:
                            source.node && document.contains(source.node)
                              ? currentRect.y
                              : currentRect.y + scrollOffset,
                          width: currentRect.width,
                          height: currentRect.height,
                        }}
                      />
                    </div>
                  );
                });
              })}
          </div>,
          document.body
        )}

      {a11yAuditActive &&
        isActive &&
        createPortal(
          <AccessibilityPanel
            issues={a11yIssues}
            summary={a11ySummary}
            isRunning={a11yIsRunning}
            onRunAudit={a11yRunAudit}
            onClearIssues={a11yClearIssues}
            onHoverIssue={a11yHighlightElement}
            onLeaveIssue={a11yClearHighlight}
            onClickIssue={a11yScrollToElement}
            isRecording={a11yIsRecording}
            recordedStates={a11yRecordedStates}
            onStartRecording={a11yStartRecording}
            onStopRecording={a11yStopRecording}
            onCaptureState={a11yCaptureState}
            activeFilter={a11yActiveFilter}
            onFilterChange={a11ySetActiveFilter}
            style={{
              position: 'fixed',
              bottom: toolbarPosition
                ? `calc(100vh - ${toolbarPosition.y}px + 14px)`
                : 'calc(1.25rem + 44px + 14px)',
              right: toolbarPosition ? `calc(100vw - ${toolbarPosition.x}px - 297px)` : '1.25rem',
            }}
          />,
          document.body
        )}

      {a11yAuditActive &&
        isActive &&
        a11yIssues.length > 0 &&
        createPortal(
          <div className={accessibilityPanelStyles.highlightOverlay}>
            {a11yIssues.map((issue) => {
              const element = getElement(issue);
              if (!element) return null;
              const rect = element.getBoundingClientRect();
              const isHovered = issue.id === highlightedIssueId;
              return (
                <div
                  key={issue.id}
                  className={`${accessibilityPanelStyles.highlight} ${accessibilityPanelStyles[issue.impact]} ${isHovered ? accessibilityPanelStyles.hovered : ''}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              );
            })}
          </div>,
          document.body
        )}

      {screenReaderActive &&
        isActive &&
        createPortal(
          <ScreenReaderPreview
            nodes={srNodes}
            isGenerating={srIsGenerating}
            onGenerate={srGeneratePreview}
            onClear={srClearPreview}
            onHighlightElement={setSrHighlightedElement}
            style={{
              position: 'fixed',
              bottom: toolbarPosition
                ? `calc(100vh - ${toolbarPosition.y}px + 14px)`
                : 'calc(1.25rem + 44px + 14px)',
              right: toolbarPosition ? `calc(100vw - ${toolbarPosition.x}px - 357px)` : '1.25rem',
            }}
          />,
          document.body
        )}

      {srHighlightedElement &&
        createPortal(
          <div className={accessibilityPanelStyles.highlightOverlay}>
            {(() => {
              const rect = srHighlightedElement.getBoundingClientRect();
              return (
                <div
                  className={`${accessibilityPanelStyles.highlight} ${accessibilityPanelStyles.minor} ${accessibilityPanelStyles.hovered}`}
                  style={{
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                  }}
                />
              );
            })()}
          </div>,
          document.body
        )}

      <div
        className={styles.toolbar}
        style={
          toolbarPosition
            ? {
                left: `${toolbarPosition.x}px`,
                top: `${toolbarPosition.y}px`,
                right: 'auto',
                bottom: 'auto',
              }
            : undefined
        }
        data-feedback-toolbar
      >
        {annotations.length > 0 && !isActive && (
          <div className={`${styles.badge} ${showEntranceAnimation ? styles.entrance : ''}`}>
            {annotations.length}
          </div>
        )}

        <div
          className={`${styles.toolbarContainer} ${isActive ? styles.expanded : styles.collapsed} ${
            showEntranceAnimation ? styles.entrance : ''
          } ${isDragging ? styles.dragging : ''}`}
          onMouseDown={handleToolbarMouseDown}
          onClick={!isActive ? handleToggle : undefined}
          onKeyDown={
            !isActive
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleToggle();
                  }
                }
              : undefined
          }
          role={!isActive ? 'button' : 'toolbar'}
          tabIndex={!isActive ? 0 : -1}
          aria-label={!isActive ? 'Open toolbar' : 'Developer toolbar'}
        >
          <div className={`${styles.controlsContent} ${isActive ? styles.visible : styles.hidden}`}>
            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelecting();
                }}
                data-active={isSelecting}
                aria-label="Select element"
                aria-pressed={isSelecting}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M4 4L10 18L12 12L18 10L4 4Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>Select Element</div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMarkers();
                }}
                data-active={showMarkers}
                disabled={annotations.length === 0}
                aria-label={showMarkers ? 'Hide markers' : 'Show markers'}
                aria-pressed={showMarkers}
              >
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  {showMarkers ? (
                    <path
                      d="M10 4C5.5 4 2 10 2 10S5.5 16 10 16 18 10 18 10 14.5 4 10 4ZM10 13.5C8.07 13.5 6.5 11.93 6.5 10S8.07 6.5 10 6.5 13.5 8.07 13.5 10 11.93 13.5 10 13.5Z"
                      fill="currentColor"
                    />
                  ) : (
                    <>
                      <path
                        d="M2 2L18 18M10 4C5.5 4 2 10 2 10S3.5 12.5 6 14.5M10 16C14.5 16 18 10 18 10S16.5 7.5 14 5.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        fill="none"
                      />
                      <circle
                        cx="10"
                        cy="10"
                        r="3"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </>
                  )}
                </svg>
              </button>
              <div className={styles.buttonTooltip}>
                {showMarkers ? 'Hide Markers' : 'Show Markers'}
              </div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAnimations();
                }}
                data-active={animationsPaused}
                aria-label={animationsPaused ? 'Resume animations' : 'Pause animations'}
                aria-pressed={animationsPaused}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  {animationsPaused ? (
                    <path d="M6 4L16 10L6 16V4Z" fill="currentColor" />
                  ) : (
                    <>
                      <rect x="5" y="4" width="3" height="12" rx="1" fill="currentColor" />
                      <rect x="12" y="4" width="3" height="12" rx="1" fill="currentColor" />
                    </>
                  )}
                </svg>
              </button>
              <div className={styles.buttonTooltip}>
                {animationsPaused ? 'Resume Animations' : 'Pause Animations'}
              </div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={handleClsButtonClick}
                data-active={clsDetectionActive}
                disabled={!clsSupported}
                aria-label={
                  clsDetectionActive ? 'Stop detecting layout shifts' : 'Detect layout shifts'
                }
                aria-pressed={clsDetectionActive}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <rect
                    x="3"
                    y="4"
                    width="6"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <rect
                    x="11"
                    y="11"
                    width="6"
                    height="5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M6 9L6 13L11 13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="2 2"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>
                {!clsSupported ? 'CLS (Chrome only)' : 'Layout Shifts'}
              </div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMode(activeMode === 'a11y' ? null : 'a11y');
                }}
                data-active={a11yAuditActive}
                aria-label={
                  a11yAuditActive ? 'Close accessibility audit' : 'Open accessibility audit'
                }
                aria-pressed={a11yAuditActive}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <circle cx="10" cy="4" r="2" fill="currentColor" />
                  <path
                    d="M10 8V14M10 14L7 18M10 14L13 18M4 10H16"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>Accessibility</div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMode(activeMode === 'screenReader' ? null : 'screenReader');
                }}
                data-active={screenReaderActive}
                aria-label={
                  screenReaderActive ? 'Close screen reader preview' : 'Open screen reader preview'
                }
                aria-pressed={screenReaderActive}
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M3 5C3 3.89543 3.89543 3 5 3H15C16.1046 3 17 3.89543 17 5V12C17 13.1046 16.1046 14 15 14H5C3.89543 14 3 13.1046 3 12V5Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M7 17H13"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10 14V17"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="10"
                    cy="8"
                    r="2"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M6 11C6 11 7 9 10 9C13 9 14 11 14 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>Screen Reader</div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                disabled={annotations.length === 0}
                data-danger
                aria-label="Clear all annotations"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 6H15M8 6V4H12V6M6 6V16C6 17 7 18 8 18H12C13 18 14 17 14 16V6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>Clear All</div>
            </div>

            <div className={styles.divider} />

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggle();
                }}
                data-danger
                aria-label="Close toolbar"
              >
                <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M5 5L15 15M15 5L5 15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div className={styles.buttonTooltip}>Close</div>
            </div>
          </div>

          <div className={`${styles.toggleContent} ${isActive ? styles.hidden : styles.visible}`}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 2L12.5 7.5L18 8.5L14 13L15 18.5L10 15.5L5 18.5L6 13L2 8.5L7.5 7.5L10 2Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
