const CACHE_NAME = 'koach-v2';
const assets = ['/', '/index.html'];

// Installation du Service Worker
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(assets)));
});

// Écoute des notifications push
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Check-up KOACH 🐨";
  const options = {
    body: data.body || "C'est le moment de remplir ton petit pixel du jour !",
    icon: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Koala/3D/koala_3d.png",
    badge: "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Koala/3D/koala_3d.png"
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
