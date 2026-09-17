const CACHE_NAME = 'invenza-v31';
const APP_SHELL = [
  './', './index.html', './style.css', './app.js', './v20.css', './v20.js', './v25.css', './v25.js', './v26.css', './v26.js', './v30.css', './v31.css', './v30.js', './v31.js', './manifest.json', './icon-192.png', './icon-512.png', './placeholder.png'
];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { const copy=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,copy)); return res; }).catch(()=>caches.match('./index.html'))));
});
