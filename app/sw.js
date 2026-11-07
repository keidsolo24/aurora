/* v19.4: a test copy in another repository (keidsolo24.github.io/<repo>/) shares the origin with the
   main app, so its caches get their own prefix and it never deletes the main app's caches (and back). */
const NSEG = (new URL(self.registration.scope).pathname.split('/')[1] || '');
const MAINAPP = !/\.github\.io$/.test(self.location.hostname) || NSEG === 'aurora';
const PFX = MAINAPP ? 'aurora-app-' : 'aurora-' + NSEG.replace(/[^\w-]/g, '') + '-';
const CACHE = PFX + 'v19-5';
const SHELL = ['./', 'index.html', 'app.css?v=195', 'desktop.css?v=195', 'js/core.js?v=195', 'js/ui.js?v=195', 'js/screens.js?v=195', 'js/sheets.js?v=195', 'js/push.js?v=195', 'js/sync.js?v=195', 'js/spolu.js?v=195', 'js/account.js?v=195', 'js/tips.js?v=195', 'js/home19.js?v=195', 'js/beta.js?v=195', 'js/app.js?v=195', 'js/coach.js?v=195', 'js/desktop.js?v=195', 'manifest-test.webmanifest', 'manifest.webmanifest', 'logo.svg', 'sig.png', 'launch-portrait.mp4', 'launch-land.mp4', 'launch-portrait-first.jpg', 'launch-portrait-last.jpg', 'launch-land-first.jpg', 'launch-land-last.jpg', 'wall.jpg', 'wall-desk.jpg', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'tutorial-poster.jpg?v=4', 'promo-poster.jpg?v=2', 'promo-card.jpg?v=1', 'tutorial-thumb.jpg?v=4', "fonts/bricolage-grotesque-latin-700-normal.woff2","fonts/bricolage-grotesque-latin-800-normal.woff2","fonts/bricolage-grotesque-latin-ext-700-normal.woff2","fonts/bricolage-grotesque-latin-ext-800-normal.woff2","fonts/inter-latin-400-normal.woff2","fonts/inter-latin-500-normal.woff2","fonts/inter-latin-600-normal.woff2","fonts/inter-latin-700-normal.woff2","fonts/inter-latin-ext-400-normal.woff2","fonts/inter-latin-ext-500-normal.woff2","fonts/inter-latin-ext-600-normal.woff2","fonts/inter-latin-ext-700-normal.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PFX) && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  if (u.pathname.endsWith('.mp4') && !/launch-/.test(u.pathname)) return; // let video stream with range requests
  if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('index.html', cp)); return res; }).catch(() => caches.match('index.html'))); return; }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});

/* ---- notifications ---- */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: e.data ? e.data.text() : 'Aurora' }; }
  const title = d.title || 'Aurora';
  e.waitUntil(self.registration.showNotification(title, { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || d.k || undefined, data: { url: d.url || './' }, renotify: !!d.tag, timestamp: d.at || Date.now() }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './', self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    for (const c of cs) { if ('focus' in c) { c.postMessage({ type: 'open', url }); return c.focus(); } }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
