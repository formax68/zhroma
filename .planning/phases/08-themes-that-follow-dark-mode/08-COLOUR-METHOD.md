# Phase 08 colour method

The settled pipeline is encoded sRGB native row over opaque pane, then translucent cell tint over that row. Only the final RGB is decoded for contrast, original Oklab, or simulation. No raw-swatch acceptance is made.

## Primary evidence and identity

- [W3C compositing](https://www.w3.org/TR/compositing-1/#simplealphacompositing): source-over, opaque backdrop `out = alpha * source + (1-alpha) * backdrop`.
- [W3C CSS Color 4 pinned snapshot](https://www.w3.org/TR/2026/CRD-css-color-4-20261007/#color-conversion-code): decode normalized nonnegative sRGB `c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4`; encode clipped linear `x <= .0031308 ? 12.92*x : 1.055*x**(1/2.4)-.055`.
- [Ottosson original Oklab](https://bottosson.github.io/posts/oklab/): original 2021 matrices, cube roots, Euclidean distance multiplied by 100. Newer distance variants are not substituted.
- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): luminance coefficients .2126/.7152/.0722; `(max+.05)/(min+.05)`.
- [Machado corrected paper](https://profs.ic.uff.br/~laffernandes/content/publications/journal/2009_tvcg_15%286%29/machado_oliveira_fernandes-tvcg-15%286%29-2009-corrected.pdf): §4.1/PDF p.4 Eq.8 projects primary spectral power onto opponent bases; Eqs.10–11 compose linear transforms; §4.3/PDF p.6 Eq.24 gives the simulation operator. Applying that spectral-power operator to linear-light primary contributions is the project's mathematical inference. The paper does not supply a browser sRGB recipe. §5.1/PDF p.6 Gamma 2.2 describes experimental monitor calibration, not an alternative browser transfer formula.
- [Author severity supplement](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html): severity 1.0 protan/deutan matrices. Retained cached bytes rehashed to research SHA256 `379c549025f91ac05a611631114ff8202fa2d802bc29e15f79479c7985373346`. No corrected-paper hash was provided; none is invented.

Simulation: final encoded RGB → exact W3C decode → severity-1 matrix → clamp each linear channel to [0,1] → exact W3C encode → original Oklab. Matrices and reports are developer-only, locally authored from the primary equations. Severity 0 is exact identity; unsupported severity is refused. Clipping is the project's display policy.

## Independent golden checks

Fixed red Oklab `(0.6279553606,0.2248630611,0.1258462985)` and severity-1 red protan `(108.78516029,95.02684074,0)`, deutan `(163.21518658,144.28077001,0)` come from the pinned research's independent calculation. Additional vectors were calculated directly from primary decimal coefficients with Python Decimal at 45-digit precision, independently of JavaScript helpers:

| Input | Protan RGB | Deutan RGB |
|---|---|---|
| blue `(0,0,255)` | `(0,88.70604067238163,255)` | `(0,61.49869648978854,251.47956328953418)` |
| white `(255,255,255)` | `(255,255,255)` | `(255,254.9998879062173,255)` |
| black | `(0,0,0)` | `(0,0,0)` |

Blue exercises both negative and >1 linear clipping. White preserves the primary matrix's rounding rather than forcibly replacing its result with white. Test tolerances apply only to independently rounded golden vectors, never general acceptance floors. Alpha 0/1, independent layer-order disagreement and black/white contrast 21 are also executed. The oracle rejects duplicate mapped priorities, nonfinite/nonnumeric inputs, missing slots, unknown case-sensitive slot names and empty source records. Exact numeric fractional channels are allowed.

## Acceptance policy

Fixed measured surfaces: light pane `[255,255,255]`, text `[41,50,57]`, native `[31,115,183]`; dark pane `[21,26,30]`, text `[216,220,222]`, native `[102,160,205]`. Normal/hover/selected native alphas are 0/.08/.16. Priority order Urgent/High/Normal/Low. Pair order U/H, U/N, U/L, H/N, H/L, N/L. Exact eight slots red/orange/yellow/green/cyan/blue/purple/magenta in both modes.

Every new rendered priority pair ≥3; each priority versus same-state untinted row ≥2; every normal→hover and hover→selected transition ≥2; measured actual text contrast ≥4.5. All values use full floating precision. Equality passes; a below-floor value fails even when it rounds to the floor for display. For Colourblind-safe, pair/untinted/native checks also run after both severity-1 simulations; L strictly increases Urgent→Low in light and strictly decreases in dark in every state and simulation. Actual-text contrast is evaluated on actual RGB, not misrepresented as a physiological text-recognition measurement.

Classic light alone is grandfathered: exact numerical RGBA equality with Git baseline `6d3ab0b10e9419a5c1077e59e468977c00d59d4a` plus its six individual pair floors and four individual untinted floors in EACH native state. `classicFloors` reads the independently hash-checked immutable baseline through `scripts/baseline-source.js`; it never reads the new palette. The permitted 1e-6 tolerance applies only to these 30 baseline comparisons. Contrast/native gates stay unchanged; Classic dark gets no exception. Literal drift fails even within the floor tolerance.

These are project engineering screens. The pinned CSS Color draft's .02 original-Oklab gamut JND reference motivates the scale, while the project's pair floor adds a margin. They do not establish universal readability or at-a-glance performance. A descriptive brand implies no endorsement. “Colourblind-safe” means the named simulation cases passed; it cannot establish accessibility for every person or visual condition.

## Executed evidence and limits

`test/extension/theme-colour.test.js` executes independent vectors, exact-floor/below-floor controls, malformed inputs, exact Classic identity and accepted catalog checks. The required Task 1 command passed with no skips. All final palettes must separately pass this oracle; research feasibility prototypes cannot admit data. Actual flattened Chrome pixels, other text styles and human hover/selection/focus/sticky-header recognition remain 08-05 verification work. Phase 6 custody/human gaps and Phase 7 review dispositions remain open where recorded.
