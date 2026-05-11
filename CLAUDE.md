# CLAUDE.md — Build Guide for `index8.html`

This document describes how the current production version (`index8.html`) is built. It is restricted to what is actually present in the file.

## Project type

Single-page WebGL application. No build system, no bundler, no package manager. Two external image assets (`earth.jpg`, `earth_night.jpg`) are loaded at runtime — must be served via HTTP (CORS forbids local `file://` cross-origin loads in modern browsers).

- Current build: `C:\Dropbox\UP\PROJECTs\_test\test_claude_1\index8.html`
- External assets:
  - `earth.jpg` — NASA Blue Marble Next Generation, 2048×1024 (POT)
  - `earth_night.jpg` — NASA Earth at Night 2012, 2048×1024 (POT)
- Earlier iterations preserved: `index1.html` through `index7.html` plus `index.html` / `index3.html` (procedural v3)

## Runtime stack

- HTML5 + CSS3 + vanilla JavaScript (ES6+, IIFE, strict mode)
- WebGL 1.0 with raw GLSL shaders (no Three.js or any other library)
- Canvas 2D API used only for the star background

## DOM layout

- `<canvas id="bg">` — Canvas 2D layer for the star field (z-index 1)
- `<canvas id="gl">` — WebGL layer for the globe (z-index 2)
- `<div id="hud">` — fixed center HUD with `#time`, `#date`, `#timezone` (z-index 3, `pointer-events: none`)

CSS uses `clamp()` for fluid font sizes, `backdrop-filter: blur()` for the clock card, and a radial-gradient body background.

## Configuration constants

| Constant | Value | Purpose |
|---|---|---|
| `EARTH_TEXTURE_URL` | `'./earth.jpg'` | Day-side equirectangular texture |
| `EARTH_NIGHT_URL` | `'./earth_night.jpg'` | Night-side Black Marble texture |
| `EARTH_FLATTENING` | `1 / 298.257223563` | WGS84 polar flattening (~0.335%) |
| `ROT_SPEED` | `0.000065625` rad/ms | Globe Y-rotation speed (~96 s per turn) |
| `AXIAL_TILT` | `0` | Z-axis tilt applied to the model matrix |
| `STAR_COUNT` | `320` | Stars in the background field |
| `FOV_V` | `35°` | Vertical field of view |
| `FIT_MARGIN` | `1.15` | Padding factor so the sphere never clips the viewport |
| `STAR_PERIOD_MS` | `300 000` | Star field horizontal traversal period (5 min) |
| `YEAR_PERIOD_MS` | `60 000` | One simulated year per real minute |

## Code structure (top to bottom)

1. **Configuration block** — constants above plus Portuguese `WEEKDAYS` / `MONTHS` arrays for the HUD.
2. **Star field setup** — `bgCanvas`, `bgCtx`, `STARS` precomputed array, and `drawStars(t)` which scrolls each star horizontally with a floor-based wrap.
3. **`M4`** — column-major 4×4 matrix utilities: `ident`, `persp`, `mul`, `trans`, `rotX`, `rotY`, `rotZ`.
4. **`EARTH_FLATTENING`** constant + **`makeSphere(r, lonSegs, latSegs, flattening)`** — generates positions, normals, UVs and indices for an ellipsoidal UV-mapped sphere (called with `1.0, 96, 48, EARTH_FLATTENING`).
5. **`VS_SRC`** — vertex shader: passes view-space normal/position, geographic-space normal, and UV to the fragment stage.
6. **`FS_SRC`** — fragment shader: day texture sample, seasonal latitude modulation, polar cap pulse, timezone band overlay, UTC-anchored day/night mix with Black Marble, crepuscular tint, Phong-style ambient + diffuse, Fresnel atmosphere rim.
7. **WebGL bootstrap** — `compile`, `link`, `buf` helpers; program creation; attribute and uniform location lookup; sphere VBO/IBO upload.
8. **Day texture upload** (TEXTURE0) — placeholder 1×1 navy, then async `Image()` load with mipmap + anisotropy (POT).
9. **Night texture upload** (TEXTURE1) — placeholder 1×1 black, then async `Image()` load with the same mipmap + anisotropy pattern.
10. **`onResize()`** — sizes both canvases using `devicePixelRatio` (clamped to 2).
11. **`frame(now)`** — main rAF loop: computes `yearPhase`, responsive camera distance, model-view matrix, sub-solar UTC longitude, and feeds all uniforms before drawing.
12. **`tick()`** — updates the HUD clock once per second using `Intl.DateTimeFormat`.

## Sphere geometry — `makeSphere`

Generates an oblate ellipsoid following the WGS84 model. Vertex formulas (with `polarFactor = 1 - EARTH_FLATTENING ≈ 0.99664`):

```js
const x = cLat * sLon;            // equatorial X, sin(lon) for east at +X
const y = sLat;                   // polar Y
const z = cLat * cLon;            // equatorial Z, cos(lon) for Greenwich at +Z
positions.push(r*x, r*y*polarFactor, r*z);

// Ellipsoid normal: gradient of x² + z² + y²/polarFactor² = 1
const ny = y / (polarFactor * polarFactor);
const invLen = 1 / Math.sqrt(x*x + ny*ny + z*z);
normals.push(x*invLen, ny*invLen, z*invLen);
```

Triangle winding is reversed (`(a, a+1, b)` and `(b, a+1, b+1)`) to keep the outward face CCW under the `(sLon, cLon)` parametrization that swaps the natural sweep direction.

UV mapping: `(u, 1 - v)` so that V=0 maps to the north pole (matching standard top-of-image = north convention for equirectangular images uploaded with `UNPACK_FLIP_Y_WEBGL = false`).

## Texture configuration

Both textures are POT (2048×1024) and use the same parameters:

| Parameter | Value | Why |
|---|---|---|
| `TEXTURE_MIN_FILTER` | `LINEAR_MIPMAP_LINEAR` | Trilinear: smooth between mip levels and texels |
| `TEXTURE_MAG_FILTER` | `LINEAR` | Standard bilinear when texel < pixel |
| `TEXTURE_WRAP_S` | `REPEAT` | Seamless wrap at the antimeridian (longitude) |
| `TEXTURE_WRAP_T` | `CLAMP_TO_EDGE` | Texture ends at the poles |
| `generateMipmap` | yes | Full mip chain for distance/edge anti-aliasing |
| Anisotropy | up to 8× | Sharper sampling at oblique viewing angles |

Texture units: day = `TEXTURE0` (`uTex`), night = `TEXTURE1` (`uTexNight`).

## Day/night system

The sun's geographic position is calculated each frame from `Date.now()`:

```js
const utcHours = (Date.now() / 3600000) % 24;
const subSolarLon = -((utcHours - 12) * 15) * Math.PI / 180;
gl.uniform3f(uSunDirGeo,
  Math.sin(subSolarLon),  // x
  0,                      // y (subSolarLat = 0; no axial tilt yet)
  Math.cos(subSolarLon)); // z
```

This direction vector lives in **geographic space** (the same model-space frame used by `makeSphere` before any model-view rotation). Because rotations preserve dot products, the per-pixel `dot(vNormalGeo, uSunDirGeo)` gives the correct day/night intensity regardless of how much the visual `M4.rotY(angle)` has spun the globe — the terminator stays anchored to the real geography.

The vertex shader exposes two normals to the fragment stage:
- `vNormal` — view-space normal (transformed by `uMV`), used for the Fresnel atmosphere
- `vNormalGeo` — model-space normal (untouched), used for the sun dot product

## Fragment shader pipeline

For each fragment, in order:

1. Sample `base = texture2D(uTex, vUV)` — day color.
2. Apply latitude-only seasonal modulation (≤5% luminance shift in `|lat| > 40°`).
3. Apply polar cap pulse — snow line oscillates between 65° (local summer) and 55° (local winter).
4. Apply timezone band overlay — pulsing amber tint on the user's local meridian (driven by `uTzLon`, `uTzHalfWidth`, and `uTime`).
5. Compute `sunDot = dot(vNormalGeo, uSunDirGeo)` and `dayWeight = smoothstep(-0.15, 0.15, sunDot)`.
6. Sample `nightTex = texture2D(uTexNight, vUV)` and build `daySide = base.rgb * (0.20 + 0.85 * max(sunDot, 0.0))` and `nightSide = nightTex.rgb * 1.4`.
7. Mix: `color = mix(nightSide, daySide, dayWeight)`.
8. Add crepuscular tint — orange-red glow that peaks at `dayWeight = 0.5` (the terminator).
9. Add Fresnel atmospheric rim — `vec3(0.30, 0.55, 1.00) * pow(1 - max(N·V, 0), 2.8) * 0.65`.

## Rendering loop

`frame(now)` runs every animation frame:

1. Recompute the perspective matrix from the live aspect ratio.
2. Compute `dist = FIT_MARGIN / sin(min(halfFovV, halfFovH))` so the sphere always fits.
3. Build the model-view matrix: translate `-dist`, rotate Z by `AXIAL_TILT`, rotate Y by `(now - startT) * ROT_SPEED`.
4. Compute `yearPhase = ((now - startT) % YEAR_PERIOD_MS) / YEAR_PERIOD_MS`.
5. Compute `subSolarLon` from `Date.now()`.
6. Bind both textures, set all uniforms (`uMV`, `uProj`, `uTex`, `uTexNight`, `uSunDirGeo`, `uTzLon`, `uTzHalfWidth`, `uTime`, `uYearPhase`), draw the sphere, draw the star field on the 2D canvas.

## How to run

Serve the project directory via any HTTP server (e.g. `python -m http.server 8000`) and open `http://localhost:8000/index8.html`. Direct `file://` access is blocked by browser CORS for the external textures.

Earlier versions (`index.html`, `index3.html` and earlier) work via `file://` because they either inline the texture as base64 or generate it procedurally.

---

# Evolution of the codebase

The project evolved through eight iterations, each building on the previous:

## v1 (`index1.html`) — Canvas 2D flat map
Equirectangular world map in Canvas 2D scrolling right-to-left, with vertical timezone lines, an amber band on the user's local meridian, and the central HUD clock.

## v2 (`index2.html`) — Canvas 2D globe
Switched to an orthographic projection of the sphere, Sutherland-Hodgman polygon clipping for the visible hemisphere, atmosphere glow and twinkling star background.

## v3 (`index.html` / `index3.html`) — Procedural WebGL globe
Replaced Canvas 2D with WebGL 1.0. Surface texture built procedurally in 10 named passes (ocean, bathymetry, chlorophyll, continents, ice caps, deserts, coastlines, noise, graticule, alpha biome snap). Biome class encoded in the texture's alpha channel; consumed by the fragment shader's `step()` cascades to drive a seasonal cycle of vegetation green↔brown and polar cap expansion. 38 polygons (~720 vertices) for continents and 26 islands.

## v4 (`index4.html`) — NASA Blue Marble inline
Procedural texture replaced by a real NASA Blue Marble Next Generation 2048×1024 JPEG embedded as base64 (~416 KB inline). All `LAND` polygon data and the procedural pipeline removed. Seasonal modulation simplified to latitude-only (no biome dependency) and confined to a polar cap pulse.

## v5 (`index5.html`) — Alternative reference image
Same architecture as v4 but with a different attached reference image (originally 1080×1080, resized to 2048×1024 before base64 embed).

## v6 (`index6.html`) — Geometry corrections
Image source: 2000×1000 NPOT (kept original size as requested). Required `WRAP_S = CLAMP_TO_EDGE` and `LINEAR` (no mipmap) for NPOT compatibility. Two geometry corrections were applied:
- `makeSphere` x/z formulas swapped (`x = cLat * sLon, z = cLat * cLon`) so Greenwich falls on +Z (camera-front) and east on +X (right of screen) — the standard Three.js / WebGL Earth convention. This eliminated horizontal mirroring of the texture.
- Triangle winding reversed (`indices.push(a, a+1, b)` instead of `(a, b, a+1)`) to compensate for the parametrization change so the sphere remains front-facing under `cullFace(BACK)`.

## v7 (`index7.html`) — Geometry of v6 + image of v4
Combines the corrected geometry/winding from v6 with the POT image from v4 (re-embedded as base64).

## v8 (`index8.html`) — Production
- **External images**: base64 inline replaced by external `earth.jpg` and `earth_night.jpg`. HTML shrinks from ~430 KB to ~30 KB; assets are cached separately by the browser.
- **WGS84 polar flattening**: `makeSphere` accepts a `flattening` parameter; positions and normals are computed for the actual oblate ellipsoid geometry (~0.335% flatter at the poles than the equator).
- **Mipmap optimization restored**: now that the textures are POT (2048×1024), `generateMipmap`, `LINEAR_MIPMAP_LINEAR`, `REPEAT` on S, and anisotropy up to 8× are re-enabled.
- **Day/night via Black Marble**: NASA Earth at Night 2012 added as a second texture (`uTexNight`, TEXTURE1). Sun position calculated per frame from `Date.now()` UTC. Fragment shader mixes `daySide` (Blue Marble + Phong) and `nightSide` (Black Marble × 1.4) based on `smoothstep(-0.15, 0.15, dot(vNormalGeo, uSunDirGeo))`. A crepuscular orange tint peaks at the terminator. The terminator stays anchored to real geography while the globe continues to spin at `ROT_SPEED`.
