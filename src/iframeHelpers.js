function resolveTargetOrigin() {
  const origin = typeof window !== "undefined" ? window.location?.origin : null
  if (!origin || origin === "null") return "*"
  return origin
}

export function postToFrame(target, msg) {
  if (!target) return
  const win = target instanceof HTMLIFrameElement ? target.contentWindow : target
  if (!win) return
  win.postMessage(msg, resolveTargetOrigin())
}

export function postToFrameById(id, msg) {
  postToFrame(document.getElementById(id), msg)
}
