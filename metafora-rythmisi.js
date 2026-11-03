/* GlenRead — τι παίρνει ο παραλήπτης «Μεταφορά στοιχείων» (metafora-lipsi.js) από την παλιά διεύθυνση
   aglentzakis-dot.github.io/GlenRead/ → glenread.glenapps.gr.
   © 2026 Ανδρέας Μ. Γλεντζάκης (Andreas M. Glentzakis). Με την επιφύλαξη παντός δικαιώματος. All rights reserved.
   ls   : μόνο τα δικά του «glenread-…» (ρυθμίσεις, γλώσσα, θέση ανάγνωσης, υπογραφή, σύνδεση Google Drive κ.λπ.)
   idb  : «glenread» (τα έγγραφα), «glenread-draft» (πρόχειρο σε εξέλιξη) και «glenapps-kleidia-glenread»
          (το κλειδί κλειδώματος των αντιγράφων στο Google Drive — χωρίς αυτό ξαναζητείται ο κωδικός)
   opfs : κανένα (το GlenRead δεν γράφει στην ιδιωτική μνήμη αρχείων)
   Ο φάκελος αντιγράφων του κινητού («shared-backups») ΔΕΝ μεταφέρεται: ξαναδιαλέγεται στη νέα διεύθυνση.
   Το κοινό «efarmoges-mas-v1» (λίστα εφαρμογών GlenApps) δεν είναι δικό του και δεν μεταφέρεται.
   exei : αν εδώ υπάρχουν ήδη έγγραφα (από τη λίστα της εφαρμογής, αλλιώς από τα ίχνη ανάγνωσης). */
window.GLEN_METAFORA={app:"glenread",onoma:"GlenRead",
  ls:["glenread-"],
  idb:["glenread","glenread-draft","glenapps-kleidia-glenread"],
  opfs:[],
  exei:function(){try{
    if(typeof docsReady!=="undefined"&&docsReady&&typeof docsCache!=="undefined"&&Array.isArray(docsCache))return docsCache.length>0;
    if(localStorage.getItem("glenread-last"))return true;
    var p=JSON.parse(localStorage.getItem("glenread-pos")||"{}");return !!p&&Object.keys(p).length>0}catch(e){return true}}};
