const CACHE='glenread-1.4';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png','privacy.html','antigrafa.js','efarmoges-mas.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('diavaseto-')||k.startsWith('gdoc-')||k.startsWith('glenread-'))&&k!==CACHE&&k!=='glenread-lib').map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  // δική μας σελίδα: πρώτα δίκτυο (για αναβαθμίσεις), αλλιώς αποθηκευμένη
  if(u.origin===location.origin){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(CACHE).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
    return;
  }
  // βιβλιοθήκες και λεξικά γλώσσας: αποθήκευση για χρήση χωρίς ίντερνετ
  e.respondWith(caches.open('glenread-lib').then(c=>c.match(e.request).then(r=>r||fetch(e.request).then(n=>{if(n.ok||n.type==='opaque')c.put(e.request,n.clone());return n}))));
});
