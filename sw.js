// Doi V khi cap nhat app de dien thoai tai ban moi
const V = 'sw-v11'; 
const F = [
  './', 
  'index.html', 
  'manifest.webmanifest', 
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
  
  // Chi xu ly cac request GET cung domain
  if (r.method !== 'GET' || !r.url.startsWith(self.location.origin)) return;

  // Chien luoc Network-first cho cac trang (Navigation)
  if (r.mode === 'navigate') {
    e.respondWith(
      fetch(r).then(res => {
        const cp = res.clone();
        caches.open(V).then(c => c.put('index.html', cp));
        return res;
      }).catch(() => caches.match('index.html'))
    );
    return;
  }

  // Chien luoc Cache-first cho tai nguyen tinh (Icons, CSS, JS...)
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