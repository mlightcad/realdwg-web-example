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

export const formatPropValue = (value: unknown): string => {
  if (value == null) return '—'
  if (typeof value === 'string') return value || '—'
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'object') {
    const maybeColor = value as AcCmColor
    if (
      typeof maybeColor.toString === 'function' &&
      'red' in maybeColor &&
      'colorIndex' in maybeColor
    ) {
      return formatColor(maybeColor)
    }
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
