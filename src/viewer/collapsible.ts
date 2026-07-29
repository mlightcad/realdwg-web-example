/**
 * Creates a left-sidebar section with a clickable header that toggles content.
 */
export const createCollapsibleSection = (options: {
  title: string
  className?: string
  expanded?: boolean
  storageKey?: string
}): {
  root: HTMLElement
  body: HTMLElement
  setExpanded: (expanded: boolean) => void
  isExpanded: () => boolean
} => {
  const expandedByDefault = options.expanded ?? true
  let expanded = options.storageKey
    ? readStoredExpanded(options.storageKey, expandedByDefault)
    : expandedByDefault

  const root = document.createElement('section')
  root.className = `collapsible${options.className ? ` ${options.className}` : ''}`
  root.dataset.expanded = expanded ? 'true' : 'false'

  const header = document.createElement('button')
  header.type = 'button'
  header.className = 'collapsible-header'
  header.setAttribute('aria-expanded', expanded ? 'true' : 'false')

  const chevron = document.createElement('span')
  chevron.className = 'collapsible-chevron'
  chevron.setAttribute('aria-hidden', 'true')

  const label = document.createElement('span')
  label.className = 'collapsible-title'
  label.textContent = options.title

  header.appendChild(chevron)
  header.appendChild(label)

  const body = document.createElement('div')
  body.className = 'collapsible-body'
  body.hidden = !expanded

  header.addEventListener('click', () => {
    setExpanded(!expanded)
  })

  root.appendChild(header)
  root.appendChild(body)

  const setExpanded = (next: boolean) => {
    expanded = next
    root.dataset.expanded = next ? 'true' : 'false'
    header.setAttribute('aria-expanded', next ? 'true' : 'false')
    body.hidden = !next
    if (options.storageKey) {
      try {
        sessionStorage.setItem(options.storageKey, next ? '1' : '0')
      } catch {
        // ignore quota / private mode
      }
    }
  }

  return {
    root,
    body,
    setExpanded,
    isExpanded: () => expanded
  }
}

const readStoredExpanded = (key: string, fallback: boolean): boolean => {
  try {
    const value = sessionStorage.getItem(key)
    if (value === '1') return true
    if (value === '0') return false
  } catch {
    // ignore
  }
  return fallback
}
