/* Formula One — a 3D presentation.
 * Plain script (no build step): three.js r149 and GSAP 3.12.5 are loaded as globals from ./vendor.
 * One source of truth for the current slide; the 3D world reads a single mutable `state`
 * object every frame, and GSAP is the only thing that writes to it.
 */
(function () {
  'use strict';

  const THREE = window.THREE;
  const gsap = window.gsap;

  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reduceMQ.matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ------------------------------------------------------------------ */
  /* Content data                                                        */
  /* ------------------------------------------------------------------ */

  const CHAPTERS = [
    { id: 'intro', label: 'Introduction', short: 'Intro' },
    { id: 'history', label: 'History', short: 'History' },
    { id: 'teams', label: 'Teams and drivers', short: 'Teams & drivers' },
    { id: 'weekend', label: 'The race weekend', short: 'Race weekend' },
    { id: 'tech', label: 'Cars and technology', short: 'Cars & tech' },
    { id: 'finale', label: 'Lights out', short: 'Lights out' },
  ];

  const ERAS = [
    { label: '1950s', title: 'Front-engined giants', text: 'Alfa Romeo, Ferrari, Maserati and Mercedes-Benz set the pace with big front-engined cars. Juan Manuel Fangio won five titles with four different manufacturers.' },
    { label: '1960s', title: 'The engine moves behind the driver', text: 'Cooper won the 1959 and 1960 titles with its engine behind the driver, and the rest of the grid followed. The 1962 Lotus 25 brought a monocoque chassis, and from 1968 sponsors’ colours replaced national racing colours.' },
    { label: '1970s', title: 'Wings and ground effect', text: 'Wings, first seen in 1968, became standard. Lotus then shaped the whole underside of its cars to pull them towards the track, and Renault introduced the first turbocharged engine in 1977.' },
    { label: '1980s', title: 'Turbos and carbon fibre', text: 'McLaren’s MP4/1 of 1981 introduced the carbon-fibre composite chassis. Turbo engines made well over 1,000 horsepower in qualifying trim before they were banned after 1988.' },
    { label: '1990s', title: 'Electronics, then safety', text: 'Active suspension and traction control made cars faster than ever until most driver aids were banned for 1994. The deaths of Roland Ratzenberger and Ayrton Senna at Imola that year began a lasting overhaul of safety.' },
    { label: '2000–13', title: 'V10s, V8s and new tools', text: 'Michael Schumacher and Ferrari won five drivers’ titles in a row from 2000. V8 engines replaced V10s in 2006, energy recovery (KERS) arrived in 2009 and the drag reduction system (DRS) in 2011.' },
    { label: '2014–25', title: 'The hybrid era', text: '1.6-litre V6 turbo hybrids arrived in 2014, recovering energy from braking and exhaust heat. The halo became mandatory in 2018, and ground-effect floors returned in 2022 to help cars follow each other closely.' },
    { label: '2026', title: 'A new rulebook', text: 'Power units with roughly half their output electric, fully sustainable fuel, smaller cars with movable wings, and an eleventh team on the grid.' },
  ];

  const TEAMS = {
    house: { body: 0x2a2a2f, accent: 0xff3b2f, wing: 0x131316 },
    ferrari: { name: 'Ferrari', body: 0xb5121b, accent: 0xf2eee6, wing: 0x141416, meta: 'Maranello, Italy · in every season since 1950', text: 'The only team to have raced in every World Championship season. Its 16 Constructors’ titles are the most of any team.' },
    mclaren: { name: 'McLaren', body: 0xff7a00, accent: 0x1d1f24, wing: 0x1d1f24, meta: 'Woking, England · debut 1966', text: 'Founded by New Zealand driver Bruce McLaren. Lauda, Prost, Senna, Häkkinen and Hamilton all won world titles in its cars.' },
    williams: { name: 'Williams', body: 0x1d3f8f, accent: 0xf2eee6, wing: 0x101a33, meta: 'Grove, England · founded 1977', text: 'Built by Frank Williams and Patrick Head. Nine Constructors’ titles between 1980 and 1997 made it the benchmark of its time.' },
    mercedes: { name: 'Mercedes', body: 0xc3c7cc, accent: 0x00a19b, wing: 0x111113, meta: 'Brackley, England · works team since 2010', text: 'Its silver cars won eight Constructors’ titles in a row, from 2014 to 2021: the longest run in the sport’s history.' },
    redbull: { name: 'Red Bull', body: 0x23305a, accent: 0xd3122f, wing: 0x1a2240, meta: 'Milton Keynes, England · entered 2005', text: 'Took over the Jaguar team and turned it into a champion: Sebastian Vettel won four titles from 2010 to 2013, Max Verstappen four from 2021 to 2024.' },
  };

  const DRIVERS = [
    { name: 'Juan Manuel Fangio', short: 'Fangio', titles: 5, meta: 'Argentina · 1951, 1954–1957', text: 'Won his five titles with Alfa Romeo, Maserati, Mercedes-Benz and Ferrari.' },
    { name: 'Jim Clark', short: 'Clark', titles: 2, meta: 'Scotland · 1963, 1965', text: 'Also won the 1965 Indianapolis 500, the same year as his second title.' },
    { name: 'Niki Lauda', short: 'Lauda', titles: 3, meta: 'Austria · 1975, 1977, 1984', text: 'Raced again six weeks after suffering severe burns in a crash at the Nürburgring in 1976.' },
    { name: 'Alain Prost', short: 'Prost', titles: 4, meta: 'France · 1985, 1986, 1989, 1993', text: 'Known as “the Professor” for his calculated, economical driving.' },
    { name: 'Ayrton Senna', short: 'Senna', titles: 3, meta: 'Brazil · 1988, 1990, 1991', text: 'Took 65 pole positions and is still celebrated for his speed in the wet.' },
    { name: 'Michael Schumacher', short: 'Schumacher', titles: 7, meta: 'Germany · 1994, 1995, 2000–2004', text: 'Won five consecutive titles with Ferrari from 2000 to 2004.' },
    { name: 'Lewis Hamilton', short: 'Hamilton', titles: 7, meta: 'Great Britain · 2008, 2014, 2015, 2017–2020', text: 'Holds the records for the most Grand Prix wins and the most pole positions.' },
    { name: 'Max Verstappen', short: 'Verstappen', titles: 4, meta: 'Netherlands · 2021–2024', text: 'Won 19 of the 22 races in 2023, the most in a single season.' },
  ];

  const PARTS = {
    frontWing: { title: 'Front wing', text: 'The first surface to meet the air. It makes downforce and steers the airflow around the front wheels and along the rest of the car.' },
    chassis: { title: 'Survival cell', text: 'A carbon-fibre composite monocoque around the driver. It must pass FIA crash and load tests before the car is allowed to race.' },
    halo: { title: 'Halo', text: 'A titanium hoop over the cockpit, mandatory since 2018. It is designed to deflect large debris and withstand loads of around 125 kN.' },
    power: { title: 'Power unit', text: 'A 1.6-litre turbocharged V6 combined with an electric motor-generator and a battery that stores energy recovered under braking.' },
    floor: { title: 'Floor', text: 'Since 2022, shaped tunnels under the car create low pressure that pulls it towards the track. This ground effect makes much of the downforce.' },
    rearWing: { title: 'Rear wing', text: 'Adds downforce for the corners. From 2026 its flap opens on the straights to cut drag, then closes again for the next corner.' },
    tyres: { title: 'Tyres', text: 'Pirelli supplies every team. Wheels have been 18 inches across since 2022, and tyre management often decides the race.' },
  };

  /* ------------------------------------------------------------------ */
  /* 3D world                                                            */
  /* ------------------------------------------------------------------ */

  function createWorld(canvas) {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      return null;
    }
    if (!renderer || !renderer.getContext()) return null;

    // Treat hex colours as sRGB (r149 defaults to legacy linear handling, which lifts the blacks).
    if (THREE.ColorManagement) THREE.ColorManagement.legacyMode = false;

    const coarse = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setClearColor(0x09090b, 1);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x09090b, 10, 40);
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 1200);

    /* Environment: a dark studio with three soft boxes, baked once. */
    (function buildEnv() {
      const env = new THREE.Scene();
      const room = new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x060607, side: THREE.BackSide }));
      env.add(room);
      const box = (w, h, color, k, pos, rot) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
        m.position.set(...pos); m.rotation.set(...rot); env.add(m);
      };
      box(10, 4, 0xffffff, 3.2, [0, 6.8, 0], [Math.PI / 2, 0, 0]);
      box(2, 9, 0xff4a3a, 2.2, [-12, 2, -6], [0, Math.PI / 3, 0]);
      box(2, 9, 0x8fb2ff, 1.2, [12, 2, 5], [0, -Math.PI / 2.4, 0]);
      box(14, 1.2, 0xfff1df, 1.5, [0, 1.5, 14], [0, Math.PI, 0]);
      const pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = pmrem.fromScene(env, 0.04).texture;
      pmrem.dispose();
    })();

    scene.add(new THREE.HemisphereLight(0x9aa3b5, 0x0b0b0d, 0.35));
    const key = new THREE.DirectionalLight(0xfff3e6, 1.1); key.position.set(5, 9, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xff3b2f, 0.75); rim.position.set(-4, 3, -7); scene.add(rim);
    const fill = new THREE.DirectionalLight(0x7f9fff, 0.35); fill.position.set(-7, 2, 4); scene.add(fill);

    /* Helpers */
    const canvasTex = (w, h, draw) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
      t.userData.redraw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
      return t;
    };
    const radialTex = canvasTex(256, 256, (g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const labelTextures = [];
    const label = (lines, opts = {}) => {
      const tex = canvasTex(512, 256, (g, w, h) => {
        g.textAlign = 'center'; g.textBaseline = 'alphabetic';
        g.fillStyle = opts.color || '#f2eee6';
        g.font = `800 ${opts.big || 150}px "Saira Condensed", "Arial Narrow", sans-serif`;
        g.fillText(lines[0], w / 2, lines[1] ? 150 : 190);
        if (lines[1]) {
          g.font = '600 52px "Saira Condensed", "Arial Narrow", sans-serif';
          g.fillStyle = opts.sub || '#a7a29a';
          g.fillText(lines[1], w / 2, 225);
        }
      });
      labelTextures.push(tex);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, fog: true }));
      return s;
    };
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('800 100px "Saira Condensed"'), document.fonts.load('600 50px "Saira Condensed"')])
        .then(() => labelTextures.forEach((t) => t.userData.redraw())).catch(() => {});
    }

    /* Fader: crossfades every material in a group and hides it when fully transparent. */
    const makeFader = (group) => {
      const mats = new Map();
      group.traverse((o) => {
        const list = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        list.forEach((m) => { if (!mats.has(m)) mats.set(m, { opacity: m.opacity, transparent: m.transparent, depthWrite: m.depthWrite }); });
      });
      let last = -1;
      return (p) => {
        if (Math.abs(p - last) < 1e-4) return;
        last = p;
        group.visible = p > 0.004;
        mats.forEach((b, m) => {
          m.opacity = b.opacity * p;
          m.transparent = b.transparent || p < 0.999;
          m.depthWrite = b.depthWrite && p > 0.6;
        });
      };
    };

    /* Loft: smooth body from superellipse cross-sections (nose → tail along -z). */
    function loft(sections, radial = 28) {
      const pos = [], idx = [];
      sections.forEach((s) => {
        const n = s.n || 2.6;
        for (let j = 0; j < radial; j++) {
          const a = (j / radial) * Math.PI * 2;
          const c = Math.cos(a), sn = Math.sin(a);
          pos.push((s.x || 0) + (s.w / 2) * Math.sign(c) * Math.pow(Math.abs(c), 2 / n), s.y + (s.h / 2) * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n), s.z);
        }
      });
      for (let i = 0; i < sections.length - 1; i++) {
        for (let j = 0; j < radial; j++) {
          const a = i * radial + j, b = (i + 1) * radial + j, c = i * radial + ((j + 1) % radial), d = (i + 1) * radial + ((j + 1) % radial);
          idx.push(a, b, c, c, b, d);
        }
      }
      const f = sections[0], l = sections[sections.length - 1];
      const fc = pos.length / 3; pos.push(f.x || 0, f.y, f.z + 0.01);
      const lc = pos.length / 3; pos.push(l.x || 0, l.y, l.z - 0.01);
      const lo = (sections.length - 1) * radial;
      for (let j = 0; j < radial; j++) {
        idx.push(fc, j, (j + 1) % radial);
        idx.push(lc, lo + ((j + 1) % radial), lo + j);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setIndex(idx); g.computeVertexNormals();
      return g;
    }
    const box = (w, h, d, mat, x = 0, y = 0, z = 0, rx = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.x = rx; return m;
    };
    const beam = (a, b, r, mat) => {
      const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
      const len = va.distanceTo(vb);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), mat);
      m.position.copy(va).add(vb).multiplyScalar(0.5);
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
      return m;
    };

    /* Materials */
    const paint = new THREE.MeshPhysicalMaterial({ color: TEAMS.house.body, metalness: 0.35, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.15 });
    const accent = new THREE.MeshPhysicalMaterial({ color: TEAMS.house.accent, metalness: 0.2, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.1 });
    const wingMat = new THREE.MeshStandardMaterial({ color: TEAMS.house.wing, metalness: 0.45, roughness: 0.42 });
    const carbon = new THREE.MeshStandardMaterial({ color: 0x0e0e10, metalness: 0.35, roughness: 0.55, envMapIntensity: 0.35 });
    const black = new THREE.MeshStandardMaterial({ color: 0x030304, metalness: 0.2, roughness: 0.25 });
    const haloMat = new THREE.MeshStandardMaterial({ color: 0x4a4a52, metalness: 0.75, roughness: 0.32, emissive: 0xff3b2f, emissiveIntensity: 0 });
    const helmetMat = new THREE.MeshPhysicalMaterial({ color: 0xece8e0, roughness: 0.25, clearcoat: 1 });
    const puMat = new THREE.MeshStandardMaterial({ color: 0x2c2c31, metalness: 0.85, roughness: 0.32, emissive: 0xff4a12, emissiveIntensity: 0 });
    const puGlow = new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0 });
    const tailLight = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff2a1a).multiplyScalar(2) });

    function makeWheel(width, bandColor, mats) {
      const R = 0.36, r0 = 0.235;
      const prof = [
        new THREE.Vector2(r0, -width / 2), new THREE.Vector2(R - 0.05, -width / 2), new THREE.Vector2(R - 0.012, -width / 2 + 0.03),
        new THREE.Vector2(R, -width / 2 + 0.07), new THREE.Vector2(R, width / 2 - 0.07), new THREE.Vector2(R - 0.012, width / 2 - 0.03),
        new THREE.Vector2(R - 0.05, width / 2), new THREE.Vector2(r0, width / 2),
      ];
      const outer = new THREE.Group();
      const spin = new THREE.Group();
      outer.add(spin);
      spin.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 56), mats.tyre));
      const rimM = new THREE.Mesh(new THREE.CylinderGeometry(r0 + 0.004, r0 + 0.004, width * 0.92, 40), mats.rim);
      spin.add(rimM);
      const bandMat = new THREE.MeshBasicMaterial({ color: bandColor });
      [-1, 1].forEach((s) => {
        const band = new THREE.Mesh(new THREE.TorusGeometry(R - 0.055, 0.009, 6, 64), bandMat);
        band.rotation.x = Math.PI / 2; band.position.y = s * (width / 2 + 0.002); spin.add(band);
        const cap = new THREE.Mesh(new THREE.CircleGeometry(0.05, 20), mats.hub);
        cap.rotation.x = s * -Math.PI / 2; cap.position.y = s * (width * 0.46 + 0.002); spin.add(cap);
      });
      outer.rotation.z = Math.PI / 2;
      outer.userData.spin = spin;
      outer.userData.band = bandMat;
      return outer;
    }

    /* ---- Car ---- */
    const car = new THREE.Group();
    const parts = {};
    {
      const body = new THREE.Group(); parts.body = body; car.add(body);
      body.add(new THREE.Mesh(loft([
        { z: 2.86, w: 0.1, h: 0.08, y: 0.24, n: 2.2 },
        { z: 2.6, w: 0.2, h: 0.13, y: 0.26, n: 2.2 },
        { z: 2.0, w: 0.3, h: 0.2, y: 0.31 },
        { z: 1.3, w: 0.42, h: 0.3, y: 0.38 },
        { z: 0.75, w: 0.56, h: 0.42, y: 0.44 },
        { z: 0.25, w: 0.64, h: 0.5, y: 0.47 },
        { z: -0.15, w: 0.66, h: 0.56, y: 0.5 },
        { z: -0.4, w: 0.56, h: 0.8, y: 0.58 },
        { z: -0.85, w: 0.52, h: 0.64, y: 0.54 },
        { z: -1.4, w: 0.36, h: 0.44, y: 0.45 },
        { z: -1.95, w: 0.2, h: 0.24, y: 0.38 },
        { z: -2.2, w: 0.12, h: 0.14, y: 0.35 },
      ]), paint));
      // nose tip in the accent colour
      body.add(new THREE.Mesh(loft([
        { z: 2.88, w: 0.11, h: 0.09, y: 0.24, n: 2.2 },
        { z: 2.6, w: 0.215, h: 0.142, y: 0.26, n: 2.2 },
        { z: 2.42, w: 0.25, h: 0.165, y: 0.275, n: 2.2 },
      ], 24), accent));
      [-1, 1].forEach((s) => {
        body.add(new THREE.Mesh(loft([
          { x: s * 0.5, z: 0.72, w: 0.2, h: 0.22, y: 0.36 },
          { x: s * 0.5, z: 0.58, w: 0.42, h: 0.36, y: 0.38 },
          { x: s * 0.51, z: 0.0, w: 0.44, h: 0.38, y: 0.38 },
          { x: s * 0.47, z: -0.7, w: 0.36, h: 0.3, y: 0.34 },
          { x: s * 0.38, z: -1.3, w: 0.22, h: 0.2, y: 0.28 },
          { x: s * 0.3, z: -1.62, w: 0.1, h: 0.1, y: 0.24 },
        ]), paint));
        // sidepod inlet
        const inlet = new THREE.Mesh(new THREE.CircleGeometry(0.15, 24), black);
        inlet.scale.set(1.25, 0.95, 1); inlet.position.set(s * 0.52, 0.39, 0.7); body.add(inlet);
        // accent flash along the sidepod
        const flash = box(0.012, 0.07, 1.1, accent, s * 0.735, 0.4, -0.15); body.add(flash);
        // mirrors
        body.add(beam([s * 0.3, 0.66, 0.5], [s * 0.44, 0.74, 0.52], 0.012, carbon));
        body.add(box(0.15, 0.065, 0.045, paint, s * 0.47, 0.76, 0.52));
      });
      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 14), black);
      cockpit.scale.set(0.22, 0.07, 0.44); cockpit.position.set(0, 0.72, 0.26); body.add(cockpit);
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.135, 28, 18), helmetMat);
      helmet.position.set(0, 0.79, 0.18); body.add(helmet);
      const visor = new THREE.Mesh(new THREE.SphereGeometry(0.138, 28, 10, Math.PI / 2 - 0.65, 1.3, Math.PI * 0.36, Math.PI * 0.18), black);
      visor.position.copy(helmet.position); body.add(visor);
      const airbox = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), black);
      airbox.scale.set(1, 0.85, 1); airbox.position.set(0, 0.9, -0.12); body.add(airbox);
      body.add(box(0.012, 0.1, 0.9, accent, 0, 0.86, -1.0, -0.28)); // engine-cover fin

      // floor
      const fs = new THREE.Shape();
      [[0.25, 1.3], [0.72, 0.95], [0.78, 0.2], [0.76, -1.2], [0.56, -1.85], [-0.56, -1.85], [-0.76, -1.2], [-0.78, 0.2], [-0.72, 0.95], [-0.25, 1.3]]
        .forEach(([x, z], i) => (i ? fs.lineTo(x, z) : fs.moveTo(x, z)));
      const fg = new THREE.ExtrudeGeometry(fs, { depth: 0.04, bevelEnabled: false });
      fg.rotateX(Math.PI / 2); fg.translate(0, 0.09, 0);
      const floor = new THREE.Group(); parts.floor = floor; car.add(floor);
      const floorMat = new THREE.MeshStandardMaterial({ color: 0x0c0c0e, metalness: 0.1, roughness: 0.85, envMapIntensity: 0.3 });
      floor.add(new THREE.Mesh(fg, floorMat));
      floor.add(box(1.0, 0.02, 0.45, carbon, 0, 0.14, -2.02, 0.35)); // diffuser

      // front wing
      const fw = new THREE.Group(); parts.frontWing = fw; car.add(fw);
      fw.add(box(1.86, 0.025, 0.34, wingMat, 0, 0.09, 2.72));
      const fflaps = new THREE.Group(); fflaps.position.set(0, 0.11, 2.64); fw.add(fflaps); parts.frontFlaps = fflaps;
      fflaps.add(box(1.62, 0.02, 0.16, wingMat, 0, 0.04, -0.08, 0.28));
      fflaps.add(box(1.5, 0.02, 0.13, accent, 0, 0.09, -0.17, 0.5));
      [-1, 1].forEach((s) => {
        fw.add(box(0.025, 0.2, 0.46, accent, s * 0.93, 0.17, 2.68));
        fw.add(box(0.02, 0.17, 0.2, carbon, s * 0.12, 0.19, 2.62));
      });

      // rear wing
      const rw = new THREE.Group(); parts.rearWing = rw; car.add(rw);
      [-1, 1].forEach((s) => rw.add(box(0.025, 0.62, 0.62, accent, s * 0.52, 0.78, -2.22)));
      rw.add(box(1.03, 0.03, 0.3, wingMat, 0, 0.86, -2.2, -0.12));
      const flapPivot = new THREE.Group(); flapPivot.position.set(0, 0.93, -2.06); rw.add(flapPivot); parts.flap = flapPivot;
      flapPivot.add(box(1.03, 0.025, 0.22, wingMat, 0, 0, -0.11));
      rw.add(box(0.8, 0.025, 0.18, wingMat, 0, 0.42, -2.16, 0.2));
      rw.add(box(0.03, 0.5, 0.12, carbon, 0, 0.62, -2.05));
      rw.add(box(0.1, 0.05, 0.03, tailLight, 0, 0.3, -2.33));

      // halo
      const halo = new THREE.Group(); parts.halo = halo; car.add(halo);
      const loop = new THREE.CatmullRomCurve3([
        [-0.31, 0.66, -0.02], [-0.3, 0.8, 0.32], [-0.16, 0.86, 0.56], [0, 0.87, 0.62], [0.16, 0.86, 0.56], [0.3, 0.8, 0.32], [0.31, 0.66, -0.02],
      ].map((p) => new THREE.Vector3(...p)));
      halo.add(new THREE.Mesh(new THREE.TubeGeometry(loop, 64, 0.03, 10, false), haloMat));
      halo.add(beam([0, 0.87, 0.62], [0, 0.65, 0.95], 0.026, haloMat));

      // power unit (inside the body; revealed when the car is pulled apart)
      const pu = new THREE.Group(); parts.pu = pu; car.add(pu);
      pu.position.set(0, 0.42, -0.95); pu.scale.setScalar(0.85);
      pu.add(box(0.34, 0.3, 0.66, puMat, 0, 0, 0));
      [-1, 1].forEach((s) => [-0.2, 0, 0.2].forEach((z) => {
        const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.17, 14), puMat);
        cyl.position.set(s * 0.13, 0.2, z); cyl.rotation.z = s * 0.5; pu.add(cyl);
      }));
      const turbo = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.13, 20), puMat);
      turbo.rotation.x = Math.PI / 2; turbo.position.set(0, 0.06, -0.45); pu.add(turbo);
      const batt = box(0.42, 0.1, 0.5, puMat, 0, -0.14, 0.75); pu.add(batt);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 12), puGlow); core.scale.set(0.7, 0.5, 1.25); pu.add(core);

      // wheels and suspension
      const wheelMats = {
        tyre: new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.92, metalness: 0 }),
        rim: new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.9, roughness: 0.3 }),
        hub: accent,
      };
      parts.wheels = [];
      const arms = new THREE.Group(); parts.arms = arms; car.add(arms);
      [[0.8, 1.75, 0.3], [-0.8, 1.75, 0.3], [0.78, -1.62, 0.4], [-0.78, -1.62, 0.4]].forEach(([x, z, w]) => {
        const wh = makeWheel(w, 0xff3b2f, wheelMats);
        wh.position.set(x, 0.36, z); wh.userData.baseX = x; car.add(wh); parts.wheels.push(wh);
        const s = Math.sign(x), bx = s * 0.22, ix = x - s * (w / 2 + 0.02);
        arms.add(beam([bx, 0.3, z + 0.25], [ix, 0.38, z], 0.012, carbon));
        arms.add(beam([bx, 0.3, z - 0.25], [ix, 0.38, z], 0.012, carbon));
        arms.add(beam([bx, 0.52, z + 0.2], [ix, 0.5, z], 0.012, carbon));
      });
      car.userData.wheelMats = wheelMats;
    }
    scene.add(car);

    const carFx = new THREE.Group(); scene.add(carFx);
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6.6), new THREE.MeshBasicMaterial({ map: radialTex, color: 0x000000, transparent: true, opacity: 0.85, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.006; carFx.add(shadow);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), new THREE.MeshBasicMaterial({ map: radialTex, color: 0x3a2622, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.004; carFx.add(pool);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000), new THREE.MeshLambertMaterial({ color: 0x0d0d10 }));
    ground.rotation.x = -Math.PI / 2; scene.add(ground);

    /* Anchors for the anatomy markers (they follow their parts as the car separates). */
    const anchors = {};
    const anchor = (key, parent, x, y, z) => { const o = new THREE.Object3D(); o.position.set(x, y, z); parent.add(o); anchors[key] = o; };
    anchor('frontWing', parts.frontWing, 0.7, 0.22, 2.72);
    anchor('chassis', parts.body, 0, 0.66, 1.1);
    anchor('halo', parts.halo, 0, 0.9, 0.6);
    anchor('power', parts.pu, 0, 0.32, 0);
    anchor('floor', parts.floor, 0.62, 0.09, -0.6);
    anchor('rearWing', parts.rearWing, 0, 1.0, -2.22);
    anchor('tyres', parts.wheels[0], 0, 0.22, 0);

    /* ---- Circuit ---- */
    const track = new THREE.Group(); scene.add(track);
    const ctrl = [[-70, -20], [-20, -24], [30, -24], [62, -18], [72, 0], [60, 16], [35, 14], [20, 30], [-5, 40], [-30, 30], [-38, 10], [-58, 16], [-75, 5]]
      .map(([x, z]) => new THREE.Vector3(x, 0, z));
    const curve = new THREE.CatmullRomCurve3(ctrl, true, 'centripetal');
    const bb = new THREE.Box3().setFromPoints(curve.getSpacedPoints(400));
    const ctr = bb.getCenter(new THREE.Vector3());
    ctrl.forEach((p) => p.sub(ctr)); curve.updateArcLengths();
    const trackLen = curve.getLength();
    const TW = 8;
    const frame = (u) => {
      const p = curve.getPointAt(((u % 1) + 1) % 1);
      const t = curve.getTangentAt(((u % 1) + 1) % 1);
      return { p, t, n: new THREE.Vector3(-t.z, 0, t.x) };
    };
    const ribbon = (offset, width, y, M = 900) => {
      const pos = [], idx = [];
      for (let i = 0; i <= M; i++) {
        const { p, n } = frame(i / M);
        const a = p.clone().addScaledVector(n, offset + width / 2), b = p.clone().addScaledVector(n, offset - width / 2);
        pos.push(a.x, y, a.z, b.x, y, b.z);
        if (i < M) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      return g;
    };
    track.add(new THREE.Mesh(ribbon(0, TW, 0.02), new THREE.MeshStandardMaterial({ color: 0x1a1a1e, roughness: 0.85, metalness: 0.1, side: THREE.DoubleSide })));
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf2eee6, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    track.add(new THREE.Mesh(ribbon(TW / 2 - 0.2, 0.3, 0.1), edgeMat));
    track.add(new THREE.Mesh(ribbon(-TW / 2 + 0.2, 0.3, 0.1), edgeMat));
    track.add(new THREE.Mesh(ribbon(0, 0.12, 0.08, 900), new THREE.MeshBasicMaterial({ color: 0xff3b2f, transparent: true, opacity: 0.35, side: THREE.DoubleSide })));
    const U0 = 0.22; // start / finish line, at the end of the long straight
    {
      const checker = canvasTex(256, 32, (g, w, h) => {
        for (let x = 0; x < 16; x++) for (let y = 0; y < 2; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f2eee6'; g.fillRect(x * 16, y * 16, 16, 16); }
      });
      const { p, t } = frame(U0);
      const line = new THREE.Mesh(new THREE.PlaneGeometry(TW, 1), new THREE.MeshBasicMaterial({ map: checker, transparent: true, side: THREE.DoubleSide }));
      line.rotation.x = -Math.PI / 2; line.rotation.z = Math.atan2(t.x, t.z);
      line.position.set(p.x, 0.12, p.z); track.add(line);
    }

    // Era markers
    const gates = new THREE.Group(); scene.add(gates);
    const gateMats = [];
    const ERA_U = ERAS.map((_, i) => 0.3 + i * 0.1);
    ERAS.forEach((era, i) => {
      const { p, t } = frame(ERA_U[i]);
      const g = new THREE.Group(); g.position.copy(p); g.rotation.y = Math.atan2(t.x, t.z);
      const m = new THREE.MeshStandardMaterial({ color: 0x18181c, emissive: 0xf2eee6, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.4 });
      gateMats.push(m);
      const span = TW + 2.4;
      g.add(box(0.35, 7, 0.35, m, span / 2, 3.5, 0));
      g.add(box(0.35, 7, 0.35, m, -span / 2, 3.5, 0));
      g.add(box(span + 0.35, 0.35, 0.35, m, 0, 7, 0));
      const s = label([era.label], { big: 170, color: i === 7 ? '#ff3b2f' : '#f2eee6' }); s.scale.set(9, 4.5, 1); s.position.set(0, 9.4, 0); g.add(s);
      gates.add(g);
    });

    // Starting grid (22 places, as on the 2026 grid)
    const grid = new THREE.Group(); scene.add(grid);
    const slotTex = canvasTex(128, 256, (g, w, h) => {
      g.strokeStyle = '#ffffff'; g.lineWidth = 10;
      g.beginPath(); g.moveTo(8, 60); g.lineTo(8, 8); g.lineTo(w - 8, 8); g.lineTo(w - 8, 60); g.stroke();
    });
    const slots = [];
    const SLOT_DU = 2.8 / trackLen;
    for (let k = 0; k < 22; k++) {
      const { p, t, n } = frame(U0 - (k + 1) * SLOT_DU - 0.002);
      const mat = new THREE.MeshBasicMaterial({ map: slotTex, color: 0xf2eee6, transparent: true, depthWrite: false, side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 4.6), mat);
      m.rotation.x = -Math.PI / 2; m.rotation.z = Math.atan2(t.x, t.z) + Math.PI;
      m.position.copy(p).addScaledVector(n, k % 2 ? -1.7 : 1.7); m.position.y = 0.14;
      grid.add(m); slots.push(mat);
    }

    // Lap marker with a fading trail
    const markerGroup = new THREE.Group(); scene.add(markerGroup);
    const marker = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xff3b2f).multiplyScalar(1.6) }));
    markerGroup.add(marker);
    const halo2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: 0xff3b2f, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
    halo2.scale.set(9, 9, 1); markerGroup.add(halo2);
    const TRAIL = 70;
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((TRAIL + 1) * 6), 3));
    const trailCol = [];
    const trailIdx = [];
    for (let i = 0; i <= TRAIL; i++) {
      const k = Math.pow(1 - i / TRAIL, 1.6);
      trailCol.push(k, k * 0.23, k * 0.18, k, k * 0.23, k * 0.18);
      if (i < TRAIL) trailIdx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    trailGeo.setAttribute('color', new THREE.Float32BufferAttribute(trailCol, 3));
    trailGeo.setIndex(trailIdx);
    const trail = new THREE.Mesh(trailGeo, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    trail.frustumCulled = false; markerGroup.add(trail);
    let markerU = U0;

    /* ---- Champions' columns ---- */
    const pillars = new THREE.Group(); scene.add(pillars);
    const pillarItems = DRIVERS.map((d, i) => {
      const mat = new THREE.MeshStandardMaterial({ color: 0x1b1b20, metalness: 0.5, roughness: 0.35, emissive: 0xf2eee6, emissiveIntensity: 0.12 });
      const geo = new THREE.BoxGeometry(0.62, 1, 0.62); geo.translate(0, 0.5, 0);
      const m = new THREE.Mesh(geo, mat);
      const x = (i - 3.5) * 1.3, z = -Math.abs(i - 3.5) * 0.45;
      m.position.set(x, 0, z); pillars.add(m);
      const cap = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), new THREE.MeshBasicMaterial({ color: 0xf2eee6, transparent: true, opacity: 0.9 }));
      cap.rotation.x = -Math.PI / 2; cap.position.set(x, 0, z); pillars.add(cap);
      const s = label([String(d.titles), d.short], { big: 150 }); s.scale.set(1.9, 0.95, 1); s.position.set(x, 0, z); pillars.add(s);
      return { mesh: m, mat, cap, label: s, h: d.titles * 0.62, glow: 0 };
    });

    /* ---- Tyre compounds ---- */
    const tyres = new THREE.Group(); scene.add(tyres);
    const tyreMats = { tyre: new THREE.MeshStandardMaterial({ color: 0x2a2a2e, roughness: 0.75 }), rim: new THREE.MeshStandardMaterial({ color: 0x2b2b30, metalness: 0.9, roughness: 0.3 }), hub: new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8, roughness: 0.3 }) };
    const tyreItems = [0xff3b2f, 0xffd23f, 0xf2eee6, 0x3ccf6e, 0x3a8dff].map((c, i) => {
      const w = makeWheel(0.4, c, tyreMats);
      const holder = new THREE.Group(); holder.add(w);
      holder.position.set((i - 2) * 1.12, 0.36, -Math.abs(i - 2) * 0.25);
      holder.rotation.y = Math.PI / 2 - 0.42;
      tyres.add(holder);
      return w;
    });

    /* ---- Start lights ---- */
    const gantry = new THREE.Group(); scene.add(gantry);
    gantry.add(box(5.2, 0.42, 0.3, carbon, 0, 3.75, -0.6));
    const lamps = [];
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 0.9;
      gantry.add(box(0.62, 1.05, 0.22, black, x, 3.25, -0.48));
      const pair = [];
      [0.22, -0.2].forEach((dy) => {
        const lm = new THREE.MeshBasicMaterial({ color: 0x1d0807 });
        const disc = new THREE.Mesh(new THREE.CircleGeometry(0.17, 28), lm);
        disc.position.set(x, 3.25 + dy, -0.36); gantry.add(disc); pair.push(lm);
      });
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTex, color: 0xff2a1a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.scale.set(1.5, 2.0, 1); glow.position.set(x, 3.25, -0.3); gantry.add(glow);
      lamps.push({ pair, glow });
    }
    const setLamps = (n) => lamps.forEach((l, i) => {
      const on = i < n;
      l.pair.forEach((m) => m.color.set(on ? 0xff1a0d : 0x1d0807));
      l.glow.material.userData.target = on ? 0.55 : 0;
    });

    /* ---- Speed lines / airflow ---- */
    const LINES = coarse ? 160 : 280;
    const lineData = [];
    const lpos = new Float32Array(LINES * 6);
    for (let i = 0; i < LINES; i++) {
      let x = (Math.random() * 2 - 1) * 7;
      if (Math.random() < 0.45) x *= 0.18;
      lineData.push({ x, y: 0.15 + Math.random() * 3.2, z: (Math.random() * 2 - 1) * 30, len: 0.8 + Math.random() * 2.6, v: 0.7 + Math.random() * 0.6 });
    }
    const lgeo = new THREE.BufferGeometry(); lgeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3));
    const lmat = new THREE.LineBasicMaterial({ color: 0xf2eee6, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineSegments(lgeo, lmat); lines.frustumCulled = false; scene.add(lines);

    /* ---- Faders ---- */
    const fade = {
      car: makeFader(car), carFx: makeFader(carFx), track: makeFader(track), gates: makeFader(gates), grid: makeFader(grid),
      marker: makeFader(markerGroup), pillars: makeFader(pillars), tyres: makeFader(tyres), gantry: makeFader(gantry),
    };

    /* ------------------------------------------------------------------ */
    /* State and presets                                                   */
    /* ------------------------------------------------------------------ */
    const DEF = {
      cx: 6, cy: 2, cz: 7, tx: 0, ty: 0.5, tz: 0, shiftX: 0, shiftY: 0, fogNear: 10, fogFar: 40,
      car: 0, track: 0, gates: 0, grid: 0, marker: 0, pillars: 0, tyres: 0, gantry: 0,
      explode: 0, pu: 0, halo: 0, wing: 0, speed: 0, carZ: 0, carRot: 0,
    };
    const state = Object.assign({}, DEF);
    const sel = { era: -1, driver: -1, part: null, spin: false };

    const layout = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const portrait = w <= 760 || w / h < 0.8;
      return { aspect: w / h, portrait };
    };
    // Pull the camera back on narrow screens so the subject still fits.
    const fitK = (L) => (L.aspect >= 1.3 ? 1 : Math.min(2.3, Math.pow(1.3 / L.aspect, 0.72)));
    const carView = (cam, tgt, L, extra = {}) => {
      const k = fitK(L);
      return Object.assign({
        cx: tgt[0] + (cam[0] - tgt[0]) * k, cy: tgt[1] + (cam[1] - tgt[1]) * k, cz: tgt[2] + (cam[2] - tgt[2]) * k,
        tx: tgt[0], ty: tgt[1], tz: tgt[2],
        shiftX: L.portrait ? 0 : 0.17, shiftY: L.portrait ? 0.24 : 0,
        fogNear: 12 * k, fogFar: 42 * k,
      }, extra);
    };
    const eraView = (i, L) => {
      const { p, t, n } = frame(ERA_U[i]);
      const k = L.portrait ? 1.7 : 1;
      const tgt = p.clone().add(new THREE.Vector3(0, 5.5, 0));
      const cam = p.clone().addScaledVector(t, -30 * k).addScaledVector(n, 3 * k).add(new THREE.Vector3(0, 6 + 2 * k, 0));
      return { cx: cam.x, cy: cam.y, cz: cam.z, tx: tgt.x, ty: tgt.y, tz: tgt.z, fogNear: 25, fogFar: 140, shiftX: L.portrait ? 0 : 0.17, shiftY: L.portrait ? 0.24 : 0 };
    };
    const overView = (L, tilt) => {
      const tanH = Math.tan(THREE.MathUtils.degToRad(17.5));
      const sizeX = bb.max.x - bb.min.x + 20, sizeZ = bb.max.z - bb.min.z + 20;
      if (L.portrait) {
        const h = Math.max(sizeX / (2 * tanH * 0.4), sizeZ / (2 * tanH * L.aspect));
        return { cx: h * tilt, cy: h, cz: 0, tx: 0, ty: 0, tz: 0, fogNear: h * 0.9, fogFar: h * 2.4, shiftX: 0, shiftY: 0.27 };
      }
      const h = Math.max(sizeZ / (2 * tanH * 0.9), (sizeX * 1.45) / (2 * tanH * L.aspect));
      return { cx: 0, cy: h, cz: h * tilt, tx: 0, ty: 0, tz: 0, fogNear: h * 0.9, fogFar: h * 2.4, shiftX: 0.17, shiftY: 0 };
    };
    const gridView = (L) => {
      const mid = frame(U0 - 9 * SLOT_DU);
      const k = L.portrait ? 1.9 : 1;
      const tgt = mid.p.clone().addScaledVector(mid.t, 10);
      const cam = mid.p.clone().addScaledVector(mid.n, 40 * k).addScaledVector(mid.t, -6 * k).add(new THREE.Vector3(0, 52 * k, 0));
      return { cx: cam.x, cy: cam.y, cz: cam.z, tx: tgt.x, ty: tgt.y, tz: tgt.z, fogNear: 40 * k, fogFar: 160 * k, shiftX: L.portrait ? 0 : 0.24, shiftY: L.portrait ? 0.24 : 0 };
    };

    const PRESETS = {
      lights: (L) => carView([5.4, 1.55, 6.4], [0, 0.42, 0.15], L, { car: 1, carFx: 1, shiftX: L.portrait ? 0 : 0.12, shiftY: L.portrait ? 0.2 : -0.02, spin: true }),
      'silverstone-1950': (L) => Object.assign(eraView(0, L), { track: 1, gates: 1, eraSel: 0 }),
      eras: (L) => Object.assign(overView(L, 0.55), { track: 1, gates: 1 }),
      teams: (L) => carView([-10.6, 1.7, 2.9], [0, 0.42, 0.1], L, { car: 1, carFx: 1 }),
      drivers: (L) => carView([0, 4.2, 17], [0, 2.3, -0.6], L, { pillars: 1, fogNear: 18, fogFar: 60, shiftX: L.portrait ? 0 : 0.2 }),
      'race-weekend': (L) => Object.assign(overView(L, 0.18), { track: 1, marker: 1 }),
      qualifying: (L) => Object.assign(gridView(L), { track: 1, grid: 1 }),
      'race-day': (L) => carView([0.6, 1.6, 9.4], [0, 0.42, 0], L, { tyres: 1, fogNear: 10, fogFar: 32 }),
      anatomy: (L) => carView([7.4, 5.6, 8.6], [0, 0.95, 0.2], L, { car: 1, carFx: 1, explode: 1 }),
      'power-unit': (L) => carView([7.2, 1.8, -4.6], [0, 0.6, -0.9], L, { car: 1, carFx: 1, explode: 0.75, pu: 1, shiftX: L.portrait ? 0 : 0.22 }),
      aerodynamics: (L) => carView([-8.2, 2.7, -5.0], [0, 0.6, -0.4], L, { car: 1, carFx: 1, speed: 0.7, shiftX: L.portrait ? 0 : 0.2 }),
      safety: (L) => carView([-5.0, 2.3, 6.2], [0, 0.6, 0.4], L, { car: 1, carFx: 1, halo: 1 }),
      'lights-out': (L) => carView([4.2, 1.1, 9.6], [0, 1.75, 0], L, { car: 1, carFx: 1, gantry: 1, shiftX: L.portrait ? 0 : 0.16, shiftY: L.portrait ? 0.2 : 0.06 }),
    };
    const PART_VIEWS = {
      frontWing: [[3.2, 1.6, 6.4], [0, 0.25, 3.4]],
      chassis: [[3.6, 3.0, 3.8], [0, 1.45, 0.6]],
      halo: [[3.6, 4.4, 4.6], [0, 2.3, 0.3]],
      power: [[5.0, 1.6, -3.2], [0, 0.6, -0.95]],
      floor: [[4.6, 1.0, 3.2], [0, 0.35, -0.2]],
      rearWing: [[-3.4, 2.4, -6.4], [0, 1.25, -3.3]],
      tyres: [[4.6, 1.2, 4.2], [1.4, 0.5, 1.7]],
    };

    let currentId = null;
    let tl = null; // per-slide timeline (lights, knockout)
    const cameraKeys = ['cx', 'cy', 'cz', 'tx', 'ty', 'tz', 'shiftX', 'shiftY', 'fogNear', 'fogFar'];

    function tweenTo(target, dur, ease = 'power3.inOut') {
      gsap.killTweensOf(state);
      const cam = {}, rest = {};
      Object.keys(target).forEach((k) => { if (k in DEF) (cameraKeys.includes(k) ? cam : rest)[k] = target[k]; });
      if (reduced || dur === 0) {
        Object.assign(state, cam);
        gsap.to(state, Object.assign({ duration: dur === 0 ? 0 : 0.35, ease: 'none' }, rest));
      } else {
        gsap.to(state, Object.assign({ duration: dur, ease }, cam, rest));
      }
    }

    let viewFn = null; // the camera framing currently in force, re-evaluated on resize
    const fullPreset = (id, L) => Object.assign({}, DEF, { carFx: 0 }, PRESETS[id](L));

    function go(id, { instant = false } = {}) {
      const L = layout();
      const preset = fullPreset(id, L);
      viewFn = PRESETS[id];
      delete preset.carRot;
      currentId = id;
      if (tl) { tl.kill(); tl = null; }
      sel.spin = !!preset.spin && !reduced;
      // keep the car's rotation continuous: settle on the nearest whole turn
      const turn = Math.PI * 2;
      state.carRot = ((state.carRot % turn) + turn) % turn;
      if (state.carRot > Math.PI) state.carRot -= turn;
      preset.carRot = id === 'lights' ? state.carRot : 0;
      preset.carZ = 0;
      fadeCarFx.target = preset.carFx;
      tweenTo(preset, instant ? 0 : 1.7);
      sel.era = preset.eraSel !== undefined ? preset.eraSel : -1;
      sel.part = null;
      if (id !== 'drivers') sel.driver = -1;
      setLamps(0);
      slots.forEach((m) => m.color.set(0xf2eee6));
      if (id === 'qualifying') runKnockout(instant);
      if (id === 'lights-out') runStart(instant ? 0.2 : 1.6);
    }
    const fadeCarFx = { target: 0 };

    // On resize only the framing changes; running sequences (lights, knockout) are left alone.
    function refit() {
      if (!viewFn) return;
      const v = viewFn(layout()), to = {};
      cameraKeys.forEach((k) => { if (k in v) to[k] = v[k]; });
      gsap.to(state, Object.assign({ duration: 0.4, ease: 'power2.out', overwrite: 'auto' }, to));
    }

    // In-slide camera moves keep the slide's other targets so no fade is left half-way.
    function setEra(i) {
      sel.era = i;
      viewFn = (L) => eraView(i, L);
      tweenTo(Object.assign(fullPreset(currentId, layout()), viewFn(layout())), 1.6);
    }
    function setPart(key) {
      sel.part = key;
      const v = PART_VIEWS[key];
      viewFn = (L) => carView(v[0], v[1], L);
      tweenTo(Object.assign(fullPreset(currentId, layout()), viewFn(layout())), 1.3);
    }
    function setTeam(key) {
      const t = TEAMS[key];
      const to = (mat, hex) => { const c = new THREE.Color(hex); gsap.to(mat.color, { r: c.r, g: c.g, b: c.b, duration: reduced ? 0 : 0.9, ease: 'power2.inOut' }); };
      to(paint, t.body); to(accent, t.accent); to(wingMat, t.wing);
    }
    function setAero(open) { gsap.to(state, { wing: open ? 1 : 0, duration: reduced ? 0 : 0.8, ease: 'power2.inOut', overwrite: false }); }

    function runKnockout(instant) {
      const stages = $$('#qualifying .stages li');
      stages.forEach((s) => s.classList.remove('is-on'));
      slots.forEach((m) => m.color.set(0xf2eee6));
      const dim = (from, to) => () => { for (let k = from; k < to; k++) gsap.to(slots[k].color, { r: 0.16, g: 0.16, b: 0.17, duration: reduced ? 0 : 0.5 }); };
      const red = new THREE.Color(0xff3b2f).multiplyScalar(1.4);
      const final = () => { stages.forEach((s) => s.classList.add('is-on')); dim(10, 22)(); gsap.to(slots[0].color, { r: red.r, g: red.g, b: red.b, duration: 0.4 }); };
      if (instant || reduced) { final(); return; }
      tl = gsap.timeline({ delay: 1.2 });
      tl.call(() => stages[0].classList.add('is-on'))
        .call(dim(16, 22), null, '+=1.0')
        .call(() => stages[1].classList.add('is-on'), null, '+=0.6')
        .call(dim(10, 16), null, '+=1.0')
        .call(() => stages[2].classList.add('is-on'), null, '+=0.6')
        .call(() => gsap.to(slots[0].color, { r: red.r, g: red.g, b: red.b, duration: 0.4 }), null, '+=1.0');
    }

    function runStart(delay) {
      if (tl) tl.kill();
      setLamps(0);
      if (reduced) {
        tl = gsap.timeline({ delay: 0.4 }).call(() => setLamps(5)).call(() => setLamps(0), null, '+=1.2');
        return;
      }
      const hold = 0.6 + Math.random() * 1.6;
      tl = gsap.timeline({ delay });
      if (state.carZ !== 0 || state.speed > 0) tl.to(state, { carZ: 0, speed: 0, duration: 0.8, ease: 'power2.out' });
      for (let i = 1; i <= 5; i++) tl.call(() => setLamps(i), null, i === 1 ? '>' : '+=1');
      tl.call(() => setLamps(0), null, `+=${hold}`)
        .to(state, { carZ: 36, duration: 1.7, ease: 'power3.in' }, '>')
        .to(state, { speed: 1.3, duration: 1.0, ease: 'power2.in' }, '<')
        .set(state, { carZ: -34 }, '+=0.6')
        .to(state, { carZ: 0, duration: 2.4, ease: 'power3.out' })
        .to(state, { speed: 0, duration: 2.0, ease: 'power2.out' }, '<0.3');
    }

    /* ------------------------------------------------------------------ */
    /* Frame loop                                                          */
    /* ------------------------------------------------------------------ */
    const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
    if (window.matchMedia('(pointer: fine)').matches) {
      window.addEventListener('pointermove', (e) => { pointer.x = e.clientX / window.innerWidth - 0.5; pointer.y = e.clientY / window.innerHeight - 0.5; }, { passive: true });
    }
    const v3 = new THREE.Vector3(), camPos = new THREE.Vector3(), tgt = new THREE.Vector3();
    const tmpColor = new THREE.Color();
    const RED = new THREE.Color(0xff3b2f);
    let pinsEl = null, pinEls = {};
    let wheelAngle = 0, tyreAngle = 0, last = performance.now(), time = 0, size = { w: 0, h: 0 };

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      size = { w, h };
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function update(dt) {
      time += dt;
      if (sel.spin && !reduced) state.carRot += dt * 0.16;

      // camera
      pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
      pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
      camPos.set(state.cx, state.cy, state.cz); tgt.set(state.tx, state.ty, state.tz);
      if (!reduced) {
        const d = camPos.distanceTo(tgt) * 0.035;
        v3.subVectors(tgt, camPos).cross(camera.up).normalize();
        camPos.addScaledVector(v3, pointer.sx * d).add(new THREE.Vector3(0, -pointer.sy * d * 0.6, 0));
      }
      camera.position.copy(camPos); camera.lookAt(tgt);
      camera.near = THREE.MathUtils.clamp(camPos.distanceTo(tgt) / 60, 0.1, 8);
      camera.updateProjectionMatrix();
      if (Math.abs(state.shiftX) > 1e-4 || Math.abs(state.shiftY) > 1e-4) camera.setViewOffset(size.w, size.h, -state.shiftX * size.w, state.shiftY * size.h, size.w, size.h);
      else camera.clearViewOffset();
      scene.fog.near = state.fogNear; scene.fog.far = state.fogFar;

      // presences
      fade.car(state.car); fade.carFx(Math.max(state.car * fadeCarFx.target, 0));
      fade.track(state.track); fade.gates(state.gates); fade.grid(state.grid); fade.marker(state.marker);
      fade.pillars(state.pillars); fade.tyres(state.tyres); fade.gantry(state.gantry);

      // car
      const e = state.explode;
      car.position.set(0, e * 0.25, state.carZ);
      car.rotation.y = state.carRot;
      carFx.position.z = state.carZ;
      parts.frontWing.position.z = e * 0.95;
      parts.body.position.y = e * 1.1;
      parts.halo.position.y = e * 1.95;
      parts.rearWing.position.set(0, e * 0.25, -e * 1.2);
      parts.wheels.forEach((w) => { w.position.x = w.userData.baseX + Math.sign(w.userData.baseX) * e * 0.8; });
      parts.arms.visible = e < 0.02 && state.car > 0.01;
      parts.pu.visible = e > 0.02 && state.car > 0.01;
      const pulse = 0.85 + 0.15 * Math.sin(time * 3.2);
      puMat.emissiveIntensity = state.pu * 0.45 * pulse;
      puGlow.opacity = state.pu * 0.18 * pulse * state.car;
      haloMat.emissiveIntensity = state.halo * (0.55 + 0.35 * Math.sin(time * 2.4));
      parts.flap.rotation.x = THREE.MathUtils.lerp(0.5, 0.04, state.wing);
      parts.frontFlaps.rotation.x = THREE.MathUtils.lerp(0, -0.22, state.wing);
      const speed = state.speed;
      wheelAngle += dt * speed * 34;
      parts.wheels.forEach((w) => { w.userData.spin.rotation.y = -wheelAngle; });

      // lines / airflow
      lmat.opacity = Math.min(1, speed) * 0.55;
      lines.visible = speed > 0.01;
      if (lines.visible) {
        const flow = reduced ? 0 : speed * 38 * dt;
        for (let i = 0; i < LINES; i++) {
          const l = lineData[i];
          l.z -= flow * l.v;
          if (l.z < -30) l.z += 60;
          const bump = (z) => (Math.abs(l.x) < 1.25 && l.y < 1.4 ? 0.75 * Math.exp(-Math.pow((z + 0.3) / 1.9, 2)) : 0);
          const o = i * 6, zA = l.z + state.carZ, zB = l.z + l.len + state.carZ;
          lpos[o] = l.x; lpos[o + 1] = l.y + bump(l.z); lpos[o + 2] = zA;
          lpos[o + 3] = l.x; lpos[o + 4] = l.y + bump(l.z + l.len); lpos[o + 5] = zB;
        }
        lgeo.attributes.position.needsUpdate = true;
      }

      // lap marker
      if (state.marker > 0.01) {
        if (!reduced) markerU = (markerU + dt * 0.032) % 1;
        const { p } = frame(markerU);
        marker.position.set(p.x, 1.2, p.z); halo2.position.copy(marker.position);
        const arr = trailGeo.attributes.position.array;
        for (let i = 0; i <= TRAIL; i++) {
          const f = frame(markerU - i * 0.0016);
          const wdt = 1.3 * (1 - i / TRAIL) + 0.2;
          arr[i * 6] = f.p.x + f.n.x * wdt; arr[i * 6 + 1] = 0.3; arr[i * 6 + 2] = f.p.z + f.n.z * wdt;
          arr[i * 6 + 3] = f.p.x - f.n.x * wdt; arr[i * 6 + 4] = 0.3; arr[i * 6 + 5] = f.p.z - f.n.z * wdt;
        }
        trailGeo.attributes.position.needsUpdate = true;
      }

      // era markers
      gateMats.forEach((m, i) => {
        const on = i === sel.era;
        tmpColor.set(on ? 0xff3b2f : 0xf2eee6);
        m.emissive.lerp(tmpColor, Math.min(1, dt * 5));
        m.emissiveIntensity += ((on ? 1.4 : 0.32) - m.emissiveIntensity) * Math.min(1, dt * 5);
      });

      // champions' columns
      if (state.pillars > 0.004) {
        const grow = reduced ? 1 : gsap.parseEase('power3.out')(state.pillars);
        pillarItems.forEach((it, i) => {
          const on = i === sel.driver;
          it.glow += ((on ? 1 : 0) - it.glow) * Math.min(1, dt * 6);
          const hh = Math.max(0.001, it.h * grow);
          it.mesh.scale.y = hh; it.cap.position.y = hh + 0.002; it.label.position.y = hh + 0.75;
          tmpColor.set(0xf2eee6).lerp(RED, it.glow);
          it.mat.emissive.copy(tmpColor);
          it.mat.emissiveIntensity = 0.1 + it.glow * 0.9;
          it.cap.material.color.copy(tmpColor);
        });
      }

      // tyres
      if (state.tyres > 0.004 && !reduced) {
        tyreAngle += dt * 0.6;
        tyreItems.forEach((w, i) => { w.userData.spin.rotation.y = tyreAngle + i * 0.7; });
      }

      // start lights glow
      lamps.forEach((l) => { const t = l.glow.material.userData.target || 0; l.glow.material.opacity += (t * state.gantry - l.glow.material.opacity) * Math.min(1, dt * 14); });

      // anatomy markers
      if (pinsEl) {
        const show = currentId === 'anatomy' && state.explode > 0.85 && state.car > 0.9;
        pinsEl.classList.toggle('is-visible', show);
        if (show) {
          // on narrow screens the text panel sits below the model: keep markers above it
          const panel = layout().portrait ? document.querySelector('#anatomy .panel') : null;
          const maxY = panel ? panel.getBoundingClientRect().top - 12 : size.h - 90;
          Object.keys(anchors).forEach((k) => {
            anchors[k].getWorldPosition(v3).project(camera);
            const el = pinEls[k];
            const x = (v3.x * 0.5 + 0.5) * size.w, y = (-v3.y * 0.5 + 0.5) * size.h;
            el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
            el.style.visibility = y > 70 && y < maxY && x > 20 && x < size.w - 20 ? '' : 'hidden';
            el.classList.toggle('is-on', sel.part === k);
          });
        }
      }
    }

    let running = true, rafId = 0, frames = 0;
    function loop(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      update(dt);
      renderer.render(scene, camera);
      if (++frames === 2) document.documentElement.dataset.ready = 'true';
      rafId = requestAnimationFrame(loop);
    }

    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault(); running = false; cancelAnimationFrame(rafId);
      document.body.classList.add('no-webgl');
    });

    resize();
    window.addEventListener('resize', () => { resize(); refit(); });
    rafId = requestAnimationFrame((t) => { last = t; loop(t); });

    return {
      go, setEra, setPart, setTeam, setAero,
      replayKnockout: () => { if (tl) tl.kill(); runKnockout(false); },
      runStart: () => runStart(0.3),
      setDriver: (i) => { sel.driver = i; },
      setReduced: () => { sel.spin = sel.spin && !reduced; },
      bindPins(container, onPick) {
        pinsEl = container;
        Object.keys(anchors).forEach((k) => {
          const b = document.createElement('button');
          b.type = 'button'; b.className = 'pin'; b.tabIndex = -1; b.title = PARTS[k].title;
          b.addEventListener('click', () => onPick(k));
          container.appendChild(b); pinEls[k] = b;
        });
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Presentation controller                                             */
  /* ------------------------------------------------------------------ */

  const slides = $$('.slide');
  const ids = slides.map((s) => s.id);
  const announcer = $('#announcer');
  const prevBtn = $('#prevBtn'), nextBtn = $('#nextBtn');
  const chapterLabel = $('#chapterLabel');
  let current = -1;

  let world = null;
  if (THREE && gsap) {
    try { world = createWorld($('#stage')); } catch (err) { console.error(err); world = null; }
  }
  if (!world) document.body.classList.add('no-webgl');
  if (!gsap) return; // without GSAP the slides stay as plain readable HTML

  // Split display titles into words for the masked reveal.
  $$('[data-split]').forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map((w) => `<span class="word" aria-hidden="true"><span>${w}</span></span>`).join('');
  });

  // Dock chapters
  const chaptersEl = $('#chapters');
  const chapterBtns = CHAPTERS.map((c) => {
    const members = slides.map((s, i) => (s.dataset.chapter === c.id ? i : -1)).filter((i) => i >= 0);
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'chapter-btn';
    b.setAttribute('aria-label', `${c.label}: go to slide ${members[0] + 1}`);
    b.innerHTML = `<span class="chapter-btn__label">${c.short}</span><span class="chapter-btn__ticks">${members.map(() => '<i></i>').join('')}</span>`;
    b.addEventListener('click', () => goTo(members[0]));
    li.appendChild(b); chaptersEl.appendChild(li);
    return { c, b, members, ticks: $$('i', b) };
  });
  $('#countAll').textContent = String(slides.length).padStart(2, '0');

  const revealFrom = {
    intro: { y: 26 }, history: { y: 22 }, teams: { x: -28 }, weekend: { y: 18 }, tech: { x: -22 }, finale: { y: 26 },
  };

  function enterSlide(slide, dir, instant) {
    const panel = $('.panel', slide);
    gsap.killTweensOf(panel);
    gsap.set(panel, { autoAlpha: 1, y: 0 });
    const items = $$('[data-reveal]', slide);
    const words = $$('[data-split] .word > span', slide);
    gsap.killTweensOf(items.concat(words));
    if (instant) { gsap.set(items, { autoAlpha: 1, x: 0, y: 0 }); if (words.length) gsap.set(words, { yPercent: 0 }); return; }
    if (reduced) {
      gsap.fromTo(items, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, x: 0, y: 0 });
      if (words.length) gsap.set(words, { yPercent: 0 });
      return;
    }
    const from = revealFrom[slide.dataset.chapter] || { y: 20 };
    if (words.length) gsap.fromTo(words, { yPercent: 110 }, { yPercent: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.35 });
    gsap.fromTo(items, Object.assign({ autoAlpha: 0 }, { x: (from.x || 0) * dir, y: from.y || 0 }), { autoAlpha: 1, x: 0, y: 0, duration: 0.85, ease: 'power3.out', stagger: 0.07, delay: words.length ? 0.7 : 0.45 });
  }
  function leaveSlide(slide, dir) {
    const panel = $('.panel', slide);
    gsap.killTweensOf(panel);
    if (reduced) { gsap.set(panel, { autoAlpha: 0 }); slide.classList.remove('is-active'); return; }
    gsap.to(panel, { autoAlpha: 0, y: -14 * dir, duration: 0.35, ease: 'power2.in', onComplete: () => { if (slides[current] !== slide) slide.classList.remove('is-active'); } });
  }

  function goTo(i, { push = true, instant = false } = {}) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === current) return;
    const dir = i > current ? 1 : -1;
    const prev = current;
    current = i;
    const slide = slides[i];

    slides.forEach((s, k) => {
      const active = k === i;
      if (active) s.classList.add('is-active');
      s.toggleAttribute('inert', !active);
      s.setAttribute('aria-hidden', String(!active));
    });
    if (prev >= 0 && !instant) leaveSlide(slides[prev], dir);
    else if (prev >= 0) slides[prev].classList.remove('is-active');
    enterSlide(slide, dir, instant);

    // dock
    prevBtn.disabled = i === 0; nextBtn.disabled = i === slides.length - 1;
    $('#countNow').textContent = String(i + 1).padStart(2, '0');
    chapterBtns.forEach(({ c, b, members, ticks }) => {
      const here = c.id === slide.dataset.chapter;
      if (here) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      ticks.forEach((t, k) => { t.classList.toggle('is-now', members[k] === i); t.classList.toggle('is-done', members[k] < i); });
    });
    const chapter = CHAPTERS.find((c) => c.id === slide.dataset.chapter);
    chapterLabel.textContent = chapter.label;
    const heading = $('h1, h2', slide);
    announcer.textContent = `Slide ${i + 1} of ${slides.length}: ${heading.getAttribute('aria-label') || heading.textContent}`;

    // slide-specific resets
    resetSlideUI(slide.id);
    if (world) world.go(slide.id, { instant });

    const hash = '#' + slide.id;
    if (location.hash !== hash) {
      try { push ? history.pushState(null, '', hash) : history.replaceState(null, '', hash); } catch (err) { /* file:// in some browsers */ }
    }
  }
  const next = () => goTo(current + 1);
  const prev = () => goTo(current - 1);

  /* ---- Slide UI ---- */
  const pressOnly = (btns, active) => btns.forEach((b) => b.setAttribute('aria-pressed', String(b === active)));

  const eraBtns = $$('[data-era]');
  const eraDetail = $('#eraDetail');
  const eraIntro = eraDetail.innerHTML;
  eraBtns.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.era, e = ERAS[i];
    pressOnly(eraBtns, b);
    eraDetail.innerHTML = `<span class="meta">${e.label}</span><h3 class="h3">${e.title}</h3><p>${e.text}</p>`;
    if (world) world.setEra(i);
  }));

  const teamBtns = $$('[data-team]');
  const teamDetail = $('#teamDetail');
  let teamKey = null;
  function chooseTeam(key) {
    teamKey = key;
    const t = TEAMS[key];
    pressOnly(teamBtns, teamBtns.find((b) => b.dataset.team === key));
    teamDetail.innerHTML = `<span class="meta">${t.meta}</span><h3 class="h3">${t.name}</h3><p>${t.text}</p>`;
    if (world) world.setTeam(key);
  }
  teamBtns.forEach((b) => b.addEventListener('click', () => chooseTeam(b.dataset.team)));

  const driverBtns = $$('[data-driver]');
  const driverDetail = $('#driverDetail');
  const driverIntro = '<p class="small">Select a driver to light up their column.</p>';
  driverBtns.forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.driver, d = DRIVERS[i];
    pressOnly(driverBtns, b);
    driverDetail.innerHTML = `<span class="meta">${d.meta}</span><p>${d.text}</p>`;
    if (world) world.setDriver(i);
  }));

  const partBtns = $$('[data-part]');
  const partDetail = $('#partDetail');
  const partIntro = partDetail.innerHTML;
  function choosePart(key) {
    pressOnly(partBtns, partBtns.find((b) => b.dataset.part === key));
    const p = PARTS[key];
    partDetail.innerHTML = `<h3 class="h3">${p.title}</h3><p>${p.text}</p>`;
    if (world) world.setPart(key);
  }
  partBtns.forEach((b) => b.addEventListener('click', () => choosePart(b.dataset.part)));
  if (world) world.bindPins($('#pins'), choosePart);

  const aeroBtn = $('#aeroBtn');
  let aeroOpen = false;
  function setAeroUI(open) {
    aeroOpen = open;
    aeroBtn.setAttribute('aria-pressed', String(open));
    $('#aeroLabel').textContent = open ? 'Switch to corner mode' : 'Switch to straight-line mode';
    $('#aeroState').textContent = open ? 'Straight-line mode: wing flaps open, less drag, higher top speed.' : 'Corner mode: wings closed, maximum downforce.';
  }
  aeroBtn.addEventListener('click', () => { setAeroUI(!aeroOpen); if (world) world.setAero(aeroOpen); });

  $('#qualiReplay').addEventListener('click', () => world && world.replayKnockout());
  $('#startBtn').addEventListener('click', () => world && world.runStart());

  function resetSlideUI(id) {
    if (id === 'eras') { pressOnly(eraBtns, null); eraDetail.innerHTML = eraIntro; }
    if (id === 'teams') { chooseTeam(teamKey || 'ferrari'); }
    if (id === 'drivers') { pressOnly(driverBtns, null); driverDetail.innerHTML = driverIntro; if (world) world.setDriver(-1); }
    if (id === 'anatomy') { pressOnly(partBtns, null); partDetail.innerHTML = partIntro; }
    if (id === 'aerodynamics') { setAeroUI(false); }
    if (world && id !== 'teams') world.setTeam(teamKey || 'house');
    if (world && id !== 'aerodynamics') world.setAero(false);
  }

  /* ---- Navigation input ---- */
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  $$('[data-next]').forEach((b) => b.addEventListener('click', next));
  $$('[data-goto]').forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); goTo(ids.indexOf(el.dataset.goto)); }));

  const help = $('#help');
  let helpReturn = null;
  const openHelp = () => { helpReturn = document.activeElement; help.hidden = false; $('#helpClose').focus(); };
  const closeHelp = () => { help.hidden = true; if (helpReturn && helpReturn.focus) helpReturn.focus(); };
  $('#helpBtn').addEventListener('click', openHelp);
  $('#helpClose').addEventListener('click', closeHelp);
  help.addEventListener('click', (e) => { if (e.target === help) closeHelp(); });

  // Fullscreen with feature detection (iPhone Safari has no element fullscreen: the button is hidden).
  const root = document.documentElement;
  const fsEnabled = document.fullscreenEnabled || document.webkitFullscreenEnabled;
  const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const fsBtn = $('#fsBtn');
  if (!fsEnabled) document.body.classList.add('no-fullscreen');
  function toggleFullscreen() {
    if (!fsEnabled) return;
    if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else { const req = root.requestFullscreen || root.webkitRequestFullscreen; const r = req && req.call(root); if (r && r.catch) r.catch(() => {}); }
  }
  const onFs = () => { const on = !!fsElement(); fsBtn.setAttribute('aria-pressed', String(on)); $('#fsLabel').textContent = on ? 'Exit fullscreen' : 'Enter fullscreen'; };
  document.addEventListener('fullscreenchange', onFs);
  document.addEventListener('webkitfullscreenchange', onFs);
  fsBtn.addEventListener('click', toggleFullscreen);

  window.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!help.hidden) {
      if (e.key === 'Escape') { e.preventDefault(); closeHelp(); }
      if (e.key === 'Tab') { e.preventDefault(); $('#helpClose').focus(); }
      return;
    }
    const onControl = e.target.closest && e.target.closest('button, a, input, select, textarea, [contenteditable]');
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      case ' ': if (!onControl) { e.preventDefault(); e.shiftKey ? prev() : next(); } break;
      case 'Home': e.preventDefault(); goTo(0); break;
      case 'End': e.preventDefault(); goTo(slides.length - 1); break;
      case 'f': case 'F': toggleFullscreen(); break;
      case '?': e.preventDefault(); openHelp(); break;
      default:
    }
  });

  // Swipe (touch only), ignoring the dock and vertical scrolling inside panels.
  let swipe = null;
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch' || e.target.closest('.dock, .help')) { swipe = null; return; }
    swipe = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, { passive: true });
  window.addEventListener('pointerup', (e) => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y, dt = performance.now() - swipe.t;
    swipe = null;
    if (dt < 700 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) (dx < 0 ? next : prev)();
  }, { passive: true });
  window.addEventListener('pointercancel', () => { swipe = null; });

  window.addEventListener('popstate', () => {
    const i = ids.indexOf(location.hash.slice(1));
    if (i >= 0) goTo(i, { push: false });
  });

  const onReduce = () => { reduced = reduceMQ.matches; if (world) world.setReduced(); };
  if (reduceMQ.addEventListener) reduceMQ.addEventListener('change', onReduce); else reduceMQ.addListener(onReduce);

  // Start at the deep-linked slide, if any.
  const start = Math.max(0, ids.indexOf(location.hash.slice(1)));
  goTo(start, { push: false, instant: true });
  if (!world) document.documentElement.dataset.ready = 'true';
})();
