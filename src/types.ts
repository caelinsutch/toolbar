export interface Annotation {
  id: string
  x: number
  y: number
  comment: string
  element: string
  elementPath: string
  timestamp: number
  selectedText?: string
  boundingBox?: {
    x: number
    y: number
    width: number
    height: number
  }
  nearbyText?: string
  cssClasses?: string
  isFixed?: boolean
}
