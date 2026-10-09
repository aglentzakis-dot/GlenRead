const CACHE='glenread-2.23';
const CORE=['./','index.html','manifest.json','icon-192.png','icon-512.png','icon-512-maskable.png','apple-touch-icon.png','privacy.html','G-glenapps.png','antigrafa.js','efarmoges-mas.js'];
// το κοινό αρχείο της σελίδας GlenApps: αν λείπει για λίγο, η εγκατάσταση δεν πρέπει να αποτύχει
const SHARED=['/efarmoges-mas.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).then(()=>Promise.all(SHARED.map(u=>c.add(u).catch(()=>{})))))));
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>(k.startsWith('diavaseto-')||k.startsWith('gdoc-')||k.startsWith('glenread-'))&&k!==CACHE&&k!=='glenread-lib'&&k!=='glenread-share').map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const timeout=(p,ms)=>Promise.race([p,new Promise((_,j)=>setTimeout(()=>j(new Error('timeout')),ms))]);
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // αρχεία (ή κείμενο) που ήρθαν με «Κοινοποίηση → GlenRead»
  if(e.request.method==='POST'&&u.pathname.endsWith('/share-target')){
    e.respondWith((async()=>{
      try{
        const fd=await e.request.formData();const files=fd.getAll('file').filter(f=>f&&f.size);
        if(!files.length){const t=[fd.get('title'),fd.get('text'),fd.get('url')].filter(x=>typeof x==='string'&&x.trim()).join('\n\n');
          if(t)files.push(new File([t],'Κείμενο.txt',{type:'text/plain'}))}
        const c=await caches.open('glenread-share');for(const k of await c.keys())await c.delete(k);
        for(let i=0;i<files.length;i++){const f=files[i];await c.put('shared/'+i,new Response(f,{headers:{'content-type':f.type||'application/octet-stream','x-name':encodeURIComponent(f.name||('arxeio-'+i))}}))}
        return Response.redirect('./?shared='+files.length,303);
      }catch(err){return Response.redirect('./?shared=0',303)}
    })());
    return;
  }
  if(e.request.method!=='GET')return;
  // δική μας σελίδα: πρώτα δίκτυο (για αναβαθμίσεις), αλλιώς αποθηκευμένη· με όριο χρόνου για αδύναμο σήμα
  if(u.origin===location.origin){
    const nav=e.request.mode==='navigate';
    const key=u.origin+(u.pathname.endsWith('/')?u.pathname+'index.html':u.pathname);
    const ms=nav?5000:u.pathname==='/efarmoges-mas.js'?4000:10000;
    e.respondWith(timeout(fetch(e.request),ms).then(r=>{
      // κρατάμε μόνο σωστές απαντήσεις (όχι 404/500 την ώρα που ανεβαίνει νέα έκδοση)
      if(r.ok&&r.type==='basic'){const c=r.clone();caches.open(CACHE).then(x=>x.put(key,c)).catch(()=>{})}
      return r;
    }).catch(()=>caches.match(key,{ignoreSearch:true}).then(r=>r||(nav?caches.match('index.html'):null)).then(r=>r||Response.error())));
    return;
  }
  // βιβλιοθήκες και λεξικά γλώσσας: από την αποθήκευση (για χρήση χωρίς ίντερνετ),
  // και για τα σενάρια ανανέωση στο παρασκήνιο, ώστε μια κακή απάντηση (π.χ. Wi-Fi ξενοδοχείου) να διορθώνεται μόνη της
  e.respondWith(caches.open('glenread-lib').then(c=>c.match(e.request).then(r=>{
    const net=()=>fetch(e.request).then(n=>{if(n.ok||n.type==='opaque')c.put(e.request,n.clone()).catch(()=>{});return n});
    if(r){if(/\.js(\?|$)/.test(u.pathname))e.waitUntil(net().catch(()=>{}));return r}
    return net();
  })));
});
