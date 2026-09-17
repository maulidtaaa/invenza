(() => {
  'use strict';

  const V20 = {
    itemsKey: 'invenza_items_v2',
    prefsKey: 'invenza_prefs_v2',
    activityKey: 'invenza_activity_v20',
    compactKey: 'invenza_compact_v20'
  };

  const $ = id => document.getElementById(id);
  const read = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
  const rupiah = value => new Intl.NumberFormat('id-ID', {
    style:'currency', currency:'IDR', maximumFractionDigits:0
  }).format(Number(value) || 0);

  function items() {
    return read(V20.itemsKey, []).map(i => ({
      ...i,
      stok:Number(i.stok)||0,
      harga:Number(i.harga)||0
    }));
  }

  function toast(title, message) {
    const box = $('toastContainer');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast v20-toast';
    el.innerHTML = `<strong>${esc(title)}</strong><span>${esc(message)}</span>`;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  function logActivity(title, detail) {
    const list = read(V20.activityKey, []);
    list.unshift({title, detail, at:new Date().toISOString()});
    localStorage.setItem(V20.activityKey, JSON.stringify(list.slice(0,30)));
  }

  function createDock() {
    if ($('v20Dock')) return;
    const dock = document.createElement('div');
    dock.id = 'v20Dock';
    dock.className = 'v20-dock';
    dock.setAttribute('aria-label','INVENZA V20 tools');
    dock.innerHTML = `
      <button type="button" class="v20-main" data-v20="hub" title="V20 Command Hub">V20 HUB</button>
      <button type="button" data-v20="calc" title="Kalkulator">⌗</button>
      <button type="button" data-v20="insight" title="Smart Insight">◈</button>
      <button type="button" data-v20="focus" title="Fokus pencarian">⌕</button>
      <button type="button" data-v20="compact" title="Mode ringkas">▦</button>
      <button type="button" data-v20="fullscreen" title="Layar penuh">⛶</button>
      <button type="button" data-v20="top" title="Ke atas">↑</button>`;
    document.body.appendChild(dock);
    dock.addEventListener('click', e => {
      const b = e.target.closest('[data-v20]');
      if (!b) return;
      const action = b.dataset.v20;
      if (action === 'hub') openHub();
      if (action === 'calc') openCalculator();
      if (action === 'insight') openInsight();
      if (action === 'focus') focusSearch();
      if (action === 'compact') toggleCompact();
      if (action === 'fullscreen') toggleFullscreen();
      if (action === 'top') window.scrollTo({top:0,behavior:'smooth'});
    });
  }

  function overlay(title, eyebrow, body, actions='') {
    const old = $('v20Overlay');
    if (old) old.remove();
    const root = document.createElement('div');
    root.id = 'v20Overlay';
    root.className = 'v20-overlay';
    root.innerHTML = `
      <div class="v20-panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
        <div class="v20-panel-head">
          <div><span class="eyebrow">${esc(eyebrow)}</span><h3>${esc(title)}</h3></div>
          <button type="button" class="v20-close" data-v20-close aria-label="Tutup">×</button>
        </div>
        ${body}
        ${actions ? `<div class="v20-actions">${actions}</div>` : ''}
      </div>`;
    document.body.appendChild(root);
    root.addEventListener('click', e => {
      if (e.target === root || e.target.closest('[data-v20-close]')) root.remove();
    });
    return root;
  }

  function openHub() {
    const data = items();
    const low = data.filter(i => i.stok > 0 && i.stok <= 5).length;
    const empty = data.filter(i => i.stok <= 0).length;
    const value = data.reduce((s,i)=>s+i.harga*i.stok,0);
    const suppliers = new Set(data.map(i=>i.supplier).filter(Boolean)).size;
    const rooms = new Set(data.map(i=>i.ruangan).filter(Boolean)).size;
    const activity = read(V20.activityKey, []);
    const body = `
      <div class="v20-grid">
        <div class="v20-stat"><span>Total entri</span><strong>${data.length.toLocaleString('id-ID')}</strong></div>
        <div class="v20-stat"><span>Total stok</span><strong>${data.reduce((s,i)=>s+i.stok,0).toLocaleString('id-ID')}</strong></div>
        <div class="v20-stat"><span>Nilai aset</span><strong>${rupiah(value)}</strong></div>
        <div class="v20-stat"><span>Stok perhatian</span><strong>${(low+empty).toLocaleString('id-ID')}</strong></div>
        <div class="v20-stat"><span>Supplier</span><strong>${suppliers.toLocaleString('id-ID')}</strong></div>
        <div class="v20-stat"><span>Ruangan</span><strong>${rooms.toLocaleString('id-ID')}</strong></div>
      </div>
      <div class="v20-actions">
        <button type="button" data-v20-hub="add">＋ Tambah barang</button>
        <button type="button" data-v20-hub="inventory">▤ Buka data</button>
        <button type="button" data-v20-hub="analytics">◒ Buka analitik</button>
        <button type="button" data-v20-hub="csv">⇩ Export CSV</button>
        <button type="button" data-v20-hub="json">⇩ Backup JSON</button>
        <button type="button" data-v20-hub="check">✓ Audit data</button>
      </div>
      <div class="v20-activity">
        <div class="eyebrow">AKTIVITAS V20</div>
        ${activity.length ? activity.slice(0,8).map(a =>
          `<div class="v20-activity-item"><strong>${esc(a.title)}</strong>${esc(a.detail)}<br><small>${new Date(a.at).toLocaleString('id-ID')}</small></div>`
        ).join('') : '<div class="v20-activity-item">Belum ada aktivitas V20 yang tercatat.</div>'}
      </div>`;
    const root = overlay('Command Hub', 'INVENZA V20', body);
    root.querySelectorAll('[data-v20-hub]').forEach(b => b.addEventListener('click', () => {
      const a = b.dataset.v20Hub;
      root.remove();
      if (a === 'add') document.querySelector('[data-action="add"]')?.click() || $('heroAddBtn')?.click();
      if (a === 'inventory') document.querySelector('[data-section-target="inventorySection"]')?.click();
      if (a === 'analytics') document.querySelector('[data-section-target="analyticsSection"]')?.click();
      if (a === 'csv') $('downloadCsvBtn')?.click();
      if (a === 'json') $('exportJsonBtn')?.click();
      if (a === 'check') auditData();
    }));
  }

  function openInsight() {
    const data = items();
    const byValue = [...data].sort((a,b)=>(b.harga*b.stok)-(a.harga*a.stok));
    const byStock = [...data].sort((a,b)=>b.stok-a.stok);
    const low = data.filter(i=>i.stok>0&&i.stok<=5);
    const damaged = data.filter(i=>i.kondisi && i.kondisi!=='Baik');
    const cats = {};
    data.forEach(i => cats[i.kategori || 'Lainnya'] = (cats[i.kategori || 'Lainnya'] || 0) + i.stok);
    const topCat = Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
    const body = `
      <div class="v20-grid">
        <div class="v20-stat"><span>Barang dengan nilai aset terbesar</span><strong>${esc(byValue[0]?.nama || '-')}</strong></div>
        <div class="v20-stat"><span>Stok terbanyak</span><strong>${esc(byStock[0]?.nama || '-')}</strong></div>
        <div class="v20-stat"><span>Kategori stok terbesar</span><strong>${esc(topCat ? topCat[0] : '-')}</strong></div>
        <div class="v20-stat"><span>Barang perlu perhatian</span><strong>${(low.length+damaged.length).toLocaleString('id-ID')}</strong></div>
      </div>
      <div class="v20-activity">
        <div class="v20-activity-item"><strong>Nilai aset:</strong> ${rupiah(data.reduce((s,i)=>s+i.harga*i.stok,0))}</div>
        <div class="v20-activity-item"><strong>Kondisi:</strong> ${damaged.length} entri memiliki kondisi selain Baik.</div>
        <div class="v20-activity-item"><strong>Stok rendah:</strong> ${low.map(i=>i.nama).slice(0,6).map(esc).join(', ') || 'Tidak ada'}.</div>
      </div>`;
    overlay('Smart Insight', 'DATA INTELLIGENCE', body, '<button type="button" data-v20-close>Tutup</button>');
    logActivity('Smart Insight','Ringkasan inventaris dibuka');
  }

  function openCalculator() {
    const body = `
      <div class="v20-calc">
        <input id="v20CalcInput" inputmode="decimal" autocomplete="off" aria-label="Kalkulator" placeholder="0">
        ${['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','C','+'].map(x=>`<button type="button" data-calc="${x}">${x}</button>`).join('')}
        <button type="button" data-calc="=" style="grid-column:1/-1">HASIL</button>
      </div>`;
    const root = overlay('Kalkulator Cepat', 'V20 UTILITY', body);
    const input = root.querySelector('#v20CalcInput');
    root.querySelectorAll('[data-calc]').forEach(btn => btn.addEventListener('click', () => {
      const key = btn.dataset.calc;
      if (key === 'C') input.value='';
      else if (key === '=') calculate(input);
      else input.value += key;
      input.focus();
    }));
    setTimeout(()=>input?.focus(),50);
  }

  function calculate(input) {
    let expr = input.value.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) { input.value='ERR'; return; }
    try {
      const result = Function(`"use strict";return (${expr})`)();
      if (!Number.isFinite(result)) throw new Error();
      input.value = String(Number(result.toFixed(8)));
    } catch { input.value='ERR'; }
  }

  function focusSearch() {
    const target = $('globalSearch') || $('inventorySearch');
    if (!target) return;
    if (target.id === 'globalSearch') target.focus();
    else document.querySelector('[data-section-target="inventorySection"]')?.click(), setTimeout(()=>target.focus(),80);
  }

  function toggleCompact() {
    document.body.classList.toggle('v20-compact');
    localStorage.setItem(V20.compactKey, document.body.classList.contains('v20-compact') ? '1':'0');
    toast('Mode tampilan', document.body.classList.contains('v20-compact') ? 'Mode ringkas aktif.' : 'Mode normal aktif.');
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch { toast('Fullscreen','Browser tidak mengizinkan mode layar penuh.','error'); }
  }

  function auditData() {
    const data = items();
    const ids = new Set();
    const codes = new Set();
    const duplicateIds = data.filter(i => ids.has(i.id) || (ids.add(i.id),false));
    const duplicateCodes = data.filter(i => codes.has(i.kode) || (codes.add(i.kode),false));
    const missing = data.filter(i => !i.nama || !i.kode || !i.supplier).length;
    const invalid = data.filter(i => i.stok < 0 || i.harga < 0).length;
    const body = `
      <div class="v20-grid">
        <div class="v20-stat"><span>Duplikat ID</span><strong>${duplicateIds.length}</strong></div>
        <div class="v20-stat"><span>Duplikat kode</span><strong>${duplicateCodes.length}</strong></div>
        <div class="v20-stat"><span>Data wajib kosong</span><strong>${missing}</strong></div>
        <div class="v20-stat"><span>Nilai tidak valid</span><strong>${invalid}</strong></div>
      </div>
      <div class="v20-activity"><div class="v20-activity-item">${duplicateIds.length+duplicateCodes.length+missing+invalid === 0 ? 'Audit selesai. Struktur data lokal terlihat konsisten.' : 'Audit menemukan beberapa entri yang perlu diperiksa.'}</div></div>`;
    overlay('Audit Data', 'DATA HEALTH', body, '<button type="button" data-v20-close>Tutup</button>');
    logActivity('Audit Data', `${data.length} entri diperiksa`);
  }

  function installInventoryEnhancements() {
    const grid = $('inventoryGrid');
    if (!grid || grid.dataset.v20Ready) return;
    grid.dataset.v20Ready = '1';
    const observer = new MutationObserver(() => {
      grid.querySelectorAll('.inventory-card').forEach(card => {
        if (card.querySelector('.v20-select')) return;
        const id = card.dataset.detailId;
        const check = document.createElement('label');
        check.className = 'v20-select';
        check.innerHTML = `<input type="checkbox" data-v20-select="${esc(id)}"><span aria-hidden="true"></span>`;
        check.addEventListener('click', e => e.stopPropagation());
        card.appendChild(check);
      });
      createBulkBar();
    });
    observer.observe(grid,{childList:true});
    grid.querySelectorAll('.inventory-card').forEach(card => {
      if (card.querySelector('.v20-select')) return;
      const id = card.dataset.detailId;
      const check = document.createElement('label');
      check.className = 'v20-select';
      check.innerHTML = `<input type="checkbox" data-v20-select="${esc(id)}"><span aria-hidden="true"></span>`;
      check.addEventListener('click', e => e.stopPropagation());
      card.appendChild(check);
    });
    createBulkBar();
  }

  function createBulkBar() {
    let bar = $('v20BulkBar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id='v20BulkBar';
      bar.className='v20-bulkbar';
      bar.innerHTML=`<strong><span id="v20SelectedCount">0</span> dipilih</strong>
        <button type="button" data-bulk="select">Pilih semua</button>
        <button type="button" data-bulk="clear">Batal pilih</button>
        <button type="button" data-bulk="csv">Export pilihan</button>
        <button type="button" data-bulk="delete">Hapus pilihan</button>`;
      document.body.appendChild(bar);
      bar.addEventListener('click', e => {
        const b=e.target.closest('[data-bulk]'); if(!b)return;
        const selected=[...document.querySelectorAll('[data-v20-select]:checked')].map(x=>x.dataset.v20Select);
        if(b.dataset.bulk==='select') document.querySelectorAll('[data-v20-select]').forEach(x=>x.checked=true);
        if(b.dataset.bulk==='clear') document.querySelectorAll('[data-v20-select]').forEach(x=>x.checked=false);
        if(b.dataset.bulk==='csv') exportSelected(selected);
        if(b.dataset.bulk==='delete') deleteSelected(selected);
        updateBulkBar();
      });
      document.addEventListener('change', e=>{if(e.target.matches('[data-v20-select]'))updateBulkBar()});
    }
    updateBulkBar();
  }

  function updateBulkBar() {
    const selected=document.querySelectorAll('[data-v20-select]:checked').length;
    const bar=$('v20BulkBar');
    if(bar) bar.classList.toggle('active',selected>0);
    if($('v20SelectedCount')) $('v20SelectedCount').textContent=selected;
  }

  function exportSelected(ids) {
    if(!ids.length){toast('Belum ada pilihan','Pilih minimal satu barang.','error');return;}
    const data=items().filter(i=>ids.includes(i.id));
    const rows=[['Kode','Nama','Kategori','Stok','Satuan','Harga','Nilai Aset'],...data.map(i=>[i.kode,i.nama,i.kategori,i.stok,i.satuan,i.harga,i.harga*i.stok])];
    const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(',')).join('\r\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download='INVENZA-V20-pilihan.csv';a.click();
    logActivity('Export pilihan',`${data.length} barang diekspor`);
  }

  function deleteSelected(ids) {
    if(!ids.length){toast('Belum ada pilihan','Pilih minimal satu barang.','error');return;}
    if(!confirm(`Hapus ${ids.length} barang terpilih dari perangkat ini?`))return;
    const data=items().filter(i=>!ids.includes(i.id));
    localStorage.setItem(V20.itemsKey,JSON.stringify(data));
    location.reload();
  }

  function hardenResponsive() {
    document.body.classList.toggle('v20-compact',localStorage.getItem(V20.compactKey)==='1');
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        document.documentElement.style.setProperty('--v20-viewport-width', `${Math.round(entry.contentRect.width)}px`);
      }
    });
    ro.observe(document.documentElement);
  }

  function watchToastActivity() {
    const box=$('toastContainer'); if(!box)return;
    const observer=new MutationObserver(records=>{
      records.forEach(r=>r.addedNodes.forEach(n=>{
        const strong=n.querySelector?.('strong');
        const spans=n.querySelectorAll?.('span');
        if(strong) logActivity(strong.textContent,spans?.[0]?.textContent||'');
      }));
    });
    observer.observe(box,{childList:true});
  }

  function initShortcuts() {
    document.addEventListener('keydown', e => {
      if (e.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName||'')) {e.preventDefault();focusSearch();}
      if (e.altKey && e.key.toLowerCase()==='h') {e.preventDefault();openHub();}
      if (e.altKey && e.key.toLowerCase()==='c') {e.preventDefault();openCalculator();}
      if (e.altKey && e.key.toLowerCase()==='i') {e.preventDefault();openInsight();}
    });
  }

  function init() {
    createDock();
    installInventoryEnhancements();
    hardenResponsive();
    watchToastActivity();
    initShortcuts();
    logActivity('INVENZA V20','Modul V20 diaktifkan');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init);
  else init();
})();
