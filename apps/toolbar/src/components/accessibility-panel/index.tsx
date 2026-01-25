import { useState, useMemo } from 'react'
import type { AccessibilityIssue, AccessibilityImpact, RecordedAccessibilityState } from '@toolbar/types'
import styles from './accessibility-panel.module.scss'

interface AccessibilityAuditSummary {
  critical: number
  serious: number
  moderate: number
  minor: number
  total: number
}

interface AccessibilityPanelProps {
  issues: AccessibilityIssue[]
  summary: AccessibilityAuditSummary
  isRunning: boolean
  onRunAudit: () => void
  onClearIssues: () => void
  onHoverIssue: (issue: AccessibilityIssue) => void
  onLeaveIssue: () => void
  onClickIssue: (issue: AccessibilityIssue) => void
  isRecording: boolean
  recordedStates: RecordedAccessibilityState[]
  onStartRecording: () => void
  onStopRecording: () => void
  onCaptureState: () => void
  activeFilter: AccessibilityImpact | 'all'
  onFilterChange: (filter: AccessibilityImpact | 'all') => void
  style?: React.CSSProperties
}

const IMPACT_ORDER: AccessibilityImpact[] = ['critical', 'serious', 'moderate', 'minor']

const IMPACT_LABELS: Record<AccessibilityImpact, string> = {
  critical: 'Critical',
  serious: 'Serious',
  moderate: 'Moderate',
  minor: 'Minor',
}

export function AccessibilityPanel({
  issues,
  summary,
  isRunning,
  onRunAudit,
  onClearIssues,
  onHoverIssue,
  onLeaveIssue,
  onClickIssue,
  isRecording,
  recordedStates,
  onStartRecording,
  onStopRecording,
  onCaptureState,
  activeFilter,
  onFilterChange,
  style,
}: AccessibilityPanelProps) {
  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)

  const filteredIssues = useMemo(() => {
    const sourceIssues = selectedStateId
      ? recordedStates.find(s => s.id === selectedStateId)?.issues || []
      : issues

    if (activeFilter === 'all') return sourceIssues
    return sourceIssues.filter(issue => issue.impact === activeFilter)
  }, [issues, activeFilter, selectedStateId, recordedStates])

  const groupedIssues = useMemo(() => {
    const groups: Record<AccessibilityImpact, AccessibilityIssue[]> = {
      critical: [],
      serious: [],
      moderate: [],
      minor: [],
    }

    for (const issue of filteredIssues) {
      groups[issue.impact].push(issue)
    }

    return groups
  }, [filteredIssues])

  const getBadgeClass = () => {
    if (summary.critical > 0) return styles.hasCritical
    if (summary.serious > 0) return styles.hasSerious
    return ''
  }

  return (
    <div className={styles.panel} style={style}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.title}>Accessibility</span>
          {summary.total > 0 && (
            <span className={`${styles.badge} ${getBadgeClass()}`}>
              {summary.total} {summary.total === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>
        <button
          type="button"
          className={styles.runButton}
          onClick={onRunAudit}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <span className={styles.spinner} />
              Running...
            </>
          ) : (
            <>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 2L12 8L4 14V2Z" fill="currentColor" />
              </svg>
              Run Audit
            </>
          )}
        </button>
      </div>

      <div className={styles.controls}>
        <select
          className={styles.filterSelect}
          value={activeFilter}
          onChange={(e) => onFilterChange(e.target.value as AccessibilityImpact | 'all')}
        >
          <option value="all">All issues</option>
          <option value="critical">Critical only</option>
          <option value="serious">Serious only</option>
          <option value="moderate">Moderate only</option>
          <option value="minor">Minor only</option>
        </select>
        <button
          type="button"
          className={`${styles.recordButton} ${isRecording ? styles.recording : ''}`}
          onClick={isRecording ? onStopRecording : onStartRecording}
        >
          {isRecording ? (
            <>
              <span className={styles.recordingDot} />
              Stop
            </>
          ) : (
            'Record'
          )}
        </button>
        <button
          type="button"
          className={styles.clearButton}
          onClick={onClearIssues}
          disabled={issues.length === 0}
        >
          Clear
        </button>
      </div>

      {isRecording && (
        <div className={styles.recordingControls}>
          <div className={styles.recordingIndicator}>
            <span className={styles.recordingDot} />
            Recording
          </div>
          <button
            type="button"
            className={styles.captureButton}
            onClick={onCaptureState}
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
              <circle cx="8" cy="8" r="3" fill="currentColor" />
            </svg>
            Capture
          </button>
        </div>
      )}

      {recordedStates.length > 0 && (
        <div className={styles.recordedStates}>
          <div className={styles.recordedStatesHeader}>
            Captured States ({recordedStates.length})
          </div>
          {recordedStates.map((state) => (
            <div
              key={state.id}
              className={`${styles.recordedState} ${selectedStateId === state.id ? styles.active : ''}`}
              onClick={() => setSelectedStateId(selectedStateId === state.id ? null : state.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedStateId(selectedStateId === state.id ? null : state.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <span className={styles.stateName}>{state.name}</span>
              <span className={styles.stateCount}>{state.issues.length}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.content}>
        {filteredIssues.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              {issues.length === 0 ? '🔍' : '✓'}
            </div>
            {issues.length === 0
              ? 'Click "Run Audit" to check accessibility'
              : 'No issues match the current filter'}
          </div>
        ) : (
          IMPACT_ORDER.map((impact) => {
            const impactIssues = groupedIssues[impact]
            if (impactIssues.length === 0) return null

            return (
              <div key={impact} className={styles.issueGroup}>
                <div className={styles.groupHeader}>
                  <span className={`${styles.impactDot} ${styles[impact]}`} />
                  {IMPACT_LABELS[impact]}
                  <span className={styles.groupCount}>{impactIssues.length}</span>
                </div>
                {impactIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={styles.issueItem}
                    onClick={() => onClickIssue(issue)}
                    onMouseEnter={() => onHoverIssue(issue)}
                    onMouseLeave={onLeaveIssue}
                    onFocus={() => onHoverIssue(issue)}
                    onBlur={onLeaveIssue}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onClickIssue(issue)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <span className={`${styles.impactDot} ${styles[issue.impact]}`} />
                    <div className={styles.issueContent}>
                      <div className={styles.issueHelp}>{issue.help}</div>
                      <div className={styles.issueSelector}>{issue.elementSelector}</div>
                    </div>
                    <a
                      href={issue.helpUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.issueLink}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="View WCAG guideline"
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M6 3H3V13H13V10M9 3H13V7M13 3L7 9"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export { styles as accessibilityPanelStyles }
