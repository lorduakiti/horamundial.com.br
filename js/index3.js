(function () {
  'use strict';

  // ─────────────────────────────────────────────────────────────────
  //  configuration
  // ─────────────────────────────────────────────────────────────────
  const TEX_W      = 2048;
  const TEX_H      = 1024;
  const ROT_SPEED  = 0.000065625; // radians per ms (~ 96 s per rotation)
  const AXIAL_TILT = 0;
  const STAR_COUNT = 320;
  const FOV_V      = 35 * Math.PI / 180;
  const FIT_MARGIN = 1.15;     // padding factor so sphere never clips edges

  const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira',
                    'Quinta-feira','Sexta-feira','Sábado'];
  const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // ─────────────────────────────────────────────────────────────────
  //  land polygon data [lon, lat]   (~720 verts across 38 polygons)
  //  fill colors are biome-tuned so the alpha-snap pass classifies
  //  each pixel correctly:  white-ish → ICECAP, green → VEGETATION,
  //  rocky-gray → TUNDRA (via latitude fallback).
  // ─────────────────────────────────────────────────────────────────
  const LAND = [
    // North America (mainland + Central America + Florida)
    { fill:'#3d6428', stroke:'#5a8a48', poly:[
      [-168,54],[-167,60],[-162,63],[-156,60],[-148,60],[-140,60],
      [-136,58],[-130,55],[-126,50],[-124,49],[-124,42],[-122,38],
      [-118,33],[-116,32],[-114,30],[-110,23],[-105,21],[-101,18],
      [-97,17],[-94,18],[-91,16],[-88,16],[-86,12],[-84,10],
      [-79,9],[-78,11],[-82,16],[-87,21],[-87,30],[-82,28],
      [-81,25],[-80,27],[-78,32],[-76,35],[-75,38],[-74,40],
      [-71,42],[-67,44],[-60,47],[-55,47],[-58,52],[-63,55],
      [-66,58],[-66,62],[-78,62],[-83,64],[-78,68],[-86,70],
      [-95,70],[-110,71],[-120,72],[-130,70],[-140,68],[-156,68],
      [-162,66],[-168,54]
    ]},
    // Greenland (ice-covered)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [-70,83],[-50,83],[-30,82],[-22,77],[-18,71],[-22,65],
      [-32,60],[-44,60],[-52,63],[-58,66],[-66,70],[-72,72],
      [-70,76],[-72,80],[-70,83]
    ]},
    // South America
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [-80,11],[-75,11],[-72,10],[-70,12],[-66,11],[-62,10],
      [-60,8],[-58,6],[-52,4],[-50,1],[-50,-3],[-45,-7],
      [-38,-10],[-35,-9],[-37,-13],[-39,-16],[-40,-21],
      [-43,-23],[-46,-25],[-48,-26],[-50,-29],[-53,-33],
      [-58,-38],[-62,-42],[-65,-46],[-68,-50],[-68,-54],
      [-70,-55],[-74,-52],[-74,-46],[-72,-40],[-72,-32],
      [-71,-25],[-71,-18],[-75,-13],[-78,-8],[-80,-2],
      [-80,2],[-80,6],[-80,11]
    ]},
    // Europe (mainland + Iberian + Italy + Balkans + Scandinavia)
    { fill:'#345820', stroke:'#588040', poly:[
      [-10,36],[-9,40],[-8,44],[-9,47],[-2,49],[1,50],[2,51],
      [3,53],[4,55],[6,58],[8,58],[10,58],[11,56],[14,55],
      [15,57],[18,58],[20,58],[22,60],[24,62],[28,68],[28,70],
      [22,70],[15,70],[10,67],[8,63],[5,62],[0,62],[-3,58],
      [-4,56],[-3,55],[0,52],[3,52],[5,50],[8,47],[10,46],
      [14,44],[14,40],[16,40],[18,40],[20,40],[22,38],
      [24,38],[28,42],[32,42],[35,40],[36,37],[34,35],
      [28,35],[24,35],[20,35],[15,37],[10,37],[5,38],
      [0,40],[-4,42],[-7,38],[-10,36]
    ]},
    // Africa (incl. Horn + Cape)
    { fill:'#4a6a28', stroke:'#688a48', poly:[
      [-18,16],[-17,21],[-15,26],[-12,29],[-9,30],[-6,32],
      [-3,35],[1,35],[5,37],[10,37],[12,33],[14,32],[18,31],
      [22,31],[25,31],[28,31],[31,31],[34,30],[37,29],
      [38,20],[39,15],[42,12],[44,11],[44,10],[43,4],
      [42,-1],[40,-3],[38,-5],[37,-9],[36,-13],[35,-18],
      [34,-22],[34,-26],[32,-28],[28,-32],[24,-34],
      [20,-35],[18,-34],[14,-30],[12,-26],[10,-20],
      [8,-16],[6,-12],[4,-8],[2,-3],[0,0],[-3,4],
      [-5,8],[-8,12],[-12,15],[-14,16],[-17,16],[-18,16]
    ]},
    // Asia (Eurasia mainland, India, SE Asia, Korea, Kamchatka)
    { fill:'#406820', stroke:'#608840', poly:[
      [28,41],[30,41],[33,42],[36,40],[38,38],[36,30],
      [35,28],[34,27],[36,28],[36,24],[39,22],[42,18],
      [43,15],[44,13],[44,11],[48,12],[52,12],[55,10],
      [58,12],[60,18],[62,24],[66,25],[68,26],[70,24],
      [68,21],[70,18],[72,21],[74,21],[76,18],[78,8],
      [80,9],[80,12],[80,16],[82,17],[83,21],[86,22],
      [88,21],[90,22],[92,22],[94,18],[96,18],[98,14],
      [100,12],[102,9],[103,4],[104,1],[107,-1],[110,1],
      [112,3],[116,4],[118,4],[121,8],[124,11],[122,16],
      [122,22],[120,28],[120,32],[122,37],[121,40],
      [124,42],[128,40],[130,40],[127,39],[126,37],
      [126,34],[127,35],[129,38],[130,42],[132,46],
      [136,45],[140,46],[142,48],[144,48],[143,52],
      [140,55],[138,56],[140,60],[142,64],[145,68],
      [148,69],[150,68],[152,66],[156,64],[160,62],
      [164,60],[170,60],[174,62],[170,68],[160,69],
      [150,70],[140,72],[132,73],[120,73],[110,73],
      [100,75],[90,76],[78,72],[68,72],[58,70],[48,68],
      [38,67],[32,68],[28,65],[28,62],[24,60],[22,56],
      [20,55],[22,50],[26,48],[30,48],[34,44],[28,41]
    ]},
    // Australia
    { fill:'#5a7028', stroke:'#789448', poly:[
      [114,-22],[114,-26],[114,-30],[116,-33],[118,-34],
      [122,-34],[126,-32],[129,-32],[132,-32],[135,-34],
      [138,-35],[140,-37],[143,-38],[145,-39],[147,-38],
      [149,-37],[151,-34],[153,-30],[153,-25],[151,-23],
      [149,-22],[146,-19],[144,-15],[142,-12],[138,-12],
      [135,-12],[131,-12],[129,-15],[127,-14],[124,-15],
      [122,-17],[120,-19],[116,-21],[114,-22]
    ]},
    // New Zealand North
    { fill:'#5a7028', stroke:'#789448', poly:[
      [173,-35],[176,-37],[178,-38],[178,-40],[176,-41],
      [174,-41],[173,-40],[174,-38],[173,-37],[173,-35]
    ]},
    // New Zealand South
    { fill:'#5a7028', stroke:'#789448', poly:[
      [167,-46],[170,-46],[172,-44],[174,-42],[174,-41],
      [172,-42],[170,-43],[168,-44],[167,-45],[167,-46]
    ]},
    // Tasmania
    { fill:'#5a7028', stroke:'#789448', poly:[
      [144,-41],[148,-41],[148,-43],[147,-44],[146,-43],
      [144,-43],[144,-41]
    ]},
    // Madagascar
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [43,-13],[46,-15],[48,-17],[50,-19],[50,-22],[48,-25],
      [45,-25],[44,-22],[43,-19],[43,-15],[43,-13]
    ]},
    // Sumatra
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [95,5],[98,4],[100,2],[102,0],[104,-2],[105,-3],
      [106,-5],[104,-6],[102,-5],[100,-3],[98,-2],
      [96,0],[95,3],[95,5]
    ]},
    // Java
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [105,-6],[108,-7],[111,-7],[114,-8],[114,-9],
      [112,-8],[110,-8],[108,-8],[106,-8],[105,-7],[105,-6]
    ]},
    // Borneo
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [109,2],[112,4],[114,4],[117,5],[119,3],[119,1],
      [118,-1],[116,-3],[114,-3],[112,-2],[110,-1],
      [109,0],[109,2]
    ]},
    // Sulawesi
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [119,1],[120,3],[122,2],[123,0],[124,-1],[123,-3],
      [121,-4],[120,-3],[121,-1],[120,0],[119,1]
    ]},
    // New Guinea
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [131,-1],[134,-3],[138,-4],[141,-3],[145,-3],
      [148,-6],[150,-9],[148,-10],[144,-9],[140,-8],
      [136,-7],[133,-5],[131,-3],[131,-1]
    ]},
    // Philippines — Luzon
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [120,18],[122,18],[122,16],[121,14],[120,15],
      [120,16],[121,17],[120,18]
    ]},
    // Philippines — Mindanao
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [123,9],[126,8],[126,6],[125,5],[123,5],[122,7],[123,9]
    ]},
    // Sri Lanka
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [80,9],[82,8],[82,6],[81,5],[80,6],[80,9]
    ]},
    // Cuba
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [-84,22],[-77,22],[-74,21],[-74,20],[-78,20],
      [-82,21],[-84,22]
    ]},
    // Hispaniola
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [-74,19],[-69,19],[-68,18],[-71,18],[-74,19]
    ]},
    // Jamaica
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [-78,18],[-76,18],[-76,17],[-78,17],[-78,18]
    ]},
    // Hawaii (Big Island)
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [-156,20],[-155,20],[-154,19],[-155,19],[-156,20]
    ]},
    // Iceland (rocky/tundra)
    { fill:'#5e7e76', stroke:'#8aaea4', poly:[
      [-24,63],[-22,66],[-18,66],[-13,66],[-13,64],
      [-16,63],[-20,63],[-24,63]
    ]},
    // Great Britain
    { fill:'#345820', stroke:'#588040', poly:[
      [-6,58],[-3,58],[-2,56],[-1,55],[1,53],[1,51],
      [-2,50],[-5,50],[-5,54],[-6,56],[-6,58]
    ]},
    // Ireland
    { fill:'#345820', stroke:'#588040', poly:[
      [-10,55],[-8,55],[-6,54],[-6,52],[-8,52],
      [-10,53],[-10,55]
    ]},
    // Honshu (Japan main island)
    { fill:'#406820', stroke:'#608840', poly:[
      [130,31],[131,33],[133,35],[136,36],[138,38],
      [140,38],[141,37],[141,34],[140,32],[136,30],
      [132,30],[130,31]
    ]},
    // Hokkaido
    { fill:'#406820', stroke:'#608840', poly:[
      [140,42],[143,42],[145,43],[145,45],[143,45],
      [140,44],[139,43],[140,42]
    ]},
    // Sakhalin
    { fill:'#3a5e2a', stroke:'#587e48', poly:[
      [142,46],[144,47],[144,52],[143,54],[141,54],
      [141,50],[141,47],[142,46]
    ]},
    // Taiwan
    { fill:'#2e6024', stroke:'#4e8044', poly:[
      [120,22],[121,22],[122,24],[121,25],[120,24],
      [120,22]
    ]},
    // Svalbard (ice)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [10,80],[16,80],[20,79],[28,79],[26,77],[22,76],
      [16,77],[12,77],[10,78],[10,80]
    ]},
    // Novaya Zemlya (ice)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [52,71],[54,73],[56,75],[60,77],[62,76],[62,74],
      [58,72],[55,71],[53,70],[52,71]
    ]},
    // Severnaya Zemlya (ice)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [94,77],[100,77],[105,79],[108,80],[104,80],
      [98,79],[94,77]
    ]},
    // Baffin Island (ice/tundra)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [-79,71],[-72,71],[-66,72],[-62,69],[-66,67],
      [-72,66],[-78,66],[-82,68],[-83,70],[-79,71]
    ]},
    // Ellesmere Island (ice)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [-90,82],[-72,82],[-66,80],[-72,78],[-82,76],
      [-90,76],[-94,79],[-92,81],[-90,82]
    ]},
    // Victoria Island (ice/tundra)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [-118,71],[-110,72],[-104,71],[-100,69],
      [-105,68],[-112,68],[-118,69],[-118,71]
    ]},
    // Falklands
    { fill:'#5a7028', stroke:'#789448', poly:[
      [-61,-51],[-58,-51],[-57,-52],[-59,-53],
      [-61,-52],[-61,-51]
    ]},
    // Antarctica (full-width strip; closes via vertical edges at ±180°)
    { fill:'#e8ebee', stroke:'#9aaeb4', poly:[
      [180,-66],[160,-66],[140,-67],[120,-66],[100,-66],
      [80,-66],[60,-68],[40,-69],[20,-69],[0,-70],
      [-20,-71],[-40,-71],[-60,-71],[-72,-72],[-65,-67],
      [-58,-62],[-58,-66],[-66,-71],[-80,-72],[-100,-72],
      [-120,-72],[-140,-72],[-160,-71],[-180,-70],
      [-180,-78],[180,-78]
    ]}
  ];

  // ─────────────────────────────────────────────────────────────────
  //  starfield (background canvas, drawn once)
  // ─────────────────────────────────────────────────────────────────
  const bgCanvas = document.getElementById('bg');
  const bgCtx    = bgCanvas.getContext('2d');
  const STAR_PERIOD_MS = 5 * 60 * 1000;  // 5 min for full traversal

  const STARS = Array.from({ length: STAR_COUNT }, () => ({
    fx: Math.random(), fy: Math.random(),
    r:  Math.random() * 1.5 + 0.2,
    a:  Math.random() * 0.7 + 0.15
  }));

  function drawStars(t) {
    const W = bgCanvas.width, H = bgCanvas.height;
    const offset = (t / STAR_PERIOD_MS) % 1;   // [0..1) traversal phase
    bgCtx.clearRect(0, 0, W, H);
    STARS.forEach(({ fx, fy, r, a }) => {
      // shift right-to-left, wrap on screen edges
      let u = fx - offset;
      u = u - Math.floor(u);
      bgCtx.beginPath();
      bgCtx.arc(u * W, fy * H, r, 0, Math.PI * 2);
      bgCtx.fillStyle = `rgba(220,235,255,${a})`;
      bgCtx.fill();
    });
  }

  // ─────────────────────────────────────────────────────────────────
  //  build equirectangular world-map texture
  //   pipeline (Blue-Marble style):
  //    1 ocean base   2 bathymetry  3 chlorophyll  4 continents
  //    5 ice caps     6 deserts     7 coastlines    8 noise grain
  //    9 graticule    10 alpha→biome class (read by FS)
  // ─────────────────────────────────────────────────────────────────
  function buildWorldTexture() {
    const c = document.createElement('canvas');
    c.width  = TEX_W;
    c.height = TEX_H;
    const g = c.getContext('2d');

    const lonLat = (lon, lat) => [
      (lon + 180) / 360 * TEX_W,
      (90 - lat) / 180 * TEX_H
    ];

    // deterministic hash → [0..1)
    const hash = (a, b) => {
      let h = (a * 73856093) ^ (b * 19349663);
      h = h ^ (h >>> 16);
      h = Math.imul(h, 0x85ebca6b);
      h = h ^ (h >>> 13);
      return ((h >>> 0) % 1000000) / 1000000;
    };

    const hex2rgba = (hex, a) => {
      const r = parseInt(hex.slice(1,3), 16);
      const gn = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return `rgba(${r},${gn},${b},${a})`;
    };

    const tracePoly = (poly) => {
      g.beginPath();
      poly.forEach(([lon, lat], i) => {
        const [x, y] = lonLat(lon, lat);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      });
      g.closePath();
    };

    // ── pass 1: ocean base ───────────────────────────────────────
    function drawOceanBase() {
      g.fillStyle = '#0a1f3a';
      g.fillRect(0, 0, TEX_W, TEX_H);
      const og = g.createLinearGradient(0, 0, 0, TEX_H);
      og.addColorStop(0,    '#0a1f3a');
      og.addColorStop(0.30, '#0e2a4a');
      og.addColorStop(0.50, '#10355e');
      og.addColorStop(0.70, '#0e2a4a');
      og.addColorStop(1,    '#0a1f3a');
      g.fillStyle = og;
      g.fillRect(0, 0, TEX_W, TEX_H);
      // mottled radial stamps
      g.globalAlpha = 0.32;
      for (let i = 0; i < 38; i++) {
        const cx = hash(i, 1) * TEX_W;
        const cy = (0.18 + hash(i, 2) * 0.64) * TEX_H;
        const r  = (0.04 + hash(i, 3) * 0.07) * TEX_W;
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, '#16466e');
        rg.addColorStop(1, 'rgba(22,70,110,0)');
        g.fillStyle = rg;
        g.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      g.globalAlpha = 1.0;
    }

    // ── pass 2: bathymetry (continental shelf halos) ─────────────
    function drawBathymetry() {
      g.save();
      g.filter = 'blur(14px)';
      g.fillStyle = 'rgba(28,80,130,0.55)';
      LAND.forEach(({ poly }) => { tracePoly(poly); g.fill(); });
      g.restore();
    }

    // ── pass 3: chlorophyll blooms ───────────────────────────────
    function drawChlorophyllBlooms() {
      const blooms = [
        [-92, -25, -75, -5,  'rgba(60,130,120,0.20)'], // Peru upwelling
        [-50, 50,  -10, 65,  'rgba(80,140,130,0.18)'], // N Atlantic
        [-180,-65, 180, -45, 'rgba(70,140,140,0.16)'], // Antarctic Convergence
        [-25, 0,   2,   20,  'rgba(70,130,120,0.16)'], // W Africa
        [125, 30,  155, 50,  'rgba(70,130,120,0.16)'], // Kuroshio
        [-65, 35,  -45, 50,  'rgba(70,130,120,0.14)'], // Gulf Stream
        [80,  -10, 100, 10,  'rgba(70,130,120,0.13)'], // Equatorial Indian
        [55,  10,  78,  25,  'rgba(70,130,120,0.13)'], // Arabian Sea
        [-150,-30, -120,-10, 'rgba(70,130,120,0.12)'], // S Pacific
        [-180,55,  -140,68,  'rgba(80,140,140,0.16)'], // Bering
      ];
      g.save();
      g.filter = 'blur(20px)';
      blooms.forEach(([lonMin, latMin, lonMax, latMax, col]) => {
        const [x1, y1] = lonLat(lonMin, latMax);
        const [x2, y2] = lonLat(lonMax, latMin);
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const r  = Math.max(x2 - x1, y2 - y1) / 2;
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0,   col);
        rg.addColorStop(0.7, col.replace(/[\d.]+\)$/, '0.06)'));
        rg.addColorStop(1,   'rgba(0,0,0,0)');
        g.fillStyle = rg;
        g.fillRect(x1, y1, x2 - x1, y2 - y1);
      });
      g.restore();
    }

    // ── pass 4: continents (filled polygons) ─────────────────────
    function drawContinentsFill() {
      LAND.forEach(({ fill, poly }) => {
        tracePoly(poly);
        g.fillStyle = fill;
        g.fill();
      });
    }

    // ── pass 5: ice caps overlay (high-lat snow + jittered fringe) ─
    function drawIceCaps() {
      const ice = '#eef2f6';
      // North solid core
      const yN = lonLat(0, 72)[1];
      g.fillStyle = ice;
      g.fillRect(0, 0, TEX_W, yN);
      // North fringe 60..72° with hash-jittered bottom edge
      for (let x = 0; x < TEX_W; x += 5) {
        const j = Math.floor(hash(x, 100) * 22);
        const a = 0.55 + hash(x, 101) * 0.40;
        g.fillStyle = `rgba(238,242,246,${a.toFixed(3)})`;
        g.fillRect(x, yN, 5, j);
      }
      // South solid core (Antarctica latitudes)
      const yS = lonLat(0, -68)[1];
      g.fillStyle = ice;
      g.fillRect(0, yS, TEX_W, TEX_H - yS);
      // South fringe -55..-66
      for (let x = 0; x < TEX_W; x += 5) {
        const j = Math.floor(hash(x, 200) * 24);
        const a = 0.55 + hash(x, 201) * 0.40;
        g.fillStyle = `rgba(238,242,246,${a.toFixed(3)})`;
        g.fillRect(x, yS - j, 5, j);
      }
    }

    // ── pass 6: deserts (rectangular bbox + radial gradient + blur) ─
    function drawDeserts() {
      const deserts = [
        [-17,  14, 38,  30, '#c8a86a'], // Sahara
        [ 34,  17, 55,  30, '#c19960'], // Arabian
        [ 12, -28, 22, -19, '#b88a55'], // Kalahari/Namib
        [120, -30,142, -20, '#b87a48'], // Australian Outback
        [-72, -50,-65, -39, '#a48060'], // Patagonian
        [-72, -28,-68, -19, '#9c7050'], // Atacama
        [-115, 24,-101, 33, '#bc925a'], // Sonoran/Chihuahuan
        [-120, 36,-110, 43, '#a89070'], // Great Basin
        [ 88,  39,110,  47, '#b89870'], // Gobi
        [ 76,  36, 88,  42, '#bc9460'], // Taklamakan
        [ 52,  28, 65,  38, '#bb9866'], // Iranian Plateau
        [ 22,  14, 33,  20, '#c4a06e'], // Sahel transition
      ];
      g.save();
      g.filter = 'blur(12px)';
      deserts.forEach(([lonMin, latMin, lonMax, latMax, col]) => {
        const [x1, y1] = lonLat(lonMin, latMax);
        const [x2, y2] = lonLat(lonMax, latMin);
        const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2;
        const r  = Math.max(x2 - x1, y2 - y1) / 2;
        const rg = g.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0,    hex2rgba(col, 0.95));
        rg.addColorStop(0.55, hex2rgba(col, 0.55));
        rg.addColorStop(1,    hex2rgba(col, 0));
        g.fillStyle = rg;
        g.fillRect(x1, y1, x2 - x1, y2 - y1);
      });
      g.restore();
    }

    // ── pass 7: coastlines ───────────────────────────────────────
    function drawCoastlineStrokes() {
      g.lineWidth = 1.2;
      LAND.forEach(({ stroke, poly }) => {
        tracePoly(poly);
        g.strokeStyle = stroke;
        g.stroke();
      });
    }

    // ── pass 8: procedural noise grain (overlay 6%) ──────────────
    function drawNoiseGrain() {
      const NW = 256, NH = 128;
      const noise = document.createElement('canvas');
      noise.width = NW; noise.height = NH;
      const ng = noise.getContext('2d');
      const id = ng.createImageData(NW, NH);
      for (let i = 0; i < NW * NH; i++) {
        const v = Math.floor(hash(i, 999) * 255);
        id.data[i*4    ] = v;
        id.data[i*4 + 1] = v;
        id.data[i*4 + 2] = v;
        id.data[i*4 + 3] = 255;
      }
      ng.putImageData(id, 0, 0);
      const blur = document.createElement('canvas');
      blur.width = NW; blur.height = NH;
      const bg = blur.getContext('2d');
      bg.filter = 'blur(2px)';
      bg.drawImage(noise, 0, 0);
      g.save();
      g.globalCompositeOperation = 'overlay';
      g.globalAlpha = 0.06;
      g.drawImage(blur, 0, 0, NW, NH, 0, 0, TEX_W, TEX_H);
      g.restore();
    }

    // ── pass 9: graticule ────────────────────────────────────────
    function drawGraticule() {
      g.strokeStyle = 'rgba(80,140,220,0.13)';
      g.lineWidth = 1.0;
      for (let lat = -75; lat <= 75; lat += 15) {
        g.beginPath();
        const [, y] = lonLat(0, lat);
        g.moveTo(0, y); g.lineTo(TEX_W, y);
        g.stroke();
      }
      for (let lon = -180; lon < 180; lon += 15) {
        g.beginPath();
        const [x] = lonLat(lon, 0);
        g.moveTo(x, 0); g.lineTo(x, TEX_H);
        g.stroke();
      }
      // Equator emphasized
      g.strokeStyle = 'rgba(120,180,240,0.28)';
      g.lineWidth = 1.4;
      g.beginPath();
      const [, eqY] = lonLat(0, 0);
      g.moveTo(0, eqY); g.lineTo(TEX_W, eqY);
      g.stroke();
    }

    // ── pass 10: classify each pixel into biome class (alpha byte) ─
    //   sentinels: 0=ocean 64=desert 128=vegetation 192=tundra 255=icecap
    function snapAlphaToBiomeClasses() {
      const id   = g.getImageData(0, 0, TEX_W, TEX_H);
      const data = id.data;
      for (let y = 0; y < TEX_H; y++) {
        const lat = 90 - (y / TEX_H) * 180;
        const aLat = Math.abs(lat);
        for (let x = 0; x < TEX_W; x++) {
          const i = (y * TEX_W + x) * 4;
          const r = data[i], gn = data[i+1], b = data[i+2];
          let A;
          // ocean: deep-blue dominance — permissive to catch bathymetry/chlorophyll tints
          if (r < 90 && b > r + 15 && b > gn) {
            A = 0;                                    // OCEAN
          } else if (r > 200 && gn > 200 && b > 195) {
            A = 255;                                  // ICECAP (white)
          } else if (aLat >= 70) {
            A = 255;                                  // ICECAP (high lat fallback)
          } else if (r > 140 && gn > r * 0.62 && gn < r * 0.95 && b < r * 0.78) {
            A = 64;                                   // DESERT
          } else if (aLat >= 50) {
            A = 192;                                  // TUNDRA
          } else {
            A = 128;                                  // VEGETATION
          }
          data[i+3] = A;
        }
      }
      g.putImageData(id, 0, 0);
    }

    // ── run pipeline ─────────────────────────────────────────────
    drawOceanBase();
    drawBathymetry();
    drawChlorophyllBlooms();
    drawContinentsFill();
    drawIceCaps();
    drawDeserts();
    drawCoastlineStrokes();
    drawNoiseGrain();
    drawGraticule();
    snapAlphaToBiomeClasses();

    return c;
  }

  // ─────────────────────────────────────────────────────────────────
  //  4×4 matrix utilities (column-major)
  // ─────────────────────────────────────────────────────────────────
  const M4 = {
    ident: () => new Float32Array([1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]),

    persp: (fov, aspect, n, f) => {
      const t = 1 / Math.tan(fov / 2);
      const nf = 1 / (n - f);
      return new Float32Array([
        t/aspect, 0,    0,             0,
        0,        t,    0,             0,
        0,        0,    (f+n)*nf,     -1,
        0,        0,    2*f*n*nf,      0
      ]);
    },

    mul: (a, b) => {
      const o = new Float32Array(16);
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) {
          let s = 0;
          for (let k = 0; k < 4; k++) s += a[k*4+i] * b[j*4+k];
          o[j*4+i] = s;
        }
      }
      return o;
    },

    trans: (x, y, z) => new Float32Array([
      1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1
    ]),

    rotY: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]);
    },

    rotX: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]);
    },

    rotZ: (a) => {
      const c = Math.cos(a), s = Math.sin(a);
      return new Float32Array([c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  //  sphere geometry (positions, normals, uvs, indices)
  // ─────────────────────────────────────────────────────────────────
  function makeSphere(r, lonSegs, latSegs) {
    const positions = [], normals = [], uvs = [], indices = [];
    for (let i = 0; i <= latSegs; i++) {
      const v   = i / latSegs;
      const lat = Math.PI * (v - 0.5);  // -π/2 .. π/2
      const sLat = Math.sin(lat), cLat = Math.cos(lat);
      for (let j = 0; j <= lonSegs; j++) {
        const u   = j / lonSegs;
        const lon = 2 * Math.PI * (u - 0.5);  // -π .. π
        const sLon = Math.sin(lon), cLon = Math.cos(lon);
        const x = cLat * cLon, y = sLat, z = cLat * sLon;
        positions.push(r*x, r*y, r*z);
        normals.push(x, y, z);
        uvs.push(u, 1 - v);
      }
    }
    for (let i = 0; i < latSegs; i++) {
      for (let j = 0; j < lonSegs; j++) {
        const a = i * (lonSegs + 1) + j;
        const b = a + lonSegs + 1;
        indices.push(a, b, a + 1);
        indices.push(b, b + 1, a + 1);
      }
    }
    return { positions, normals, uvs, indices };
  }

  // ─────────────────────────────────────────────────────────────────
  //  shaders
  // ─────────────────────────────────────────────────────────────────
  const VS_SRC = `
    attribute vec3 aPos;
    attribute vec3 aNormal;
    attribute vec2 aUV;

    uniform mat4 uMV;
    uniform mat4 uProj;

    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying vec2 vUV;

    void main () {
      vec4 viewPos = uMV * vec4(aPos, 1.0);
      vViewPos = viewPos.xyz;
      vNormal  = (uMV * vec4(aNormal, 0.0)).xyz;
      vUV      = aUV;
      gl_Position = uProj * viewPos;
    }
  `;

  const FS_SRC = `
    precision mediump float;

    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying vec2 vUV;

    uniform sampler2D uTex;
    uniform float uTzLon;       // user's timezone center longitude (radians, world)
    uniform float uTzHalfWidth; // half-band width (radians)
    uniform float uTime;
    uniform float uYearPhase;   // 0..1, full year cycle (1 real min = 1 year)

    const float PI  = 3.1415926535;
    const float TAU = 6.2831853;

    void main () {
      vec3 N = normalize(vNormal);
      vec3 V = normalize(-vViewPos);

      vec4 base = texture2D(uTex, vUV);

      // ── biome class from alpha sentinel (with mipmap-blur tolerance) ──
      float biomeA = base.a;
      float isOcean      = step(biomeA, 0.125);
      float isDesert     = step(0.20, biomeA) * step(biomeA, 0.30);
      float isVegetation = step(0.45, biomeA) * step(biomeA, 0.55);
      float isTundra     = step(0.70, biomeA) * step(biomeA, 0.80);
      float isIceCore    = step(0.95, biomeA);

      // ── seasonal modulation (vegetation green↔brown, snow line) ──
      float latDeg      = (0.5 - vUV.y) * 180.0;        // -90..+90
      float yearAngle   = uYearPhase * TAU;
      float nhSeason    = sin(yearAngle);                // +1 NH summer, -1 NH winter
      float seasonFactor= nhSeason * sign(latDeg);       // local: +1 summer, -1 winter
      float latStrength = smoothstep(5.0, 45.0, abs(latDeg)); // 0 in tropics

      vec3  winterBrown = vec3(0.42, 0.34, 0.20);
      vec3  summerBoost = vec3(0.05, 0.12, 0.03);
      float winterness  = clamp(-seasonFactor * latStrength * 0.5 + 0.5, 0.0, 1.0);
      vec3  vegSummer   = base.rgb + summerBoost * latStrength;
      vec3  vegWinter   = mix(base.rgb, winterBrown, 0.55);
      vec3  vegColor    = mix(vegSummer, vegWinter, winterness);
      float vegMask     = isVegetation + isTundra * 0.7;
      vec3  modulated   = mix(base.rgb, vegColor, vegMask);

      // dynamic snow line: ±70° in summer → ±45° in winter (per hemisphere)
      float snowLineDeg = mix(45.0, 70.0, clamp(seasonFactor * 0.5 + 0.5, 0.0, 1.0));
      float snowEligible= isTundra + isVegetation * step(50.0, abs(latDeg));
      float snowAmount  = snowEligible *
                          smoothstep(snowLineDeg - 3.0, snowLineDeg + 3.0, abs(latDeg));
      vec3  snowColor   = vec3(0.92, 0.94, 0.96);
      modulated = mix(modulated, snowColor, snowAmount);

      // permanent ice cores stay white year-round
      modulated = mix(modulated, snowColor, isIceCore);

      // oceans and deserts are not modulated
      modulated = mix(modulated, base.rgb, max(isOcean, isDesert));

      base.rgb = modulated;

      // longitude in radians from the texture's u coord (-PI .. PI)
      float lon = (vUV.x - 0.5) * TAU;
      float diff = lon - uTzLon;
      diff = mod(diff + PI, TAU) - PI;
      float ad = abs(diff);

      // timezone band overlay
      float band = 1.0 - smoothstep(uTzHalfWidth - 0.020, uTzHalfWidth, ad);
      base.rgb = mix(base.rgb, vec3(1.0, 0.85, 0.30), band * 0.32);

      // pulsing center meridian
      float pulse = 0.55 + 0.45 * sin(uTime * 0.0025);
      float lineW = 0.006;
      float line = 1.0 - smoothstep(lineW - 0.002, lineW, ad);
      base.rgb = mix(base.rgb, vec3(1.0, 0.95, 0.50), line * 0.85 * pulse);

      // diffuse lighting
      vec3 L = normalize(vec3(0.55, 0.30, 0.85));
      float NdotL = dot(N, L);
      float dayL  = max(NdotL, 0.0);
      float intensity = 0.32 + dayL * 0.85;
      vec3 color = base.rgb * intensity;

      // night-side hint
      float nightK = max(-NdotL, 0.0);
      color += base.rgb * vec3(0.05, 0.10, 0.20) * nightK * 0.30;

      // Fresnel atmosphere rim glow
      float fres = 1.0 - max(dot(N, V), 0.0);
      fres = pow(fres, 2.8);
      color += vec3(0.30, 0.55, 1.00) * fres * 0.65;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  // ─────────────────────────────────────────────────────────────────
  //  WebGL helpers
  // ─────────────────────────────────────────────────────────────────
  function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('shader compile error:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  function link(gl, vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error('program link error:', gl.getProgramInfoLog(p));
      return null;
    }
    return p;
  }

  function buf(gl, data, target) {
    const b = gl.createBuffer();
    gl.bindBuffer(target, b);
    gl.bufferData(target, data, gl.STATIC_DRAW);
    return b;
  }

  // ─────────────────────────────────────────────────────────────────
  //  initialise WebGL
  // ─────────────────────────────────────────────────────────────────
  const glCanvas = document.getElementById('gl');
  const gl = glCanvas.getContext('webgl', { antialias: true, alpha: true })
          || glCanvas.getContext('experimental-webgl', { antialias: true, alpha: true });

  if (!gl) {
    document.body.innerHTML =
      '<div style="color:#fff;font-family:monospace;padding:30px">WebGL não suportado neste navegador.</div>';
    return;
  }

  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.cullFace(gl.BACK);

  // shader program
  const vs   = compile(gl, gl.VERTEX_SHADER,   VS_SRC);
  const fs   = compile(gl, gl.FRAGMENT_SHADER, FS_SRC);
  const prog = link(gl, vs, fs);
  gl.useProgram(prog);

  const aPos    = gl.getAttribLocation(prog, 'aPos');
  const aNormal = gl.getAttribLocation(prog, 'aNormal');
  const aUV     = gl.getAttribLocation(prog, 'aUV');

  const uMV          = gl.getUniformLocation(prog, 'uMV');
  const uProj        = gl.getUniformLocation(prog, 'uProj');
  const uTex         = gl.getUniformLocation(prog, 'uTex');
  const uTzLon       = gl.getUniformLocation(prog, 'uTzLon');
  const uTzHalfWidth = gl.getUniformLocation(prog, 'uTzHalfWidth');
  const uTime        = gl.getUniformLocation(prog, 'uTime');
  const uYearPhase   = gl.getUniformLocation(prog, 'uYearPhase');

  // sphere
  const sphere = makeSphere(1.0, 96, 48);
  const posBuf = buf(gl, new Float32Array(sphere.positions), gl.ARRAY_BUFFER);
  const nrmBuf = buf(gl, new Float32Array(sphere.normals),   gl.ARRAY_BUFFER);
  const uvBuf  = buf(gl, new Float32Array(sphere.uvs),       gl.ARRAY_BUFFER);
  const idxBuf = buf(gl, new Uint16Array(sphere.indices),    gl.ELEMENT_ARRAY_BUFFER);
  const idxLen = sphere.indices.length;

  // texture
  const worldCanvas = buildWorldTexture();
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, worldCanvas);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);

  // ─────────────────────────────────────────────────────────────────
  //  resize handling (with HiDPI)
  // ─────────────────────────────────────────────────────────────────
  function onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = window.innerWidth, cssH = window.innerHeight;

    glCanvas.width  = Math.floor(cssW * dpr);
    glCanvas.height = Math.floor(cssH * dpr);
    bgCanvas.width  = Math.floor(cssW * dpr);
    bgCanvas.height = Math.floor(cssH * dpr);

    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  }
  window.addEventListener('resize', onResize);
  onResize();

  // ─────────────────────────────────────────────────────────────────
  //  render loop
  // ─────────────────────────────────────────────────────────────────
  const tzOffsetHr = -new Date().getTimezoneOffset() / 60;
  const tzLonRad   = tzOffsetHr * 15 * Math.PI / 180;
  const tzHalfRad  = 7.5 * Math.PI / 180;     // half-width of one timezone
  const YEAR_PERIOD_MS = 60 * 1000;           // 1 real minute = 1 simulated year

  let startT = performance.now();
  let lastT  = startT;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = now - lastT;
    lastT = now;

    drawStars(now);

    const aspect = glCanvas.width / glCanvas.height;
    const proj   = M4.persp(FOV_V, aspect, 0.1, 100);

    // responsive camera distance: ensure full sphere fits both axes
    const halfFovV = FOV_V / 2;
    const halfFovH = Math.atan(aspect * Math.tan(halfFovV));
    const dist     = FIT_MARGIN / Math.sin(Math.min(halfFovV, halfFovH));

    // model-view: spin → tilt → push back
    const angle = (now - startT) * ROT_SPEED;
    let mv = M4.trans(0, 0, -dist);
    mv = M4.mul(mv, M4.rotZ(AXIAL_TILT));
    mv = M4.mul(mv, M4.rotY(angle));

    // seasonal phase: 1 real minute = 1 simulated year
    const yearPhase = ((now - startT) % YEAR_PERIOD_MS) / YEAR_PERIOD_MS;

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(prog);

    // attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, nrmBuf);
    gl.enableVertexAttribArray(aNormal);
    gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuf);

    // uniforms
    gl.uniformMatrix4fv(uProj, false, proj);
    gl.uniformMatrix4fv(uMV,   false, mv);
    gl.uniform1f(uTzLon, tzLonRad);
    gl.uniform1f(uTzHalfWidth, tzHalfRad);
    gl.uniform1f(uTime, now);
    gl.uniform1f(uYearPhase, yearPhase);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(uTex, 0);

    gl.drawElements(gl.TRIANGLES, idxLen, gl.UNSIGNED_SHORT, 0);
  }
  requestAnimationFrame(frame);

  // ─────────────────────────────────────────────────────────────────
  //  clock
  // ─────────────────────────────────────────────────────────────────
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