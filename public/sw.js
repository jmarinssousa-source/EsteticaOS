// Deliberately minimal: this app is a live, authenticated dashboard backed
// by Supabase, so caching pages/data offline would risk showing stale or
// wrong-clinic content. The only job of this worker is to exist — Chrome
// requires an active service worker with a fetch handler before it will
// fire `beforeinstallprompt` and offer "Add to Home Screen". Every request
// still passes straight through to the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
