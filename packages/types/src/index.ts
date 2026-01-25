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
  scrollY: number; // Scroll position when shift was detected
}
