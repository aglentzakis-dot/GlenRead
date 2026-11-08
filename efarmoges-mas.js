/*
  GlenApps · «Οι εφαρμογές μας» — ΚΟΙΝΟ ΚΟΜΜΑΤΙ, έκδοση 2.0 (8/11/2026)
  © 2026 Ανδρέας Μ. Γλεντζάκης (Andreas M. Glentzakis). Με την επιφύλαξη παντός δικαιώματος. All rights reserved.
  Απαγορεύεται η αντιγραφή, τροποποίηση και διάθεση, εν όλω ή εν μέρει, χωρίς προηγούμενη γραπτή άδεια του κατόχου.

  ΠΗΓΗ ΑΛΗΘΕΙΑΣ: αποθετήριο aglentzakis-dot.github.io, αρχείο efarmoges-mas.js.
  Κάθε εφαρμογή έχει ΔΙΚΟ ΤΗΣ αντίγραφο (κανόνας αυτονομίας) — δεν φορτώνεται κώδικας από άλλη διεύθυνση.
  Αλλαγή εμφάνισης/λειτουργίας: αλλάζεις ΜΟΝΟ αυτό το αρχείο και τρέχεις το σενάριο συγχρονισμού,
  που το αντιγράφει σε κάθε εφαρμογή και ανεβάζει την έκδοσή της.
  Αλλαγή ονόματος/εικονιδίου/χρώματος/κειμένου/σειράς: αλλάζεις ΜΟΝΟ το efarmoges.json — φαίνεται αμέσως παντού.

  Ασφάλεια: σύνδεσμοι και εικονίδια γίνονται δεκτά ΜΟΝΟ από τις δικές μας διευθύνσεις (και Google Play για συνδέσμους).
  Οτιδήποτε άλλο απορρίπτεται σιωπηλά, ώστε μια αλλοιωμένη λίστα να μην μπορεί να στείλει χρήστες σε ψεύτικη σελίδα.
  Η σελίδα δεν δείχνει ποτέ τιμές ή συνδέσμους αγοράς.

  Λειτουργία Google Play: όταν η εφαρμογή ανοίγει ως εφαρμογή καταστήματος (διεύθυνση εκκίνησης με ?src=play
  ή παραπομπή android-app://), η λωρίδα δεν εμφανίζεται ποτέ και τα πλακίδια ανοίγουν μόνο τη σελίδα Google Play
  της κάθε εφαρμογής (πεδίο «play»)· όσες δεν έχουν ακόμα, δεν εμφανίζονται. EfarmogesMas.isPlay() για τις εφαρμογές
  (π.χ. να κρύβουν αγορά Pro εκτός Google Play). Κρατιέται στο sessionStorage και όχι στο localStorage, γιατί στο
  Android η εφαρμογή καταστήματος και ο περιηγητής μοιράζονται την ίδια αποθήκη — αλλιώς θα «κολλούσε» και στον περιηγητή.

  Χρήση:
    EfarmogesMas.init({app:"dromologio", isPro:()=>false, lang:()=>"el", t:(s,v)=>s, canShow:()=>true})
    EfarmogesMas.page(στοιχείο, {skip:[], self:true, intro:true, custom:{id: ()=>html}, onCount:n=>{}})
    EfarmogesMas.slot() / EfarmogesMas.mount(στοιχείο)   — η διακριτική λωρίδα (όχι μέσα σε πλαίσιο/πύλη)
*/
(function () {
  "use strict";
  var W = window;
  if (W.EfarmogesMas) return;

  var VERSION = "2.0";
  var SRC = "https://aglentzakis-dot.github.io/efarmoges.json";
  /* Αντίγραφο της λίστας τη στιγμή του συγχρονισμού — για το πρώτο άνοιγμα χωρίς ίντερνετ. */
  var BUILTIN = /*EFM_LIST*/[{"id":"dromologio","name":"Δρομολόγιο","icon":"https://aglentzakis-dot.github.io/dromologio/eikonidia/icon-192.png","text":"Πελάτες, δουλειές, υπενθυμίσεις και ταμείο για μάστορες, με διαδρομή που πιάνει τις κοντινές δουλειές.","url":"https://aglentzakis-dot.github.io/dromologio/","showIn":["*"],"active":true,"en":{"name":"Route","text":"Clients, jobs, reminders and cash book for tradespeople, with a route that picks up nearby jobs.","short":"clients, jobs, routes and cash book"},"emoji":"🗺","short":"πελάτες, δουλειές, διαδρομές και ταμείο","bg":"linear-gradient(135deg,#17324D,#2B5C8A)"},{"id":"kontamou","name":"Κοντά μου","icon":"https://aglentzakis-dot.github.io/kontamou/icon-192.png","text":"Μάστορες και συνεργάτες στον χάρτη — σε βρίσκουν οι πελάτες της περιοχής σου.","url":"https://aglentzakis-dot.github.io/kontamou/","showIn":["*"],"active":true,"en":{"name":"Near me","text":"Tradespeople and partners on the map — customers in your area find you.","short":"tradespeople and partners on the map"},"emoji":"📍","short":"μάστορες και συνεργάτες στον χάρτη","bg":"linear-gradient(135deg,#f2b632,#e8a317 60%,#d98a0b)","ink":"#1b2e45"},{"id":"tameia","name":"Ταμεία","icon":"https://aglentzakis-dot.github.io/tameia/icon-192.png","text":"Προσωπικά και εταιρεία σε ένα μέρος — με πάγια, προϋπολογισμό και αρχείο για τον λογιστή. Κοινόχρηστα: υπό κατασκευή, δωρεάν έως 3 διαμερίσματα.","url":"https://aglentzakis-dot.github.io/tameia/","showIn":["*"],"active":true,"en":{"name":"Cash books","text":"Personal and business money in one place — with fixed costs, budget and an export for your accountant. Shared building expenses: under construction, free for up to 3 apartments.","short":"personal, business, shared expenses and any cash book you want"},"emoji":"📒","short":"προσωπικά, εταιρεία, κοινόχρηστα και όσα ταμεία θέλεις","bg":"linear-gradient(135deg,#1e8449,#27ae60)"},{"id":"imerologio","name":"Ημερολόγιο","icon":"https://aglentzakis-dot.github.io/imerologio/icon-192.png","text":"Ραντεβού για κάθε επάγγελμα: οι πελάτες κλείνουν μόνοι τους, υπενθυμίσεις με μήνυμα, στατιστικά και χάρτης πελατών.","url":"https://aglentzakis-dot.github.io/imerologio/","showIn":["*"],"active":true,"en":{"name":"Calendar","text":"Appointments for every profession: clients book themselves, message reminders, statistics and a client map.","short":"your schedule in one place"},"emoji":"📅","short":"το πρόγραμμά σου σε ένα σημείο","bg":"linear-gradient(135deg,#1f5fa8,#2f80d1)"},{"id":"glenread","name":"GlenRead","icon":"https://aglentzakis-dot.github.io/GlenRead/icon-192.png","text":"Διάβασε PDF, Word και φωτογραφίες εγγράφων άνετα στο κινητό — με αναγνώριση κειμένου, σημειώσεις και υπογραφή.","url":"https://aglentzakis-dot.github.io/GlenRead/","showIn":["*"],"active":true,"en":{"name":"GlenRead","text":"Read PDFs, Word files and document photos comfortably on your phone — with text recognition, notes and signatures.","short":"read and sign PDFs"},"emoji":"📄","short":"διάβασε και υπόγραψε PDF","bg":"linear-gradient(135deg,#5b3fa8,#7c5cd6)"},{"id":"ergaleiothiki","name":"Εργαλειοθήκη","icon":"https://aglentzakis-dot.github.io/ergaleiothiki/icon-192.png","text":"Αλφάδι, μετρήσεις και υπολογισμοί υλικών για κάθε μάστορα.","url":"https://aglentzakis-dot.github.io/ergaleiothiki/","showIn":["*"],"active":true,"en":{"name":"Toolbox","text":"Spirit level, measurements and material calculators for every tradesperson.","short":"spirit level, measurements and material calculators · free"},"emoji":"🧰","short":"αλφάδι, μετρήσεις και υπολογισμοί υλικών · δωρεάν","bg":"linear-gradient(135deg,#4a5866,#8e9aa6)"},{"id":"glenscanner","name":"GlenScanner","icon":"https://aglentzakis-dot.github.io/GlenScanner/icon-192.png","text":"Σάρωσε έγγραφα με την κάμερα και κάν’ τα καθαρά PDF.","url":"https://aglentzakis-dot.github.io/GlenScanner/","showIn":["*"],"active":true,"en":{"name":"GlenScanner","text":"Scan documents with your camera and turn them into clean PDFs.","short":"scan documents into clean PDFs"},"emoji":"📷","short":"σάρωσε έγγραφα σε καθαρά PDF","bg":"linear-gradient(135deg,#0f766e,#14b8a6)"},{"id":"paraggelies","name":"Παραγγελίες","icon":"https://aglentzakis-dot.github.io/paraggelies/eikonidia/icon-192.png","text":"Οι πελάτες σου παραγγέλνουν με έναν σύνδεσμο, εσύ τα βλέπεις όλα μαζεμένα.","url":"https://aglentzakis-dot.github.io/paraggelies/","showIn":["*"],"active":true,"en":{"name":"Orders","text":"Your customers order with one link, you see everything in one place.","short":"your customers order with one Viber link"},"emoji":"🧺","short":"οι πελάτες σου παραγγέλνουν με έναν σύνδεσμο στο Viber","bg":"linear-gradient(135deg,#b4531f,#e07b39)"},{"id":"fotometra","name":"ΦωτοΜέτρα","icon":"https://fotometra.glenapps.gr/icon-192.png","text":"Σημειώσεις, ίσιες γραμμές και διαστάσεις πάνω στις φωτογραφίες σου.","url":"https://fotometra.glenapps.gr/","showIn":["*"],"active":true,"en":{"name":"PhotoMeasure","text":"Notes, straight lines and dimensions on your photos.","short":"notes and dimensions on photos"},"hideIn":["dromologio"],"emoji":"📐","short":"σημειώσεις και διαστάσεις πάνω σε φωτογραφίες","bg":"linear-gradient(135deg,#7c3aed,#c026d3 55%,#f59e0b)"},{"id":"fishiq","name":"Fish IQ","icon":"https://aglentzakis-dot.github.io/fishing-log/icon-192.png","text":"Ημερολόγιο ψαρέματος με καιρό, στατιστικά και σκορ ημέρας.","url":"https://aglentzakis-dot.github.io/fishing-log/","showIn":["*"],"active":true,"en":{"name":"Fish IQ","text":"Fishing log with weather, statistics and a daily score.","short":"fishing log"},"emoji":"🎣","short":"ημερολόγιο ψαρέματος","bg":"linear-gradient(135deg,#0e6b8c,#1aa0c8)"}]/*/EFM_LIST*/;

  var KEY = "efarmoges-mas-v1", DAY = 864e5, NO_DAYS = 60;
  var cfg = {
    app: "", src: SRC,
    isPro: function () { return false; },
    lang: function () { return (document.documentElement.lang || "el").slice(0, 2); },
    t: null, canShow: null, everyDays: 3, proEveryDays: 14, firstDays: 2, timeout: 6000, revealMs: 2500, onChange: null
  };

  var EN = {
    "Από τις εφαρμογές μας": "From our apps", "Δεν με ενδιαφέρει": "Not interested", "Άνοιγμα": "Open",
    "Κλείσιμο": "Close", "Οι εφαρμογές μας": "Our apps", "Φόρτωση…": "Loading…", "Δοκίμασε ξανά": "Try again",
    "Η λίστα δεν φορτώθηκε. Χρειάζεται σύνδεση στο διαδίκτυο.": "The list did not load. An internet connection is needed.",
    "Δεν υπάρχουν άλλες εφαρμογές προς το παρόν.": "No other apps for now.", "Είσαι εδώ": "You are here",
    "Οι εφαρμογές μας — όλα τα εργαλεία σε ένα σημείο.": "Our apps — all the tools in one place."
  };

  function lang() { try { return String(cfg.lang() || "el").slice(0, 2); } catch (e) { return "el"; } }
  function T(s, v) {
    var r = s;
    try {
      if (cfg.t) r = cfg.t(s, v);
      else { if (lang() !== "el" && EN[s]) r = EN[s]; if (v) for (var k in v) r = r.split("{" + k + "}").join(v[k]); }
    } catch (e) { r = s; }
    return r == null ? s : r;
  }
  function isPro() { try { return !!cfg.isPro(); } catch (e) { return false; } }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- Λίστα επιτρεπόμενων προελεύσεων ---------- */
  function hostOk(h, store) {
    h = String(h || "").toLowerCase();
    if (h === "glenapps.gr" || /^[a-z0-9-]+\.glenapps\.gr$/.test(h) || h === "aglentzakis-dot.github.io") return true;
    return !!store && h === "play.google.com";
  }
  function safeUrl(u, store) {
    if (typeof u !== "string" || !/^https:\/\/[^\s"'<>\\]+$/i.test(u)) return "";
    try { var x = new URL(u); return x.protocol === "https:" && !x.username && !x.password && hostOk(x.hostname, store) ? x.href : ""; }
    catch (e) { return ""; }
  }
  function safeIcon(u) {
    if (typeof u !== "string") return "";
    if (/^(\.\/|\/)?[a-z0-9_\-\/]+\.(png|jpe?g|webp|svg)$/i.test(u) && u.indexOf("..") < 0) return u;
    var s = safeUrl(u, false);
    return s && /\.(png|jpe?g|webp|svg)(\?[^\s"'<>]*)?$/i.test(s) ? s : "";
  }
  function safeBg(b) {
    b = String(b || "");
    return /^linear-gradient\(\s*\d{1,3}deg(\s*,\s*#[0-9a-fA-F]{3,8}(\s+\d{1,3}%)?){2,4}\s*\)$/.test(b) || /^#[0-9a-fA-F]{3,8}$/.test(b) ? b : "";
  }
  function safePlay(u) {
    var s = safeUrl(u, true);
    try { return s && new URL(s).hostname === "play.google.com" ? s : ""; } catch (e) { return ""; }
  }
  var PLAY_KEY = "glenapps-src-play", PLAY = false;
  function detectPlay() {
    try {
      var q = new URLSearchParams(location.search || "");
      if (q.get("src") === "play" || /^android-app:\/\//i.test(document.referrer || "")) { PLAY = true; try { sessionStorage.setItem(PLAY_KEY, "1"); } catch (e) {} }
      else { try { PLAY = sessionStorage.getItem(PLAY_KEY) === "1"; } catch (e) { PLAY = false; } }
    } catch (e) { PLAY = false; }
    return PLAY;
  }
  detectPlay();
  function safeInk(c) { c = String(c || ""); return /^#[0-9a-fA-F]{3,8}$/.test(c) ? c : ""; }

  /* Καθαρίζει τη λίστα: κρατά μόνο εγγραφές με ασφαλή σύνδεσμο. */
  function clean(raw) {
    var arr = raw && (Array.isArray(raw) ? raw : raw.apps);
    if (!Array.isArray(arr)) return null;
    var out = [];
    arr.forEach(function (a) {
      if (!a || typeof a !== "object") return;
      var id = String(a.id || "").trim(), url = safeUrl(a.url, true);
      if (!id || !a.name || !url) return;
      var c = {};
      for (var k in a) if (Object.prototype.hasOwnProperty.call(a, k)) c[k] = a[k];
      c.id = id; c.url = url; c.icon = safeIcon(a.icon); c.bg = safeBg(a.bg); c.ink = safeInk(a.ink); c.play = safePlay(a.play);
      out.push(c);
    });
    return out;
  }

  /* ---------- Τοπική κατάσταση (μόνο στη συσκευή) ---------- */
  var st = {};
  function load() { try { st = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { st = {}; } if (!st.no) st.no = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} }
  function notWanted(id) { var t = st.no[id]; if (!t) return false; if (Date.now() - t > NO_DAYS * DAY) { delete st.no[id]; save(); return false; } return true; }

  /* ---------- Φόρτωση λίστας ---------- */
  var list = null, failed = false, loading = false, waiters = [], sess = { pick: null, closed: false, shown: false }, ready = false;
  function cached() { return (st.cache && clean(st.cache.apps)) || clean(BUILTIN); }
  function fetchList(cb) {
    if (cb) waiters.push(cb);
    if (list || loading) { if (list) flush(); return; }
    loading = true; failed = false;
    var done = false, ctl = null, tm;
    function fin(v) {
      if (done) return; done = true; loading = false; clearTimeout(tm);
      if (v) { list = v; st.cache = { at: Date.now(), apps: v }; save(); } else failed = true;
      flush(); reveal(); try { cfg.onChange && cfg.onChange(); } catch (e) {}
    }
    try {
      if (typeof AbortController === "function") ctl = new AbortController();
      tm = setTimeout(function () { try { ctl && ctl.abort(); } catch (e) {} fin(null); }, cfg.timeout);
      fetch(cfg.src, { cache: "no-store", credentials: "omit", signal: ctl ? ctl.signal : void 0 })
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) { fin(clean(j)); })
        .catch(function () { fin(null); });
    } catch (e) { fin(null); }
  }
  function flush() { var w = waiters; waiters = []; w.forEach(function (f) { try { f(); } catch (e) {} }); }

  function field(a, f) {
    var l = lang();
    if (l !== "el") {
      var o = a[l] || (a.i18n && a.i18n[l]) || (l !== "en" && (a.en || (a.i18n && a.i18n.en)));
      if (o && o[f]) return o[f];
    }
    return a[f] || "";
  }
  function isSelf(a) {
    if (a.id === cfg.app) return true;
    try {
      var u = new URL(a.url);
      if (u.origin !== location.origin) return false;
      var p = location.pathname.split("/").filter(Boolean)[0] || "", q = u.pathname.split("/").filter(Boolean)[0] || "";
      return p === q;
    } catch (e) { return false; }
  }
  function visible(a, custom) {
    if (a.active === false || isSelf(a)) return false;
    if (custom && custom[a.id]) return true;
    var h = a.hideIn; if (h && (Array.isArray(h) ? h : [h]).indexOf(cfg.app) >= 0) return false;
    var s = a.showIn; if (!s || s === "*") return true;
    if (!Array.isArray(s)) s = [s];
    return s.indexOf("*") >= 0 || s.indexOf(cfg.app) >= 0;
  }

  /* ---------- Εμφάνιση πλακιδίου (όπως στο Δρομολόγιο) ---------- */
  function iconHTML(a) {
    var fb = esc(String(a.emoji || String(a.name || "?").charAt(0)).slice(0, 8));
    return '<span class="efm-ic efm-icw" aria-hidden="true"><span>' + fb + "</span>" +
      (a.icon ? '<img src="' + esc(a.icon) + '" alt="" loading="lazy">' : "") + "</span>";
  }
  function styleOf(a) {
    var s = (a.bg ? "background:" + a.bg + ";" : "") + (a.ink ? "color:" + a.ink + ";" : "");
    return s ? ' style="' + s + '"' : "";
  }
  function desc(a) { return field(a, "short") || field(a, "text"); }
  function href(a) { return PLAY ? a.play : a.url; }
  function tile(a) {
    return '<a class="efm-tile' + (a.ink ? " efm-ink" : "") + '" data-efm-id="' + esc(a.id) + '" href="' + esc(href(a)) +
      '" target="_blank" rel="noopener noreferrer" data-efm="open"' + styleOf(a) + ">" + iconHTML(a) +
      '<span class="efm-tx"><b>' + esc(field(a, "name")) + "</b>" + (desc(a) ? "<small>" + esc(desc(a)) + "</small>" : "") +
      '</span><span class="efm-arr">↗</span></a>';
  }
  function hereTile(a) {
    return '<div class="efm-tile efm-here' + (a.ink ? " efm-ink" : "") + '" data-efm-id="' + esc(a.id) + '"' + styleOf(a) + ">" + iconHTML(a) +
      '<span class="efm-tx"><b>' + esc(field(a, "name")) + "</b>" + (desc(a) ? "<small>" + esc(desc(a)) + "</small>" : "") +
      '</span><span class="efm-hb">✓ ' + esc(T("Είσαι εδώ")) + "</span></div>";
  }

  /* ---------- Σελίδα «Οι εφαρμογές μας» ---------- */
  function page(el, o) {
    if (!el) return;
    o = o || {};
    var skip = o.skip || [], custom = o.custom || null;
    function draw() {
      try {
        if (!el.isConnected) return;
        var L = list || cached();
        var head = o.intro === false ? "" : '<p class="efm-intro">' + esc(T("Οι εφαρμογές μας — όλα τα εργαλεία σε ένα σημείο.")) + "</p>";
        if (!L) {
          el.innerHTML = head + (loading ? '<p class="efm-note">' + esc(T("Φόρτωση…")) + "</p>"
            : '<p class="efm-note">' + esc(T("Η λίστα δεν φορτώθηκε. Χρειάζεται σύνδεση στο διαδίκτυο.")) +
              '</p><button type="button" class="efm-retry" data-efm="retry">' + esc(T("Δοκίμασε ξανά")) + "</button>");
          return;
        }
        var html = "", n = 0;
        L.forEach(function (a) {
          if (skip.indexOf(a.id) >= 0) return;
          if (isSelf(a)) {
            if (o.self === false || a.active === false) return;
            html += custom && custom[a.id] ? custom[a.id](a) : hereTile(a); return;
          }
          if (!visible(a, custom)) return;
          if (PLAY && !a.play && !(custom && custom[a.id])) return;
          n++;
          html += custom && custom[a.id] ? custom[a.id](a) : tile(a);
        });
        if (!html) html = '<p class="efm-note">' + esc(T("Δεν υπάρχουν άλλες εφαρμογές προς το παρόν.")) + "</p>";
        el.innerHTML = head + '<div class="efm-hub">' + html + "</div>";
        if (o.onCount) try { o.onCount(n); } catch (e) {}
      } catch (e) { el.innerHTML = ""; }
    }
    el.classList.add("efm-page");
    el.__efmDraw = draw;
    draw();
    if (!list) fetchList(draw);
  }
  function redraw() { document.querySelectorAll(".efm-page").forEach(function (e) { e.__efmDraw && e.__efmDraw(); }); }

  /* ---------- Διακριτική λωρίδα ---------- */
  function inFrame() { try { return W.top !== W.self; } catch (e) { return true; } }
  function due() {
    var now = Date.now();
    if (now - (st.first || now) < cfg.firstDays * DAY) return false;
    return now - (st.last || 0) >= (isPro() ? cfg.proEveryDays : cfg.everyDays) * DAY;
  }
  function allowed() { try { return !cfg.canShow || !!cfg.canShow(); } catch (e) { return false; } }
  function pick() {
    if (sess.pick && list && list.indexOf(sess.pick) >= 0 && !notWanted(sess.pick.id)) return sess.pick;
    var c = (list || []).filter(function (a) { return visible(a) && !notWanted(a.id); });
    if (!c.length) return null;
    var r = st.rot || 0; sess.pick = c[r % c.length]; st.rot = r + 1; return sess.pick;
  }
  function bar(a) {
    return '<div class="efm-bar" role="complementary" aria-label="' + esc(T("Από τις εφαρμογές μας")) + '" data-efm-id="' + esc(a.id) + '">' +
      '<div class="efm-top"><a class="efm-go" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer" data-efm="open">' +
      '<span class="efm-ic efm-icw efm-sm" aria-hidden="true"><span>' + esc(String(a.emoji || String(a.name).charAt(0)).slice(0, 8)) + "</span>" +
      (a.icon ? '<img src="' + esc(a.icon) + '" alt="" loading="lazy">' : "") + "</span>" +
      '<span class="efm-btx"><small>' + esc(T("Από τις εφαρμογές μας")) + "</small><b>" + esc(field(a, "name")) + "</b>" +
      (desc(a) ? "<span>" + esc(desc(a)) + "</span>" : "") + "</span></a>" +
      '<button type="button" class="efm-x" data-efm="close" aria-label="' + esc(T("Κλείσιμο")) + '">✕</button></div>' +
      '<div class="efm-acts"><button type="button" class="efm-no" data-efm="no">' + esc(T("Δεν με ενδιαφέρει")) +
      '</button><a class="efm-open" href="' + esc(a.url) + '" target="_blank" rel="noopener noreferrer" data-efm="open">' + esc(T("Άνοιγμα")) + " ↗</a></div></div>";
  }
  function barHTML() {
    if (PLAY || sess.closed || !list || !allowed() || inFrame() || (!sess.shown && !due())) return "";
    var a = pick(); if (!a) return "";
    if (!sess.shown) { sess.shown = true; st.last = Date.now(); save(); }
    return bar(a);
  }
  function slot() {
    try {
      if (PLAY || !ready || sess.closed || inFrame()) return "";
      if (list) return '<div class="efm-slot">' + barHTML() + "</div>";
      if (failed || !due() || !allowed()) return "";
      fetchList();
      return '<div class="efm-slot" data-efm-wait="' + Date.now() + '"></div>';
    } catch (e) { return ""; }
  }
  function reveal() {
    try {
      var now = Date.now();
      document.querySelectorAll(".efm-slot[data-efm-wait]").forEach(function (s) {
        var t = +s.getAttribute("data-efm-wait"); s.removeAttribute("data-efm-wait");
        if (now - t <= cfg.revealMs) s.innerHTML = barHTML();
      });
    } catch (e) {}
  }
  function mount(el) { try { if (el) el.innerHTML = slot(); } catch (e) {} }
  function removeBars() { try { document.querySelectorAll(".efm-bar").forEach(function (b) { b.remove(); }); } catch (e) {} }

  function onClick(ev) {
    var b = ev.target && ev.target.closest ? ev.target.closest("[data-efm]") : null;
    if (!b) return;
    var act = b.getAttribute("data-efm"), box = b.closest("[data-efm-id]"), id = box && box.getAttribute("data-efm-id");
    if (act === "open") return;
    ev.preventDefault(); ev.stopPropagation();
    if (act === "close") { sess.closed = true; removeBars(); }
    else if (act === "no" && id) { st.no[id] = Date.now(); save(); sess.closed = true; removeBars(); }
    else if (act === "retry") { failed = false; var pg = b.closest(".efm-page"); if (pg && pg.__efmDraw) { fetchList(pg.__efmDraw); pg.__efmDraw(); } }
    try { cfg.onChange && cfg.onChange(); } catch (e) {}
  }

  var CSS =
    ".efm-intro{margin:4px 2px 12px;font-size:14px;opacity:.8}" +
    ".efm-hub{display:flex;flex-direction:column;gap:10px}" +
    ".efm-tile{display:flex;align-items:center;gap:13px;width:100%;box-sizing:border-box;min-height:78px;margin:0;padding:14px 16px;border:0;border-radius:16px;" +
    "background:linear-gradient(135deg,#17324D,#2B5C8A);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.16);text-decoration:none;text-align:left;font:inherit}" +
    ".efm-tile:active{transform:scale(.98)}.efm-here{cursor:default}.efm-here:active{transform:none}" +
    ".efm-ic{flex:none;width:44px;height:44px;border-radius:12px;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center;font-size:24px;line-height:1}" +
    ".efm-ink .efm-ic{background:rgba(27,46,69,.14)}" +
    ".efm-icw{position:relative;overflow:hidden;font-weight:800}" +
    ".efm-icw img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:12px;background:#fff}" +
    ".efm-tx{flex:1;min-width:0;display:block}" +
    ".efm-tx b{display:block;font-size:16px;line-height:1.25}" +
    ".efm-tx small{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;font-weight:600;opacity:.85;margin-top:1px}" +
    ".efm-arr{flex:none;font-weight:800}" +
    ".efm-hb{flex:none;font-size:12px;font-weight:800;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.24)}" +
    ".efm-note{opacity:.75;font-size:14px;margin:6px 2px 12px}" +
    ".efm-retry{border:1px solid var(--line,#ccc);background:var(--card,#fff);color:inherit;border-radius:10px;padding:10px 14px;font-weight:700}" +
    ".efm-bar{margin:0 0 12px;padding:8px 8px 6px 10px;border:1px solid var(--line,#dfe4ea);border-radius:14px;background:var(--card,#fff);color:var(--ink,#1b2733);animation:efmIn .35s ease;overflow:hidden}" +
    "@keyframes efmIn{from{opacity:0;max-height:0}to{opacity:1;max-height:200px}}" +
    ".efm-top{display:flex;align-items:flex-start;gap:6px}" +
    ".efm-go{flex:1;min-width:0;display:flex;align-items:center;gap:10px;text-decoration:none;color:inherit}" +
    ".efm-sm{width:30px;height:30px;border-radius:8px;font-size:20px;background:none}.efm-sm img{border-radius:8px}" +
    ".efm-btx{min-width:0;display:flex;flex-direction:column;line-height:1.3}.efm-btx small{font-size:11px;opacity:.6}.efm-btx b{font-size:14.5px}" +
    ".efm-btx span{font-size:12.5px;opacity:.8;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}" +
    ".efm-x{flex:none;width:36px;height:36px;margin:-4px -2px 0 0;border:0;background:transparent;color:inherit;opacity:.55;font-size:16px;border-radius:50%;cursor:pointer}" +
    ".efm-acts{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px}" +
    ".efm-no{border:0;background:transparent;color:inherit;opacity:.65;font-size:12.5px;padding:8px 4px;cursor:pointer;text-decoration:underline}" +
    ".efm-open{font-size:13px;font-weight:700;text-decoration:none;color:var(--loc,var(--brand,#1f6feb));padding:8px 6px}";

  function css() {
    if (document.getElementById("efm-css")) return;
    var s = document.createElement("style"); s.id = "efm-css"; s.textContent = CSS;
    (document.head || document.documentElement).appendChild(s);
  }
  /* εικονίδιο που δεν φορτώνει → μένει το emoji/γράμμα */
  try {
    document.addEventListener("error", function (e) {
      var t = e.target;
      if (t && t.tagName === "IMG" && t.parentNode && t.parentNode.classList && t.parentNode.classList.contains("efm-icw")) t.remove();
    }, true);
  } catch (e) {}

  function init(o) {
    try {
      if (o) for (var k in o) if (o[k] !== void 0) cfg[k] = o[k];
      load();
      if (!st.first) { st.first = Date.now(); save(); }
      if (!ready) { ready = true; css(); document.addEventListener("click", onClick, true); }
      if (due()) fetchList();
    } catch (e) {}
  }
  load(); css();

  W.EfarmogesMas = {
    version: VERSION, isPlay: function () { return PLAY; }, init: init, slot: slot, mount: mount, page: page,
    _clean: clean,
    _state: function () { return { list: list, failed: failed, loading: loading, st: st, sess: sess }; },
    _reset: function () { list = null; failed = false; loading = false; sess = { pick: null, closed: false, shown: false }; load(); }
  };
  void redraw;
})();
