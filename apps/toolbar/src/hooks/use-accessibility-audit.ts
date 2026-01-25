import { useState, useCallback, useRef } from 'react'
import type { AccessibilityIssue, AccessibilityImpact, RecordedAccessibilityState } from '@toolbar/types'
import type { AxeResults } from 'axe-core'

interface UseAccessibilityAuditOptions {
  enabled: boolean
  autoRun?: boolean
}

interface AccessibilityAuditSummary {
  critical: number
  serious: number
  moderate: number
  minor: number
  total: number
}

interface UseAccessibilityAuditResult {
  issues: AccessibilityIssue[]
  summary: AccessibilityAuditSummary
  isRunning: boolean
  lastRunTimestamp: number | null
  runAudit: () => Promise<void>
  clearIssues: () => void
  highlightedIssueId: string | null
  highlightElement: (issue: AccessibilityIssue) => void
  clearHighlight: () => void
  scrollToAndLogElement: (issue: AccessibilityIssue) => void
  isRecording: boolean
  recordedStates: RecordedAccessibilityState[]
  startRecording: () => void
  stopRecording: () => void
  captureCurrentState: (name?: string) => Promise<void>
  clearRecordedStates: () => void
  activeFilter: AccessibilityImpact | 'all'
  setActiveFilter: (filter: AccessibilityImpact | 'all') => void
}

function getElement(issue: AccessibilityIssue): Element | null {
  if (issue.element?.isConnected) {
    return issue.element
  }

  if (issue.elementSelector) {
    try {
      const el = document.querySelector(issue.elementSelector)
      if (el) return el
    } catch {
      // Selector might be invalid
    }
  }

  if (issue.elementHtml) {
    const idMatch = issue.elementHtml.match(/id=["']([^"']+)["']/)
    if (idMatch?.[1]) {
      const el = document.getElementById(idMatch[1])
      if (el) return el
    }
  }

  return null
}

function calculateSummary(issues: AccessibilityIssue[]): AccessibilityAuditSummary {
  return issues.reduce(
    (acc, issue) => {
      acc[issue.impact]++
      acc.total++
      return acc
    },
    { critical: 0, serious: 0, moderate: 0, minor: 0, total: 0 }
  )
}

export function useAccessibilityAudit({
  enabled,
}: UseAccessibilityAuditOptions): UseAccessibilityAuditResult {
  const [issues, setIssues] = useState<AccessibilityIssue[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastRunTimestamp, setLastRunTimestamp] = useState<number | null>(null)
  const [highlightedIssueId, setHighlightedIssueId] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedStates, setRecordedStates] = useState<RecordedAccessibilityState[]>([])
  const [activeFilter, setActiveFilter] = useState<AccessibilityImpact | 'all'>('all')
  const captureCountRef = useRef(0)

  const summary = calculateSummary(issues)

  const transformAxeResults = useCallback((results: AxeResults): AccessibilityIssue[] => {
    const timestamp = Date.now()
    const transformed: AccessibilityIssue[] = []

    for (const violation of results.violations) {
      for (const node of violation.nodes) {
        const element = (node as { element?: Element }).element
        const selector = Array.isArray(node.target)
          ? node.target.join(' ')
          : (node.target as string) || ''

        const issue: AccessibilityIssue = {
          id: `${timestamp}-${Math.random().toString(36).slice(2, 9)}`,
          ruleId: violation.id,
          impact: (violation.impact as AccessibilityImpact) || 'minor',
          description: violation.description,
          help: violation.help,
          helpUrl: violation.helpUrl,
          element: element || null,
          elementSelector: selector,
          elementHtml: node.html || '',
          failureSummary: node.failureSummary || '',
          wcagTags: violation.tags.filter((tag: string) => tag.startsWith('wcag')),
          timestamp,
        }
        transformed.push(issue)
      }
    }

    return transformed
  }, [])

  const runAudit = useCallback(async () => {
    if (!enabled || isRunning) return

    setIsRunning(true)

    try {
      const axe = await import('axe-core')
      const results = await axe.default.run(
        { exclude: ['[data-feedback-toolbar]'] },
        {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          elementRef: true,
        }
      )

      const transformedIssues = transformAxeResults(results)
      setIssues(transformedIssues)
      setLastRunTimestamp(Date.now())
    } catch (error) {
      console.error('Accessibility audit failed:', error)
    } finally {
      setIsRunning(false)
    }
  }, [enabled, isRunning, transformAxeResults])

  const clearIssues = useCallback(() => {
    setIssues([])
    setLastRunTimestamp(null)
  }, [])

  const highlightElement = useCallback((issue: AccessibilityIssue) => {
    setHighlightedIssueId(issue.id)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedIssueId(null)
  }, [])

  const scrollToAndLogElement = useCallback((issue: AccessibilityIssue) => {
    const element = getElement(issue)

    // Scroll to element smoothly
    if (element) {
      const rect = element.getBoundingClientRect()
      const scrollTop = window.scrollY + rect.top - window.innerHeight / 3
      window.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: 'smooth',
      })
    }

    // Log to console
    console.group(`%cAccessibility Issue: ${issue.ruleId}`, 'color: #ff9500; font-weight: bold;')
    console.log('%cImpact:', 'font-weight: bold;', issue.impact)
    console.log('%cDescription:', 'font-weight: bold;', issue.description)
    console.log('%cHow to fix:', 'font-weight: bold;', issue.failureSummary)
    console.log('%cWCAG Criteria:', 'font-weight: bold;', issue.wcagTags.join(', '))
    console.log('%cHelp:', 'font-weight: bold;', issue.helpUrl)
    console.log('%cElement HTML:', 'font-weight: bold;', issue.elementHtml)
    console.log('%cElement:', 'font-weight: bold;', element)
    console.groupEnd()

    // Highlight the element
    setHighlightedIssueId(issue.id)
  }, [])

  const startRecording = useCallback(() => {
    setIsRecording(true)
    captureCountRef.current = 0
    setRecordedStates([])
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
  }, [])

  const captureCurrentState = useCallback(async (name?: string) => {
    if (!isRecording) return

    try {
      const axe = await import('axe-core')
      const results = await axe.default.run(
        { exclude: ['[data-feedback-toolbar]'] },
        {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
          elementRef: true,
        }
      )

      const capturedIssues = transformAxeResults(results)
      captureCountRef.current++

      const state: RecordedAccessibilityState = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        name: name || `Capture ${captureCountRef.current}`,
        timestamp: Date.now(),
        issues: capturedIssues,
      }

      setRecordedStates(prev => [...prev, state])
    } catch (error) {
      console.error('Failed to capture accessibility state:', error)
    }
  }, [isRecording, transformAxeResults])

  const clearRecordedStates = useCallback(() => {
    setRecordedStates([])
    captureCountRef.current = 0
  }, [])

  return {
    issues,
    summary,
    isRunning,
    lastRunTimestamp,
    runAudit,
    clearIssues,
    highlightedIssueId,
    highlightElement,
    clearHighlight,
    scrollToAndLogElement,
    isRecording,
    recordedStates,
    startRecording,
    stopRecording,
    captureCurrentState,
    clearRecordedStates,
    activeFilter,
    setActiveFilter,
  }
}

export { getElement }
