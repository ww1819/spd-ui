/* 最小 Service Worker：满足 Chrome 可安装条件，用于桌面快捷方式 */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  /* 不拦截，全部走网络 */
});
