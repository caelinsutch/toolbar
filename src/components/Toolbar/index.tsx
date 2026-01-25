import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './Toolbar.module.scss'
import { AnnotationPopup, type AnnotationPopupHandle } from '../AnnotationPopup'
import { identifyElement, getNearbyText, getElementClasses } from '../../utils/element-identification'
import type { Annotation } from '../../types'

let hasPlayedEntranceAnimation = false

type HoverInfo = {
  element: string
  elementPath: string
  rect: DOMRect | null
}

type PendingAnnotation = {
  x: number
  y: number
  clientY: number
  element: string
  elementPath: string
  selectedText?: string
  boundingBox?: { x: number; y: number; width: number; height: number }
  nearbyText?: string
  cssClasses?: string
  isFixed?: boolean
}

function isElementFixed(element: HTMLElement): boolean {
  let current: HTMLElement | null = element
  while (current && current !== document.body) {
    const style = window.getComputedStyle(current)
    if (style.position === 'fixed' || style.position === 'sticky') {
      return true
    }
    current = current.parentElement
  }
  return false
}

export default function Toolbar() {
  const [isActive, setIsActive] = useState(false)
  const [isSelecting, setIsSelecting] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showMarkers, setShowMarkers] = useState(true)
  const [markersVisible, setMarkersVisible] = useState(false)
  const [markersExiting, setMarkersExiting] = useState(false)
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
  const [pendingAnnotation, setPendingAnnotation] = useState<PendingAnnotation | null>(null)
  const [pendingExiting, setPendingExiting] = useState(false)
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null)
  const [animatedMarkers, setAnimatedMarkers] = useState<Set<string>>(new Set())
  const [exitingMarkers, setExitingMarkers] = useState<Set<string>>(new Set())
  const [isClearing, setIsClearing] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  const [showEntranceAnimation, setShowEntranceAnimation] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<{
    x: number
    y: number
    toolbarX: number
    toolbarY: number
  } | null>(null)
  const [dragRotation, setDragRotation] = useState(0)
  const justFinishedDragRef = useRef(false)
  const popupRef = useRef<AnnotationPopupHandle>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!hasPlayedEntranceAnimation) {
      setShowEntranceAnimation(true)
      hasPlayedEntranceAnimation = true
      setTimeout(() => setShowEntranceAnimation(false), 750)
    }
    setScrollY(window.scrollY)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      scrollTimeoutRef.current = setTimeout(() => {}, 150)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  const shouldShowMarkers = isActive && showMarkers
  useEffect(() => {
    if (shouldShowMarkers) {
      setMarkersExiting(false)
      setMarkersVisible(true)
      setAnimatedMarkers(new Set())
      const timer = setTimeout(() => {
        setAnimatedMarkers((prev) => {
          const newSet = new Set(prev)
          for (const a of annotations) {
            newSet.add(a.id)
          }
          return newSet
        })
      }, 350)
      return () => clearTimeout(timer)
    } else if (markersVisible) {
      setMarkersExiting(true)
      const timer = setTimeout(() => {
        setMarkersVisible(false)
        setMarkersExiting(false)
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [shouldShowMarkers, annotations, markersVisible])

  useEffect(() => {
    if (!isActive) {
      setPendingAnnotation(null)
      setHoverInfo(null)
      setIsSelecting(false)
    }
  }, [isActive])

  useEffect(() => {
    if (!isSelecting) return

    const style = document.createElement('style')
    style.id = 'toolbar-cursor-styles'
    style.textContent = `
      body * { cursor: crosshair !important; }
      body p, body span, body h1, body h2, body h3, body h4, body h5, body h6,
      body li, body td, body th, body label, body a, body pre, body code,
      body p *, body span *, body h1 *, body h2 *, body h3 *, body h4 *,
      body h5 *, body h6 *, body li *, body a *, body label *, body pre *, body code * {
        cursor: text !important;
      }
      [data-feedback-toolbar], [data-feedback-toolbar] * { cursor: default !important; }
      [data-annotation-marker], [data-annotation-marker] * { cursor: pointer !important; }
    `
    document.head.appendChild(style)
    return () => {
      const existing = document.getElementById('toolbar-cursor-styles')
      if (existing) existing.remove()
    }
  }, [isSelecting])

  useEffect(() => {
    if (!isSelecting || pendingAnnotation) return

    const handleMouseMove = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('[data-feedback-toolbar]')) {
        setHoverInfo(null)
        return
      }
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (!elementUnder || elementUnder.closest('[data-feedback-toolbar]')) {
        setHoverInfo(null)
        return
      }
      const { name, path } = identifyElement(elementUnder)
      const rect = elementUnder.getBoundingClientRect()
      setHoverInfo({ element: name, elementPath: path, rect })
      setHoverPosition({ x: e.clientX, y: e.clientY })
    }
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [isSelecting, pendingAnnotation])

  useEffect(() => {
    if (!isSelecting) return

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-feedback-toolbar]')) return
      if (target.closest('[data-annotation-popup]')) return
      if (target.closest('[data-annotation-marker]')) return

      if (pendingAnnotation) {
        e.preventDefault()
        popupRef.current?.shake()
        return
      }

      e.preventDefault()
      const elementUnder = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement
      if (!elementUnder) return

      const { name, path } = identifyElement(elementUnder)
      const rect = elementUnder.getBoundingClientRect()
      const x = (e.clientX / window.innerWidth) * 100
      const isFixed = isElementFixed(elementUnder)
      const y = isFixed ? e.clientY : e.clientY + window.scrollY

      const selection = window.getSelection()
      let selectedText: string | undefined
      if (selection && selection.toString().trim().length > 0) {
        selectedText = selection.toString().trim().slice(0, 500)
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
      })
      setHoverInfo(null)
    }

    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [isSelecting, pendingAnnotation])

  const addAnnotation = useCallback(
    (comment: string) => {
      if (!pendingAnnotation) return
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
      }
      setAnnotations((prev) => [...prev, newAnnotation])
      setTimeout(() => {
        setAnimatedMarkers((prev) => new Set(prev).add(newAnnotation.id))
      }, 250)
      setPendingExiting(true)
      setTimeout(() => {
        setPendingAnnotation(null)
        setPendingExiting(false)
      }, 150)
      window.getSelection()?.removeAllRanges()
    },
    [pendingAnnotation]
  )

  const cancelAnnotation = useCallback(() => {
    setPendingExiting(true)
    setTimeout(() => {
      setPendingAnnotation(null)
      setPendingExiting(false)
    }, 150)
  }, [])

  const deleteAnnotation = useCallback((id: string) => {
    setExitingMarkers((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setAnnotations((prev) => prev.filter((a) => a.id !== id))
      setExitingMarkers((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 150)
  }, [])

  const clearAll = useCallback(() => {
    if (annotations.length === 0) return
    setIsClearing(true)
    const totalTime = annotations.length * 30 + 200
    setTimeout(() => {
      setAnnotations([])
      setAnimatedMarkers(new Set())
      setIsClearing(false)
    }, totalTime)
  }, [annotations.length])

  const handleToolbarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button')) return
      const toolbarParent = (e.currentTarget as HTMLElement).parentElement
      if (!toolbarParent) return
      const rect = toolbarParent.getBoundingClientRect()
      const currentX = toolbarPosition?.x ?? rect.left
      const currentY = toolbarPosition?.y ?? rect.top
      const randomRotation = (Math.random() - 0.5) * 10
      setDragRotation(randomRotation)
      setDragStartPos({
        x: e.clientX,
        y: e.clientY,
        toolbarX: currentX,
        toolbarY: currentY,
      })
    },
    [toolbarPosition]
  )

  useEffect(() => {
    if (!dragStartPos) return
    const DRAG_THRESHOLD = 5

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.x
      const deltaY = e.clientY - dragStartPos.y
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      if (!isDragging && distance > DRAG_THRESHOLD) {
        setIsDragging(true)
      }
      if (isDragging || distance > DRAG_THRESHOLD) {
        let newX = dragStartPos.toolbarX + deltaX
        let newY = dragStartPos.toolbarY + deltaY
        const padding = 20
        const containerWidth = 257
        const circleWidth = 44
        const toolbarHeight = 44
        if (isActive) {
          newX = Math.max(padding, Math.min(window.innerWidth - containerWidth - padding, newX))
        } else {
          const circleOffset = containerWidth - circleWidth
          const minX = padding - circleOffset
          const maxX = window.innerWidth - padding - circleOffset - circleWidth
          newX = Math.max(minX, Math.min(maxX, newX))
        }
        newY = Math.max(padding, Math.min(window.innerHeight - toolbarHeight - padding, newY))
        setToolbarPosition({ x: newX, y: newY })
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        justFinishedDragRef.current = true
        setTimeout(() => {
          justFinishedDragRef.current = false
        }, 50)
      }
      setIsDragging(false)
      setDragStartPos(null)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragStartPos, isDragging, isActive])

  const handleToggle = () => {
    if (justFinishedDragRef.current) return
    setIsActive(!isActive)
  }

  const toggleSelecting = () => {
    setIsSelecting(!isSelecting)
  }

  const toggleMarkers = () => {
    setShowMarkers(!showMarkers)
  }

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
              const isEntering = !animatedMarkers.has(annotation.id) && !markersExiting
              const isExiting = exitingMarkers.has(annotation.id) || markersExiting
              const clearingDelay = isClearing ? index * 30 : 0

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
                    e.stopPropagation()
                    deleteAnnotation(annotation.id)
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
              )
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
              top: pendingAnnotation.clientY > window.innerHeight / 2 
                ? pendingAnnotation.clientY - 200 
                : pendingAnnotation.clientY + 30,
            }}
          />,
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

        {isActive ? (
          <div
            className={`${styles.toolbarContainer} ${styles.expanded} ${
              showEntranceAnimation ? styles.entrance : ''
            } ${isDragging ? styles.dragging : ''}`}
            style={isDragging ? { transform: `rotate(${dragRotation}deg)` } : undefined}
            onMouseDown={handleToolbarMouseDown}
          >
            <div className={`${styles.toggleContent} ${styles.hidden}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2L12.5 7.5L18 8.5L14 13L15 18.5L10 15.5L5 18.5L6 13L2 8.5L7.5 7.5L10 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>

            <div className={`${styles.controlsContent} ${styles.visible}`}>
              <div className={styles.buttonWrapper}>
                <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleSelecting()
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
                  e.stopPropagation()
                  toggleMarkers()
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
                      <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                    </>
                  )}
                </svg>
              </button>
              <div className={styles.buttonTooltip}>{showMarkers ? 'Hide Markers' : 'Show Markers'}</div>
            </div>

            <div className={styles.buttonWrapper}>
              <button
                type="button"
                className={styles.controlButton}
                onClick={(e) => {
                  e.stopPropagation()
                  clearAll()
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
                  e.stopPropagation()
                  handleToggle()
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
          </div>
        ) : (
          <button
            type="button"
            className={`${styles.toolbarContainer} ${styles.collapsed} ${
              showEntranceAnimation ? styles.entrance : ''
            }`}
            onMouseDown={handleToolbarMouseDown}
            onClick={handleToggle}
            aria-label="Open toolbar"
          >
            <div className={`${styles.toggleContent} ${styles.visible}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 2L12.5 7.5L18 8.5L14 13L15 18.5L10 15.5L5 18.5L6 13L2 8.5L7.5 7.5L10 2Z"
                  fill="currentColor"
                />
              </svg>
            </div>
          </button>
        )}
      </div>
    </>
  )
}
