/* GlenRead · Εξαγωγή σε Word και Excel. Οι λίστες, οι κατάλογοι και οι πίνακες βγαίνουν ως πραγματικές στήλες,
   ώστε στο Excel να μπαίνουν φίλτρα και οι αριθμοί να μετράνε ως αριθμοί. © 2026 Ανδρέας Μ. Γλεντζάκης · GlenApps */
(function(){'use strict';
const norm=s=>String(s||'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,'');
const median=a=>{if(!a.length)return 0;const b=[...a].sort((x,y)=>x-y);return b[b.length>>1]};
const ENW={'Στήλη':'Column','Ενότητα':'Section','Σελίδα':'Page','Πίνακας':'Table','Κείμενο':'Text'};
const T=s=>{try{if(typeof EN!=='undefined'&&EN&&ENW[s])return ENW[s]}catch(e){}return s};

// ---------- 1. Γραμμές της σελίδας με τη θέση κάθε λέξης ----------
// PDF με κείμενο: οι θέσεις έρχονται από το ίδιο το αρχείο
async function pdfPageLines(pdf,i){
  const pg=await pdf.getPage(i+1),vp=pg.getViewport({scale:1}),tc=await pg.getTextContent(),W=vp.width,H=vp.height,items=[];
  for(const it of tc.items){const s=it.str;if(!s||!s.trim())continue;
    const m=pdfjsLib.Util.transform(vp.transform,it.transform),h=Math.hypot(m[2],m[3])||10,w=it.width||s.length*h*.5;
    // κομμάτια που χωρίζονται με 2+ κενά (στοίχιση με κενά) γίνονται ξεχωριστά κελιά
    const re=/\S+(?: \S+)*/g;let mm;
    while((mm=re.exec(s))){const a=m[4]+w*mm.index/s.length,b=m[4]+w*(mm.index+mm[0].length)/s.length;items.push({t:mm[0],x0:a/W,x1:b/W,y:m[5]/H,h:h/H})}}
  try{pg.cleanup()}catch(e){}
  return groupLines(items);
}
function groupLines(items){
  items.sort((a,b)=>a.y-b.y||a.x0-b.x0);const L=[];
  for(const it of items){let done=false;
    for(let k=L.length-1;k>=Math.max(0,L.length-3);k--){const l=L[k];if(Math.abs(l.y-it.y)<Math.max(l.h,it.h)*.5){l.items.push(it);done=true;break}}
    if(!done)L.push({y:it.y,h:it.h,items:[it]})}
  L.forEach(l=>l.items.sort((a,b)=>a.x0-b.x0));return L.sort((a,b)=>a.y-b.y);
}
// σκαναρισμένη σελίδα/φωτογραφία: οι θέσεις των λέξεων από την αναγνώριση
// (η αναγνώριση δίνει συχνά κάθε στήλη χωριστά: ξαναφτιάχνουμε τις γραμμές της σελίδας από το ύψος κάθε λέξης)
function ocrPageLines(p){
  const items=[];
  for(const ln of p.lines){const [t,x0,y0,x1,y1,w]=ln;if(!t||!t.trim())continue;const tk=t.trim().split(/\s+/),y=(y0+y1)/2,h=Math.max(.004,y1-y0);
    if(Array.isArray(w)&&w.length===tk.length*2)tk.forEach((s,k)=>items.push({t:s,x0:w[2*k],x1:w[2*k+1],y,h}));
    else items.push({t:t.trim(),x0,x1,y,h,whole:true})}
  return groupLines(items);
}
const lineText=l=>l.items.map(x=>x.t).join(' ');
// ίδιο κείμενο (με οποιαδήποτε σειρά); αν ο χρήστης το διόρθωσε ή το μετέφρασε, δουλεύουμε με το κείμενο όπως είναι τώρα
const chars=t=>[...norm(t)].sort().join('');
const sameText=(L,text)=>chars(L.map(lineText).join(' '))===chars(text);

// ---------- 2. Αριθμοί, ποσά, ποσοστά, ημερομηνίες ----------
function cellVal(s,gd){
  const raw=String(s==null?'':s).trim();let t=raw;if(!t)return null;if(t.length>40)return {s:raw};
  let cur=false,pct=false;
  if(/^€|(€|ευρώ|EUR)$/i.test(t)){cur=true;t=t.replace(/€|ευρώ|EUR/gi,'').trim()}else if(/%$/.test(t)){pct=true;t=t.slice(0,-1).trim()}
  // ημερομηνία: με τετραψήφιο έτος, ή 12/05/26 με κάθετες (το 01.11.11 είναι κωδικός, όχι ημερομηνία)
  const dm=t.match(/^(\d{1,2})([\/.\-])(\d{1,2})\2(\d{4})$/)||t.match(/^(\d{1,2})(\/)(\d{1,2})\/(\d{2})$/);
  if(dm&&!cur&&!pct){let d=+dm[1],m=+dm[3],y=+dm[4];if(y<100)y+=2000;if(d>=1&&d<=31&&m>=1&&m<=12)return {n:(Date.UTC(y,m-1,d)-Date.UTC(1899,11,30))/864e5,f:'d'}}
  const neg=/^[-−–]/.test(t);t=t.replace(/^[-−–+]\s?/,'');let v=null;
  if(gd){if(/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)||/^\d+(,\d+)?$/.test(t))v=+t.replace(/\./g,'').replace(',','.')}
  else if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)||/^\d+(\.\d+)?$/.test(t))v=+t.replace(/,/g,'');
  if(v===null||!isFinite(v))return {s:raw};
  // κωδικοί με μηδενικά μπροστά και πολύ μεγάλοι αριθμοί (γραμμωτοί κώδικες) μένουν κείμενο
  if((/^0\d/.test(t)&&!/^0[,.]\d/.test(t))||t.replace(/\D/g,'').length>15)return {s:raw};
  if(neg)v=-v;if(pct)return {n:v/100,f:'p'};if(cur)return {n:v,f:'c'};
  return {n:v,f:(gd?/,\d+$/:/\.\d+$/).test(t)?'f':'i'};
}
const isNum=c=>{const a=cellVal(c,true),b=cellVal(c,false);return !!((a&&a.n!=null)||(b&&b.n!=null))};
// ελληνική γραφή (1.234,50) ή αγγλική (1,234.50); αποφασίζει η πλειοψηφία
function greekDecimals(rows){let gr=0,en=0;for(const r of rows)for(const c of r){const s=String(c||'');if(/\d,\d{1,2}(?!\d)/.test(s))gr++;if(/\d\.\d{1,2}(?!\d)/.test(s)&&!/\d\.\d{1,2}\.\d/.test(s))en++}return gr>=en}

// ---------- 3. Εντοπισμός πινάκων ----------
const HEAD_KW=/^(α\/α|α\.α|αα|κωδ|περιγρ|είδος|ειδος|προϊόν|προιον|τιμή|τιμη|ποσότ|ποσοτ|τεμ|μονάδ|μοναδ|μ\.μ|σύνολο|συνολο|αξία|αξια|έκπτ|εκπτ|όνομα|ονομα|επώνυμ|επωνυμ|τηλ|κινητ|διεύθ|διευθ|πόλη|πολη|email|ημερομ|ημ\/νια|ποσό|ποσο|φπα|φ\.π\.α|κατηγ|μάρκα|μαρκα|code|sku|item|desc|product|name|price|qty|quantity|total|amount|date|unit|vat|phone|city|category|brand)/i;
const isHeadingText=t=>{t=String(t||'').trim();return t.length>0&&t.length<=60&&(/:$/.test(t)||(/\p{L}/u.test(t)&&t===t.toUpperCase()))};
function hasHeader(R){
  if(R.length<2)return false;const h=R[0],n=h.length;let hn=0,he=0;
  for(const c of h){if(!c)he++;else if(isNum(c))hn++}
  if(hn>0||he>n/2)return false;
  const dig=h.some(c=>c&&/\d/.test(c));
  for(let c=0;c<n;c++){if(!h[c])continue;let num=0,tot=0;for(let k=1;k<R.length;k++){const v=R[k][c];if(v){tot++;if(isNum(v))num++}}if(tot&&num/tot>=.6)return true}
  if(h.some(c=>c&&HEAD_KW.test(c.trim())))return true;
  return !dig&&h.every(c=>!c||(c===c.toUpperCase()&&/\p{L}/u.test(c)));
}
// προηγούμενη μικρή γραμμή που μοιάζει με επικεφαλίδα στηλών (π.χ. «Περιγραφή   Τιμή»)
function headerFromLine(t,n){
  t=String(t||'').trim();if(!t||t.length>120||/\d/.test(t))return null;
  let c=t.split(/\t| {2,}|\s*\|\s*/).filter(Boolean);if(c.length!==n)c=t.split(/\s+/);
  if(c.length!==n)return null;if(!c.some(x=>HEAD_KW.test(x))&&!c.every(x=>x===x.toUpperCase()))return null;return c;
}
// πίνακες σε σελίδα με θέσεις λέξεων: στήλες = κάθετα «κενά διαδρόμια» που περνούν από όλες τις γραμμές
function analyzePositioned(lines){
  const cws=[];lines.forEach(l=>l.items.forEach(i=>{if(!i.whole&&i.t.length>=2)cws.push((i.x1-i.x0)/i.t.length)}));const cw=median(cws)||.008;
  const segs=l=>{const S=[];for(const it of l.items){const s=S[S.length-1];if(s&&it.x0-s.x1<cw*1.6){s.t+=' '+it.t;s.x1=Math.max(s.x1,it.x1)}else S.push({t:it.t,x0:it.x0,x1:it.x1})}return S};
  const rows=lines.map(l=>({segs:segs(l)}));const seq=[];let cur=null;
  for(let k=0;k<rows.length;k++){const r=rows[k];
    if(r.segs.length>=2){if(!cur){cur={rows:[]};seq.push({tb:cur})}cur.rows.push(r);continue}
    const nx=rows[k+1];
    if(cur&&nx&&nx.segs.length>=2){r.single=true;cur.rows.push(r);continue}
    cur=null;seq.push({p:r.segs.map(s=>s.t).join(' ')})}
  const out=[];
  for(const it of seq){
    if(it.p!==undefined){out.push(it);continue}
    const tb=finishPositioned(it.tb.rows);
    if(tb)out.push({tb});else it.tb.rows.forEach(r=>out.push({p:r.segs.map(s=>s.t).join(' ')}));
  }
  return out;
}
function finishPositioned(rows){
  const data=rows.filter(r=>!r.single);if(data.length<2)return null;
  const N=500,cov=new Uint16Array(N);
  for(const r of data){const seen=new Uint8Array(N);for(const s of r.segs){const a=Math.max(0,Math.floor(s.x0*N)),b=Math.min(N-1,Math.ceil(s.x1*N));for(let i=a;i<=b;i++)if(!seen[i]){seen[i]=1;cov[i]++}}}
  const tol=data.length>=10?Math.floor(data.length*.05):0,cols=[];let st=-1;
  for(let i=0;i<=N;i++){const on=i<N&&cov[i]>tol;if(on&&st<0)st=i;if(!on&&st>=0){cols.push([st/N,i/N]);st=-1}}
  if(cols.length<2)return null;
  const colOf=x=>{let best=0,bd=1e9;cols.forEach((c,k)=>{const d=x<c[0]?c[0]-x:x>c[1]?x-c[1]:0;if(d<bd){bd=d;best=k}});return best};
  const n=cols.length,R=[];
  for(const r of rows){
    const cells=Array(n).fill('');for(const s of r.segs){const c=colOf((s.x0+s.x1)/2);cells[c]=cells[c]?cells[c]+' '+s.t:s.t}
    if(r.single){const c=cells.findIndex(Boolean),t=cells[c];const prev=R.length&&R[R.length-1];
      if(c===0&&isHeadingText(t)||!prev||prev.section!==undefined)R.push({section:t});else prev.cells[c]=prev.cells[c]?prev.cells[c]+' '+t:t;continue}
    R.push({cells})}
  // δύο στήλες με μεγάλα κείμενα = σελίδα σε δύο στήλες (εφημερίδα), όχι πίνακας
  if(n===2){const ml=k=>median(R.filter(r=>r.cells&&r.cells[k]).map(r=>r.cells[k].length));if(ml(0)>30&&ml(1)>30)return null}
  return {n,rows:R};
}
// πίνακες σε απλό κείμενο: στηλοθέτες, «|», πολλά κενά, CSV, ή γραμμές που τελειώνουν σε αριθμούς/τιμές
const NT='[-+−]?(?:€\\s?)?\\d[\\d.,]*(?:\\s?(?:€|%))?';
const TRAIL=new RegExp(`^(.*?\\p{L}.*?)\\s+(${NT}(?:\\s+${NT})*)$`,'u');
function splitLine(s){
  const t=s.trim();if(!t)return null;
  if(s.includes('\t')&&t.includes('\t'))return {m:'tab',c:s.split('\t').map(x=>x.trim())};
  if(/\S\s*\|\s*\S/.test(t))return {m:'bar',c:t.replace(/^\|\s*|\s*\|$/g,'').split('|').map(x=>x.trim())};
  if(/\S {2,}\S/.test(t))return {m:'sp',c:t.split(/ {2,}/)};
  const m=t.match(TRAIL);if(m&&m[1].length<=80)return {m:'num',c:[m[1].trim(),...m[2].replace(/\s+(€|%)/g,'$1').split(/\s+/)]};
  return null;
}
function csvSplit(line,d){const out=[];let cur='',q=false;for(let i=0;i<line.length;i++){const ch=line[i];
  if(q){if(ch==='"'){if(line[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
  else if(ch==='"')q=true;else if(ch===d){out.push(cur.trim());cur=''}else cur+=ch}out.push(cur.trim());return out}
function csvDelim(lines){
  const L=lines.filter(l=>l.trim());if(L.length<3)return null;
  for(const d of [';','\t',',']){const cnt=L.map(l=>csvSplit(l,d).length-1),m=median(cnt);if(m<1)continue;
    if(cnt.filter(c=>c===m).length/L.length>=.8){
      // κόμμα: μόνο αν δεν είναι απλώς δεκαδικοί αριθμοί
      if(d===','&&L.filter(l=>/\d,\d/.test(l)).length>L.length*.5&&!L.some(l=>l.includes('"')))continue;
      return d}}
  return null;
}
function analyzeText(lines){
  const d=csvDelim(lines);
  if(d){const R=lines.filter(l=>l.trim()).map(l=>({cells:csvSplit(l,d)}));const n=Math.max(...R.map(r=>r.cells.length));R.forEach(r=>{while(r.cells.length<n)r.cells.push('')});return [{tb:{n,rows:R,csv:true}}]}
  const sp=lines.map(splitLine),out=[];let cur=null;
  const nextSplit=k=>{for(let j=k+1;j<lines.length;j++){if(!lines[j].trim())continue;return sp[j]}return null};
  for(let k=0;k<lines.length;k++){const s=sp[k],t=lines[k].trim();
    if(s){
      if(cur&&cur.m===s.m&&(s.m!=='sp'||Math.abs(s.c.length-cur.n)<=1)){cur.n=Math.max(cur.n,s.c.length);cur.rows.push({cells:s.c});continue}
      cur={m:s.m,n:s.c.length,rows:[{cells:s.c}]};out.push({tb:cur});continue}
    if(cur&&!t){const nx=nextSplit(k);if(nx&&nx.m===cur.m)continue}
    if(cur&&t&&t.length<=80){const nx=nextSplit(k);
      if(nx&&nx.m===cur.m){const prev=cur.rows[cur.rows.length-1];if(isHeadingText(t)||!prev.cells)cur.rows.push({section:t});else prev.cells[0]=prev.cells[0]+' '+t;continue}}
    cur=null;out.push({p:lines[k]})}
  // μόνο πίνακες με τουλάχιστον 2 γραμμές
  const fin=[];
  for(const it of out){if(!it.tb){fin.push(it);continue}const data=it.tb.rows.filter(r=>r.cells);
    const need=it.tb.m==='num'?3:2;
    if(data.length<need){it.tb.rows.forEach(r=>fin.push({p:r.cells?r.cells.join(' '):r.section}));continue}
    const n=it.tb.n;data.forEach(r=>{if(it.tb.m==='num'&&r.cells.length<n){const c=r.cells;r.cells=[c[0],...Array(n-c.length).fill(''),...c.slice(1)]}while(r.cells.length<n)r.cells.push('')});
    fin.push({tb:{n,rows:it.tb.rows}})}
  return fin;
}

// ---------- 4. Ανάλυση όλου του εγγράφου ----------
async function analyze(d,opt){
  opt=opt||{};const tr=opt.translated;let pdf=null,task=null;
  if(!tr&&!d.kind&&d.pages.some(p=>!p.ocr)&&window.pdfjsLib&&opt.draftGet){
    try{const f=await opt.draftGet('file-'+d.id);if(f&&f.pdf){task=(window.pdfLoad?window.pdfLoad(f.pdf.slice(0)):pdfjsLib.getDocument({data:f.pdf.slice(0),isEvalSupported:false}));pdf=await task.promise}}catch(e){pdf=null}}
  const pages=[];
  try{
    // 1ο πέρασμα: οι γραμμές κάθε σελίδας με θέσεις (όπου υπάρχουν και το κείμενο δεν άλλαξε)
    const PL=[];
    for(let i=0;i<d.pages.length;i++){const p=d.pages[i],text=String(p.text||'');let L=null;
      if(opt.progress)opt.progress(i,d.pages.length);
      if(!tr&&Array.isArray(p.lines)&&p.lines.length){L=ocrPageLines(p);if(!sameText(L,text))L=null}
      else if(!tr&&pdf&&!p.ocr&&i<pdf.numPages){try{L=await pdfPageLines(pdf,i);if(!L.length||!sameText(L,text))L=null}catch(e){L=null}}
      PL.push(L)}
    // κεφαλίδες/υποσέλιδα που επαναλαμβάνονται σε κάθε σελίδα (τίτλος, «9/438») δεν ανήκουν στους πίνακες
    const key=l=>norm(lineText(l)).replace(/\d+/g,'#'),edge=L=>[...L.slice(0,2),...L.slice(-2)];
    const withL=PL.filter(Boolean);const cnt=new Map(),mid=new Map();
    withL.forEach(L=>{new Set(edge(L).map(key)).forEach(k=>cnt.set(k,(cnt.get(k)||0)+1));new Set(L.slice(2,-2).map(key)).forEach(k=>mid.set(k,(mid.get(k)||0)+1))});
    // (μια γραμμή δεδομένων που μοιάζει με άλλες υπάρχει και στη μέση των σελίδων — αυτή δεν πειράζεται)
    const furn=new Set([...cnt].filter(([k,c])=>k&&withL.length>=3&&c>=Math.max(3,withL.length*.5)&&(mid.get(k)||0)<withL.length*.1).map(([k])=>k));
    for(let i=0;i<d.pages.length;i++){const p=d.pages[i],text=String(p.text||'');let seq=null,L=PL[i];
      if(L&&furn.size){const ed=new Set(edge(L));L=L.filter(l=>!(ed.has(l)&&furn.has(key(l))))}
      if(L){if(L.some(l=>l.items.length>1)){seq=analyzePositioned(L);seq.pos=true}else seq=analyzeText(L.map(lineText))}
      if(!seq)seq=analyzeText(text.split('\n'));
      // επικεφαλίδα στηλών: πρώτη γραμμή του πίνακα ή η γραμμή ακριβώς πάνω του
      seq.forEach((it,k)=>{if(!it.tb)return;const tb=it.tb,data=tb.rows.filter(r=>r.cells);
        if(hasHeader(data.map(r=>r.cells))){tb.header=data[0].cells;tb.rows.splice(tb.rows.indexOf(data[0]),1)}
        else{const pr=seq[k-1];const h=pr&&pr.p!==undefined&&headerFromLine(pr.p,tb.n);if(h){tb.header=h;pr.hidden=true}}
        // σύντομη γραμμή πριν από τον πίνακα = ενότητα (π.χ. «ΤΥΡΙΑ»)
        const pr=seq[k-1];if(pr&&pr.p!==undefined&&!pr.hidden){const t=pr.p.trim();if(t&&t.length<=60)tb.pre=t}});
      pages.push(seq)}
  }finally{if(pdf||task)try{const r=(task||pdf).destroy();r&&r.catch&&r.catch(()=>{})}catch(e){}}
  // ενώνουμε πίνακες με τις ίδιες στήλες σε όλο το έγγραφο (κατάλογος σε πολλές σελίδες)
  const tables=[];let cur=null;
  pages.forEach((seq,pi)=>seq.forEach(it=>{if(!it.tb)return;const tb=it.tb;
    const sameH=(a,b)=>a&&b&&norm(a.join('|'))===norm(b.join('|'));
    if(!cur||cur.n!==tb.n||(tb.header&&cur.header&&!sameH(tb.header,cur.header))||(tb.header&&!cur.header)){cur={n:tb.n,header:tb.header||null,rows:[],pages:new Set()};tables.push(cur)}
    let sec=tb.pre||null;
    for(const r of tb.rows){if(r.section!==undefined){sec=r.section;continue}
      if(cur.header&&sameH(r.cells,cur.header))continue;cur.rows.push({cells:r.cells,sec,page:pi+1});cur.pages.add(pi+1)}}));
  return {pages,tables:tables.filter(t=>t.rows.length)};
}

// ---------- 5. Excel (.xlsx) ----------
const X=s=>String(s==null?'':s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const colL=k=>{let s='';k++;while(k){const m=(k-1)%26;s=String.fromCharCode(65+m)+s;k=(k-m-1)/26}return s};
const STY={h:1,i:0,f:2,c:3,p:4,d:5};
function sheetXml(head,rows,gd){
  const n=head.length,w=head.map(h=>String(h).length+3);
  const cell=(r,k,v,hd)=>{const ref=colL(k)+r;if(hd)return `<c r="${ref}" t="inlineStr" s="1"><is><t xml:space="preserve">${X(v)}</t></is></c>`;
    const o=cellVal(v,gd);if(!o)return '';if(o.n!=null)return `<c r="${ref}" s="${STY[o.f]}"><v>${o.n}</v></c>`;
    w[k]=Math.max(w[k],Math.min(60,o.s.length+2));return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${X(o.s)}</t></is></c>`};
  const body=rows.map((r,i)=>`<row r="${i+2}">${r.map((v,k)=>cell(i+2,k,v)).join('')}</row>`).join('');
  rows.forEach(r=>r.forEach((v,k)=>{const o=cellVal(v,gd);if(o&&o.n!=null)w[k]=Math.max(w[k],12)}));
  const last=colL(n-1)+(rows.length+1);
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><dimension ref="A1:${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/><cols>${w.map((x,k)=>`<col min="${k+1}" max="${k+1}" width="${Math.min(60,Math.max(8,x))}" customWidth="1"/>`).join('')}</cols><sheetData><row r="1">${head.map((h,k)=>cell(1,k,h,true)).join('')}</row>${body}</sheetData><autoFilter ref="A1:${last}"/><pageMargins left="0.5" right="0.5" top="0.6" bottom="0.6" header="0.3" footer="0.3"/></worksheet>`;
}
const sheetName=(s,used)=>{let b=String(s).replace(/[\[\]:*?\/\\]/g,' ').trim().slice(0,31)||'Φύλλο',n=b,k=2;while(used.has(n.toLowerCase()))n=b.slice(0,28)+' '+k++;used.add(n.toLowerCase());return n};
async function buildXlsx(an,d){
  const sheets=[],used=new Set();
  an.tables.forEach((t,ti)=>{
    let head=t.header?t.header.map((h,k)=>h||T('Στήλη')+' '+(k+1)):Array.from({length:t.n},(_,k)=>T('Στήλη')+' '+(k+1));
    const secs=new Set(t.rows.map(r=>r.sec).filter(Boolean)),withSec=secs.size>=2||(secs.size===1&&t.rows.some(r=>!r.sec)),withPg=t.pages.size>1;
    const rows=t.rows.map(r=>[...(withSec?[r.sec||'']:[]),...r.cells,...(withPg?[String(r.page)]:[])]);
    if(withSec)head=[T('Ενότητα'),...head];if(withPg)head=[...head,T('Σελίδα')];
    sheets.push({name:sheetName(an.tables.length>1?T('Πίνακας')+' '+(ti+1):T('Πίνακας'),used),head,rows,gd:greekDecimals(t.rows.map(r=>r.cells))})});
  // το υπόλοιπο κείμενο, μία γραμμή ανά σειρά (για να φιλτράρεται κι αυτό)
  const txt=[];an.pages.forEach((seq,pi)=>seq.forEach(it=>{if(it.p===undefined||it.hidden)return;String(it.p).split('\n').forEach(l=>{if(l.trim())txt.push([String(pi+1),l.trim()])})}));
  if(txt.length)sheets.push({name:sheetName(T('Κείμενο'),used),head:[T('Σελίδα'),T('Κείμενο')],rows:txt,gd:true,text:true});
  if(!sheets.length)sheets.push({name:sheetName(T('Κείμενο'),used),head:[T('Σελίδα'),T('Κείμενο')],rows:[],gd:true});
  const z=new JSZip();
  z.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((s,i)=>`<Override PartName="/xl/worksheets/sheet${i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  z.file('_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  z.file('docProps/core.xml',core(d));
  z.file('xl/workbook.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${sheets.map((s,i)=>`<sheet name="${X(s.name)}" sheetId="${i+1}" r:id="rId${i+1}"/>`).join('')}</sheets><definedNames>${sheets.map((s,i)=>`<definedName name="_xlnm._FilterDatabase" localSheetId="${i}" hidden="1">'${X(s.name).replace(/'/g,"''")}'!$A$1:$${colL(s.head.length-1)}$${s.rows.length+1}</definedName>`).join('')}</definedNames></workbook>`);
  z.file('xl/_rels/workbook.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((s,i)=>`<Relationship Id="rId${i+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i+1}.xml"/>`).join('')}<Relationship Id="rId${sheets.length+1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  z.file('xl/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFCE8C3"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFEF9F02"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`);
  sheets.forEach((s,i)=>z.file(`xl/worksheets/sheet${i+1}.xml`,sheetXml(s.head,s.rows,s.gd)));
  const blob=await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',compression:'DEFLATE'});
  return {blob,info:{tables:an.tables.length,rows:an.tables.reduce((a,t)=>a+t.rows.length,0),cols:an.tables.length?Math.max(...sheets.filter(s=>!s.text).map(s=>s.head.length)):0}};
}
function core(d){const now=new Date().toISOString().replace(/\.\d+Z$/,'Z');return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${X(d.name)}</dc:title><dc:creator>GlenRead · GlenApps</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`}

// ---------- 6. Word (.docx) ----------
const run=(t,b)=>{const parts=String(t).split('\n');return parts.map((p,i)=>(i?'<w:r><w:br/></w:r>':'')+(p?`<w:r>${b?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${X(p)}</w:t></w:r>`:'')).join('')};
const para=(t,style)=>`<w:p>${style?`<w:pPr><w:pStyle w:val="${style}"/></w:pPr>`:''}${run(t)}</w:p>`;
function tableXml(tb,gd){
  const n=tb.n,gw=Math.floor(9638/n);
  const tc=(v,hd)=>{const o=hd?null:cellVal(v,gd),right=o&&o.n!=null;return `<w:tc><w:tcPr><w:tcW w:w="${gw}" w:type="dxa"/>${hd?'<w:shd w:val="clear" w:color="auto" w:fill="FCE8C3"/>':''}</w:tcPr><w:p><w:pPr><w:spacing w:after="0"/>${right?'<w:jc w:val="right"/>':''}</w:pPr>${run(v||'',hd)}</w:p></w:tc>`};
  let rows='';if(tb.header)rows+=`<w:tr><w:trPr><w:tblHeader/></w:trPr>${tb.header.map(h=>tc(h,true)).join('')}</w:tr>`;
  for(const r of tb.rows){if(r.section!==undefined)rows+=`<w:tr><w:tc><w:tcPr><w:gridSpan w:val="${n}"/><w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${run(r.section,true)}</w:p></w:tc></w:tr>`;
    else rows+=`<w:tr>${r.cells.map(c=>tc(c)).join('')}</w:tr>`}
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblLook w:val="04A0" w:firstRow="1" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/></w:tblPr><w:tblGrid>${Array(n).fill(`<w:gridCol w:w="${gw}"/>`).join('')}</w:tblGrid>${rows}</w:tbl><w:p/>`;
}
// γραμμές σελίδας → παράγραφοι: ενώνεται μόνο η συνέχεια πρότασης (η επόμενη γραμμή ξεκινά με μικρό γράμμα)
function joinLines(L){const out=[];for(const raw of L){const l=String(raw).trim();if(!l)continue;const p=out.length?out[out.length-1]:null;
  if(p!==null&&/^\p{Ll}/u.test(l)&&!/[.!;:·»)]$/.test(p)){out[out.length-1]=/\p{L}-$/u.test(p)?p.slice(0,-1)+l:p+' '+l}else out.push(l)}return out}
async function buildDocx(an,d){
  let body=para(d.name,'Title');
  an.pages.forEach((seq,pi)=>{
    if(pi>0)body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
    let buf=[];const pos=seq.pos;const flush=()=>{if(!buf.length)return;const buf0=buf,t=buf.join('\n');buf=[];
      // κανονικό κείμενο: παράγραφοι όπως στο έγγραφο (από PDF/φωτογραφία: ενώνονται οι γραμμές της ίδιας πρότασης)
      (pos?joinLines(buf0):t.split(/\n{2,}/)).forEach(p=>{if(p.trim())body+=para(p.replace(/\s+$/,''))})};
    for(const it of seq){if(it.tb){flush();body+=tableXml(it.tb,greekDecimals(it.tb.rows.filter(r=>r.cells).map(r=>r.cells)));continue}
      if(!it.hidden)buf.push(it.p)}
    flush()});
  body+='<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
  const z=new JSZip();
  z.file('[Content_Types].xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>`);
  z.file('_rels/.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>`);
  z.file('docProps/core.xml',core(d));
  z.file('word/_rels/document.xml.rels',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  z.file('word/styles.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="el-GR" w:eastAsia="en-US" w:bidi="ar-SA"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="333333"/><w:sz w:val="36"/><w:szCs w:val="36"/></w:rPr></w:style><w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:left w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:right w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="BFBFBF"/></w:tblBorders></w:tblPr></w:style></w:styles>`);
  z.file('word/document.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${body}</w:body></w:document>`);
  const blob=await z.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
  return {blob,info:{tables:an.pages.reduce((a,s)=>a+s.filter(i=>i.tb).length,0)}};
}
window.GlenExport={analyze,buildXlsx,buildDocx,_t:{cellVal,splitLine,analyzeText,analyzePositioned,hasHeader,csvDelim}};
})();
