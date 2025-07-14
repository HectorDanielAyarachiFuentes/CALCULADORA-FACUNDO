// sw.js
const CACHE_NAME = 'calculadora-facundo-cache-v1';
const urlsToCache = [
  '/', // La raíz de tu aplicación
  '/index.html',
  '/style.css',
  '/jelly-webfont.woff2', // Tus fuentes personalizadas
  '/jelly-webfont.woff',
  '/kurzetstype_v1.4-webfont.woff2',
  '/kurzetstype_v1.4-webfont.woff',
  '/arrow_7-webfont.woff2',
  '/arrow_7-webfont.woff',
  // Si tienes archivos JavaScript adicionales:
  '/script.js', // Asume que tienes un script.js principal
  // Y tus iconos
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png'
];

// Instalar Service Worker y cachear archivos estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cacheando archivos principales');
        return cache.addAll(urlsToCache);
      })
  );
});

// Interceptar peticiones para servir desde caché (Cache First strategy)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Si el recurso está en caché, devolverlo
        if (response) {
          return response;
        }
        // Si no está en caché, ir a la red
        return fetch(event.request);
      })
  );
});

// Activar Service Worker y limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});