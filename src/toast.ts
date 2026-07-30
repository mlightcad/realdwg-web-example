const DISMISS_MS = 5000

let hideTimer: ReturnType<typeof setTimeout> | null = null

const getRoot = (): HTMLElement => {
  let root = document.getElementById('toastRoot')
  if (!root) {
    root = document.createElement('div')
    root.id = 'toastRoot'
    root.className = 'toast-root'
    root.setAttribute('aria-live', 'polite')
    document.body.appendChild(root)
  }
  return root
}

export const showToast = (
  message: string,
  kind: 'error' | 'ok' = 'error'
): void => {
  const root = getRoot()
  root.replaceChildren()

  const toast = document.createElement('div')
  toast.className = `toast toast-${kind}`
  toast.setAttribute('role', kind === 'error' ? 'alert' : 'status')

  const text = document.createElement('div')
  text.className = 'toast-message'
  text.textContent = message

  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'toast-close'
  close.setAttribute('aria-label', 'Dismiss')
  close.textContent = '×'
  close.addEventListener('click', () => hideToast())

  toast.append(text, close)
  root.appendChild(toast)

  // Force reflow so the enter transition runs.
  void toast.offsetWidth
  toast.classList.add('toast-visible')

  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => hideToast(), DISMISS_MS)
}

export const hideToast = (): void => {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  const root = document.getElementById('toastRoot')
  const toast = root?.querySelector('.toast')
  if (!toast || !root) return

  toast.classList.remove('toast-visible')
  const remove = () => {
    root.replaceChildren()
  }
  toast.addEventListener('transitionend', remove, { once: true })
  // Fallback if transitionend does not fire.
  setTimeout(remove, 300)
}
