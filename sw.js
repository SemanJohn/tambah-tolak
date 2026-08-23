// sw.js — Permainan Tambah Ceria
// PENTING: tukar CACHE_VERSION setiap kali index.html dikemas kini.
const CACHE_VERSION = 'v1.9';
const CACHE_NAME = `tambah-ceria-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  './',
  './index.html'
];

// Pasang: simpan fail asas, terus sedia untuk ambil alih
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('Precache gagal:', err))
  );
});

// Aktif: buang semua cache versi lama
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('tambah-ceria-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Terima kedua-dua format mesej supaya SW baharu tidak tersangkut
self.addEventListener('message', (event) => {
  const data = event.data;
  if (data === 'SKIP_WAITING' || (data && data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  // Dokumen (index.html): rangkaian dahulu, cache sebagai sandaran offline.
  // Ini yang memastikan murid sentiasa dapat versi terbaharu bila ada internet.
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Aset lain: cache dahulu, kemudian rangkaian
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
