'use strict';
const PREFIX='takken2026-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'c4b02743842d';
const FILES=['./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png'];
const URLS=FILES.map(p=>new URL(p,self.registration.scope).href);
const ROOT=new URL('./',self.registration.scope).href;
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{await cache.addAll(URLS);await self.skipWaiting()}catch(e){await caches.delete(CACHE);throw e}})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith(PREFIX)&&name!==CACHE)await caches.delete(name);await self.clients.claim()})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 url.search='';url.hash='';let key=url.href;if(key===ROOT)key=URLS[0];if(!URLS.includes(key))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);const stored=await cache.match(key);if(stored)return stored;return fetch(request)})());
});
