const CACHE='glenread-2.9';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png','privacy.html','G-glenapps.png','antigrafa.js','efarmoges-mas.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE))));
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('diavaseto-')||k.startsWith('gdoc-')||k.startsWith('glenread-'))&&k!==CACHE&&k!=='glenread-lib'&&k!=='glenread-share').map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  // αρχεία που ήρθαν με «Κοινοποίηση → GlenRead»
  if(e.request.method==='POST'&&new URL(e.request.url).pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData();const files=fd.getAll('file').filter(f=>f&&f.size);
        const c=await caches.open('glenread-share');for(const k of await c.keys())await c.delete(k);
        for(let i=0;i<files.length;i++){const f=files[i];await c.put('shared/'+i,new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-name':encodeURIComponent(f.name||('arxeio-'+i))}}))}
        return Response.redirect('./?shared='+files.length,303);
      }catch(err){return Response.redirect('./?shared=0',303)}
    })());
    return;
  }
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
