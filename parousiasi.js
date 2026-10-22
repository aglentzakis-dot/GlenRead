/* GlenRead · Παρουσιάσεις (PowerPoint) όπως είναι: κάθε διαφάνεια ζωγραφίζεται σε εικόνα με τα κείμενα στη θέση τους,
   τους πίνακες, τις εικόνες, τα σχήματα και τα χρώματά της. Τρέχει μόνο μέσα στο κινητό. © 2026 Ανδρέας Μ. Γλεντζάκης · GlenApps */
(function(){'use strict';
const EMU=914400,PT=12700;
const xml=s=>new DOMParser().parseFromString(s,'application/xml');
const kids=(el,name)=>el?[...el.children].filter(c=>c.localName===name):[];
const kid=(el,name)=>el?[...el.children].find(c=>c.localName===name)||null:null;
const path=(el,...names)=>{let e=el;for(const n of names){e=kid(e,n);if(!e)return null}return e};
const num=(v,d)=>{const n=parseFloat(v);return isFinite(n)?n:d};
const RID='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const rid=el=>el&&(el.getAttributeNS(RID,'embed')||el.getAttributeNS(RID,'id')||el.getAttribute('r:embed')||el.getAttribute('r:id'));
const dir=p=>p.slice(0,p.lastIndexOf('/')+1);
function resolve(base,t){if(!t)return null;if(t.startsWith('/'))return t.slice(1);const parts=(dir(base)+t).split('/'),out=[];for(const p of parts){if(p==='..')out.pop();else if(p&&p!=='.')out.push(p)}return out.join('/')}
async function rels(z,part){const f=z.file(dir(part)+'_rels/'+part.slice(part.lastIndexOf('/')+1)+'.rels');const m={};if(!f)return m;
  const d=xml(await f.async('string'));for(const r of d.getElementsByTagNameNS('*','Relationship'))m[r.getAttribute('Id')]={t:resolve(part,r.getAttribute('Target')),type:r.getAttribute('Type')||'',ext:r.getAttribute('TargetMode')==='External'};return m}

// ---------- χρώματα ----------
function hex(h){h=(h||'000000').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
function rgb2hsl([r,g,b]){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;let h=0,s=0;if(mx!==mn){const d=mx-mn;s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h/=6}return [h,s,l]}
function hsl2rgb([h,s,l]){if(!s)return [l*255,l*255,l*255];const q=l<.5?l*(1+s):l+s-l*s,p=2*l-q,f=t=>{t<0&&(t+=1);t>1&&(t-=1);return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p};return [f(h+1/3)*255,f(h)*255,f(h-1/3)*255]}
function colorOf(el,ctx){ // el: στοιχείο που περιέχει srgbClr/schemeClr/sysClr/prstClr
  if(!el)return null;const c=[...el.children].find(x=>['srgbClr','schemeClr','sysClr','prstClr','scrgbClr'].includes(x.localName));if(!c)return null;
  let rgb;if(c.localName==='srgbClr')rgb=hex(c.getAttribute('val'));else if(c.localName==='sysClr')rgb=hex(c.getAttribute('lastClr')||(c.getAttribute('val')==='window'?'FFFFFF':'000000'));
  else if(c.localName==='prstClr')rgb=hex({black:'000000',white:'FFFFFF',red:'FF0000',green:'008000',blue:'0000FF',yellow:'FFFF00',gray:'808080'}[c.getAttribute('val')]||'000000');
  else if(c.localName==='scrgbClr')rgb=['r','g','b'].map(k=>Math.round(num(c.getAttribute(k),0)/1e5*255));
  else{let v=c.getAttribute('val');if(v==='phClr'&&ctx.ph)return applyMods(ctx.ph.slice(0,3),c,ctx.ph[3]);v=(ctx.map&&ctx.map[v])||v;rgb=(ctx.theme&&ctx.theme[v])||[0,0,0]}
  return applyMods(rgb,c,1)}
function applyMods(rgb,c,a){let hsl=null;const H=()=>hsl||(hsl=rgb2hsl(rgb));
  for(const m of c.children){const v=num(m.getAttribute('val'),0)/1e5;
    if(m.localName==='lumMod'){H();hsl[2]*=v}else if(m.localName==='lumOff'){H();hsl[2]+=v}
    else if(m.localName==='tint'){if(hsl){rgb=hsl2rgb(hsl);hsl=null}rgb=rgb.map(x=>x+(255-x)*(1-v))}else if(m.localName==='shade'){if(hsl){rgb=hsl2rgb(hsl);hsl=null}rgb=rgb.map(x=>x*v)}
    else if(m.localName==='alpha')a=v}
  if(hsl){hsl[2]=Math.min(1,Math.max(0,hsl[2]));rgb=hsl2rgb(hsl)}
  return [...rgb.map(x=>Math.round(Math.min(255,Math.max(0,x)))),a]}
const css=c=>c?`rgba(${c[0]},${c[1]},${c[2]},${c[3]==null?1:c[3]})`:null;

// ---------- θέμα, διατάξεις, κύριο σχέδιο ----------
async function loadTheme(z,part){const T={},F={};if(!part||!z.file(part))return {T,F};const d=xml(await z.file(part).async('string'));
  const cs=d.getElementsByTagNameNS('*','clrScheme')[0];if(cs)for(const e of cs.children)T[e.localName]=colorOf(e,{}).slice(0,3);
  const fs=d.getElementsByTagNameNS('*','fontScheme')[0];if(fs){const mj=path(fs,'majorFont','latin'),mn=path(fs,'minorFont','latin');F.mj=mj&&mj.getAttribute('typeface');F.mn=mn&&mn.getAttribute('typeface')}
  return {T,F}}
function phOf(sp){const ph=sp&&(sp.getElementsByTagNameNS('*','ph')[0]);if(!ph)return null;return {type:ph.getAttribute('type')||'body',idx:ph.getAttribute('idx')}}
function findPh(tree,ph,byType){if(!tree||!ph)return null;const all=[...tree.getElementsByTagNameNS('*','sp')];
  const t=x=>x==='ctrTitle'?'title':x==='subTitle'?'body':x;
  if(ph.idx!=null&&!byType){const m=all.find(s=>{const p=phOf(s);return p&&p.idx===ph.idx});if(m)return m}
  return all.find(s=>{const p=phOf(s);return p&&t(p.type)===t(ph.type)})||null}

// ---------- κείμενο ----------
function fontFamily(face,F){if(!face)face=F.mn;if(face==='+mj-lt')face=F.mj;if(face==='+mn-lt')face=F.mn;
  return `${face?'"'+face.replace(/"/g,'')+'",':''}Carlito,Calibri,Roboto,"Noto Sans",Arial,sans-serif`}
// ιδιότητα παραγράφου/γραμμάτων: ψάχνει διαδοχικά (γραμμή → παράγραφος → πλαίσιο → διάταξη → κύριο → στυλ κειμένου)
function lvlPr(lst,lvl){return lst?kid(lst,'lvl'+(lvl+1)+'pPr'):null}
function textBox(c,X,Y,W,H,tx,sc,S,chain,opts){ // tx: txBody
  if(!tx)return [];const body=kid(tx,'bodyPr'),bp=n=>{for(const b of [body,...chain.map(x=>x.body)])if(b&&b.getAttribute(n)!=null)return b.getAttribute(n);return null};
  const ins={l:num(bp('lIns'),91440),t:num(bp('tIns'),45720),r:num(bp('rIns'),91440),b:num(bp('bIns'),45720)};
  const anchor=bp('anchor')||(opts&&opts.anchor)||'t',wrap=bp('wrap')!=='none';
  const fsc=(()=>{const n=body&&kid(body,'normAutofit');return n?num(n.getAttribute('fontScale'),1e5)/1e5:1})();
  const lsr=(()=>{const n=body&&kid(body,'normAutofit');return n?1-num(n.getAttribute('lnSpcReduction'),0)/1e5:1})();
  const bx=X+ins.l*sc,by=Y+ins.t*sc,bw=Math.max(4,W-(ins.l+ins.r)*sc),bh=H-(ins.t+ins.b)*sc;
  const lst=[kid(tx,'lstStyle'),...chain.map(x=>x.lst)];
  const get=(lvl,fn)=>{for(const L of lst){const p=lvlPr(L,lvl);if(p){const v=fn(p);if(v!=null)return v}}return null};
  // παράγραφοι → γραμμές
  const lines=[];let total=0,auto=0;
  for(const p of kids(tx,'p')){
    const pPr=kid(p,'pPr'),lvl=num(pPr&&pPr.getAttribute('lvl'),0);
    const pa=n=>(pPr&&pPr.getAttribute(n)!=null)?pPr.getAttribute(n):get(lvl,x=>x.getAttribute(n));
    const algn=pa('algn')||'l',marL=num(pa('marL'),0)*sc,ind=num(pa('indent'),0)*sc;
    const dR=x=>kid(x,'defRPr');
    const rp=(r,n)=>{if(r&&r.getAttribute(n)!=null)return r.getAttribute(n);const d=pPr&&dR(pPr);if(d&&d.getAttribute(n)!=null)return d.getAttribute(n);return get(lvl,x=>{const d=dR(x);return d&&d.getAttribute(n)})};
    const rc=r=>{const f=r&&kid(r,'solidFill');if(f)return colorOf(f,S);const d=pPr&&dR(pPr),df=d&&kid(d,'solidFill');if(df)return colorOf(df,S);const g=get(lvl,x=>{const d=dR(x),f=d&&kid(d,'solidFill');return f?colorOf(f,S):null});return g||S.txt||[0,0,0,1]};
    const rface=r=>{const l=r&&kid(r,'latin');if(l)return l.getAttribute('typeface');return get(lvl,x=>{const d=dR(x),l=d&&kid(d,'latin');return l&&l.getAttribute('typeface')})};
    const spc=(n)=>{const s=pPr&&kid(pPr,n)||get(lvl,x=>kid(x,n));if(!s)return null;const pts=kid(s,'spcPts'),pct=kid(s,'spcPct');return pts?{pt:num(pts.getAttribute('val'),0)/100}:pct?{pct:num(pct.getAttribute('val'),1e5)/1e5}:null};
    const lnSpc=spc('lnSpc'),spB=spc('spcBef'),spA=spc('spcAft');
    // κομμάτια κειμένου με το στυλ τους
    const segs=[];let maxSz=0;
    const add=(t,r)=>{const sz=num(rp(r,'sz'),opts&&opts.sz||1800)/100*fsc,b=rp(r,'b')==='1'||rp(r,'b')==='true',i=rp(r,'i')==='1',u=(rp(r,'u')||'none')!=='none';
      maxSz=Math.max(maxSz,sz);segs.push({t,sz,b,i,u,col:rc(r),face:fontFamily(rface(r),S.F)})};
    for(const n of p.children){if(n.localName==='r'){const t=kid(n,'t');add(t?t.textContent:'',kid(n,'rPr'))}else if(n.localName==='br')segs.push({br:1});else if(n.localName==='fld'){const t=kid(n,'t');add(t?t.textContent:'',kid(n,'rPr'))}}
    if(!maxSz){const e=kid(p,'endParaRPr');maxSz=num(e&&e.getAttribute('sz'),num(get(lvl,x=>{const d=dR(x);return d&&d.getAttribute('sz')}),opts&&opts.sz||1800))/100*fsc}
    // κουκκίδα
    const buNone=pPr&&kid(pPr,'buNone');const buC=!buNone&&(pPr&&kid(pPr,'buChar')||(!pPr||!kid(pPr,'buNone'))&&get(lvl,x=>kid(x,'buNone')?false:kid(x,'buChar')));
    const buA=!buNone&&(pPr&&kid(pPr,'buAutoNum'));
    const hasText=segs.some(s=>s.t&&s.t.trim());
    let bullet=null;if(hasText&&buC)bullet=buC.getAttribute('char')||'•';else if(hasText&&buA)bullet=(++auto)+'.';if(!buA)auto=0;
    // σπάσιμο σε γραμμές
    const pxSz=s=>s.sz*PT*sc;
    const fnt=s=>`${s.i?'italic ':''}${s.b?'700 ':''}${pxSz(s)}px ${s.face}`;
    const startX=marL,firstX=bullet?marL:marL+ind;let cur={items:[],w:0,h:0,x0:firstX},pl=[cur];
    const words=[];for(const s of segs){if(s.br){words.push({br:1});continue}const parts=String(s.t).split(/(\s+)/);for(const w of parts)if(w)words.push({t:w,s})}
    for(const w of words){if(w.br){cur={items:[],w:0,h:0,x0:startX};pl.push(cur);continue}
      c.font=fnt(w.s);const ww=c.measureText(w.t).width,lim=bw-cur.x0;
      if(wrap&&cur.items.length&&cur.w+ww>lim&&w.t.trim()){cur={items:[],w:0,h:0,x0:startX};pl.push(cur)}
      if(!cur.items.length&&!w.t.trim())continue;
      cur.items.push({t:w.t,s:w.s,w:ww});cur.w+=ww;cur.h=Math.max(cur.h,pxSz(w.s))}
    const lh0=Math.max(1,maxSz)*PT*sc;
    const before=spB?(spB.pt!=null?spB.pt*PT*sc:spB.pct*lh0):0,after=spA?(spA.pt!=null?spA.pt*PT*sc:spA.pct*lh0):0;
    total+=lines.length?before:0;
    pl.forEach((L,k)=>{const h=L.h||lh0,lh=(lnSpc?(lnSpc.pt!=null?lnSpc.pt*PT*sc:h*1.2*lnSpc.pct):h*1.2)*lsr;lines.push({L,algn,lh,h,bullet:k===0?bullet:null,marL,ind,bulletSeg:segs.find(s=>s.t)||null,y:total});total+=lh});
    total+=after}
  // κάθετη στοίχιση
  let oy=by;if(anchor==='ctr')oy=by+(bh-total)/2;else if(anchor==='b')oy=by+bh-total;
  const out=[];
  for(const ln of lines){const L=ln.L,lw=L.items.reduce((a,x)=>a+x.w,0);let x=bx+L.x0;
    if(ln.algn==='ctr')x=bx+L.x0+(bw-L.x0-lw)/2;else if(ln.algn==='r')x=bx+bw-lw;
    const base=oy+ln.y+ln.h*0.95+(ln.lh/1.2-ln.h)*0;
    if(ln.bullet&&ln.bulletSeg){const s=ln.bulletSeg;c.font=`${s.sz*PT*sc}px ${s.face}`;c.fillStyle=css(s.col);
      const bxx=ln.ind<0?bx+ln.marL+ln.ind:bx+Math.max(0,ln.marL-c.measureText(ln.bullet+' ').width);c.fillText(ln.bullet,bxx,base)}
    let txt='',x0=x;
    for(const it of L.items){const s=it.s;c.font=`${s.i?'italic ':''}${s.b?'700 ':''}${s.sz*PT*sc}px ${s.face}`;c.fillStyle=css(s.col);c.fillText(it.t,x,base);
      if(s.u){c.fillRect(x,base+2,it.w,Math.max(1,s.sz*PT*sc/14))}x+=it.w;txt+=it.t}
    if(txt.trim())out.push([txt.trim(),x0,oy+ln.y,x,oy+ln.y+ln.lh])}
  return out}

// ---------- σχήματα ----------
function shapePath(c,geom,x,y,w,h){c.beginPath();
  if(geom==='ellipse'){c.ellipse(x+w/2,y+h/2,Math.abs(w/2),Math.abs(h/2),0,0,Math.PI*2)}
  else if(geom==='roundRect'){const r=Math.min(Math.abs(w),Math.abs(h))*.1667;c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  else if(geom==='line'||geom==='straightConnector1'){c.moveTo(x,y);c.lineTo(x+w,y+h)}
  else c.rect(x,y,w,h)}
function fillOf(spPr,S,styleEl){if(spPr){if(kid(spPr,'noFill'))return null;const f=kid(spPr,'solidFill');if(f)return colorOf(f,S);if(kid(spPr,'gradFill')){const gs=spPr.getElementsByTagNameNS('*','gs')[0];return gs?colorOf(gs,S):null}}
  const fr=styleEl&&kid(styleEl,'fillRef');if(fr&&fr.getAttribute('idx')!=='0')return colorOf(fr,S);return null}
function lineOf(spPr,S,styleEl,sc){const ln=spPr&&kid(spPr,'ln');if(ln){if(kid(ln,'noFill'))return null;const f=kid(ln,'solidFill');const w=num(ln.getAttribute('w'),12700)*sc;if(f)return {c:colorOf(f,S),w}}
  const lr=styleEl&&kid(styleEl,'lnRef');if(lr&&lr.getAttribute('idx')!=='0'&&!(ln&&!kid(ln,'solidFill')&&ln.children.length&&false))return ln&&ln.getAttribute('w')?{c:colorOf(lr,S),w:num(ln.getAttribute('w'),12700)*sc}:{c:colorOf(lr,S),w:Math.max(1,12700*sc)};return null}

// ---------- πίνακες (με τα βασικά ενσωματωμένα στυλ του PowerPoint) ----------
function tableStyle(id,S){const a1=S.theme.accent1||[68,114,196];
  if(id==='{2D5ABB26-0587-4C30-8999-92F81FD0307C}')return {none:1};
  if(id==='{5940675A-B579-460E-94D1-54222C63F5DA}')return {grid:[0,0,0,1]};
  // «Μεσαίο στυλ 2 — Έμφαση 1» (η προεπιλογή του PowerPoint)
  const tint=t=>[...a1.map(x=>Math.round(x+(255-x)*(1-t))),1];
  return {head:[...a1,1],headTxt:[255,255,255,1],band1:tint(.4),band2:tint(.2),border:[255,255,255,1]}}
function drawTable(c,gf,X,Y,W,H,sc,S,lines){
  const tbl=gf.getElementsByTagNameNS('*','tbl')[0];if(!tbl)return;const tblPr=kid(tbl,'tblPr');
  const sid=tblPr&&(()=>{const e=kid(tblPr,'tableStyleId');return e?e.textContent.trim():''})();
  const st=tableStyle(sid||S.defTbl,S),firstRow=tblPr&&tblPr.getAttribute('firstRow')==='1',band=tblPr&&tblPr.getAttribute('bandRow')==='1';
  const cols=kids(kid(tbl,'tblGrid'),'gridCol').map(g=>num(g.getAttribute('w'),0)*sc);
  const rows=kids(tbl,'tr');
  // ύψος γραμμών: όσο χρειάζεται το κείμενο (μέτρηση σε κρυφό καμβά)
  const meas=document.createElement('canvas').getContext('2d');let y=Y;const hs=[];
  rows.forEach((tr,ri)=>{let h=num(tr.getAttribute('h'),0)*sc;let ci=0;
    for(const tc of kids(tr,'tc')){const span=num(tc.getAttribute('gridSpan'),1);const w=cols.slice(ci,ci+span).reduce((a,b)=>a+b,0);
      if(!tc.getAttribute('hMerge')&&!tc.getAttribute('vMerge')){const got=textBox(meas,0,0,w,1e6,kid(tc,'txBody'),sc,S,[],{sz:1800});const need=got.length?got[got.length-1][4]+45720*sc*2:0;h=Math.max(h,need)}ci+=span}
    hs.push(h)});
  rows.forEach((tr,ri)=>{let x=X,ci=0;const h=hs[ri];
    for(const tc of kids(tr,'tc')){const span=num(tc.getAttribute('gridSpan'),1),rspan=num(tc.getAttribute('rowSpan'),1);
      const w=cols.slice(ci,ci+span).reduce((a,b)=>a+b,0),hh=hs.slice(ri,ri+rspan).reduce((a,b)=>a+b,0);ci+=span;
      if(tc.getAttribute('hMerge')||tc.getAttribute('vMerge')){x+=w;continue}
      const tcPr=kid(tc,'tcPr');let fill=null;const head=firstRow&&ri===0;
      if(tcPr&&kid(tcPr,'noFill'))fill=null;else if(tcPr&&kid(tcPr,'solidFill'))fill=colorOf(kid(tcPr,'solidFill'),S);
      else if(!st.none&&!st.grid)fill=head?st.head:band?((firstRow?ri-1:ri)%2===0?st.band1:st.band2):st.band2;
      if(fill){c.fillStyle=css(fill);c.fillRect(x,y,w,hh)}
      // περιγράμματα
      const bd=(n,x1,y1,x2,y2)=>{const l=tcPr&&kid(tcPr,n);let col=st.grid||st.border||null,lw=Math.max(1,12700*sc);
        if(l){if(kid(l,'noFill'))return;const f=kid(l,'solidFill');if(f)col=colorOf(f,S);lw=Math.max(1,num(l.getAttribute('w'),12700)*sc)}
        if(!col)return;c.strokeStyle=css(col);c.lineWidth=lw;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()};
      bd('lnT',x,y,x+w,y);bd('lnB',x,y+hh,x+w,y+hh);bd('lnL',x,y,x,y+hh);bd('lnR',x+w,y,x+w,y+hh);
      const S2=Object.assign({},S,{txt:head&&st.headTxt?st.headTxt:S.txt});
      const anchor=tcPr&&tcPr.getAttribute('anchor');
      const got=textBox(c,x,y,w,hh,kid(tc,'txBody'),sc,S2,[],{sz:1800,anchor:anchor||'t'});
      lines.push(...got);x+=w}
    y+=h})}

// ---------- εικόνες ----------
async function imageOf(z,part){const f=z.file(part);if(!f)return null;const ext=(part.split('.').pop()||'').toLowerCase();
  if(!['png','jpg','jpeg','gif','bmp','webp','svg'].includes(ext))return null;
  const blob=new Blob([await f.async('uint8array')],{type:ext==='svg'?'image/svg+xml':'image/'+(ext==='jpg'?'jpeg':ext)});
  const u=URL.createObjectURL(blob);try{return await new Promise((ok,no)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=()=>ok(null);i.src=u})}finally{setTimeout(()=>URL.revokeObjectURL(u),5000)}}

// ---------- ζωγραφική ενός δέντρου σχημάτων ----------
async function drawTree(c,tree,ctx,tf,skipPh,lines){
  for(const el of tree.children){const ln=el.localName;
    if(ln==='grpSp'){const x=path(el,'grpSpPr','xfrm');let t2=tf;
      if(x){const off=kid(x,'off'),ext=kid(x,'ext'),co=kid(x,'chOff'),ce=kid(x,'chExt');
        const ox=num(off&&off.getAttribute('x'),0),oy=num(off&&off.getAttribute('y'),0),ex=num(ext&&ext.getAttribute('cx'),1),ey=num(ext&&ext.getAttribute('cy'),1);
        const cx=num(co&&co.getAttribute('x'),0),cy=num(co&&co.getAttribute('y'),0),cex=num(ce&&ce.getAttribute('cx'),ex)||1,cey=num(ce&&ce.getAttribute('cy'),ey)||1;
        const kx=ex/cex,ky=ey/cey;t2=p=>tf([ox+(p[0]-cx)*kx,oy+(p[1]-cy)*ky,p[2]*kx,p[3]*ky])}
      await drawTree(c,el,ctx,t2,skipPh,lines);continue}
    if(!['sp','pic','graphicFrame','cxnSp'].includes(ln))continue;
    const ph=phOf(el);if(skipPh&&ph)continue;
    let xf=ln==='graphicFrame'?kid(el,'xfrm'):path(el,'spPr','xfrm');
    const chain=[];
    if(ph&&ctx.layout){const l=findPh(ctx.layout,ph),m=findPh(ctx.master,ph,true);
      for(const s of [l,m])if(s){if(!xf)xf=path(s,'spPr','xfrm');const tb=kid(s,'txBody');chain.push({body:tb&&kid(tb,'bodyPr'),lst:tb&&kid(tb,'lstStyle')})}
      const ts=ctx.txStyles;const st=ph.type==='title'||ph.type==='ctrTitle'?ts.title:ts.body;chain.push({body:null,lst:st})}
    else chain.push({body:null,lst:ctx.txStyles.other});
    if(!xf)continue;const off=kid(xf,'off'),ext=kid(xf,'ext');if(!off||!ext)continue;
    const r=tf([num(off.getAttribute('x'),0),num(off.getAttribute('y'),0),num(ext.getAttribute('cx'),0),num(ext.getAttribute('cy'),0)]);
    const sc=ctx.sc,X=r[0]*sc,Y=r[1]*sc,W=r[2]*sc,H=r[3]*sc;const rot=num(xf.getAttribute('rot'),0)/60000;
    c.save();if(rot){c.translate(X+W/2,Y+H/2);c.rotate(rot*Math.PI/180);c.translate(-(X+W/2),-(Y+H/2))}
    try{
      if(ln==='pic'){const b=el.getElementsByTagNameNS('*','blip')[0],rel=ctx.rels[rid(b)];const im=rel&&await imageOf(ctx.z,rel.t);
        if(im){const sr=el.getElementsByTagNameNS('*','srcRect')[0],g=n=>num(sr&&sr.getAttribute(n),0)/1e5;const iw=im.naturalWidth,ih=im.naturalHeight;
          const sx=g('l')*iw,sy=g('t')*ih,sw=iw*(1-g('l')-g('r')),sh=ih*(1-g('t')-g('b'));if(sw>0&&sh>0)c.drawImage(im,sx,sy,sw,sh,X,Y,W,H)}}
      else if(ln==='graphicFrame'){drawTable(c,el,X,Y,W,H,sc,ctx.S,lines)}
      else{const spPr=kid(el,'spPr'),style=kid(el,'style'),geom=(()=>{const g=spPr&&kid(spPr,'prstGeom');return g?g.getAttribute('prst'):'rect'})();
        const fl=fillOf(spPr,ctx.S,style),li=lineOf(spPr,ctx.S,style,sc);
        if(fl&&geom!=='line'){shapePath(c,geom,X,Y,W,H);c.fillStyle=css(fl);c.fill()}
        if(li&&li.c){shapePath(c,geom,X,Y,W,H);c.strokeStyle=css(li.c);c.lineWidth=Math.max(1,li.w);c.stroke()}
        const fr=style&&kid(style,'fontRef');const S2=fr&&colorOf(fr,ctx.S)?Object.assign({},ctx.S,{txt:colorOf(fr,ctx.S)}):ctx.S;
        const tb=kid(el,'txBody');if(tb)lines.push(...textBox(c,X,Y,W,H,tb,sc,S2,chain,{sz:ph?(ph.type==='title'||ph.type==='ctrTitle'?4400:2800):1800,anchor:ph&&(ph.type==='title'||ph.type==='ctrTitle')?'ctr':null}))}
    }catch(e){console.warn(e)}finally{c.restore()}}}
async function drawBg(c,doc,ctx,W,H){const bg=doc&&path(doc.documentElement,'cSld','bg');if(!bg)return false;const pr=kid(bg,'bgPr'),ref=kid(bg,'bgRef');
  if(pr){const f=kid(pr,'solidFill');if(f){c.fillStyle=css(colorOf(f,ctx.S));c.fillRect(0,0,W,H);return true}
    const bf=kid(pr,'blipFill');if(bf){const b=kid(bf,'blip');const rl=ctx.bgRels[rid(b)]||ctx.rels[rid(b)];const im=rl&&await imageOf(ctx.z,rl.t);if(im){c.drawImage(im,0,0,W,H);return true}}
    const g=kid(pr,'gradFill');if(g){const gs=[...g.getElementsByTagNameNS('*','gs')];const gr=c.createLinearGradient(0,0,0,H);gs.forEach(s=>gr.addColorStop(num(s.getAttribute('pos'),0)/1e5,css(colorOf(s,ctx.S))));c.fillStyle=gr;c.fillRect(0,0,W,H);return true}}
  if(ref){const col=colorOf(ref,ctx.S);if(col){c.fillStyle=css(col);c.fillRect(0,0,W,H);return true}}return false}

// ---------- όλη η παρουσίαση ----------
async function render(buf,opt){opt=opt||{};const W=opt.width||1600;
  const z=await JSZip.loadAsync(buf);const pres=xml(await z.file('ppt/presentation.xml').async('string'));
  const ss=pres.getElementsByTagNameNS('*','sldSz')[0],SW=num(ss&&ss.getAttribute('cx'),9144000),SH=num(ss&&ss.getAttribute('cy'),6858000);
  const prels=await rels(z,'ppt/presentation.xml');
  let order=[...pres.getElementsByTagNameNS('*','sldId')].map(s=>prels[rid(s)]&&prels[rid(s)].t).filter(t=>t&&z.file(t));
  if(!order.length)order=Object.keys(z.files).filter(n=>/^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b)=>+a.match(/\d+/)[0]-+b.match(/\d+/)[0]);
  const ts=z.file('ppt/tableStyles.xml')?xml(await z.file('ppt/tableStyles.xml').async('string')):null;const defTbl=ts&&ts.documentElement.getAttribute('def');
  const sc=W/SW,H=Math.round(SH*sc);const out=[];const cache={};
  for(const part of order){
    const sd=xml(await z.file(part).async('string'));if(sd.documentElement.getAttribute('show')==='0')continue;
    const r=await rels(z,part);const lp=Object.values(r).find(x=>/slideLayout/.test(x.type));
    const L=lp&&(cache[lp.t]||(cache[lp.t]={d:xml(await z.file(lp.t).async('string')),r:await rels(z,lp.t)}));
    const mp=L&&Object.values(L.r).find(x=>/slideMaster/.test(x.type));
    const M=mp&&(cache[mp.t]||(cache[mp.t]={d:xml(await z.file(mp.t).async('string')),r:await rels(z,mp.t)}));
    const thp=M&&Object.values(M.r).find(x=>/theme/.test(x.type));const th=thp?(cache[thp.t]||(cache[thp.t]=await loadTheme(z,thp.t))):{T:{},F:{}};
    const cm=M&&M.d.getElementsByTagNameNS('*','clrMap')[0];const map={};if(cm)for(const a of cm.attributes)map[a.name]=a.value;
    const ovr=sd.getElementsByTagNameNS('*','overrideClrMapping')[0];if(ovr)for(const a of ovr.attributes)map[a.name]=a.value;
    const S={theme:th.T,map,F:th.F,txt:null,defTbl};S.txt=[...(th.T[map.tx1||'dk1']||[0,0,0]),1];
    const txS=M&&path(M.d.documentElement,'txStyles');const txStyles={title:txS&&kid(txS,'titleStyle'),body:txS&&kid(txS,'bodyStyle'),other:txS&&kid(txS,'otherStyle')};
    const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,W,H);c.textBaseline='alphabetic';
    const tree=d=>d&&path(d.documentElement,'cSld','spTree');
    const lines=[];const base={z,sc,S,txStyles,layout:L&&tree(L.d),master:M&&tree(M.d),bgRels:{}};
    // φόντο: διαφάνεια → διάταξη → κύριο σχέδιο
    if(!await drawBg(c,sd,Object.assign({},base,{rels:r}),W,H))if(!(L&&await drawBg(c,L.d,Object.assign({},base,{rels:L.r}),W,H)))M&&await drawBg(c,M.d,Object.assign({},base,{rels:M.r}),W,H);
    const id=p=>p;const showM=sd.documentElement.getAttribute('showMasterSp')!=='0';
    if(showM&&M&&(!L||L.d.documentElement.getAttribute('showMasterSp')!=='0'))await drawTree(c,tree(M.d),Object.assign({},base,{rels:M.r,layout:null}),id,true,[]);
    if(showM&&L)await drawTree(c,tree(L.d),Object.assign({},base,{rels:L.r,layout:null}),id,true,[]);
    await drawTree(c,tree(sd),Object.assign({},base,{rels:r}),id,false,lines);
    const r4=v=>Math.round(v*1e4)/1e4;
    out.push({url:cv.toDataURL('image/jpeg',.9),w:W,h:H,lines:lines.map(([t,x0,y0,x1,y1])=>[t,r4(x0/W),r4(y0/H),r4(x1/W),r4(y1/H)])});cv.width=cv.height=0;
    if(opt.progress)opt.progress(out.length,order.length)}
  return out}
window.GlenSlides={render};
})();
