/**
 * Textes par étape (clés step01…step07) — contenu de l’exposé.
 * Médias : `docs/media/` + `src/sections.js` (image ou vidéo par étape).
 * `bodyHtml` : corps enrichi (formules, emphase) ; sinon `paragraphes` (texte simple).
 */

function step(rubrique, titre, paragraphes, credit = "", extras = {}) {
  return { rubrique, titre, sousTitre: "", paragraphes, credit, ...extras }
}

export const CONTENT = {
  step01: step(
    "",
    "LA TERRE N'EST PAS RONDE",
    [],
    "",
    {
      titleUnderline: true,
      introPoster: true,
      sommaire: true,
      sommaireItems: [
        { part: "Première partie", titre: "L'expérience d'Eratosthène", scrollIndex: 1 },
        { part: "Seconde partie", titre: "Les irrégularités de Surface", scrollIndex: 2 },
        { part: "Troisième partie", titre: "La gravité et la forme de la Terre", scrollIndex: 3 },
        { part: "Quatrième partie", titre: "Les modifications topographiques", scrollIndex: 4 },
        { part: "Cinquième partie", titre: "Conclusion", scrollIndex: 5 },
      ],
    }
  ),
  step02: step(
    "Première partie :",
    "L'expérience d'Eratosthène",
    [],
    "",
    {
      titleUnderline: true,
      partTitle: true,
      bodyHtml: `
<p class="text-overlay__p">Ératosthène compare l'ombre au solstice d'été entre Syène et Alexandrie.</p>
<p class="text-overlay__p">Syène 24° Nord, Alexandrie 31° Nord.</p>
<p class="text-overlay__p">Différence d'ombre → courbure de la Terre.</p>
<p class="text-overlay__p">7,2° mesurés d'écart.</p>
<p class="text-overlay__p text-overlay__p--formula">
  <span class="text-overlay__frac">
    <span class="text-overlay__frac-num">distance entre les deux villes</span>
    <span class="text-overlay__frac-den">circonférence de la Terre</span>
  </span>
  <span class="text-overlay__formula-eq">=</span>
  <span class="text-overlay__frac">
    <span class="text-overlay__frac-num">angle entre les rayons du soleil aux deux villes</span>
    <span class="text-overlay__frac-den">360°</span>
  </span>
</p>
<p class="text-overlay__p">Circonférence mesurée : 250 000 stades → environ 40 000 km.</p>
<p class="text-overlay__p">Circonférence réelle : 40 075 km.</p>`.trim(),
    }
  ),
  step03: step(
    "Seconde partie :",
    "Les irrégularités de Surface",
    [],
    "",
    {
      partTitle: true,
      bodyHtml: `
<p class="text-overlay__p">Aplatissement au pôles.</p>
<p class="text-overlay__p">La cause est la <strong>rotation terrestre</strong>.</p>
<p class="text-overlay__p">La Terre génère une force centrifuge qui pousse la matière vers l'extérieur.</p>
<p class="text-overlay__p">Découvert par Newton en 1687.</p>`.trim(),
    }
  ),
  step04: step(
    "Troisième partie :",
    "La gravité et la forme de la Terre",
    [],
    "",
    {
      partTitle: true,
      bodyHtml: `
<p class="text-overlay__p text-overlay__p--formula text-overlay__p--formula-inline">U(r) = −GMm / r</p>
<p class="text-overlay__p">Formule de l'énergie potentielle gravitationnelle :</p>
<p class="text-overlay__p">cause → rapprochement de la matière.</p>
<p class="text-overlay__p">conséquence → uniquement la forme sphérique est possible.</p>`.trim(),
    }
  ),
  step05: step(
    "Quatrième partie :",
    "Les modifications topographiques",
    [],
    "",
    {
      partTitle: true,
      bodyHtml: `
<p class="text-overlay__p">Everest : 8 849 mètres.</p>
<p class="text-overlay__p">Fosse des Mariannes : −11 034 mètres.</p>
<p class="text-overlay__p">Différence d'environ 20 km, soit 0,3 % du rayon terrestre.</p>`.trim(),
    }
  ),
  step06: step(
    "Conclusion :",
    "",
    [
      "Circonférence d'Ératosthène : 250 000 stades (≈ 40 075 km).",
      "Aplatissement au pôle : lié à la rotation terrestre.",
      "Gravitation : seule la sphère est stable (U(r) = −GMm / r).",
      "Relief terrestre : ~20 km d'écart, soit 0,3 % du rayon.",
    ],
    "",
    { partTitle: true }
  ),
  step07: step("", "Merci de votre écoute", [], "", { epilogue: true }),
}

/** Libellés des points de navigation */
export const SECTION_LABELS = [
  "Sommaire",
  "Première partie :",
  "Seconde partie :",
  "Troisième partie :",
  "Quatrième partie :",
  "Conclusion",
]
