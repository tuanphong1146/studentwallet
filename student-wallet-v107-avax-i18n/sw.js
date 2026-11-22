// Doi V khi cap nhat app de dien thoai tai ban moi
const V = 'sw-v101';
const F = [
  './',
  'index.html',
  'bank-vault.js?v=105',
  'i18n-extra.js?v=105',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(F)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(k =>
      Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;

  const url = new URL(r.url);
  const isHtmlOrJs = r.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('.js');

  if (isHtmlOrJs) {
    e.respondWith(
      fetch(r).then(res => {
        const cp = res.clone();
        caches.open(V).then(c => c.put(r, cp));
        return res;
      }).catch(() => caches.match(r).then(h => h || (r.mode === 'navigate' ? caches.match('index.html') : undefined)))
    );
    return;
  }

  e.respondWith(
    caches.match(r).then(h =>
      h || fetch(r).then(res => {
        const cp = res.clone();
        caches.open(V).then(c => c.put(r, cp));
        return res;
      })
    )
  );
});
