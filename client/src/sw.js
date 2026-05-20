import { precacheAndRoute } from 'workbox-precaching';

// Inject precached assets compiled by Vite during the build
precacheAndRoute(self.__WB_MANIFEST || []);

const CACHE_VERSION = 'laura-v1';
const CACHE_ASSETS = 'laura-assets-v1';
const CACHE_API = 'laura-api-v1';

const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

const ASSET_EXTENSIONS = ['.js', '.css', '.woff', '.woff2', '.ttf', '.svg', '.png', '.jpg', '.jpeg', '.gif'];

// ========================================
// INSTALLATION
// ========================================

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_ASSETS).then((cache) => {
      return cache.addAll(CRITICAL_ASSETS).catch((err) => {
        console.warn('[SW] Failed to cache critical assets:', err);
      });
    })
  );
  
  self.skipWaiting();
});

// ========================================
// ACTIVATION
// ========================================

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            cacheName !== CACHE_ASSETS &&
            cacheName !== CACHE_API &&
            cacheName !== CACHE_VERSION &&
            !cacheName.startsWith('workbox-')
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// ========================================
// FETCH - NETWORK STRATEGIES
// ========================================

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extensions
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // API calls: Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    return event.respondWith(networkFirstStrategy(request));
  }
  
  // Assets (CSS, JS, images): Cache first, fallback to network
  if (isAsset(url.pathname)) {
    return event.respondWith(cacheFirstStrategy(request));
  }
  
  // HTML pages: Network first, fallback to cache, then offline fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    return event.respondWith(networkFirstStrategy(request));
  }
  
  event.respondWith(networkFirstStrategy(request));
});

// ========================================
// CACHE STRATEGIES
// ========================================

async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_API);
  
  try {
    const response = await fetch(request);
    
    if (response.ok || response.status === 404) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    
    if (request.headers.get('accept')?.includes('text/html')) {
      return new Response('Mode hors-ligne - page non disponible', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
      });
    }
    
    return new Response('Network error', {
      status: 408,
      statusText: 'Request Timeout',
      headers: new Headers({ 'Content-Type': 'text/plain' })
    });
  }
}

async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_ASSETS);
  
  try {
    const cached = await cache.match(request);
    if (cached) {
      updateCacheInBackground(request, cache);
      return cached;
    }
    
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('[SW] Cache miss and network failed:', request.url);
    
    return new Response('Asset non disponible hors-ligne', {
      status: 503,
      headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
    });
  }
}

async function updateCacheInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    console.log('[SW] Background update failed:', request.url);
  }
}

function isAsset(pathname) {
  return ASSET_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

// ========================================
// BACKGROUND SYNC
// ========================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  try {
    const response = await fetch('/api/progress/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('[SW] Progress synced successfully');
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error;
  }
}

// ========================================
// PUSH NOTIFICATIONS
// ========================================

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Nouvelle notification LAURA',
    icon: '/icon.png',
    badge: '/icon.png',
    tag: data.tag || 'notification',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'open',
        title: 'Ouvrir'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'LAURA', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ========================================
// MESSAGE HANDLING (from clients)
// ========================================

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const { type, payload } = event.data;
  
  console.log('[SW] Message received:', type);
  
  switch (type) {
    case 'CLEAR_CACHE':
      handleClearCache(payload);
      break;
    case 'CACHE_URLS':
      handleCacheUrls(payload);
      break;
    case 'GET_CACHE_SIZE':
      handleGetCacheSize(event.ports[0]);
      break;
    default:
      console.warn('[SW] Unknown message type:', type);
  }
});

async function handleClearCache(cacheName) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('[SW] Cache cleared:', cacheName);
    } else {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
      console.log('[SW] All caches cleared');
    }
  } catch (error) {
    console.error('[SW] Cache clear failed:', error);
  }
}

async function handleCacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_ASSETS);
    await cache.addAll(urls);
    console.log('[SW] URLs cached:', urls.length);
  } catch (error) {
    console.error('[SW] URL caching failed:', error);
  }
}

async function handleGetCacheSize(port) {
  try {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const name of cacheNames) {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      for (const request of keys) {
        const response = await cache.match(request);
        if (response) {
          const blob = await response.blob();
          totalSize += blob.size;
        }
      }
    }
    
    port.postMessage({ type: 'CACHE_SIZE', size: totalSize });
  } catch (error) {
    console.error('[SW] Cache size calculation failed:', error);
    port.postMessage({ type: 'ERROR', error: error.message });
  }
}
