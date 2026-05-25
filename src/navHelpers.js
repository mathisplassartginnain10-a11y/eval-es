export function createNavState() {
  return { locked: false, lastTime: 0 }
}

export function canNavigate(navState, delayMs) {
  if (navState.locked) return false
  if (Date.now() - navState.lastTime < delayMs) return false
  return true
}

export function withNavLock(navState, delayMs, fn) {
  navState.locked = true
  navState.lastTime = Date.now()
  fn()
  window.setTimeout(() => {
    navState.locked = false
  }, delayMs)
}
