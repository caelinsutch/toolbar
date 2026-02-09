import { createRoot } from 'react-dom/client';
import Toolbar from './components/toolbar';

interface CDNOptions {
  /** Keyboard shortcut to toggle the toolbar. Default: "Alt+t" */
  activationKey?: string;
  /** Initial position of the toolbar */
  position?: { x: number; y: number };
  /** Whether the toolbar starts expanded */
  defaultExpanded?: boolean;
  /** Container element ID to mount the toolbar. Creates one if not found */
  containerId?: string;
}

declare global {
  interface Window {
    AgentFeedback?: {
      mount: (options?: CDNOptions) => void;
      unmount: () => void;
    };
  }
}

let root: ReturnType<typeof createRoot> | null = null;
let container: HTMLElement | null = null;

function getScriptOptions(): CDNOptions {
  // Find the current script tag
  const scripts = document.querySelectorAll('script[src*="agent-feedback"], script[src*="index.global"]');
  const currentScript = scripts[scripts.length - 1] as HTMLScriptElement | undefined;

  if (currentScript?.dataset.options) {
    try {
      return JSON.parse(currentScript.dataset.options);
    } catch (e) {
      console.warn('[AgentFeedback] Failed to parse data-options:', e);
    }
  }

  return {};
}

function mount(options?: CDNOptions) {
  const opts = { ...getScriptOptions(), ...options };

  // Create or find container
  const containerId = opts.containerId || '__agent-feedback-root__';
  container = document.getElementById(containerId);

  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;';
    document.body.appendChild(container);
  }

  // Create React root and render
  root = createRoot(container);
  root.render(
    <div style={{ pointerEvents: 'auto' }}>
      <Toolbar />
    </div>
  );

  // Set up keyboard shortcut for activation
  if (opts.activationKey) {
    setupActivationKey(opts.activationKey);
  }
}

function unmount() {
  if (root) {
    root.unmount();
    root = null;
  }
  if (container && container.parentNode) {
    container.parentNode.removeChild(container);
    container = null;
  }
}

function setupActivationKey(key: string) {
  // Parse key combo like "Alt+t" or "Ctrl+Shift+t"
  const parts = key.toLowerCase().split('+');
  const mainKey = parts.pop() || '';
  const modifiers = {
    alt: parts.includes('alt'),
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd'),
  };

  let isVisible = true;

  document.addEventListener('keydown', (e) => {
    const matchesModifiers =
      e.altKey === modifiers.alt &&
      e.ctrlKey === modifiers.ctrl &&
      e.shiftKey === modifiers.shift &&
      e.metaKey === modifiers.meta;

    if (matchesModifiers && e.key.toLowerCase() === mainKey) {
      e.preventDefault();
      if (isVisible) {
        unmount();
        isVisible = false;
      } else {
        mount();
        isVisible = true;
      }
    }
  });
}

// Expose global API
window.AgentFeedback = { mount, unmount };

// Auto-mount when DOM is ready
function autoMount() {
  const opts = getScriptOptions();
  mount(opts);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoMount);
} else {
  autoMount();
}