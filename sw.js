const CACHE_NAME = 'emotion-iceberg-v1';
const ASSETS = [
  '/emotion-iceberg/',
  '/emotion-iceberg/index.html',
  '/emotion-iceberg/css/style.css',
  '/emotion-iceberg/js/app.js',
  '/emotion-iceberg/js/i18n.js',
  '/emotion-iceberg/js/locales/ko.json',
  '/emotion-iceberg/js/locales/en.json',
  '/emotion-iceberg/js/locales/ja.json',
  '/emotion-iceberg/js/locales/zh.json',
  '/emotion-iceberg/js/locales/hi.json',
  '/emotion-iceberg/js/locales/ru.json',
  '/emotion-iceberg/js/locales/es.json',
  '/emotion-iceberg/js/locales/pt.json',
  '/emotion-iceberg/js/locales/id.json',
  '/emotion-iceberg/js/locales/tr.json',
  '/emotion-iceberg/js/locales/de.json',
  '/emotion-iceberg/js/locales/fr.json',
  '/emotion-iceberg/manifest.json',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (!event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.status === 200) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
