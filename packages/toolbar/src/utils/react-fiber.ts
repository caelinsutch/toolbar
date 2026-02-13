import {
  type Fiber,
  getDisplayName,
  getFiberFromHostInstance,
  getLatestFiber,
  isCompositeFiber,
  traverseFiber,
} from 'bippy';

const REACT_INTERNAL_NAMES = new Set([
  'Fragment',
  'Suspense',
  'SuspenseList',
  'StrictMode',
  'Profiler',
  'Provider',
  'Consumer',
  'Context',
  'Portal',
  'ForwardRef',
  'Memo',
  'Lazy',
]);

const NEXTJS_INTERNAL_NAMES = new Set([
  'InnerLayoutRouter',
  'OuterLayoutRouter',
  'RedirectErrorBoundary',
  'RedirectBoundary',
  'HTTPAccessFallbackErrorBoundary',
  'HTTPAccessFallbackBoundary',
  'DevRootHTTPAccessFallbackBoundary',
  'LoadingBoundary',
  'ErrorBoundary',
  'ErrorBoundaryHandler',
  'InnerScrollAndFocusHandler',
  'ScrollAndFocusHandler',
  'RenderFromTemplateContext',
  'AppRouter',
  'Router',
  'HotReload',
  'ServerRoot',
  'SegmentStateProvider',
  'RootErrorBoundary',
  'AppDevOverlayErrorBoundary',
  'AppDevOverlay',
  'LoadableComponent',
  'MotionDOMComponent',
  'SegmentViewNode',
]);

function isUsefulComponentName(name: string | null | undefined): name is string {
  if (!name) return false;
  if (REACT_INTERNAL_NAMES.has(name)) return false;
  if (NEXTJS_INTERNAL_NAMES.has(name)) return false;
  if (name === 'Anonymous' || name === 'Component') return false;
  if (name.length === 1 && name === name.toLowerCase()) return false;
  if (name.startsWith('_')) return false;
  if (name.startsWith('Primitive.')) return false;
  if (name === 'Slot' || name === 'SlotClone') return false;
  return true;
}

function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  const seen = new WeakSet();

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children' || key.startsWith('__')) continue;
    if (typeof value === 'function') continue;
    if (value && typeof value === 'object' && '$$typeof' in value) continue;

    if (value && typeof value === 'object') {
      if (seen.has(value as object)) continue;
      seen.add(value as object);
    }

    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      sanitized[key] = value;
    } else if (Array.isArray(value) && value.length <= 5) {
      sanitized[key] = value.slice(0, 5);
    }
  }

  return sanitized;
}

export function getReactComponentName(element: Element): string | null {
  try {
    const fiber = getFiberFromHostInstance(element);
    if (!fiber) return null;

    const latestFiber = getLatestFiber(fiber);
    if (!latestFiber) return null;

    const componentFiber = traverseFiber(latestFiber, (f) => isCompositeFiber(f), true);

    if (!componentFiber) return null;

    const name = getDisplayName(componentFiber.type);
    return isUsefulComponentName(name) ? name : null;
  } catch {
    return null;
  }
}

export function getReactComponentHierarchy(element: Element, maxDepth = 10): string[] {
  try {
    const fiber = getFiberFromHostInstance(element);
    if (!fiber) return [];

    const latestFiber = getLatestFiber(fiber);
    if (!latestFiber) return [];

    const names: string[] = [];
    let current: Fiber | null = latestFiber.return;

    while (current && names.length < maxDepth) {
      if (isCompositeFiber(current)) {
        const name = getDisplayName(current.type);
        if (name && isUsefulComponentName(name)) {
          names.push(name);
        }
      }
      current = current.return;
    }

    return names;
  } catch {
    return [];
  }
}

export function getReactComponentInfo(element: Element): {
  componentName: string | null;
  hierarchy: string[];
  props: Record<string, unknown> | null;
} {
  try {
    const fiber = getFiberFromHostInstance(element);
    if (!fiber) {
      return { componentName: null, hierarchy: [], props: null };
    }

    const latestFiber = getLatestFiber(fiber);
    if (!latestFiber) {
      return { componentName: null, hierarchy: [], props: null };
    }

    const componentFiber = traverseFiber(latestFiber, (f) => isCompositeFiber(f), true);

    const componentName = componentFiber ? getDisplayName(componentFiber.type) : null;

    const hierarchy: string[] = [];
    let current: Fiber | null = latestFiber.return;
    while (current && hierarchy.length < 10) {
      if (isCompositeFiber(current)) {
        const name = getDisplayName(current.type);
        if (name && isUsefulComponentName(name)) {
          hierarchy.push(name);
        }
      }
      current = current.return;
    }

    let props: Record<string, unknown> | null = null;
    if (componentFiber?.memoizedProps) {
      props = sanitizeProps(componentFiber.memoizedProps);
    }

    return {
      componentName: componentName && isUsefulComponentName(componentName) ? componentName : null,
      hierarchy,
      props,
    };
  } catch {
    return { componentName: null, hierarchy: [], props: null };
  }
}
