import {
  useState,
  useRef,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react'
import styles from './AnnotationPopup.module.scss'

export interface AnnotationPopupProps {
  element: string
  selectedText?: string
  placeholder?: string
  initialValue?: string
  submitLabel?: string
  onSubmit: (text: string) => void
  onCancel: () => void
  style?: React.CSSProperties
  accentColor?: string
  isExiting?: boolean
}

export interface AnnotationPopupHandle {
  shake: () => void
}

export const AnnotationPopup = forwardRef<AnnotationPopupHandle, AnnotationPopupProps>(
  function AnnotationPopup(
    {
      element,
      selectedText,
      placeholder = 'What should change?',
      initialValue = '',
      submitLabel = 'Add',
      onSubmit,
      onCancel,
      style,
      accentColor = '#3c82f7',
      isExiting = false,
    },
    ref
  ) {
    const [text, setText] = useState(initialValue)
    const [isShaking, setIsShaking] = useState(false)
    const [animState, setAnimState] = useState<'initial' | 'enter' | 'entered' | 'exit'>('initial')
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const popupRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (isExiting && animState !== 'exit') {
        setAnimState('exit')
      }
    }, [isExiting, animState])

    useEffect(() => {
      requestAnimationFrame(() => {
        setAnimState('enter')
      })
      const enterTimer = setTimeout(() => {
        setAnimState('entered')
      }, 200)
      const focusTimer = setTimeout(() => {
        const textarea = textareaRef.current
        if (textarea) {
          textarea.focus()
          textarea.selectionStart = textarea.selectionEnd = textarea.value.length
        }
      }, 50)
      return () => {
        clearTimeout(enterTimer)
        clearTimeout(focusTimer)
      }
    }, [])

    const shake = useCallback(() => {
      setIsShaking(true)
      setTimeout(() => {
        setIsShaking(false)
        textareaRef.current?.focus()
      }, 250)
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        shake,
      }),
      [shake]
    )

    const handleCancel = useCallback(() => {
      setAnimState('exit')
      setTimeout(() => {
        onCancel()
      }, 150)
    }, [onCancel])

    const handleSubmit = useCallback(() => {
      if (!text.trim()) return
      onSubmit(text.trim())
    }, [text, onSubmit])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.nativeEvent.isComposing) return
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSubmit()
        }
        if (e.key === 'Escape') {
          handleCancel()
        }
      },
      [handleSubmit, handleCancel]
    )

    const popupClassName = [
      styles.popup,
      animState === 'enter' ? styles.enter : '',
      animState === 'entered' ? styles.entered : '',
      animState === 'exit' ? styles.exit : '',
      isShaking ? styles.shake : '',
    ]
      .filter(Boolean)
      .join(' ')

    return (
      <div
        ref={popupRef}
        className={popupClassName}
        data-annotation-popup
        style={style}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Add annotation"
      >
        <div className={styles.header}>
          <span className={styles.element}>{element}</span>
        </div>

        {selectedText && (
          <div className={styles.quote}>
            &ldquo;{selectedText.slice(0, 80)}
            {selectedText.length > 80 ? '...' : ''}&rdquo;
          </div>
        )}

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          style={{ borderColor: isFocused ? accentColor : undefined }}
          placeholder={placeholder}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          rows={2}
          onKeyDown={handleKeyDown}
        />

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={handleCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.submit}
            style={{
              backgroundColor: accentColor,
              opacity: text.trim() ? 1 : 0.4,
            }}
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            {submitLabel}
          </button>
        </div>
      </div>
    )
  }
)

export default AnnotationPopup
