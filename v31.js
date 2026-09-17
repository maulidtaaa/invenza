/* =========================================================
   INVENZA V31 • ORBITAL COMMAND OS
   - Replaces visible legacy V20/V25/V26 command docks with V31.
   - Adds Mission Control, data health, anomaly detection,
     duplicate detection, quick filters, system diagnostics,
     snapshots, smart reports and a V31 boot identity.
   ========================================================= */
(() => {
  'use strict';
  const VERSION = 'V31';
  const ITEM_KEY = 'invenza_items_v2';
  const SNAP_KEY = 'invenza_v31_snapshots';
  const LOG_KEY = 'invenza_v31_activity';
  const SPLASH_KEY = 'invenza_splash_seen_v31';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const items = () => { try { const x = JSON.parse(localStorage.getItem(ITEM_KEY) || '[]'); return Array.isArray(x) ? x : []; } catch { return []; } };
  const getJSON = (key, fallback) => { try { const x=JSON.parse(localStorage.getItem(key)); return x ?? fallback; } catch { return fallback; } };
  const put = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const rup = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0);
  const num = n => (Number(n)||0).toLocaleString('id-ID');
  const date = x => x ? new Date(x).toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}) : '-';
  const daysSince = x => x ? Math.max(0,Math.floor((Date.now()-new Date(x).getTime())/86400000)) : 9999;

  function toast(title,msg){
    const old=$('v31Toast'); if(old) old.remove();
    const el=document.createElement('div'); el.id='v31Toast'; el.className='v31-toast';
    el.innerHTML=`<strong>${esc(title)}</strong><span>${esc(msg)}</span>`; document.body.appendChild(el);
    setTimeout(()=>el.remove(),3600);
  }

  function quality(){
    const a=items(); if(!a.length) return {score:0,complete:0,duplicate:0,stale:0,low:0,damaged:0,value:0};
    const required=['kode','nama','kategori','supplier','ruangan','lokasi','penanggungJawab'];
    let missing=0;
    a.forEach(i=>required.forEach(k=>{if(!String(i[k]??'').trim())missing++}));
    const possible=a.length*required.length;
    const complete=Math.max(0,Math.round((1-missing/Math.max(1,possible))*100));
    const codes=new Map(); a.forEach(i=>{const k=String(i.kode||'').trim().toLowerCase();if(k)codes.set(k,(codes.get(k)||0)+1)});
    const duplicate=[...codes.values()].filter(v=>v>1).reduce((s,v)=>s+v-1,0);
    const low=a.filter(i=>(Number(i.stok)||0)<=5).length;
    const damaged=a.filter(i=>i.kondisi && i.kondisi!=='Baik').length;
    const stale=a.filter(i=>daysSince(i.updatedAt||i.createdAt)>45).length;
    const value=a.reduce((s,i)=>s+(Number(i.harga)||0)*(Number(i.stok)||0),0);
    const penalty=Math.min(60,duplicate*6+low*1.5+damaged*2+stale*1.5);
    return {score:Math.max(0,Math.min(100,Math.round(complete-penalty))),complete,duplicate,stale,low,damaged,value};
  }

  function anomalies(){
    const a=items(), out=[];
    a.filter(i=>!String(i.kode||'').trim()||!String(i.nama||'').trim()||!String(i.supplier||'').trim()).slice(0,8).forEach(i=>out.push({type:'bad',title:'Data belum lengkap',msg:`${i.nama||i.id||'Barang'} memiliki identitas wajib yang belum terisi.`}));
    const map=new Map(); a.forEach(i=>{const k=String(i.kode||'').trim().toLowerCase();if(k)map.set(k,[...(map.get(k)||[]),i])});
    [...map.values()].filter(x=>x.length>1).slice(0,5).forEach(x=>out.push({type:'bad',title:'Kode duplikat',msg:`${x.map(i=>i.kode).join(', ')} digunakan lebih dari sekali.`}));
    a.filter(i=>(Number(i.stok)||0)<=5).slice(0,6).forEach(i=>out.push({type:'warn',title:'Stok menipis',msg:`${i.nama||'-'} tersisa ${num(i.stok)} ${i.satuan||'unit'}.`}));
    a.filter(i=>i.kondisi&&i.kondisi!=='Baik').slice(0,6).forEach(i=>out.push({type:'bad',title:'Kondisi perlu perhatian',msg:`${i.nama||'-'} tercatat ${i.kondisi}.`}));
    a.filter(i=>daysSince(i.updatedAt||i.createdAt)>45).slice(0,5).forEach(i=>out.push({type:'warn',title:'Data lama belum diperbarui',msg:`${i.nama||'-'} terakhir diperbarui ${daysSince(i.updatedAt||i.createdAt)} hari lalu.`}));
    return out.slice(0,14);
  }

  function log(action,detail=''){
    const a=getJSON(LOG_KEY,[]); a.unshift({time:new Date().toISOString(),action,detail}); put(LOG_KEY,a.slice(0,60));
  }

  function addV31Badge(){
    const header=document.querySelector('.header-tools');
    if(header&&!$('v31VersionBadge')){
      const b=document.createElement('span'); b.id='v31VersionBadge'; b.className='v31-version-badge'; b.innerHTML='<i></i><span>V31 COMMAND OS</span>'; header.insertBefore(b,header.firstChild);
    }
    const brand=document.querySelector('.brand-text span'); if(brand)brand.textContent='Orbital Inventory Command OS • V31';
    document.title='INVENZA V31 | Orbital Inventory Command OS';
    document.querySelectorAll('.app-footer .footer-project-badge-v15 strong').forEach(e=>e.textContent='INVENZA V31 • Orbital Command OS');
  }

  function hideLegacyVisibleLayers(){
    document.body.classList.add('v31-active');
    ['v20Dock','v25Orb','v26Dock'].forEach(id=>{const e=$(id);if(e)e.remove();});
    document.querySelectorAll('.v20-overlay,.v26-overlay,.v26-command,.v26-presentation').forEach(e=>{if(!e.dataset.v31Keep)e.remove();});
  }

  function createSection(){
    if($('v31Section'))return;
    const main=$('mainContent'); if(!main)return;
    const s=document.createElement('section'); s.id='v31Section'; s.className='page-section v31-section';
    s.innerHTML=`
      <div class="section-title-row"><div><span class="eyebrow">V31 ORBITAL COMMAND OS</span><h1>Mission Control Inventaris</h1><p>Satu pusat kendali untuk kesehatan data, anomali, risiko stok, aktivitas, dan kesiapan sistem.</p></div><div class="title-actions"><button class="secondary-btn" id="v31RefreshBtn">↻ Refresh Intelligence</button><button class="primary-btn glow-btn" id="v31SnapshotBtn">＋ Snapshot</button></div></div>
      <div class="v31-grid">
        <section class="v31-card"><span class="v31-kicker">SYSTEM HEALTH</span><h2>Inventory Health Score</h2><p>Skor dihitung dari kelengkapan data, duplikasi kode, stok rendah, kondisi aset, dan usia pembaruan data.</p><div id="v31HealthBox" class="v31-health"></div><div id="v31Numbers" class="v31-number-grid"></div></section>
        <section class="v31-card"><span class="v31-kicker">LIVE ALERTS</span><h2>Signal Center</h2><p>Temuan yang paling membutuhkan perhatian saat ini.</p><div id="v31Alerts" class="v31-alerts"></div></section>
        <section class="v31-card"><span class="v31-kicker">SMART ACTIONS</span><h2>One-click Operations</h2><p>Aksi cepat tanpa harus membuka banyak menu.</p><div class="v31-actions">
          <button class="v31-action" data-v31-action="low"><strong>⚠ Fokus stok rendah</strong><small>Filter data barang yang mendekati batas minimum.</small></button>
          <button class="v31-action" data-v31-action="bad"><strong>◈ Fokus kondisi</strong><small>Temukan barang Rusak Ringan atau Rusak Berat.</small></button>
          <button class="v31-action" data-v31-action="duplicate"><strong>⌘ Audit duplikasi</strong><small>Buka daftar kode barang yang terdeteksi ganda.</small></button>
          <button class="v31-action" data-v31-action="json"><strong>⇩ Smart backup</strong><small>Ekspor snapshot JSON bertanda V31.</small></button>
          <button class="v31-action" data-v31-action="report"><strong>▧ Intelligence report</strong><small>Cetak ringkasan kesehatan inventaris.</small></button>
          <button class="v31-action" data-v31-action="inventory"><strong>▦ Buka inventory</strong><small>Kembali ke tabel data barang.</small></button>
        </div></section>
        <section class="v31-card"><span class="v31-kicker">SYSTEM DIAGNOSTICS</span><h2>Perangkat & PWA</h2><p>Status kemampuan utama INVENZA pada perangkat ini.</p><div id="v31System" class="v31-status-row"></div><div id="v31Activity" class="v31-alerts" style="margin-top:14px"></div></section>
      </div>`;
    main.insertBefore(s,main.firstChild);
    bindSection(); renderSection();
  }

  function renderSection(){
    const q=quality(), a=items(), an=anomalies();
    const scoreRows=[['Kelengkapan',q.complete],['Duplikasi',Math.max(0,100-q.duplicate*15)],['Stok',Math.max(0,100-q.low*4)],['Kondisi',Math.max(0,100-q.damaged*5)],['Kebaruan',Math.max(0,100-q.stale*4)]];
    $('v31HealthBox').innerHTML=`<div class="v31-ring" style="--score:${q.score}"><div><strong>${q.score}%</strong><small>${q.score>=85?'Stabil':q.score>=65?'Perlu review':'Perlu tindakan'}</small></div></div><div class="v31-score-list">${scoreRows.map(r=>`<div class="v31-score-row"><span>${r[0]}</span><div class="v31-meter"><span style="width:${Math.max(0,Math.min(100,r[1]))}%"></span></div><b>${Math.round(r[1])}%</b></div>`).join('')}</div>`;
    $('v31Numbers').innerHTML=[['Jenis barang',a.length],['Total unit',num(a.reduce((s,i)=>s+(Number(i.stok)||0),0))],['Nilai aset',rup(q.value)],['Temuan',an.length]].map(x=>`<div class="v31-number"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('');
    $('v31Alerts').innerHTML=an.length?an.map(x=>`<div class="v31-alert ${x.type}"><i></i><div><strong>${esc(x.title)}</strong><span>${esc(x.msg)}</span></div><time>NOW</time></div>`).join(''):'<div class="v31-alert"><i></i><div><strong>Signal bersih</strong><span>Tidak ada temuan utama dari pemeriksaan V31.</span></div><time>OK</time></div>';
    renderSystem(); renderActivity();
  }

  function renderSystem(){
    const storage=navigator.storage?.estimate?null:null;
    const sw='serviceWorker' in navigator;
    const idb='indexedDB' in window;
    const notif='Notification' in window;
    const cam='mediaDevices' in navigator;
    $('v31System').innerHTML=[
      [navigator.onLine?'ONLINE':'OFFLINE',navigator.onLine?'ok':'warn'],
      [sw?'PWA / SW READY':'PWA / SW UNAVAILABLE',sw?'ok':'warn'],
      [idb?'INDEXEDDB AVAILABLE':'INDEXEDDB N/A',idb?'ok':'warn'],
      [notif?'NOTIFICATION READY':'NOTIFICATION N/A',notif?'ok':'warn'],
      [cam?'CAMERA API READY':'CAMERA N/A',cam?'ok':'warn'],
      [localStorage?'LOCAL STORAGE READY':'LOCAL STORAGE N/A','ok']
    ].map(x=>`<span class="v31-status ${x[1]}"><b>${esc(x[0])}</b></span>`).join('');
    if(storage){storage.then(s=>{const el=document.querySelector('#v31System .v31-storage');if(el)el.textContent=s.usage?`${Math.round(s.usage/1024/1024*10)/10} MB`:'-'}).catch(()=>{});}
  }

  function renderActivity(){
    const a=getJSON(LOG_KEY,[]).slice(0,5);
    $('v31Activity').innerHTML=a.length?a.map(x=>`<div class="v31-alert"><i></i><div><strong>${esc(x.action)}</strong><span>${esc(x.detail||'Aktivitas V31')}</span></div><time>${new Date(x.time).toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'})}</time></div>`).join(''):'<div class="v31-alert"><i></i><div><strong>Belum ada aktivitas V31</strong><span>Aksi yang dijalankan dari Command OS akan muncul di sini.</span></div><time>—</time></div>';
  }

  function bindSection(){
    $('v31RefreshBtn').onclick=()=>{renderSection();log('Refresh intelligence');renderSection();toast('V31 diperbarui','Data kesehatan dan signal center sudah dipindai ulang.')};
    $('v31SnapshotBtn').onclick=()=>createSnapshot(true);
    document.querySelectorAll('[data-v31-action]').forEach(b=>b.onclick=()=>runAction(b.dataset.v31Action));
  }

  function runAction(action){
    if(action==='inventory'){$('#inventoryAddBtn')?.closest('button'); document.querySelector('[data-section="inventorySection"]')?.click();log('Buka inventory');return;}
    if(action==='low'||action==='bad'){
      document.querySelector('[data-section="inventorySection"]')?.click();
      setTimeout(()=>{
        const s=$('stockFilter'), c=$('conditionFilter');
        if(action==='low'&&s){s.value='low';s.dispatchEvent(new Event('input',{bubbles:true}));}
        if(action==='bad'&&c){c.value='bad';c.dispatchEvent(new Event('input',{bubbles:true}));}
      },80); log(action==='low'?'Fokus stok rendah':'Fokus kondisi'); return;
    }
    if(action==='duplicate'){showAudit();return;}
    if(action==='json'){createSnapshot(false);return;}
    if(action==='report'){printIntelligence();return;}
  }

  function showOverlay(title,kicker,body){
    const old=$('v31Overlay');if(old)old.remove();
    const root=document.createElement('div');root.id='v31Overlay';root.className='v31-overlay';root.innerHTML=`<div class="v31-overlay-box"><div class="v31-overlay-head"><div><span class="v31-kicker">${esc(kicker)}</span><h2>${esc(title)}</h2></div><button class="v31-close" data-v31-close>ESC ×</button></div>${body}</div></div>`;
    document.body.appendChild(root); root.addEventListener('click',e=>{if(e.target===root||e.target.closest('[data-v31-close]'))root.remove()}); return root;
  }

  function showAudit(){
    const a=items(), map=new Map(); a.forEach(i=>{const k=String(i.kode||'').trim().toLowerCase();if(k)map.set(k,[...(map.get(k)||[]),i])});
    const dup=[...map.entries()].filter(([,v])=>v.length>1);
    const missing=a.filter(i=>!i.kode||!i.nama||!i.supplier||!i.ruangan||!i.lokasi);
    const body=`<p style="color:#8ea8bf">Audit lokal V31 membaca ${a.length} entri tanpa mengubah data.</p><div class="v31-overlay-grid"><div class="v31-mini-card"><strong>${dup.length}</strong><span>kelompok kode duplikat</span></div><div class="v31-mini-card"><strong>${missing.length}</strong><span>entri belum lengkap</span></div><div class="v31-mini-card"><strong>${a.filter(i=>daysSince(i.updatedAt||i.createdAt)>45).length}</strong><span>data >45 hari</span></div></div><div class="v31-table-wrap" style="margin-top:14px"><table class="v31-table"><thead><tr><th>Kode</th><th>Nama</th><th>Temuan</th><th>Detail</th></tr></thead><tbody>${dup.map(([k,v])=>v.map(i=>`<tr><td>${esc(i.kode)}</td><td>${esc(i.nama)}</td><td>Duplikat</td><td>${v.length} entri memakai kode ini</td></tr>`).join('')).join('')||'<tr><td colspan="4">Tidak ditemukan kode duplikat.</td></tr>'}</tbody></table></div>`;
    showOverlay('Data Quality Audit','V31 AUDITOR',body); log('Audit kualitas data',`${dup.length} duplikat, ${missing.length} belum lengkap`);
  }

  function createSnapshot(downloadIt){
    const a=items(), q=quality(), record={time:new Date().toISOString(),version:VERSION,health:q.score,items:a};
    const all=getJSON(SNAP_KEY,[]); all.unshift(record); put(SNAP_KEY,all.slice(0,20)); log('Snapshot dibuat',`${a.length} item • health ${q.score}%`);
    if(downloadIt||!downloadIt){
      const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const el=document.createElement('a');el.href=url;el.download=`INVENZA-V31-snapshot-${new Date().toISOString().slice(0,10)}.json`;el.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    renderSection(); toast('Snapshot V31 dibuat',`${a.length} item disimpan dengan health ${q.score}%.`);
  }

  function printIntelligence(){
    const a=items(),q=quality(),an=anomalies();
    const w=window.open('','_blank','noopener,noreferrer'); if(!w){toast('Popup diblokir','Izinkan popup untuk mencetak laporan.');return;}
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>INVENZA V31 Intelligence Report</title><style>body{font-family:Arial,sans-serif;padding:30px;color:#122033}h1{margin:0 0 5px}small{color:#65758b}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:20px 0}.card{border:1px solid #dce4ec;border-radius:12px;padding:14px}.num{font-size:24px;font-weight:800}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{padding:9px;border-bottom:1px solid #e5eaf0;text-align:left;font-size:12px}</style></head><body><h1>INVENZA V31 • Intelligence Report</h1><small>${new Date().toLocaleString('id-ID')} • ${a.length} jenis barang</small><div class="grid"><div class="card"><small>HEALTH</small><div class="num">${q.score}%</div></div><div class="card"><small>TOTAL UNIT</small><div class="num">${num(a.reduce((s,i)=>s+(Number(i.stok)||0),0))}</div></div><div class="card"><small>NILAI ASET</small><div class="num">${rup(q.value)}</div></div><div class="card"><small>TEMUAN</small><div class="num">${an.length}</div></div></div><h2>Signal Center</h2><table><tr><th>Jenis</th><th>Temuan</th></tr>${an.map(x=>`<tr><td>${esc(x.title)}</td><td>${esc(x.msg)}</td></tr>`).join('')||'<tr><td colspan="2">Tidak ada temuan utama.</td></tr>'}</table></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300);log('Intelligence report dicetak');
  }

  function createOrb(){
    if($('v31CommandOrb'))return;
    const b=document.createElement('button');b.id='v31CommandOrb';b.type='button';b.textContent='V31';b.title='Buka V31 Orbital Command OS';b.setAttribute('aria-label','Buka V31 Orbital Command OS');document.body.appendChild(b);b.onclick=openCommandCenter;
  }

  function openCommandCenter(){
    const q=quality(),a=items(),snap=getJSON(SNAP_KEY,[]),logs=getJSON(LOG_KEY,[]);
    const body=`<p style="color:#8ea8bf">V31 menyatukan tool generasi sebelumnya ke satu pusat kendali tanpa menghapus data inventaris.</p><div class="v31-overlay-grid"><div class="v31-mini-card"><strong>${q.score}%</strong><span>Inventory Health</span></div><div class="v31-mini-card"><strong>${a.length}</strong><span>Jenis barang</span></div><div class="v31-mini-card"><strong>${snap.length}</strong><span>Snapshot V31</span></div><div class="v31-mini-card"><strong>${logs.length}</strong><span>Aktivitas V31</span></div></div><div class="v31-actions"><button class="v31-action" data-orb="mission"><strong>◈ Mission Control</strong><small>Buka dashboard intelligence V31.</small></button><button class="v31-action" data-orb="audit"><strong>⌘ Data Quality Audit</strong><small>Cari duplikasi, data kosong, dan data lama.</small></button><button class="v31-action" data-orb="snapshot"><strong>◫ Create Snapshot</strong><small>Buat titik pemulihan dan file JSON.</small></button><button class="v31-action" data-orb="report"><strong>▧ Intelligence Report</strong><small>Buat laporan cetak V31.</small></button><button class="v31-action" data-orb="inventory"><strong>▦ Inventory</strong><small>Buka tabel barang.</small></button><button class="v31-action" data-orb="theme"><strong>◐ Theme</strong><small>Ganti mode tampilan.</small></button></div>`;
    const r=showOverlay('V31 Orbital Command','COMMAND CENTER',body);
    r.addEventListener('click',e=>{const b=e.target.closest('[data-orb]');if(!b)return;r.remove();const a=b.dataset.orb;if(a==='mission')document.querySelector('[data-section="v31Section"]')?.click();if(a==='audit')showAudit();if(a==='snapshot')createSnapshot(true);if(a==='report')printIntelligence();if(a==='inventory')document.querySelector('[data-section="inventorySection"]')?.click();if(a==='theme')document.querySelector('#themeBtn')?.click();});
  }

  function addNav(){
    const navs=[document.querySelector('#desktopNav'),document.querySelector('.drawer-nav')];
    navs.forEach(nav=>{if(!nav||nav.querySelector('[data-section="v31Section"]'))return;const b=document.createElement('button');b.type='button';b.className='nav-item';b.dataset.section='v31Section';b.innerHTML='<span class="nav-glyph">✦</span><span>V31 Command</span>';nav.appendChild(b);b.onclick=()=>{document.querySelectorAll('.page-section').forEach(s=>s.classList.toggle('active-section',s.id==='v31Section'));document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.section==='v31Section'));window.scrollTo({top:0,behavior:'smooth'});document.body.classList.remove('v26-focus-mode');document.querySelector('#mobileDrawer')?.classList.remove('open');document.querySelector('#drawerOverlay')?.classList.add('hidden');renderSection();};});
  }

  function createSplash(){
    const splash=$('splashScreen'); if(!splash||$('v31SplashLayer'))return;
    const layer=document.createElement('div');layer.id='v31SplashLayer';layer.innerHTML='<div class="v31-scan-ring"></div><div class="v31-scan-ring r2"></div><div class="v31-scan-ring r3"></div><div class="v31-splash-core"><div class="v31-splash-top"><span>INVENZA / V31</span><span id="v31SplashPct">BOOT 0%</span></div><div class="v31-splash-name">INVEN<span>ZA</span></div><div class="v31-splash-line"></div><div id="v31SplashStage" class="v31-splash-stage">Orbital Command OS • initializing</div><div class="v31-splash-code">SYS::DATA_HEALTH → SIGNAL_CENTER → COMMAND_OS → READY</div></div>';
    splash.appendChild(layer);
    const update=()=>{const bar=$('splashProgressBar');const w=parseFloat(bar?.style.width||'0')||0;const p=Math.min(100,w);$('v31SplashPct').textContent=`BOOT ${Math.round(p)}%`;const stage=$('v31SplashStage');if(stage)stage.textContent=p<25?'Mounting inventory core':p<50?'Scanning data quality':p<75?'Calibrating command systems':p<92?'Synchronizing orbital identity':'V31 COMMAND OS READY';if(p>=100){setTimeout(()=>layer.classList.add('ready'),350)}};setInterval(update,180);
  }

  function fixSplashKey(){
    // If an older V25/V30 session key exists, V31 must still get its own first-run boot.
    if(sessionStorage.getItem('invenza_splash_seen_v31'))return;
    sessionStorage.removeItem('invenza_splash_seen_v25');
    sessionStorage.removeItem('invenza_v30_splash_seen');
  }

  function boot(){
    fixSplashKey();addV31Badge();hideLegacyVisibleLayers();createSection();addNav();createOrb();createSplash();
    log('V31 aktif','Orbital Command OS initialized');
    window.addEventListener('online',()=>{toast('V31 Online','Koneksi aktif kembali.');renderSection()});
    window.addEventListener('offline',()=>{toast('V31 Offline','Mode lokal tetap dapat digunakan.');renderSection()});
    window.addEventListener('storage',e=>{if(e.key===ITEM_KEY)renderSection()});
    document.addEventListener('keydown',e=>{if(e.key==='F9'){e.preventDefault();openCommandCenter()}if(e.key==='Escape'){const o=$('v31Overlay');if(o)o.remove()}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
