export interface Annotation {
  id: string;
  x: number;
  y: number;
  comment: string;
  element: string;
  elementPath: string;
  timestamp: number;
  selectedText?: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  nearbyText?: string;
  cssClasses?: string;
  isFixed?: boolean;
}

export interface LayoutShiftRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LayoutShiftSource {
  node: Element | null;
  nodeSelector?: string;
  previousRect: LayoutShiftRect;
  currentRect: LayoutShiftRect;
}

export interface LayoutShift {
  id: string;
  value: number;
  timestamp: number;
  hadRecentInput: boolean;
  sources: LayoutShiftSource[];
  description?: string;
  scrollY: number;
}

export type AccessibilityImpact = 'critical' | 'serious' | 'moderate' | 'minor';

export interface AccessibilityIssue {
  id: string;
  ruleId: string;
  impact: AccessibilityImpact;
  description: string;
  help: string;
  helpUrl: string;
  element: Element | null;
  elementSelector: string;
  elementHtml: string;
  failureSummary: string;
  wcagTags: string[];
  timestamp: number;
}

export interface RecordedAccessibilityState {
  id: string;
  name: string;
  timestamp: number;
  issues: AccessibilityIssue[];
}
