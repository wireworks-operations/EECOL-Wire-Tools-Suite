/**
 * EECOL Wire Tools Suite - Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_NAME = 'eecol-tools-v0.8.0.4';
const STATIC_CACHE = 'eecol-static-v0.8.0.4';
const DYNAMIC_CACHE = 'eecol-dynamic-v0.8.0.4';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/src/assets/css/eecol-theme.css',
  '/src/assets/js/index.js',
  '/src/core/database/indexeddb.js'
];

// Pages that should be cached for offline access
const PAGE_CACHE = [
  '/src/pages/index/',
  '/src/pages/cutting-records/cutting-records.html',
  '/inventory-records.html'
];

// Install event - cache core assets
self.addEventListener('install', (event) => {
  console.log('🛠️ Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name =>
          name !== STATIC_CACHE &&
          name !== DYNAMIC_CACHE
        ).map(name => caches.delete(name))
      );
    }).then(() => {
      console.log('✅ Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different request types
  if (request.method !== 'GET') return;

  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Static assets - cache first
  if (STATIC_ASSETS.includes(url.pathname) ||
      url.hostname.includes('cdn.') ||
      url.hostname.includes('fonts.googleapis.com')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages - network first, fallback to cache
  event.respondWith(networkFirst(request));
});

// Cache first strategy for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.warn('⚠️ Cache-first failed:', error);
    return new Response('Offline - Content unavailable', { status: 503 });
  }
}

// Network first strategy for dynamic content
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('🌐 Network failed, trying cache for:', request.url);

    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('📦 Served from cache:', request.url);
      return cachedResponse;
    }

    // Neither network nor cache work
    return new Response(`
      <html>
        <head><title>Offline - EECOL Tools</title></head>
        <body style="background: linear-gradient(to bottom, #0058B3 20%, white 80%); padding: 20px; text-align: center; font-family: Arial;">
          <h1 style="color: white; font-size: 2em;">Offline Mode</h1>
          <p style="color: #0058B3; font-size: 1.2em;">This content is currently unavailable offline.</p>
          <p>Check your internet connection and try again.</p>
          <button onclick="location.reload()" style="background: #0058B3; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">Retry</button>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// Background sync for offline cutting records
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cutting-records') {
    event.waitUntil(syncCuttingRecords());
  }
});

async function syncCuttingRecords() {
  try {
    console.log('🔄 Background syncing cutting records...');

    // Check if we have an instance of IndexDB in the main thread
    const clients = await self.clients.matchAll();
    for (const client of clients) {
      client.postMessage({
        type: 'SYNC_CUTTING_RECORDS',
        timestamp: Date.now()
      });
    }

    console.log('✅ Background sync requested');
  } catch (error) {
    console.error('❌ Background sync failed:', error);
  }
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from EECOL Tools',
      icon: '/src/assets/icons/icon-192.png',
      badge: '/src/assets/icons/icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.id || 1
      },
      actions: [{
        action: 'explore',
        title: 'View'
      }]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'EECOL Tools',
        options
      )
    );
  }
});

// Background sync for forming network connections
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Trigger P2P connection attempts
      Promise.resolve()
    );
  }
});
