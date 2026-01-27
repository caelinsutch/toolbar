import { useState } from 'react';
import type { AccessibleNode } from '../../hooks/use-screen-reader-preview';
import { generateTextScript } from '../../hooks/use-screen-reader-preview';
import styles from './screen-reader-preview.module.scss';

interface ScreenReaderPreviewProps {
  nodes: AccessibleNode[];
  isGenerating: boolean;
  onGenerate: () => void;
  onClear: () => void;
  onHighlightElement: (element: Element | null) => void;
  style?: React.CSSProperties;
}

type ViewMode = 'script' | 'tree';

const ROLE_ICONS: Record<string, string> = {
  heading: 'H',
  button: '⏺',
  link: '🔗',
  textbox: '✎',
  checkbox: '☑',
  radio: '◉',
  img: '🖼',
  list: '≡',
  listitem: '•',
  navigation: '☰',
  main: '▣',
  banner: '⬆',
  contentinfo: '⬇',
  form: '📝',
  region: '▢',
  article: '📄',
  table: '▦',
  combobox: '▼',
};

function TreeNode({
  node,
  onHover,
  onLeave,
}: {
  node: AccessibleNode;
  onHover: (el: Element) => void;
  onLeave: () => void;
}) {
  const [expanded] = useState(true);
  const hasWarnings = node.warnings.length > 0;

  return (
    <div className={styles.treeNode}>
      <div
        className={`${styles.treeNodeContent} ${hasWarnings ? styles.hasWarning : ''}`}
        onMouseEnter={() => onHover(node.element)}
        onMouseLeave={onLeave}
        onClick={() => {
          node.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            node.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        role="button"
        tabIndex={0}
      >
        <span className={styles.roleIcon}>{ROLE_ICONS[node.role] || '○'}</span>
        <span className={styles.role}>
          {node.role}
          {node.level && <span className={styles.level}>{node.level}</span>}
        </span>
        {node.states.length > 0 && <span className={styles.states}>{node.states.join(', ')}</span>}
        {node.name && <span className={styles.name}>"{node.name}"</span>}
        {hasWarnings && (
          <span className={styles.warning} title={node.warnings.join('\n')}>
            ⚠️
          </span>
        )}
      </div>
      {node.children.length > 0 && expanded && (
        <div className={styles.treeChildren}>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onHover={onHover} onLeave={onLeave} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ScreenReaderPreview({
  nodes,
  isGenerating,
  onGenerate,
  onClear,
  onHighlightElement,
  style,
}: ScreenReaderPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('script');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const scriptText = generateTextScript(nodes);
  const warningCount = nodes.filter((n) => n.warnings.length > 0).length;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptText);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={styles.panel} style={style}>
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <span className={styles.title}>Screen Reader</span>
          {warningCount > 0 && <span className={styles.warningBadge}>{warningCount} ⚠️</span>}
        </div>
        <button
          type="button"
          className={styles.generateButton}
          onClick={onGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <span className={styles.spinner} />
              Generating...
            </>
          ) : nodes.length > 0 ? (
            'Refresh'
          ) : (
            'Generate Preview'
          )}
        </button>
      </div>

      {nodes.length > 0 && (
        <div className={styles.controls}>
          <div className={styles.viewToggle}>
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'script' ? styles.active : ''}`}
              onClick={() => setViewMode('script')}
            >
              Script
            </button>
            <button
              type="button"
              className={`${styles.toggleButton} ${viewMode === 'tree' ? styles.active : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree
            </button>
          </div>
          <div className={styles.actions}>
            {viewMode === 'script' && (
              <button type="button" className={styles.actionButton} onClick={handleCopyScript}>
                {copiedToClipboard ? '✓ Copied' : 'Copy'}
              </button>
            )}
            <button type="button" className={styles.actionButton} onClick={onClear}>
              Clear
            </button>
          </div>
        </div>
      )}

      <div className={styles.content}>
        {nodes.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔊</div>
            Click "Generate Preview" to see what screen readers would announce
          </div>
        ) : viewMode === 'script' ? (
          <div className={styles.scriptView}>
            <pre className={styles.script}>{scriptText}</pre>
          </div>
        ) : (
          <div className={styles.treeView}>
            {nodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                onHover={onHighlightElement}
                onLeave={() => onHighlightElement(null)}
              />
            ))}
          </div>
        )}
      </div>

      {nodes.length > 0 && (
        <div className={styles.footer}>
          <span className={styles.stats}>
            {nodes.length} elements • {warningCount} warnings
          </span>
        </div>
      )}
    </div>
  );
}
