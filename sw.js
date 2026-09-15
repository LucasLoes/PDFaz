/**
 * PDFaz - Service Worker para Funcionamento 100% Offline & PWA
 * Versão do Cache: v2.3.1
 */

const CACHE_NAME = 'pdfaz-pwa-v2.3.1';

// Arquivos e bibliotecas para pré-cache obrigatório (apenas URLs canônicas)
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './politica-privacidade',
  './termos-de-uso',
  './lgpd',
  './css/style.css',
  './js/app.js',
  './js/sw-register.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/screenshot-desktop.png',
  './icons/screenshot-mobile.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Instalação do Service Worker & Pré-cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[Service Worker] Falha ao pré-carregar:', url, err);
        }))
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Ativação do Service Worker & Limpeza imediata de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Estratégia de Fetch
self.addEventListener('fetch', event => {
  // Apenas métodos GET são tratados
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // CDNs e fontes externas permitidas
  const isCdn = url.hostname.includes('cdnjs.cloudflare.com') || 
                url.hostname.includes('fonts.googleapis.com') || 
                url.hostname.includes('fonts.gstatic.com');

  const isOurOrigin = url.origin === self.location.origin;

  // Se não for da nossa origem e não for um CDN do PDFaz, não intercepta (ex: extensões, antivírus local, etc.)
  if (!isOurOrigin && !isCdn) {
    return;
  }

  // 1. Navegação de páginas HTML: Network-First com fallback para cache offline
  // Isso garante que novos deploys e URLs limpas sejam carregados imediatamente
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Se estiver offline, busca no cache a página requisitada ou index.html
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          return caches.match('./index.html');
        });
      })
    );
    return;
  }

  // 2. CDNs e fontes externas: Cache-First

  if (isCdn) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Recursos estáticos locais (CSS, JS, imagens, ícones): Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(err => {
        if (cachedResponse) return cachedResponse;
        throw err;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// Permite forçar ativação de nova versão via mensagem
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
