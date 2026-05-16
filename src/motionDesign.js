/**
 * Langage d’animation partagé — courbes et durées cohérentes sur tout l’exposé.
 */

export const MOTION = {
  ease: {
    out: "power3.out",
    in: "power2.in",
    inOut: "power2.inOut",
    settle: "expo.out",
    soft: "sine.inOut",
    drift: "sine.out",
  },
  /** Durée du warp stellaire (synchronisée avec la transition). */
  warpSec: 1.2,
  alpha: {
    /** Pendant le pic du warp : le contenu reste visible en silhouette. */
    dim: 0.38,
    /** Début de l’apparition de la nouvelle étape. */
    reveal: 0.78,
    /** Jamais en dessous pendant un fondu. */
    floor: 0.28,
  },
  dur: {
    pageExit: (ipad) => (ipad ? 0.28 : 0.32),
    pageReveal: (ipad) => (ipad ? 0.65 : 0.75),
    pageOverlap: (ipad) => (ipad ? 0.12 : 0.14),
    miniTotal: (ipad) => (ipad ? 0.44 : 0.52),
    mediaEnter: (ipad) => (ipad ? 0.82 : 0.96),
    iframeCrossfade: 0.85,
    navPulse: 0.42,
  },
  offset: {
    textY: 5,
    mediaY: 6,
    mediaScaleOut: 0.992,
    mediaScaleIn: 0.988,
  },
}

export function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/** @param {boolean} isBack */
export function layerShift(isBack) {
  const s = isBack ? -1 : 1
  return {
    textY: MOTION.offset.textY * s,
    mediaY: MOTION.offset.mediaY * s,
  }
}
