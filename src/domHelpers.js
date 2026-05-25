export function show(el) {
  if (!(el instanceof HTMLElement)) return
  el.hidden = false
  el.setAttribute("aria-hidden", "false")
}

export function hide(el) {
  if (!(el instanceof HTMLElement)) return
  el.hidden = true
  el.setAttribute("aria-hidden", "true")
}

export function setHidden(el, isHidden) {
  if (isHidden) hide(el)
  else show(el)
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
