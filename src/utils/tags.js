const CLOSE_TAG_EVENT = 'tags-view:close'

export function emitCloseTag(path) {
  if (!path || typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent(CLOSE_TAG_EVENT, {
    detail: { path }
  }))
}

export function addCloseTagListener(handler) {
  if (typeof window === 'undefined' || typeof handler !== 'function') return () => { }

  const listener = event => {
    handler(event?.detail?.path)
  }

  window.addEventListener(CLOSE_TAG_EVENT, listener)

  return () => {
    window.removeEventListener(CLOSE_TAG_EVENT, listener)
  }
}
