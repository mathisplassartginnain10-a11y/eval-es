/**
 * Variante « documentaire » pour l’étape 3 (sphère → sphéroïde oblate).
 * L’implémentation d’origine reste dans `sphereAnim.js` ; l’exposé utilise ce module.
 *
 * @param {HTMLElement} container
 * @param {{ embed?: boolean }} [opts]
 */
export function createSphereAnimPage3Stylish(container, opts = {}) {
  const embed = !!opts.embed

  container.innerHTML = `
<div class="sphere-anim-v2" role="img" aria-label="De la sphère idéale au sphéroïde oblate — rayons équatorial et polaire">
  <div class="sphere-anim-v2__frame">
    <canvas class="sphere-anim-v2__canvas" width="560" height="560"></canvas>
  </div>
  <div class="sphere-anim-v2__hud">
    <h2 class="sphere-anim-v2__title"></h2>
    <div class="sphere-anim-v2__cards">
      <div class="sphere-anim-v2__card sphere-anim-v2__card--eq">
        <span class="sphere-anim-v2__card-label">Rayon équatorial</span>
        <span class="sphere-anim-v2__card-val sphere-anim-v2__card-val--eq"></span>
      </div>
      <div class="sphere-anim-v2__card sphere-anim-v2__card--pol">
        <span class="sphere-anim-v2__card-label">Rayon polaire</span>
        <span class="sphere-anim-v2__card-val sphere-anim-v2__card-val--pol"></span>
      </div>
    </div>
  </div>
  ${embed ? "" : `<div class="sphere-anim-v2__btn-row">
    <button type="button" class="sphere-anim-v2__btn sphere-anim-v2__btn-play">Lancer</button>
    <button type="button" class="sphere-anim-v2__btn sphere-anim-v2__btn-reset">Réinitialiser</button>
  </div>`}
</div>`

  const root = container.querySelector(".sphere-anim-v2")
  const canvas = container.querySelector(".sphere-anim-v2__canvas")
  const elTitle = container.querySelector(".sphere-anim-v2__title")
  const elValEq = container.querySelector(".sphere-anim-v2__card-val--eq")
  const elValPol = container.querySelector(".sphere-anim-v2__card-val--pol")
  const btnPlay = container.querySelector(".sphere-anim-v2__btn-play")
  const btnReset = container.querySelector(".sphere-anim-v2__btn-reset")

  if (!(canvas instanceof HTMLCanvasElement) || !root || !elTitle || !elValEq || !elValPol) {
    throw new Error("createSphereAnimPage3Stylish: structure DOM incomplète")
  }

  const ctx = canvas.getContext("2d", { alpha: true })

  const EQ_START = 6371
  const EQ_END = 6378
  const POL_START = 6371
  const POL_END = 6357

  const RX_START = 118
  const RX_END = 142
  const RY_START = 118
  const RY_END = 98

  const DURATION = 4800

  /** Masses continentales / déserts (coords normalisées dans l’espace « cercle » avant scale) */
  const LAND_PATCHES = [
    { dx: -0.44, dy: -0.06, r: 0.4, c0: "rgba(48,112,52,0.88)", c1: "rgba(18,52,28,0.2)" },
    { dx: 0.32, dy: 0.18, r: 0.36, c0: "rgba(42,98,48,0.75)", c1: "rgba(12,40,24,0.12)" },
    { dx: 0.08, dy: -0.38, r: 0.28, c0: "rgba(110,92,58,0.55)", c1: "rgba(40,32,18,0.08)" },
    { dx: -0.12, dy: 0.35, r: 0.32, c0: "rgba(38,88,44,0.7)", c1: "rgba(10,35,22,0.1)" },
    { dx: 0.48, dy: -0.22, r: 0.22, c0: "rgba(52,96,50,0.5)", c1: "rgba(15,40,22,0.06)" },
  ]

  const CLOUD_PATCHES = [
    { dx: -0.15, dy: 0.12, r: 0.18, a: 0.14 },
    { dx: 0.22, dy: -0.28, r: 0.14, a: 0.11 },
    { dx: -0.35, dy: 0.28, r: 0.12, a: 0.1 },
  ]

  let _progress = 0
  let _playing = false
  let _startTs = null
  /** @type {number | null} */
  let _raf = null

  let W = 560
  let H = 560
  let CX = W / 2
  let CY = H / 2
  let dpr = 1

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  function lerp(a, b, t) {
    return a + (b - a) * t
  }

  function fmt(v) {
    return (
      Math.round(v)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") + " km"
    )
  }

  function resizeCanvas() {
    const frame = root?.querySelector(".sphere-anim-v2__frame")
    const cw = frame instanceof HTMLElement ? frame.clientWidth : container.clientWidth
    const side = Math.min(560, Math.max(260, cw || 360))
    dpr = Math.min(2, window.devicePixelRatio || 1)
    W = Math.round(side * dpr)
    H = Math.round(side * dpr)
    canvas.width = W
    canvas.height = H
    canvas.style.width = `${side}px`
    canvas.style.height = `${side}px`
    CX = W / 2
    CY = H / 2
  }

  function updateDOM(t, eq, pol) {
    elValEq.textContent = fmt(eq)
    elValPol.textContent = fmt(pol)
    if (t < 0.04) {
      elTitle.textContent = "Sphère de référence"
    } else if (t > 0.96) {
      elTitle.textContent = "Sphéroïde oblate"
    } else {
      elTitle.textContent = "Aplatissement progressif"
    }
  }

  /**
   * @param {number} t progression animation 0–1
   * @param {number} eq km
   * @param {number} pol km
   */
  function draw(t, eq, pol) {
    if (!ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const rx = lerp(RX_START, RX_END, t) * dpr
    const ry = lerp(RY_START, RY_END, t) * dpr
    const sx = rx / ry
    const cx = CX / sx

    /* Halo atmosphère très doux — se fond dans le fond de scène */
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(CX, CY, rx * 1.08, ry * 1.08, 0, 0, Math.PI * 2)
    const outer = ctx.createRadialGradient(CX, CY, ry * 0.82, CX, CY, ry * 1.22)
    outer.addColorStop(0, "rgba(80, 150, 220, 0)")
    outer.addColorStop(0.65, "rgba(40, 100, 180, 0.1)")
    outer.addColorStop(1, "rgba(10, 30, 60, 0)")
    ctx.fillStyle = outer
    ctx.fill()
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2)
    ctx.clip()

    ctx.save()
    ctx.scale(sx, 1)

    /* Océans */
    ctx.beginPath()
    ctx.arc(cx, CY, ry, 0, Math.PI * 2)
    const ocean = ctx.createRadialGradient(
      cx - ry * 0.42,
      CY - ry * 0.34,
      Math.max(2, ry * 0.06),
      cx + ry * 0.08,
      CY + ry * 0.12,
      ry * 1.05
    )
    ocean.addColorStop(0, "#6eb0d8")
    ocean.addColorStop(0.22, "#3d7dae")
    ocean.addColorStop(0.48, "#1d5682")
    ocean.addColorStop(0.78, "#0f3555")
    ocean.addColorStop(1, "#071f38")
    ctx.fillStyle = ocean
    ctx.fill()

    /* Continents / terres émergées */
    for (const L of LAND_PATCHES) {
      const gx = cx + L.dx * ry
      const gy = CY + L.dy * ry
      const gr = L.r * ry
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
      g.addColorStop(0, L.c0)
      g.addColorStop(0.55, L.c1)
      g.addColorStop(1, "rgba(0,0,0,0)")
      ctx.beginPath()
      ctx.arc(gx, gy, gr, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }

    /* Calotte nord / sud (glace) */
    const iceN = ctx.createLinearGradient(0, CY - ry, 0, CY - ry * 0.42)
    iceN.addColorStop(0, "rgba(248,252,255,0.42)")
    iceN.addColorStop(0.55, "rgba(200,220,235,0.08)")
    iceN.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = iceN
    ctx.fillRect(cx - ry * 1.3, CY - ry * 1.3, ry * 2.6, ry * 0.55)

    const iceS = ctx.createLinearGradient(0, CY + ry * 0.42, 0, CY + ry)
    iceS.addColorStop(0, "rgba(255,255,255,0)")
    iceS.addColorStop(0.45, "rgba(210,228,240,0.1)")
    iceS.addColorStop(1, "rgba(248,252,255,0.38)")
    ctx.fillStyle = iceS
    ctx.fillRect(cx - ry * 1.3, CY + ry * 0.38, ry * 2.6, ry * 0.62)

    /* Côté nuit (terminateur) */
    const night = ctx.createLinearGradient(cx - ry * 1.15, 0, cx + ry * 0.45, 0)
    night.addColorStop(0, "rgba(2, 4, 18, 0.78)")
    night.addColorStop(0.28, "rgba(8, 24, 48, 0.35)")
    night.addColorStop(0.52, "rgba(0, 40, 70, 0.08)")
    night.addColorStop(1, "rgba(0, 0, 0, 0)")
    ctx.fillStyle = night
    ctx.fillRect(cx - ry * 1.25, CY - ry * 1.25, ry * 1.35, ry * 2.5)

    /* Nuages */
    ctx.globalCompositeOperation = "screen"
    for (const c of CLOUD_PATCHES) {
      const gx = cx + c.dx * ry
      const gy = CY + c.dy * ry
      const gr = c.r * ry
      const cg = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
      cg.addColorStop(0, `rgba(255,255,255,${c.a})`)
      cg.addColorStop(0.5, `rgba(255,255,255,${c.a * 0.35})`)
      cg.addColorStop(1, "rgba(255,255,255,0)")
      ctx.beginPath()
      ctx.arc(gx, gy, gr, 0, Math.PI * 2)
      ctx.fillStyle = cg
      ctx.fill()
    }
    ctx.globalCompositeOperation = "source-over"

    /* Reflet solaire sur l’océan */
    ctx.globalCompositeOperation = "lighter"
    const glint = ctx.createRadialGradient(
      cx - ry * 0.52,
      CY - ry * 0.42,
      0,
      cx - ry * 0.38,
      CY - ry * 0.32,
      ry * 0.28
    )
    glint.addColorStop(0, "rgba(255,255,255,0.38)")
    glint.addColorStop(0.35, "rgba(200,230,255,0.12)")
    glint.addColorStop(1, "rgba(255,255,255,0)")
    ctx.beginPath()
    ctx.arc(cx - ry * 0.38, CY - ry * 0.32, ry * 0.28, 0, Math.PI * 2)
    ctx.fillStyle = glint
    ctx.fill()
    ctx.globalCompositeOperation = "source-over"

    ctx.restore() /* scale */
    ctx.restore() /* clip */

    /* Contour très discret (limbe atmosphérique) */
    ctx.save()
    ctx.beginPath()
    ctx.ellipse(CX, CY, rx, ry, 0, 0, Math.PI * 2)
    ctx.strokeStyle = "rgba(130, 185, 255, 0.16)"
    ctx.lineWidth = Math.max(1, dpr * 0.9)
    ctx.stroke()
    ctx.restore()

    updateDOM(t, eq, pol)
  }

  function step(ts) {
    if (!_startTs) _startTs = ts
    const raw = Math.min((ts - _startTs) / DURATION, 1)
    _progress = ease(raw)
    const eq = lerp(EQ_START, EQ_END, _progress)
    const pol = lerp(POL_START, POL_END, _progress)
    draw(_progress, eq, pol)
    if (raw < 1) {
      _raf = requestAnimationFrame(step)
    } else {
      _playing = false
      if (btnPlay) btnPlay.textContent = "Lancer"
    }
  }

  const api = {
    play() {
      if (_playing) return
      _playing = true
      _startTs = null
      if (btnPlay) btnPlay.textContent = "Lecture…"
      _raf = requestAnimationFrame(step)
    },

    reset() {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      _startTs = null
      _progress = 0
      if (btnPlay) btnPlay.textContent = "Lancer"
      draw(0, EQ_START, POL_START)
    },

    seek(t) {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      _progress = Math.max(0, Math.min(1, t))
      const eq = lerp(EQ_START, EQ_END, _progress)
      const pol = lerp(POL_START, POL_END, _progress)
      draw(_progress, eq, pol)
    },

    isPlaying() {
      return _playing
    },

    destroy() {
      if (_raf != null) cancelAnimationFrame(_raf)
      _raf = null
      _playing = false
      window.removeEventListener("resize", onResize)
      container.replaceChildren()
    },
  }

  function onResize() {
    resizeCanvas()
    const eq = lerp(EQ_START, EQ_END, _progress)
    const pol = lerp(POL_START, POL_END, _progress)
    draw(_progress, eq, pol)
  }

  window.addEventListener("resize", onResize)
  resizeCanvas()
  if (btnPlay) btnPlay.addEventListener("click", () => api.play())
  if (btnReset) btnReset.addEventListener("click", () => api.reset())

  draw(0, EQ_START, POL_START)

  return api
}
