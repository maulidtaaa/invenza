(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const qa = (s, r=document) => [...r.querySelectorAll(s)];
  const getItems = () => {
    try {
      const raw = localStorage.getItem('invenza_items_v2');
      const data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  };
  const toast = (title, message) => {
    const box = $('toastContainer');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast v20-toast';
    const safe = v => String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
    el.innerHTML = `<strong>${safe(title)}</strong><span>${safe(message)}</span>`;
    box.appendChild(el); setTimeout(() => el.remove(), 3600);
  };
  const navigate = id => {
    const btn = document.querySelector(`[data-section="${id}"], [data-section-target="${id}"]`);
    if (btn) btn.click();
  };

  function enhanceSearch() {
    const input = $('inventorySearch');
    const shell = input?.closest('.toolbar-search');
    if (!input || !shell || shell.dataset.v25Ready) return;
    shell.dataset.v25Ready = '1';
    shell.classList.add('v25-search-shell');
    input.setAttribute('aria-label', 'Cari data barang');
    const clear = document.createElement('button');
    clear.type = 'button'; clear.className = 'v25-search-clear'; clear.title = 'Bersihkan pencarian'; clear.setAttribute('aria-label','Bersihkan pencarian'); clear.textContent = '×';
    shell.appendChild(clear);
    const hint = document.createElement('div'); hint.className = 'v25-search-hint';
    ['Laptop','Proyektor','Baik','Rusak','Stok rendah'].forEach(label => {
      const chip = document.createElement('button'); chip.type='button'; chip.className='v25-search-chip'; chip.textContent=label;
      chip.addEventListener('click', () => { input.value = label; input.dispatchEvent(new Event('input',{bubbles:true})); input.focus(); });
      hint.appendChild(chip);
    });
    shell.parentElement?.appendChild(hint);
    const sync = () => shell.classList.toggle('has-value', Boolean(input.value.trim()));
    clear.addEventListener('click', () => { input.value=''; input.dispatchEvent(new Event('input',{bubbles:true})); input.focus(); });
    input.addEventListener('input', () => { sync(); const grid=$('inventoryGrid'); if(grid){grid.classList.remove('v25-result-pulse'); void grid.offsetWidth; grid.classList.add('v25-result-pulse');} });
    sync();
  }

  function smartSearchPatch() {
    const input = $('inventorySearch');
    if (!input || input.dataset.v25Search) return;
    input.dataset.v25Search = '1';
    const original = window.filteredInventory;
    if (typeof original !== 'function') return;
    // app.js keeps filteredInventory private, so V25 enhances the input UX while preserving its existing filter engine.
    input.title = 'Cari nama, kode, supplier, ruangan, lokasi, atau kategori. Tekan / untuk fokus.';
  }

  function createOrb() {
    if ($('v25Orb')) return;
    const orb = document.createElement('button'); orb.id='v25Orb'; orb.className='v25-orb'; orb.type='button'; orb.setAttribute('aria-label','Buka V25 Command Orb'); orb.innerHTML='<span>V25</span>';
    const menu=document.createElement('aside'); menu.id='v25OrbMenu'; menu.className='v25-orb-menu'; menu.innerHTML=`<span class="v25-kicker">INVENZA V25</span><h3>Command Orb</h3><p>Jalur cepat untuk ruang inventaris dan pemeriksaan data.</p><div class="v25-orb-grid"><button type="button" data-v25-orb="search">⌕ Fokus Cari</button><button type="button" data-v25-orb="insight">◈ Radar Data</button><button type="button" data-v25-orb="inventory">▦ Data Barang</button><button type="button" data-v25-orb="theme">◐ Ganti Tema</button></div>`;
    document.body.append(orb,menu);
    orb.addEventListener('click',()=>menu.classList.toggle('open'));
    menu.addEventListener('click',e=>{
      const b=e.target.closest('[data-v25-orb]'); if(!b)return;
      const a=b.dataset.v25Orb;
      if(a==='search'){ const i=$('inventorySearch')||$('globalSearch'); i?.focus(); i?.scrollIntoView({behavior:'smooth',block:'center'}); }
      if(a==='inventory') navigate('inventorySection');
      if(a==='insight') showRadar();
      if(a==='theme') $('themeBtn')?.click();
      menu.classList.remove('open');
    });
    document.addEventListener('click',e=>{if(!menu.contains(e.target)&&e.target!==orb)menu.classList.remove('open')});
  }

  function showRadar() {
    const items=getItems();
    const total=items.length;
    const low=items.filter(i=>Number(i.stok)||0).filter(i=>Number(i.stok)<=3).length;
    const broken=items.filter(i=>i.kondisi && i.kondisi!=='Baik').length;
    const filled=total?Math.max(0,Math.round(((total-low-broken)/total)*100)):100;
    let root=$('v25Radar');
    if(!root){root=document.createElement('div');root.id='v25Radar';root.className='v20-overlay';document.body.appendChild(root);}
    root.innerHTML=`<div class="v20-overlay-backdrop" data-v25-close></div><div class="v20-overlay-card"><span class="v25-kicker">V25 DATA RADAR</span><h2>Detak inventaris</h2><p>Ringkasan cepat dari data lokal yang sedang tersimpan di perangkat.</p><div class="v25-insight-panel"><div class="v25-insight-card"><span class="v25-kicker">DATA HEALTH</span><h3>${filled}% ruang data stabil</h3><p>${low} item stok rendah dan ${broken} item berkondisi selain Baik.</p><div class="v25-meter"><span style="width:${filled}%"></span></div></div><div class="v25-stat-grid"><div class="v25-stat"><strong>${total}</strong><span>Jenis barang</span></div><div class="v25-stat"><strong>${low}</strong><span>Stok rendah</span></div><div class="v25-stat"><strong>${broken}</strong><span>Perlu cek</span></div><div class="v25-stat"><strong>${new Set(items.map(i=>i.kategori).filter(Boolean)).size}</strong><span>Kategori</span></div></div></div><button type="button" class="primary-btn" data-v25-close style="margin-top:14px">Tutup Radar</button></div>`;
    qa('[data-v25-close]',root).forEach(b=>b.addEventListener('click',()=>root.remove()));
  }

  function addDashboardSurprise() {
    const anchor=$('focusInsight')?.closest('.surface-card');
    if(!anchor || $('v25DashboardPanel')) return;
    const panel=document.createElement('section'); panel.id='v25DashboardPanel'; panel.className='v25-insight-panel';
    const items=getItems(); const total=items.length; const stock=items.reduce((s,i)=>s+(Number(i.stok)||0),0); const categories=new Set(items.map(i=>i.kategori).filter(Boolean)).size;
    panel.innerHTML=`<div class="v25-insight-card"><span class="v25-kicker">V25 LIVE SIGNAL</span><h3>Inventaris siap dipantau.</h3><p>V25 membaca ${total} jenis barang, ${stock.toLocaleString('id-ID')} unit stok, dan ${categories} kategori dari penyimpanan lokal.</p><div class="v25-meter"><span style="width:${Math.min(100,Math.round((total/20)*100))}%"></span></div></div><div class="v25-stat-grid"><div class="v25-stat"><strong>${total}</strong><span>Jenis</span></div><div class="v25-stat"><strong>${stock.toLocaleString('id-ID')}</strong><span>Total stok</span></div><div class="v25-stat"><strong>${categories}</strong><span>Kategori</span></div><div class="v25-stat"><strong>V25</strong><span>Core aktif</span></div></div>`;
    anchor.insertAdjacentElement('afterend',panel);
  }

  function shortcuts(){
    document.addEventListener('keydown',e=>{
      if(e.key==='.' && e.altKey){e.preventDefault();$('v25Orb')?.click();}
      if(e.key.toLowerCase()==='r' && e.altKey){e.preventDefault();showRadar();}
    });
  }

  function updateSplashBrand(){
    const splash=$('splashScreen'); if(!splash)return;
    splash.setAttribute('aria-label','Memuat INVENZA V25');
    const kicker=splash.querySelector('.solar-kicker'); if(kicker) kicker.textContent='INVENZA V25 • RPL • 2026/2027';
    const init=splash.querySelector('.solar-loader-top span'); if(init) init.textContent='INITIALIZING V25';
    const status=splash.querySelector('.solar-status'); if(status) status.textContent='Menyelaraskan orbit data V25...';
    const bottom=splash.querySelector('.solar-loader-bottom'); if(bottom){const spans=bottom.querySelectorAll('span'); if(spans[0])spans[0].textContent='8 PLANETARY ORBITS'; if(spans[1])spans[1].textContent='V25 DATA CORE'; if(spans[2])spans[2].textContent='READY';}
  }

  function init(){
    enhanceSearch(); smartSearchPatch(); createOrb(); shortcuts(); updateSplashBrand();
    setTimeout(addDashboardSurprise,500);
    window.addEventListener('storage',()=>{setTimeout(addDashboardSurprise,100);});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init); else init();
})();
