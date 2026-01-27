import { useState, useCallback } from 'react'

export interface AccessibleNode {
  id: string
  role: string
  name: string
  description?: string
  value?: string
  states: string[]
  level?: number // For headings
  children: AccessibleNode[]
  element: Element
  warnings: string[]
  depth: number
}

interface UseScreenReaderPreviewResult {
  nodes: AccessibleNode[]
  isGenerating: boolean
  generatePreview: () => void
  clearPreview: () => void
}

// Get the implicit role for an element
function getImplicitRole(element: Element): string {
  const tagName = element.tagName.toLowerCase()
  const type = element.getAttribute('type')?.toLowerCase()

  const roleMap: Record<string, string> = {
    a: element.hasAttribute('href') ? 'link' : 'generic',
    article: 'article',
    aside: 'complementary',
    button: 'button',
    datalist: 'listbox',
    details: 'group',
    dialog: 'dialog',
    fieldset: 'group',
    figure: 'figure',
    footer: 'contentinfo',
    form: 'form',
    h1: 'heading',
    h2: 'heading',
    h3: 'heading',
    h4: 'heading',
    h5: 'heading',
    h6: 'heading',
    header: 'banner',
    hr: 'separator',
    img: 'img',
    input: getInputRole(type),
    li: 'listitem',
    main: 'main',
    menu: 'menu',
    nav: 'navigation',
    ol: 'list',
    option: 'option',
    progress: 'progressbar',
    section: 'region',
    select: 'combobox',
    summary: 'button',
    table: 'table',
    tbody: 'rowgroup',
    td: 'cell',
    textarea: 'textbox',
    tfoot: 'rowgroup',
    th: 'columnheader',
    thead: 'rowgroup',
    tr: 'row',
    ul: 'list',
  }

  return roleMap[tagName] || 'generic'
}

function getInputRole(type?: string | null): string {
  const inputRoles: Record<string, string> = {
    button: 'button',
    checkbox: 'checkbox',
    email: 'textbox',
    image: 'button',
    number: 'spinbutton',
    radio: 'radio',
    range: 'slider',
    reset: 'button',
    search: 'searchbox',
    submit: 'button',
    tel: 'textbox',
    text: 'textbox',
    url: 'textbox',
  }
  return inputRoles[type || 'text'] || 'textbox'
}

// Get accessible name for an element
function getAccessibleName(element: Element): string {
  // aria-labelledby takes precedence
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labels = labelledBy.split(/\s+/).map(id => {
      const labelEl = document.getElementById(id)
      return labelEl?.textContent?.trim() || ''
    }).filter(Boolean)
    if (labels.length) return labels.join(' ')
  }

  // Then aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // For inputs, check associated label
  if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
    const id = element.getAttribute('id')
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`)
      if (label?.textContent?.trim()) return label.textContent.trim()
    }
    // Check for wrapping label
    const parentLabel = element.closest('label')
    if (parentLabel?.textContent?.trim()) {
      return parentLabel.textContent.trim()
    }
    // Placeholder as last resort for inputs
    const placeholder = element.getAttribute('placeholder')
    if (placeholder) return `[placeholder: ${placeholder}]`
  }

  // For images, check alt
  if (element.tagName === 'IMG') {
    const alt = element.getAttribute('alt')
    if (alt !== null) return alt || '[empty alt]'
    return '[no alt text]'
  }

  // For buttons/links, use text content
  const textContent = element.textContent?.trim()
  if (textContent && textContent.length < 100) return textContent

  // Title attribute as fallback
  const title = element.getAttribute('title')
  if (title) return title

  return ''
}

// Get accessible states
function getAccessibleStates(element: Element): string[] {
  const states: string[] = []

  if (element.getAttribute('aria-pressed') === 'true') states.push('pressed')
  if (element.getAttribute('aria-expanded') === 'true') states.push('expanded')
  if (element.getAttribute('aria-expanded') === 'false') states.push('collapsed')
  if (element.getAttribute('aria-checked') === 'true') states.push('checked')
  if (element.getAttribute('aria-selected') === 'true') states.push('selected')
  if (element.getAttribute('aria-disabled') === 'true') states.push('disabled')
  if (element.getAttribute('aria-hidden') === 'true') states.push('hidden')
  if (element.getAttribute('aria-required') === 'true') states.push('required')
  if (element.getAttribute('aria-invalid') === 'true') states.push('invalid')
  if ((element as HTMLInputElement).disabled) states.push('disabled')
  if ((element as HTMLInputElement).required) states.push('required')
  if ((element as HTMLInputElement).readOnly) states.push('readonly')

  return states
}

// Check for accessibility warnings
function getWarnings(element: Element, role: string, name: string): string[] {
  const warnings: string[] = []

  // Interactive elements without accessible names
  const interactiveRoles = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'slider', 'menuitem']
  if (interactiveRoles.includes(role) && !name) {
    warnings.push('Missing accessible name')
  }

  // Images without alt
  if (role === 'img' && element.tagName === 'IMG' && !element.hasAttribute('alt')) {
    warnings.push('Missing alt attribute')
  }

  // Links without href
  if (element.tagName === 'A' && !element.hasAttribute('href')) {
    warnings.push('Link without href')
  }

  // Form inputs without labels
  if (['textbox', 'combobox', 'checkbox', 'radio'].includes(role)) {
    if (!name || name.startsWith('[placeholder:')) {
      warnings.push('Form input without label')
    }
  }

  // Clickable divs/spans
  if (['DIV', 'SPAN'].includes(element.tagName)) {
    if (element.getAttribute('onclick') || element.getAttribute('role') === 'button') {
      if (!element.hasAttribute('tabindex')) {
        warnings.push('Interactive element not focusable')
      }
    }
  }

  return warnings
}

// Check if element should be included in accessibility tree
function isAccessibleElement(element: Element): boolean {
  // Skip hidden elements
  if (element.getAttribute('aria-hidden') === 'true') return false
  const style = window.getComputedStyle(element)
  if (style.display === 'none' || style.visibility === 'hidden') return false

  // Skip toolbar itself
  if (element.closest('[data-feedback-toolbar]')) return false

  const role = element.getAttribute('role') || getImplicitRole(element)

  // Include landmark roles
  const landmarks = ['banner', 'complementary', 'contentinfo', 'form', 'main', 'navigation', 'region', 'search']
  if (landmarks.includes(role)) return true

  // Include interactive elements
  const interactive = ['button', 'link', 'textbox', 'checkbox', 'radio', 'combobox', 'slider', 'menuitem', 'tab', 'option']
  if (interactive.includes(role)) return true

  // Include structural elements
  const structural = ['heading', 'list', 'listitem', 'table', 'row', 'cell', 'img', 'article', 'figure']
  if (structural.includes(role)) return true

  // Include elements with explicit ARIA
  if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) return true

  return false
}

// Get heading level
function getHeadingLevel(element: Element): number | undefined {
  const match = element.tagName.match(/^H([1-6])$/i)
  if (match?.[1]) return parseInt(match[1], 10)
  const ariaLevel = element.getAttribute('aria-level')
  if (ariaLevel) return parseInt(ariaLevel, 10)
  return undefined
}

// Build the accessibility tree
function buildAccessibilityTree(root: Element, depth = 0): AccessibleNode[] {
  const nodes: AccessibleNode[] = []

  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT,
    {
      acceptNode: (node) => {
        const el = node as Element
        if (el.closest('[data-feedback-toolbar]')) return NodeFilter.FILTER_REJECT
        if (el.getAttribute('aria-hidden') === 'true') return NodeFilter.FILTER_REJECT
        const style = window.getComputedStyle(el)
        if (style.display === 'none') return NodeFilter.FILTER_REJECT
        return NodeFilter.FILTER_ACCEPT
      }
    }
  )

  let currentNode = walker.currentNode as Element

  // Process root if it's accessible
  if (isAccessibleElement(root)) {
    const role = root.getAttribute('role') || getImplicitRole(root)
    const name = getAccessibleName(root)
    const node: AccessibleNode = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role,
      name,
      states: getAccessibleStates(root),
      level: getHeadingLevel(root),
      children: [],
      element: root,
      warnings: getWarnings(root, role, name),
      depth,
    }
    nodes.push(node)
  }

  while (walker.nextNode()) {
    currentNode = walker.currentNode as Element

    if (!isAccessibleElement(currentNode)) continue

    const role = currentNode.getAttribute('role') || getImplicitRole(currentNode)
    const name = getAccessibleName(currentNode)

    const node: AccessibleNode = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      role,
      name,
      states: getAccessibleStates(currentNode),
      level: getHeadingLevel(currentNode),
      children: [],
      element: currentNode,
      warnings: getWarnings(currentNode, role, name),
      depth,
    }

    nodes.push(node)
  }

  return nodes
}

export function useScreenReaderPreview(): UseScreenReaderPreviewResult {
  const [nodes, setNodes] = useState<AccessibleNode[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePreview = useCallback(() => {
    setIsGenerating(true)

    // Use requestAnimationFrame to not block UI
    requestAnimationFrame(() => {
      const tree = buildAccessibilityTree(document.body)
      setNodes(tree)
      setIsGenerating(false)
    })
  }, [])

  const clearPreview = useCallback(() => {
    setNodes([])
  }, [])

  return {
    nodes,
    isGenerating,
    generatePreview,
    clearPreview,
  }
}

// Generate text script from nodes
export function generateTextScript(nodes: AccessibleNode[]): string {
  const lines: string[] = []

  for (const node of nodes) {
    let line = ''

    // Role
    if (node.role === 'heading' && node.level) {
      line += `[heading level ${node.level}]`
    } else {
      line += `[${node.role}]`
    }

    // States
    if (node.states.length > 0) {
      line += ` (${node.states.join(', ')})`
    }

    // Name
    if (node.name) {
      line += ` "${node.name}"`
    }

    // Warnings
    if (node.warnings.length > 0) {
      line += ` ⚠️ ${node.warnings.join(', ')}`
    }

    lines.push(line)
  }

  return lines.join('\n')
}
