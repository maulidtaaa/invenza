(() => {
  'use strict';

  const V30_KEY = 'invenza_v30_splash_seen';
  const $ = id => document.getElementById(id);

  function makeParticles(root, count = 85) {
    const field = document.createElement('div');
    field.className = 'v30-particle-field';
    field.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'v30-particle';
      p.style.setProperty('--x', `${Math.random() * 100}%`);
      p.style.setProperty('--y', `${Math.random() * 100}%`);
      p.style.setProperty('--s', `${1 + Math.random() * 2.8}px`);
      p.style.setProperty('--dx', `${(Math.random() - .5) * 30}px`);
      p.style.setProperty('--dy', `${(Math.random() - .5) * 30}px`);
      p.style.setProperty('--d', `${3.5 + Math.random() * 5}s`);
      p.style.setProperty('--delay', `${Math.random() * -7}s`);
      field.appendChild(p);
    }
    root.appendChild(field);
  }

  function makeAsteroids(root, count = 52) {
    const belt = document.createElement('div');
    belt.className = 'v30-asteroid-belt';
    belt.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < count; i++) {
      const a = document.createElement('i');
      a.className = 'v30-asteroid';
      a.style.setProperty('--a', `${(360 / count) * i + Math.random() * 5}deg`);
      a.style.setProperty('--r', `${44 + Math.random() * 8}vw`);
      a.style.setProperty('--s', `${1.2 + Math.random() * 3.5}px`);
      a.style.setProperty('--d', `${16 + Math.random() * 18}s`);
      a.style.animationDelay = `${Math.random() * -20}s`;
      belt.appendChild(a);
    }
    root.appendChild(belt);
  }

  function makeConstellation(root) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1000 600');
    svg.classList.add('v30-constellation');
    svg.setAttribute('aria-hidden', 'true');
    const points = [[90,120],[190,210],[310,130],[410,250],[540,150],[650,270],[790,160],[900,300],[710,450],[520,390],[330,470],[160,390]];
    points.forEach(([x,y], i) => {
      const [nx, ny] = points[(i + 1) % points.length];
      const line = document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('x1',x); line.setAttribute('y1',y); line.setAttribute('x2',nx); line.setAttribute('y2',ny); svg.appendChild(line);
      const c = document.createElementNS('http://www.w3.org/2000/svg','circle');
      c.setAttribute('cx',x); c.setAttribute('cy',y); c.setAttribute('r',2.4); svg.appendChild(c);
    });
    root.appendChild(svg);
  }

  function makeOrbitEchoes(root) {
    const sizes = [[58,34,-12],[66,42,20],[74,48,-28],[82,55,11],[90,61,-18],[96,68,31],[103,73,-7],[110,80,17]];
    sizes.forEach(([w,h,rot]) => {
      const e = document.createElement('div');
      e.className = 'v30-orbit-echo';
      e.style.setProperty('--w', `${w}vw`);
      e.style.setProperty('--h', `${h}vw`);
      e.style.setProperty('--rot', `${rot}deg`);
      root.appendChild(e);
    });
  }

  function makeFormation(root) {
    const wrap = document.createElement('div');
    wrap.className = 'v30-formation';
    wrap.id = 'v30Formation';
    wrap.innerHTML = `
      <svg class="v30-logo-svg" viewBox="0 0 1000 250" role="img" aria-label="INVENZA">
        <ellipse class="v30-logo-ring" cx="500" cy="125" rx="465" ry="92"></ellipse>
        <text class="v30-logo-word-fill" x="500" y="155" text-anchor="middle" font-family="system-ui, sans-serif" font-size="126" font-weight="800" letter-spacing="8">INVENZA</text>
        <text class="v30-logo-word" x="500" y="155" text-anchor="middle" font-family="system-ui, sans-serif" font-size="126" font-weight="800" letter-spacing="8">INVENZA</text>
      </svg>
      <span class="v30-formation-label">ORBITAL IDENTITY FORMATION • V30</span>
      <span class="v30-status">Eight planetary paths converging into INVENZA</span>`;
    root.appendChild(wrap);
    return wrap;
  }

  function setup() {
    const splash = $('splashScreen');
    if (!splash || splash.dataset.v30Ready) return;
    splash.dataset.v30Ready = '1';
    splash.classList.add('v30-splash-active');

    const layer = document.createElement('div');
    layer.className = 'v30-splash-layer';
    layer.id = 'v30CosmicLayer';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<div class="v30-nebula"></div><div class="v30-stars"></div>';
    splash.appendChild(layer);
    makeConstellation(layer);
    makeAsteroids(layer);
    makeParticles(layer);
    makeOrbitEchoes(layer);
    const formation = makeFormation(layer);

    requestAnimationFrame(() => layer.classList.add('active'));

    const status = splash.querySelector('.solar-status');
    const loader = splash.querySelector('.solar-loader-top span');
    const progress = $('splashProgressText');
    const messages = [
      ['V25 • SOLAR SYSTEM', 'Menyalakan delapan orbit...'],
      ['V26 • ASTEROID BELT', 'Memasuki sabuk asteroid...'],
      ['V27 • CONSTELLATION', 'Menghubungkan pola bintang...'],
      ['V28 • PARTICLES', 'Mengaktifkan partikel interaktif...'],
      ['V29 • LOGO FORMATION', 'Mengumpulkan jalur identitas...'],
      ['V30 • ORBITAL SIGNATURE', 'Membentuk simbol INVENZA...']
    ];

    let last = -1;
    const update = () => {
      const seen = sessionStorage.getItem(V30_KEY);
      if (seen) return;
      const pct = Number.parseInt(progress?.textContent || '0', 10) || 0;
      const idx = pct < 18 ? 0 : pct < 34 ? 1 : pct < 51 ? 2 : pct < 68 ? 3 : pct < 84 ? 4 : 5;
      if (idx !== last) {
        last = idx;
        if (loader) loader.textContent = `INITIALIZING ${messages[idx][0]}`;
        if (status) status.textContent = messages[idx][1];
      }
      if (pct >= 68 && !formation.classList.contains('active')) formation.classList.add('active');
      requestAnimationFrame(update);
    };
    requestAnimationFrame(update);

    window.addEventListener('beforeunload', () => sessionStorage.removeItem(V30_KEY), { once:true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once:true });
  else setup();
})();
