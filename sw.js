const CACHE_NAME = 'brickifm-v5';
const ASSETS = [
  './',
  './index.html',
  './install.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// 설치: 핵심 파일 캐시
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 정리
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// fetch 핸들러 (Chrome PWA 설치 필수 조건)
self.addEventListener('fetch', (e) => {
  // Firebase 등 API 요청은 캐시하지 않고 네트워크로
  if (e.request.url.includes('firestore') || 
      e.request.url.includes('googleapis') || 
      e.request.url.includes('firebasestorage') ||
      e.request.url.includes('gstatic')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 성공하면 캐시 업데이트
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => {
        // 오프라인이면 캐시에서
        return caches.match(e.request);
      })
  );
});
