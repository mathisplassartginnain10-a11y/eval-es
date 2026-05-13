/**
 * Fond d’étape : soit une image fixe, soit une vidéo qui lit tant que l’utilisateur ne swipe pas.
 * - Image : <video> masquée et mise en pause.
 * - Vidéo : lecture après changement d’étape ; si tu reviens sur la même source sans changer de fichier, on ne remet pas currentTime à 0 (sauf option restart).
 */

/**
 * @typedef {{ type: "image" | "video", url: string, loop?: boolean, loopSkipTailSec?: number, restartOnReenter?: boolean }} SlideMedia
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

  /** @type {{ timeupdate: (() => void) | null, ended: (() => void) | null }} */
  let seamlessLoop = { timeupdate: null, ended: null }

  function detachSeamlessLoop() {
    if (seamlessLoop.timeupdate) {
      videoEl.removeEventListener("timeupdate", seamlessLoop.timeupdate)
      seamlessLoop.timeupdate = null
    }
    if (seamlessLoop.ended) {
      videoEl.removeEventListener("ended", seamlessLoop.ended)
      seamlessLoop.ended = null
    }
  }

  /**
   * Boucle sans passer par la toute fin du fichier (souvent 1 image en trop ou micro-pause navigateur).
   * @param {number} skipTailSec
   */
  function attachSeamlessLoop(skipTailSec) {
    detachSeamlessLoop()
    const onTime = () => {
      const d = videoEl.duration
      if (!Number.isFinite(d) || d <= 0 || skipTailSec <= 0) return
      if (videoEl.currentTime >= d - skipTailSec) {
        videoEl.currentTime = 0
        if (!opts.reducedMotion) void videoEl.play().catch(() => {})
      }
    }
    const onEnded = () => {
      try {
        videoEl.currentTime = 0
      } catch {
        /* ignore */
      }
      if (!opts.reducedMotion) void videoEl.play().catch(() => {})
    }
    seamlessLoop.timeupdate = onTime
    seamlessLoop.ended = onEnded
    videoEl.addEventListener("timeupdate", onTime)
    videoEl.addEventListener("ended", onEnded)
  }

  function hideVideo() {
    detachSeamlessLoop()
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
    const skipTail =
      typeof m.loopSkipTailSec === "number" &&
      Number.isFinite(m.loopSkipTailSec) &&
      m.loopSkipTailSec > 0
        ? m.loopSkipTailSec
        : 0
    const manualLoop = loop && skipTail > 0

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
      videoEl.loop = loop && !manualLoop
      if (manualLoop) {
        if (!seamlessLoop.timeupdate) attachSeamlessLoop(skipTail)
      } else {
        detachSeamlessLoop()
      }
      if (!opts.reducedMotion) {
        void videoEl.play().catch(() => {})
        playEnterAnimation(videoEl)
      }
      return
    }

    detachSeamlessLoop()
    activeVideoSrc = url
    videoEl.src = url
    videoEl.load()
    videoEl.loop = loop && !manualLoop
    if (manualLoop) attachSeamlessLoop(skipTail)
    playEnterAnimation(videoEl)
    if (!opts.reducedMotion) {
      void videoEl.play().catch(() => {})
    }
  }

  function pause() {
    videoEl.pause()
  }

  function clear() {
    stripEnterClass()
    hideVideo()
    hideImage()
  }

  return { apply, pause, clear }
}
