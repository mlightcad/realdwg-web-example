import type { AcCmColor } from '@mlightcad/data-model'

export const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export const formatMs = (ms: number): string => `${ms.toFixed(0)} ms`

export const formatNumber = (value: number): string => value.toLocaleString()

export const colorToCss = (color: AcCmColor | undefined): string | null => {
  if (!color) return null
  const r = color.red
  const g = color.green
  const b = color.blue
  if (r == null || g == null || b == null) return null
  return `rgb(${r}, ${g}, ${b})`
}

export const formatColor = (color: AcCmColor | undefined): string => {
  if (!color) return '—'
  return color.toString() || '—'
}

const isPointLike = (
  value: object
): value is { x: number; y: number; z?: number } =>
  'x' in value &&
  'y' in value &&
  typeof (value as { x: unknown }).x === 'number' &&
  typeof (value as { y: unknown }).y === 'number'

export const isColorValue = (value: unknown): value is AcCmColor => {
  if (!value || typeof value !== 'object') return false
  const maybeColor = value as AcCmColor
  return (
    typeof maybeColor.toString === 'function' &&
    'red' in maybeColor &&
    'colorIndex' in maybeColor
  )
}

const formatPointLike = (value: {
  x: number
  y: number
  z?: number
}): string =>
  value.z == null ? `${value.x}, ${value.y}` : `${value.x}, ${value.y}, ${value.z}`

/** Keep primitives as JSON types; only rewrite special nested values. */
const propJsonReplacer = (_key: string, nested: unknown): unknown => {
  if (nested instanceof Uint8Array) {
    return nested.length === 0 ? '—' : `${nested.length} bytes`
  }
  if (nested && typeof nested === 'object' && !Array.isArray(nested) && isPointLike(nested)) {
    return formatPointLike(nested)
  }
  if (isColorValue(nested)) {
    return formatColor(nested)
  }
  return nested
}

export const formatPropValue = (value: unknown): string => {
  if (value == null) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    if (value instanceof Uint8Array) {
      return value.length === 0 ? '—' : `${value.length} bytes`
    }
    if (isColorValue(value)) {
      return formatColor(value)
    }
    if (isPointLike(value)) {
      return formatPointLike(value)
    }
    try {
      return JSON.stringify(value, propJsonReplacer)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
