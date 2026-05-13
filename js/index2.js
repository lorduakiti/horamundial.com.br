(function () {
  'use strict';

  // ── config ───────────────────────────────────────────────────────
  const ROT_SPEED  = 0.07;   // degrees/frame → full rotation ≈ 85 s
  const CENTER_LAT = 18;     // viewing tilt (slightly north)
  const STAR_COUNT = 220;

  const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira',
                    'Quinta-feira','Sexta-feira','Sábado'];
  const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // ── canvas & state ───────────────────────────────────────────────
  const canvas = document.getElementById('c');
  const ctx    = canvas.getContext('2d');
  let W, H, R, cx, cy;
  let centerLon = -20;

  // ── precomputed trig (fixed latitude tilt) ───────────────────────
  const φ0    = CENTER_LAT * Math.PI / 180;
  const sinφ0 = Math.sin(φ0);
  const cosφ0 = Math.cos(φ0);

  // ── orthographic projection ──────────────────────────────────────
  function zOf(lon, lat) {
    const λ0 = centerLon * Math.PI / 180;
    const λ  = lon * Math.PI / 180;
    const φ  = lat * Math.PI / 180;
    return sinφ0 * Math.sin(φ) + cosφ0 * Math.cos(φ) * Math.cos(λ - λ0);
  }

  function project(lon, lat) {
    const λ0   = centerLon * Math.PI / 180;
    const λ    = lon * Math.PI / 180;
    const φ    = lat * Math.PI / 180;
    const Δλ   = λ - λ0;
    const cosφ = Math.cos(φ);
    const x    = cosφ * Math.sin(Δλ);
    const y    = cosφ0 * Math.sin(φ) - sinφ0 * cosφ * Math.cos(Δλ);
    return { px: cx + x * R, py: cy - y * R };
  }

  // ── hemisphere clipping (Sutherland-Hodgman) ─────────────────────
  function clipHemi(poly) {
    const out = [];
    const n   = poly.length;
    if (!n) return out;
    let prev  = poly[n - 1];
    let zPrev = zOf(prev[0], prev[1]);
    for (let i = 0; i < n; i++) {
      const curr  = poly[i];
      const zCurr = zOf(curr[0], curr[1]);
      if (zCurr > 0) {
        if (zPrev <= 0) {
          const dz = zPrev - zCurr;
          const t  = Math.abs(dz) > 1e-9 ? zPrev / dz : 0;
          out.push([prev[0] + t * (curr[0] - prev[0]),
                    prev[1] + t * (curr[1] - prev[1])]);
        }
        out.push(curr);
      } else if (zPrev > 0) {
        const dz = zPrev - zCurr;
        const t  = Math.abs(dz) > 1e-9 ? zPrev / dz : 0;
        out.push([prev[0] + t * (curr[0] - prev[0]),
                  prev[1] + t * (curr[1] - prev[1])]);
      }
      prev  = curr;
      zPrev = zCurr;
    }
    return out;
  }

  // ── land polygons [lon, lat][] ────────────────────────────────────
  const LAND = [
    {
      fill: '#2a5424', stroke: '#4a8a42',
      poly: [
        [-168,54],[-165,60],[-148,60],[-136,58],
        [-130,55],[-124,49],[-124,38],[-118,33],
        [-110,23],[-104,19],[-97,18],[-90,16],
        [-84,10],[-78,9],
        [-76,35],[-74,40],[-70,42],[-66,44],
        [-60,47],[-55,47],[-58,52],[-64,60],
        [-68,62],[-78,62],[-84,64],[-80,66],
        [-86,70],[-100,70],[-110,71],[-120,70],
        [-140,60],[-160,56],[-168,54]
      ]
    },
    {
      fill: '#3a6836', stroke: '#5a9852',
      poly: [
        [-70,83],[-42,83],[-20,77],[-18,71],
        [-22,65],[-44,60],[-52,63],[-60,66],
        [-68,70],[-72,77],[-70,83]
      ]
    },
    {
      fill: '#365e2c', stroke: '#568c4c',
      poly: [
        [-80,11],[-73,12],[-62,10],[-60,14],
        [-58,6],[-52,4],[-50,0],[-50,-4],
        [-38,-10],[-35,-9],[-39,-16],[-40,-21],
        [-43,-23],[-44,-28],[-48,-27],[-51,-30],
        [-53,-33],[-58,-38],[-62,-42],[-65,-46],
        [-68,-52],[-65,-55],[-68,-55],[-74,-50],
        [-72,-38],[-72,-30],[-70,-18],[-75,-10],
        [-80,-2],[-80,8],[-80,11]
      ]
    },
    {
      fill: '#304e2c', stroke: '#507a4a',
      poly: [
        [-10,36],[-8,44],[-9,49],[2,51],
        [2,54],[5,58],[10,58],[14,55],
        [18,56],[20,58],[22,60],[25,62],
        [28,70],[20,70],[14,70],[8,63],
        [5,62],[0,62],[-4,58],[-6,58],
        [-3,55],[0,51],[8,47],[14,44],
        [12,38],[14,37],[18,40],[20,38],
        [24,38],[26,42],[28,41],[32,38],
        [30,36],[24,35],[18,36],[12,38],
        [4,38],[0,40],[-4,44],[-10,36]
      ]
    },
    {
      fill: '#3a6030', stroke: '#5a904e',
      poly: [
        [-18,16],[-16,20],[-14,26],[-9,30],
        [-5,33],[0,35],[5,37],[10,37],
        [12,33],[16,31],[22,31],[28,31],
        [32,30],[36,28],[38,20],[42,12],
        [44,10],[43,4],[42,0],[38,-4],
        [36,-10],[35,-18],[34,-24],[30,-30],
        [26,-36],[20,-35],[14,-30],[8,-16],
        [2,-5],[0,0],[-4,5],[-6,10],
        [-10,15],[-14,16],[-18,16]
      ]
    },
    {
      fill: '#2c5428', stroke: '#4c8444',
      poly: [
        [28,41],[32,38],[36,38],[36,28],
        [42,12],[44,10],[48,12],[52,12],
        [55,10],[58,14],[62,24],[70,24],
        [72,22],[78,8],[80,10],[80,14],
        [78,16],[80,22],[78,26],[80,30],
        [84,28],[88,26],[90,22],[92,22],
        [96,18],[98,14],[100,4],[104,2],
        [108,2],[112,2],[118,4],[122,10],
        [122,22],[120,28],[122,30],[122,36],
        [118,38],[118,42],[120,44],[124,46],
        [130,42],[132,46],[138,46],[142,48],
        [142,52],[138,56],[136,60],[140,66],
        [142,70],[132,70],[120,68],[104,72],
        [88,76],[72,72],[56,70],[46,68],
        [36,68],[30,65],[28,62],[22,56],
        [20,56],[22,50],[26,48],[30,48],
        [34,42],[28,41]
      ]
    },
    {
      fill: '#486e30', stroke: '#689a50',
      poly: [
        [114,-22],[116,-20],[120,-18],[122,-18],
        [124,-16],[128,-14],[130,-12],[132,-12],
        [136,-12],[138,-14],[140,-18],[142,-18],
        [144,-14],[146,-20],[148,-20],[150,-24],
        [152,-28],[154,-30],[152,-34],[150,-36],
        [148,-38],[144,-38],[138,-36],[130,-34],
        [122,-34],[116,-34],[112,-26],[112,-22],
        [114,-22]
      ]
    },
    {
      fill: '#486e30', stroke: '#689a50',
      poly: [
        [166,-46],[170,-46],[172,-44],[174,-42],
        [174,-38],[172,-36],[170,-36],[168,-38],
        [168,-42],[166,-44],[166,-46]
      ]
    },
    {
      fill: '#5e7e76', stroke: '#8aaea4',
      poly: [
        [-170,-68],[-140,-68],[-110,-68],[-80,-68],
        [-50,-68],[-20,-68],[10,-68],[40,-68],
        [70,-68],[100,-68],[130,-68],[160,-68],
        [170,-70],[170,-83],
        [160,-83],[130,-83],[100,-83],[70,-83],
        [40,-83],[10,-83],[-20,-83],[-50,-83],
        [-80,-83],[-110,-83],[-140,-83],[-170,-83],
        [-170,-70]
      ]
    },
    {
      fill: '#304e2c', stroke: '#507a4a',
      poly: [
        [-6,58],[-3,58],[-2,56],[0,53],
        [0,51],[-2,50],[-5,50],[-5,54],
        [-6,56],[-6,58]
      ]
    },
    {
      fill: '#304e2c', stroke: '#507a4a',
      poly: [
        [-24,63],[-22,66],[-18,66],[-13,66],
        [-13,64],[-16,63],[-20,63],[-24,63]
      ]
    },
    {
      fill: '#2c5428', stroke: '#4c8444',
      poly: [
        [130,31],[131,33],[133,35],[136,36],
        [138,38],[141,36],[141,34],[140,32],
        [136,30],[130,31]
      ]
    }
  ];

  // ── stars (fixed fractional positions) ───────────────────────────
  const STARS = Array.from({ length: STAR_COUNT }, () => ({
    fx: Math.random(), fy: Math.random(),
    r:  Math.random() * 1.3 + 0.2,
    a:  Math.random() * 0.65 + 0.15
  }));

  // ── draw: starfield background ───────────────────────────────────
  function drawBackground() {
    ctx.fillStyle = '#000810';
    ctx.fillRect(0, 0, W, H);
    STARS.forEach(({ fx, fy, r, a }) => {
      ctx.beginPath();
      ctx.arc(fx * W, fy * H, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(215,230,255,${a})`;
      ctx.fill();
    });
  }

  // ── draw: drop shadow under globe ────────────────────────────────
  function drawShadow() {
    const sx = cx + R * 0.06, sy = cy + R * 0.90;
    const g  = ctx.createRadialGradient(sx, sy, 0, sx, sy, R * 0.72);
    g.addColorStop(0, 'rgba(0,0,0,0.38)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sx, sy, R * 0.72, R * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── draw: atmosphere halo ────────────────────────────────────────
  function drawAtmosphere() {
    const g = ctx.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 1.10);
    g.addColorStop(0,   'rgba(50,125,255,0.30)');
    g.addColorStop(0.5, 'rgba(30, 80,200,0.12)');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.10, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── draw: ocean ──────────────────────────────────────────────────
  function drawOcean() {
    const g = ctx.createRadialGradient(cx - R*0.22, cy - R*0.28, R*0.06,
                                       cx, cy, R);
    g.addColorStop(0, '#10294c');
    g.addColorStop(1, '#040e22');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── draw: graticule ──────────────────────────────────────────────
  function drawGraticule() {
    const S = 3; // sample step in degrees

    // Latitude lines
    [-60,-30,0,30,60].forEach(lat => {
      const eq = lat === 0;
      ctx.beginPath();
      let was = false;
      for (let lon = -180; lon <= 180; lon += S) {
        if (zOf(lon, lat) > 0) {
          const { px, py } = project(lon, lat);
          was ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          was = true;
        } else was = false;
      }
      ctx.strokeStyle = eq ? 'rgba(130,195,250,0.25)' : 'rgba(80,140,220,0.11)';
      ctx.lineWidth   = eq ? 0.9 : 0.45;
      ctx.stroke();
    });

    // Longitude lines (every 30°)
    for (let lon = -180; lon < 180; lon += 30) {
      ctx.beginPath();
      let was = false;
      for (let lat = -88; lat <= 88; lat += S) {
        if (zOf(lon, lat) > 0) {
          const { px, py } = project(lon, lat);
          was ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          was = true;
        } else was = false;
      }
      ctx.strokeStyle = 'rgba(80,140,220,0.11)';
      ctx.lineWidth   = 0.45;
      ctx.stroke();
    }
  }

  // ── draw: timezone band ──────────────────────────────────────────
  function drawTzBand(tzOff) {
    const lon1 = (tzOff - 0.5) * 15;
    const lon2 = (tzOff + 0.5) * 15;
    const lonC = tzOff * 15;
    const STEPS = 90;

    // Filled wedge
    const poly = [];
    for (let i = 0; i <= STEPS; i++) poly.push([lon1, -83 + 166 * i / STEPS]);
    for (let i = STEPS; i >= 0; i--) poly.push([lon2, -83 + 166 * i / STEPS]);
    const cl = clipHemi(poly);
    if (cl.length >= 3) {
      ctx.beginPath();
      cl.forEach(([lon, lat], i) => {
        const { px, py } = project(lon, lat);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,210,55,0.13)';
      ctx.fill();
    }

    // Edge meridians (dashed)
    [lon1, lon2].forEach(lon => {
      ctx.beginPath();
      let was = false;
      for (let lat = -88; lat <= 88; lat += 2) {
        if (zOf(lon, lat) > 0) {
          const { px, py } = project(lon, lat);
          was ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
          was = true;
        } else was = false;
      }
      ctx.strokeStyle = 'rgba(255,215,70,0.48)';
      ctx.lineWidth   = 0.9;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Center meridian (solid, brighter)
    ctx.beginPath();
    let was = false;
    for (let lat = -88; lat <= 88; lat += 2) {
      if (zOf(lonC, lat) > 0) {
        const { px, py } = project(lonC, lat);
        was ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
        was = true;
      } else was = false;
    }
    ctx.strokeStyle = 'rgba(255,220,80,0.75)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }

  // ── draw: land masses ────────────────────────────────────────────
  function drawLand() {
    LAND.forEach(({ fill, stroke, poly }) => {
      const cl = clipHemi(poly);
      if (cl.length < 3) return;
      ctx.beginPath();
      cl.forEach(([lon, lat], i) => {
        const { px, py } = project(lon, lat);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.fillStyle   = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth   = 0.85;
      ctx.stroke();
    });
  }

  // ── draw: 3D sphere shading overlay ─────────────────────────────
  function drawShading() {
    const hl = ctx.createRadialGradient(
      cx - R * 0.38, cy - R * 0.38, R * 0.02,
      cx + R * 0.18, cy + R * 0.18, R
    );
    hl.addColorStop(0,    'rgba(255,255,255,0.14)');
    hl.addColorStop(0.28, 'rgba(255,255,255,0.04)');
    hl.addColorStop(0.58, 'rgba(0,0,0,0.03)');
    hl.addColorStop(1,    'rgba(0,0,24,0.50)');
    ctx.fillStyle = hl;
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── resize ───────────────────────────────────────────────────────
  function onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    R  = Math.min(W, H) * 0.42;
    cx = W / 2;
    cy = H / 2;
  }
  window.addEventListener('resize', onResize);
  onResize();

  // ── animation loop ───────────────────────────────────────────────
  const tzOff = -new Date().getTimezoneOffset() / 60;

  function frame() {
    requestAnimationFrame(frame);
    centerLon = (centerLon + ROT_SPEED) % 360;

    drawBackground();
    drawShadow();
    drawAtmosphere();

    // Globe interior (clipped to circle)
    ctx.save();
    drawOcean();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();
    drawGraticule();
    drawTzBand(tzOff);
    drawLand();
    drawShading();
    ctx.restore();

    // Globe rim
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80,165,255,0.35)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  }
  requestAnimationFrame(frame);

  // ── clock ────────────────────────────────────────────────────────
  const timeEl = document.getElementById('time');
  const dateEl = document.getElementById('date');
  const tzEl   = document.getElementById('timezone');

  function tick() {
    const n   = new Date();
    const pad = v => String(v).padStart(2, '0');
    timeEl.textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
    dateEl.textContent =
      `${WEEKDAYS[n.getDay()]}, ${n.getDate()} de ${MONTHS[n.getMonth()]} de ${n.getFullYear()}`;
    const off  = -n.getTimezoneOffset() / 60;
    const sign = off >= 0 ? '+' : '';
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    tzEl.textContent = `${iana} · UTC${sign}${off}`;
  }
  tick();
  setInterval(tick, 1000);

}());