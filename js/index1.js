(function () {
  'use strict';

  // ── constants ────────────────────────────────────────────────────
  const MAP_W = 1800;   // px for one full world
  const SPEED = 0.45;   // px / frame  (~27 px/s at 60 fps)

  const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira',
                    'Quinta-feira','Sexta-feira','Sábado'];
  const MONTHS   = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  // ── canvas ───────────────────────────────────────────────────────
  const canvas = document.getElementById('c');
  const ctx    = canvas.getContext('2d');
  let W, H, mapCanvas, scrollX = 0;

  // ── Mercator projection ──────────────────────────────────────────
  function lon2x(lon) {
    return (lon + 180) / 360 * MAP_W;
  }
  function lat2y(lat, mH) {
    const c = Math.max(-83, Math.min(83, lat));
    const r = c * Math.PI / 180;
    const n = Math.log(Math.tan(Math.PI / 4 + r / 2));
    return mH / 2 - mH * n / (2 * Math.PI);
  }

  // ── land polygons [lon, lat][] ────────────────────────────────────
  const LAND = [
    {
      name: 'north-america',
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
      name: 'greenland',
      fill: '#3a6836', stroke: '#5a9852',
      poly: [
        [-70,83],[-42,83],[-20,77],[-18,71],
        [-22,65],[-44,60],[-52,63],[-60,66],
        [-68,70],[-72,77],[-70,83]
      ]
    },
    {
      name: 'south-america',
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
      name: 'europe',
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
      name: 'africa',
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
      name: 'asia',
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
      name: 'australia',
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
      name: 'new-zealand',
      fill: '#486e30', stroke: '#689a50',
      poly: [
        [166,-46],[170,-46],[172,-44],[174,-42],
        [174,-38],[172,-36],[170,-36],[168,-38],
        [168,-42],[166,-44],[166,-46]
      ]
    },
    {
      name: 'antarctica',
      fill: '#5e7e76', stroke: '#8aaea4',
      poly: [
        [-180,-68],[-120,-68],[-60,-68],[0,-68],
        [60,-68],[120,-68],[180,-68],
        [180,-83],[-180,-83],[-180,-68]
      ]
    },
    {
      name: 'british-isles',
      fill: '#304e2c', stroke: '#507a4a',
      poly: [
        [-6,58],[-3,58],[-2,56],[0,53],
        [0,51],[-2,50],[-5,50],[-5,54],
        [-6,56],[-6,58]
      ]
    },
    {
      name: 'iceland',
      fill: '#304e2c', stroke: '#507a4a',
      poly: [
        [-24,63],[-22,66],[-18,66],[-13,66],
        [-13,64],[-16,63],[-20,63],[-24,63]
      ]
    },
    {
      name: 'japan',
      fill: '#2c5428', stroke: '#4c8444',
      poly: [
        [130,31],[131,33],[133,35],[136,36],
        [138,38],[141,36],[141,34],[140,32],
        [136,30],[130,31]
      ]
    }
  ];

  // ── build offscreen map (called once per resize) ──────────────────
  function buildMapCanvas(mH) {
    const oc  = document.createElement('canvas');
    oc.width  = MAP_W;
    oc.height = mH;
    const g   = oc.getContext('2d');

    // ocean gradient
    const og = g.createLinearGradient(0, 0, 0, mH);
    og.addColorStop(0,    '#030c1a');
    og.addColorStop(0.45, '#091c32');
    og.addColorStop(0.55, '#091c32');
    og.addColorStop(1,    '#030c1a');
    g.fillStyle = og;
    g.fillRect(0, 0, MAP_W, mH);

    // subtle latitude grid
    for (let lat = -80; lat <= 80; lat += 20) {
      const y = lat2y(lat, mH);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(MAP_W, y);
      g.strokeStyle = lat === 0
        ? 'rgba(100,170,240,0.22)'
        : 'rgba( 55,105,175,0.10)';
      g.lineWidth = lat === 0 ? 1 : 0.5;
      g.setLineDash([]);
      g.stroke();
    }

    // time-zone verticals + labels
    const fSz = Math.max(9, MAP_W / 220);
    for (let tz = -12; tz <= 12; tz++) {
      const x    = lon2x(tz * 15);
      const main = tz % 6 === 0;
      g.setLineDash(main ? [] : [4, 8]);
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, mH);
      g.strokeStyle = main
        ? 'rgba( 80,145,215,0.24)'
        : 'rgba( 55,105,175,0.11)';
      g.lineWidth = main ? 1 : 0.5;
      g.stroke();
      g.setLineDash([]);

      if (tz % 3 === 0) {
        g.fillStyle = 'rgba(130,185,245,0.40)';
        g.font = `${fSz}px "Courier New"`;
        g.fillText(`UTC${tz >= 0 ? '+' : ''}${tz}`, x + 3, 16);
      }
    }

    // tropics & arctic circles (dashed)
    [23.5, -23.5, 66.5, -66.5].forEach(lat => {
      const y = lat2y(lat, mH);
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(MAP_W, y);
      g.strokeStyle = 'rgba(200,180,80,0.10)';
      g.lineWidth   = 0.6;
      g.setLineDash([3, 14]);
      g.stroke();
      g.setLineDash([]);
    });

    // land masses
    LAND.forEach(({ fill, stroke, poly }) => {
      g.beginPath();
      poly.forEach(([lon, lat], i) => {
        const x = lon2x(lon);
        const y = lat2y(lat, mH);
        i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      });
      g.closePath();
      g.fillStyle   = fill;
      g.fill();
      g.strokeStyle = stroke;
      g.lineWidth   = 0.9;
      g.stroke();
    });

    // top/bottom vignette
    const vg = g.createLinearGradient(0, 0, 0, mH);
    vg.addColorStop(0,    'rgba(3,12,26,0.70)');
    vg.addColorStop(0.18, 'rgba(3,12,26,0)');
    vg.addColorStop(0.82, 'rgba(3,12,26,0)');
    vg.addColorStop(1,    'rgba(3,12,26,0.70)');
    g.fillStyle = vg;
    g.fillRect(0, 0, MAP_W, mH);

    return oc;
  }

  // ── resize ───────────────────────────────────────────────────────
  function onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    mapCanvas = buildMapCanvas(H);
  }
  window.addEventListener('resize', onResize);
  onResize();

  // ── animation loop ───────────────────────────────────────────────
  function frame() {
    requestAnimationFrame(frame);

    scrollX = (scrollX + SPEED) % MAP_W;
    const x0 = -scrollX;

    // draw enough tiles to cover any screen width
    const tiles = Math.ceil(W / MAP_W) + 1;
    for (let i = 0; i < tiles; i++) {
      ctx.drawImage(mapCanvas, x0 + i * MAP_W, 0);
    }

    // highlight the user's current timezone band
    const tzOff = -new Date().getTimezoneOffset() / 60;
    const tzCX  = lon2x(tzOff * 15);   // center x on map
    const bandW = MAP_W / 24;

    for (let i = 0; i < tiles; i++) {
      const bx = x0 + i * MAP_W + tzCX - bandW / 2;
      if (bx + bandW < 0 || bx > W) continue;

      // amber band glow
      ctx.fillStyle = 'rgba(255, 215, 70, 0.07)';
      ctx.fillRect(bx, 0, bandW, H);

      // center meridian line
      ctx.strokeStyle = 'rgba(255, 215, 70, 0.55)';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(bx + bandW / 2, 0);
      ctx.lineTo(bx + bandW / 2, H);
      ctx.stroke();
      ctx.setLineDash([]);
    }
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
    dateEl.textContent = `${WEEKDAYS[n.getDay()]}, ${n.getDate()} de ${MONTHS[n.getMonth()]} de ${n.getFullYear()}`;

    const off  = -n.getTimezoneOffset() / 60;
    const sign = off >= 0 ? '+' : '';
    const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
    tzEl.textContent = `${iana} · UTC${sign}${off}`;
  }

  tick();
  setInterval(tick, 1000);

}());