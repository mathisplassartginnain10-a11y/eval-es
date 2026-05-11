/**
 * Fond d’étape : soit une image fixe, soit une vidéo qui lit tant que l’utilisateur ne swipe pas.
 * - Image : <video> masquée et mise en pause.
 * - Vidéo : lecture après changement d’étape ; si tu reviens sur la même source sans changer de fichier, on ne remet pas currentTime à 0 (sauf option restart).
 */

/**
 * @typedef {{ type: "image" | "video", url: string, loop?: boolean, restartOnReenter?: boolean }} SlideMedia
 */

/**
 * @param {HTMLVideoElement} videoEl
 * @param {HTMLImageElement} imgEl
 * @param {{ reducedMotion: boolean }} opts
 */
export function createSlideStage(videoEl, imgEl, opts) {
  videoEl.setAttribute("playsinline", "")
  videoEl.setAttribute("webkit-playsinline", "")
  videoEl.playsInline = true
  videoEl.muted = true
  videoEl.preload = "auto"

  /** @type {string | null} */
  let activeVideoSrc = null

  function hideVideo() {
    videoEl.pause()
    videoEl.removeAttribute("src")
    videoEl.load()
    activeVideoSrc = null
    videoEl.classList.add("stage-video--hidden")
    videoEl.setAttribute("aria-hidden", "true")
  }

  function hideImage() {
    imgEl.removeAttribute("src")
    imgEl.alt = ""
    imgEl.hidden = true
    imgEl.classList.add("stage-image--hidden")
  }

  function stripEnterClass() {
    videoEl.classList.remove("stage-media-enter")
    imgEl.classList.remove("stage-media-enter")
  }

  /** @param {HTMLElement} el */
  function playEnterAnimation(el) {
    if (opts.reducedMotion) return
    stripEnterClass()
    void el.offsetWidth
    requestAnimationFrame(() => {
      el.classList.add("stage-media-enter")
    })
  }

  /**
   * @param {SlideMedia} m
   */
  function apply(m) {
    stripEnterClass()

    const url = m.url && String(m.url).trim()
    const loop = !!m.loop

    if (m.type === "image") {
      hideVideo()
      imgEl.hidden = false
      imgEl.classList.remove("stage-image--hidden")
      imgEl.src = url || ""
      imgEl.alt = ""
      if (url) playEnterAnimation(imgEl)
      return
    }

    /* vidéo */
    hideImage()
    videoEl.classList.remove("stage-video--hidden")
    videoEl.setAttribute("aria-hidden", "false")
    videoEl.loop = loop

    if (!url) {
      hideVideo()
      return
    }

    const sameFile = activeVideoSrc === url
    if (sameFile) {
      if (m.restartOnReenter) {
        try {
          videoEl.currentTime = 0
        } catch {
          /* ignore */
        }
      }
      if (!opts.reducedMotion) {
        void videoEl.play().catch(() => {})
      }
      return
    }

    activeVideoSrc = url
    videoEl.src = url
    videoEl.load()
    playEnterAnimation(videoEl)
    if (!opts.reducedMotion) {
      void videoEl.play().catch(() => {})
    }
  }

  function pause() {
    videoEl.pause()
  }

  return { apply, pause }
}
