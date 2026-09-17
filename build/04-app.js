/* ══════════════════════════════════════════════════════════
   Everything about this party lives in one object. Change a
   field here and the header, the ticket, the countdown, the
   directions link and the calendar link all follow.
   ══════════════════════════════════════════════════════════ */
window.EVENT = {
  name:      "Rishaan Vineesh",
  tagline:   "One year, so loved",
  startISO:  "2026-09-25T18:00:00+05:30",
  endISO:    "2026-09-25T22:00:00+05:30",
  dateLabel: "Friday, 25 September 2026",
  dateShort: "Fri 25 Sep 2026",
  timeLabel: "From 6:00 in the evening",
  timeShort: "6 pm onwards",
  venue:     "The Locus",
  address:   "Punnapra, Alappuzha, Kerala",
  hosts:     "Rishaan's Family",
  whatsapp:  "919400000000",
  /* geo: "9.4603,76.3319"  <- paste "lat,lng" from a Google Maps pin and the
     directions link becomes an exact route instead of a name search */
  geo:       "",
  calTitle:  "Rishaan Turns One",
  calNote:   "Rishaan's first birthday. Doors open from 6 in the evening - come when you can, stay as long as you like."
};

/* ── the two outbound actions, in one place ─────────────── */
window.INVITE = (function(){
  var E = window.EVENT;
  var where = E.venue + ", " + E.address;
  var pad = function(n){ return String(n).padStart(2, "0"); };
  function utc(d){
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
           pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z";
  }
  return {
    where: where,
    /* "dir" asks Google to geocode the destination into one exact point, and
       on a name it cannot match it picks the wrong one. Only a coordinate is
       safe to route to; a name goes to "search", which shows the place. */
    map: function(){
      return E.geo
        ? "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(E.geo)
        : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(where);
    },
    gcal: function(){
      var st = new Date(E.startISO), en = new Date(E.endISO);
      return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
             "&text=" + encodeURIComponent(E.calTitle) +
             "&dates=" + utc(st) + "/" + utc(en) +
             "&details=" + encodeURIComponent(E.calNote) +
             "&location=" + encodeURIComponent(where);
    }
  };
})();

(function(){
  "use strict";
  var E = window.EVENT, ART = window.ART, IV = window.INVITE;
  var $ = function(id){ return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var set = function(id, v){ var el = $(id); if (el) el.textContent = v; };
  var root = document.documentElement;

  /* ── artwork: one decoded copy, several placements ───── */
  [["gCarImg",ART.car],["iCar",ART.car],
   ["lElephS",ART.eleph],["lEleph2",ART.eleph],["lAvatar",ART.head]
   /* parked with the "Meet the birthday boy" section:
   ,["lRacer1",ART.racer1],["lWv1",ART.wave1],["lWv2",ART.wave2],["lWv3",ART.wave3] */
  ].forEach(function(p){ var el = $(p[0]); if (el){ el.src = p[1]; el.decoding = "async"; } });

  /* ══════════════════════════════════════════════════════
     THE INVITATION
     ══════════════════════════════════════════════════════ */
  var dot = '<span>&#9670;</span>';
  $("lFacts").innerHTML = "<b>"+E.dateShort+"</b>"+dot+"<b>"+E.timeShort+"</b>"+dot+"<b>"+E.venue+"</b>";
  set("lHosts", E.hosts);

  var st = new Date(E.startISO);
  var TZ = { timeZone:"Asia/Kolkata" };
  function fmt(opts){
    try { return new Intl.DateTimeFormat("en-GB", Object.assign({}, TZ, opts)).format(st); }
    catch(err){ return ""; }
  }
  set("tDay", fmt({ day:"numeric" }) || "25");
  set("tWeekday", fmt({ weekday:"long" }) || "Friday");
  set("tMonth", (fmt({ month:"long" }) + " " + fmt({ year:"numeric" })).trim());
  set("tTime", E.timeLabel);
  set("tVenue", E.venue);
  set("tAddr", E.address);
  set("lFoot", E.name + " · First Birthday · " + (fmt({ year:"numeric" }) || "2026"));

  $("lMap").href = IV.map();
  $("lCal").href = IV.gcal();
  $("lWa").href  = "https://wa.me/" + E.whatsapp + "?text=" +
    encodeURIComponent("We'll be there for " + E.name + "'s first birthday!");

  /* ── countdown ───────────────────────────────────────── */
  var els = { d:$("cd-d"), h:$("cd-h"), m:$("cd-m"), s:$("cd-s") };
  function pad(n){ return String(n).padStart(2,"0"); }
  function beat(){
    var gap = st.getTime() - Date.now();
    if (gap <= 0){ $("lClock").innerHTML = '<p class="done">Today is the day</p>'; return false; }
    var v = Math.floor(gap/1000);
    els.d.textContent = pad(Math.floor(v/86400));
    els.h.textContent = pad(Math.floor(v/3600)%24);
    els.m.textContent = pad(Math.floor(v/60)%60);
    els.s.textContent = pad(v%60);
    return true;
  }
  if (beat()) { var tick = setInterval(function(){ if (!beat()) clearInterval(tick); }, 1000); }

  /* ── his note: it lands, he types it, then it winks ──── */
  function playNote(){
    var note = $("lNote"), p = note && note.querySelector("p");
    if (!note || !p || note.dataset.done) return;
    note.dataset.done = "1";
    if (reduce){ note.classList.add("in","typed"); return; }
    var words = p.textContent.trim().split(/\s+/);
    p.textContent = "";
    words.forEach(function(w, i){
      var s = document.createElement("span");
      s.className = "w"; s.style.setProperty("--i", i); s.textContent = w;
      p.appendChild(s);
      if (i < words.length - 1) p.appendChild(document.createTextNode(" "));
    });
    setTimeout(function(){ note.classList.add("in"); }, 520);
    setTimeout(function(){ note.classList.add("typed"); }, 1420);
    setTimeout(function(){ note.classList.add("live"); }, 1420 + words.length * 55 + 620);
  }

  /* ── reveal, from a visible resting state ────────────── */
  function startReveals(){
    if (reduce || !("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function(en){
      en.forEach(function(x){ if (x.isIntersecting){ x.target.classList.remove("hid"); io.unobserve(x.target); } });
    }, { rootMargin:"0px 0px -8% 0px" });
    document.querySelectorAll("[data-rev]").forEach(function(el){
      if (el.getBoundingClientRect().top > innerHeight * 0.55){ el.classList.add("hid"); io.observe(el); }
    });
  }

  /* ══════════════════════════════════════════════════════
     THE GATE — he drives for five seconds, then the cover
     lifts away and the invitation is underneath.

     The car never moves horizontally. The world moves past
     it, every band at its own fraction of one shared
     distance, which is what makes the depth read.
     ══════════════════════════════════════════════════════ */
  var gate = $("gate"), invite = $("invite");
  if (!gate) return;
  invite.setAttribute("inert", "");

  var scene = $("gScene");
  var V = 640;                      /* cruising speed, px per second      */
  var T = { accel:0.9, brake:3.6, end:5.0 };
  var smooth = function(x){ x = x<0?0:(x>1?1:x); return x*x*(3-2*x); };
  function speedAt(t){
    if (t <= 0) return 0;
    if (t < T.accel) return V * smooth(t / T.accel);
    if (t < T.brake) return V;
    if (t < T.end)   return V * smooth(1 - (t - T.brake) / (T.end - T.brake));
    return 0;
  }
  /* how far he travels in total — integrated once, so the arch can be
     parked at exactly the spot where he will come to rest */
  var TOTAL = (function(){ var s = 0, dt = 1/240;
    for (var t = 0; t < T.end; t += dt) s += speedAt(t) * dt;
    return s; })();

  /* ── build the scenery ───────────────────────────────── */
  /* The set is drawn at desktop scale and shrunk on a narrow screen: a
     940px hill on a 390px phone is not a hill, it is a wall. */
  var SC = 1;
  function band(id, tileW, paint){
    var host = $(id); host.innerHTML = "";
    var w = Math.round(tileW * SC);
    for (var i = 0; i < 3; i++){
      var t = document.createElement("div");
      t.className = "t"; t.style.width = w + "px";
      t.innerHTML = paint(SC);
      host.appendChild(t);
    }
    return w;
  }
  /* left, top(% of band), width — a cloud is three overlapping ellipses, so
     it reads as weather rather than as a rounded rectangle */
  var CLOUDS = [[40,8,190],[240,26,130],[430,2,220],[610,17,150],[800,6,170],
                [980,30,210],[1160,12,240],[1340,3,150],
                [120,48,160],[500,62,130],[880,52,190],[1250,66,150],[1420,44,120]];
  var HILLS  = [[-140,720,82],[420,940,100],[900,820,74],[1080,520,92]];
  var BUSHES = [[80,230,72],[420,190,56],[640,250,86],[820,150,48]];
  var BALS   = [[150,40,34],[700,56,28],[1210,34,40],[420,72,26],[1040,68,32]];

  function buildScene(){
    band("gSky", 1400, function(k){
      var out = CLOUDS.map(function(c){
        return '<svg class="g-cloud" style="left:' + (c[0]*k).toFixed(0) + 'px;top:' + c[1] + '%;width:' +
          (c[2]*k).toFixed(0) + 'px" viewBox="0 0 200 74" aria-hidden="true"><g fill="rgba(255,255,255,.8)">' +
          '<ellipse cx="54" cy="48" rx="46" ry="24"/><ellipse cx="104" cy="34" rx="44" ry="30"/>' +
          '<ellipse cx="152" cy="50" rx="42" ry="22"/><rect x="50" y="48" width="106" height="24" rx="12"/>' +
          '</g></svg>';
      });
      /* a few balloons let go earlier in the day — they give the upper half
         of a tall phone screen something to be */
      out = out.concat(BALS.map(function(b, i){
        var tint = ["var(--dusty)","var(--powder)","var(--dusty-2)"][i % 3];
        return '<svg class="g-bal" style="left:' + (b[0]*k).toFixed(0) + 'px;top:' + b[1] + '%;width:' +
          (b[2]*k).toFixed(0) + 'px" viewBox="0 0 40 74" aria-hidden="true">' +
          '<path d="M20 34 C21 46 19 58 20 72" stroke="rgba(74,136,190,.3)" stroke-width="1.2" fill="none"/>' +
          '<ellipse cx="20" cy="19" rx="16" ry="18" fill="' + tint + '"/>' +
          '<ellipse cx="14" cy="12" rx="5" ry="6" fill="rgba(255,255,255,.5)"/>' +
          '<path d="M17 36 L20 31 L23 36 Z" fill="' + tint + '"/></svg>';
      }));
      return out.join("");
    });
    band("gHill", 1200, function(k){
      return HILLS.map(function(h){
        return '<div class="g-hill" style="left:' + (h[0]*k).toFixed(0) + 'px;width:' +
               (h[1]*k).toFixed(0) + 'px;height:' + h[2] + '%"></div>';
      }).join("");
    });
    band("gBush", 900, function(k){
      return BUSHES.map(function(b){
        return '<div class="g-bush" style="left:' + (b[0]*k).toFixed(0) + 'px;width:' +
               (b[1]*k).toFixed(0) + 'px;height:' + b[2] + '%"></div>';
      }).join("");
    });
    band("gFore", 760, function(k){
      var tuft = function(x, w){
        return '<svg class="g-tuft" style="left:' + (x*k).toFixed(0) + 'px;width:' + (w*k).toFixed(0) +
          'px" viewBox="0 0 200 80" aria-hidden="true">' +
          '<g fill="var(--ivory)" opacity=".92"><ellipse cx="36" cy="62" rx="36" ry="24"/>' +
          '<ellipse cx="104" cy="66" rx="44" ry="26"/><ellipse cx="166" cy="60" rx="30" ry="22"/></g>' +
          '<g fill="var(--dusty-2)"><circle cx="42" cy="47" r="5"/><circle cx="110" cy="50" r="5.5"/></g></svg>';
      };
      return tuft(30, 150) + tuft(430, 175);
    });
  }

  /* speed lines and wheel dust, once */
  (function(){
    var sp = $("gSpeed"), html = "";
    for (var i = 0; i < 9; i++){
      html += '<i style="top:' + (14 + Math.random()*62).toFixed(1) + '%;left:' +
              (52 + Math.random()*44).toFixed(1) + '%;width:' + (40 + Math.random()*110).toFixed(0) +
              'px;animation-delay:-' + (Math.random()*0.62).toFixed(2) + 's"></i>';
    }
    sp.innerHTML = html;
    var du = $("gDust"), d = "";
    for (var j = 0; j < 5; j++){
      d += '<i style="left:' + (8 + j*9) + '%;bottom:' + (2 + Math.random()*10).toFixed(0) +
           '%;width:' + (10 + Math.random()*16).toFixed(0) + 'px;height:' + (10 + Math.random()*16).toFixed(0) +
           'px;animation-delay:-' + (j*0.19).toFixed(2) + 's"></i>';
    }
    du.innerHTML = d;
  })();

  /* ── the road band's height drives the whole composition ── */
  var road = 100;
  function fit(){
    var h = scene.clientHeight || 1, w = scene.clientWidth || 1;
    road = Math.max(54, Math.min(196, h * 0.28));
    /* the car is sized to the room ABOVE the road as well as across it, or a
       phone held sideways pushes his head off the top of the frame */
    var avail = h - road * 0.40 - 76;          /* 76 clears the party lights */
    /* the cap is in rem so it follows the root-size step on a big monitor */
    var rem = parseFloat(getComputedStyle(root).fontSize) || 16;
    var carW = Math.max(140, Math.min(47.5 * rem, w * 0.86, avail * 1.083));
    /* the set is drawn at 1150px. Shrink it on a phone so a hill is a hill
       and not a wall, and let it grow on a wide screen so the same hill is
       not tiled six times across the horizon. */
    var sc = Math.max(0.46, Math.min(1.6, w / 1150));
    scene.style.setProperty("--road", road.toFixed(0) + "px");
    scene.style.setProperty("--carw", carW.toFixed(0) + "px");
    if (Math.abs(sc - SC) > 0.02){ SC = sc; buildScene(); syncWidths(); }
  }

  /* ── the drive ───────────────────────────────────────── */
  var bands = [["gSky",0.16,1400],["gHill",0.34,1200],["gBush",0.66,900],["gFore",1.55,760]];
  var refs = bands.map(function(b){ return { el:$(b[0]), f:b[1], base:b[2], w:b[2] }; });
  var DASH = 104;
  function syncWidths(){
    refs.forEach(function(r){ r.w = Math.round(r.base * SC); });
    /* the road markings belong to the set, so they scale with it — and the
       loop has to wrap on exactly one painted period or the dashes stutter */
    DASH = Math.round(104 * SC);
    var d = $("gDash");
    d.style.backgroundImage = "repeating-linear-gradient(90deg,var(--dusty-2) 0 " +
      Math.round(44 * SC) + "px,transparent " + Math.round(44 * SC) + "px " + DASH + "px)";
    d.style.height = Math.max(3, Math.round(4 * SC)) + "px";
  }
  buildScene(); syncWidths(); fit();
  var rt; addEventListener("resize", function(){
    clearTimeout(rt); rt = setTimeout(function(){ if (!running) fit(); }, 120);
  });

  var dash = $("gDash"), arch = $("gArch"), car = $("gCar"), shade = $("gShade");
  var bar = $("gBar"), cap = $("gCap");
  var running = false, done = false, t0 = 0, dist = 0, lastV = 0;

  function place(d, v){
    refs.forEach(function(r){
      var x = -((d * r.f) % r.w);
      r.el.style.transform = "translate3d(" + x.toFixed(1) + "px,0,0)";
    });
    dash.style.transform = "translate3d(" + (-(d % DASH)).toFixed(1) + "px,0,0)";
    arch.style.transform = "translate3d(calc(-50% + " + (TOTAL - d).toFixed(1) + "px),0,0)";

    var u = v / V;
    scene.style.setProperty("--v", u.toFixed(3));
    /* the bob is tied to distance, not to time, so it stops when he stops */
    var bob = Math.sin(d * 0.055) * 3.4 * Math.min(1, u * 1.6);
    var pitch = ((v - lastV) * 0.006);
    car.style.transform = "translate3d(-50%," + bob.toFixed(2) + "px,0) rotate(" +
      Math.max(-2.2, Math.min(2.2, -pitch)).toFixed(2) + "deg)";
    shade.style.transform = "translate3d(-50%,0,0) scaleX(" + (1 - bob * 0.008).toFixed(3) + ")";
    shade.style.opacity = (0.95 - bob * 0.02).toFixed(2);
  }
  place(0, 0);
  arch.style.opacity = "1";

  var CAPS = [[0,"Hold on tight…"],[1.6,"Mind the puddles…"],[3.2,"Almost there…"],[4.4,"We have arrived."]];
  var capAt = -1;

  function frame(now){
    if (!running) return;
    var t = (now - t0) / 1000;
    if (t >= T.end) t = T.end;
    var v = speedAt(t);
    /* integrate with the average of the two samples: at 5 seconds the
       error would otherwise show up as the arch stopping off-centre */
    dist += (v + lastV) / 2 * (1/60);
    place(dist, v);
    lastV = v;
    bar.style.width = (Math.min(1, t / T.end) * 100).toFixed(1) + "%";
    for (var i = CAPS.length - 1; i >= 0; i--){
      if (t >= CAPS[i][0] && capAt !== i){ capAt = i; cap.textContent = CAPS[i][1]; break; }
    }
    if (t >= T.end){ running = false; arrive(); return; }
    requestAnimationFrame(frame);
  }

  /* the arch is parked at TOTAL, and the frame loop's integration drifts
     by a pixel or two — snap it home so he stops dead centre under it */
  function arrive(){
    dist = TOTAL; place(dist, 0); lastV = 0;
    confetti();
    setTimeout(lift, 620);
  }

  function confetti(){
    if (reduce) return;
    var host = $("gConf"), tints = ["var(--dusty)","var(--powder)","var(--ivory)","var(--dusty-2)","var(--bulb)"];
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 34; i++){
      var n = document.createElement("i");
      n.style.left = (50 + (Math.random()*44 - 22)).toFixed(1) + "%";
      n.style.bottom = (road * 1.1).toFixed(0) + "px";
      n.style.background = tints[i % tints.length];
      frag.appendChild(n);
      (function(el, k){
        var dx = (Math.random()*440 - 220), dy = -(120 + Math.random()*220), rot = Math.random()*900 - 450;
        requestAnimationFrame(function(){
          el.animate(
            [{ opacity:0, transform:"translate(0,0) rotate(0deg) scale(.6)" },
             { opacity:1, offset:.12 },
             { opacity:0, transform:"translate("+dx+"px,"+(dy+260)+"px) rotate("+rot+"deg) scale(1)" }],
            { duration: 1500 + Math.random()*700, delay: k*9, easing:"cubic-bezier(.15,.6,.4,1)", fill:"forwards" });
        });
      })(n, i);
    }
    host.appendChild(frag);
  }

  /* ── the curtain lifts ───────────────────────────────── */
  function lift(){
    if (done) return;
    done = true;
    invite.removeAttribute("inert");
    root.classList.add("open");
    window.scrollTo(0, 0);
    gate.classList.add("lift");
    /* the invitation animates in WHILE the cover rises, not after it —
       otherwise the guest watches a still page for a second first */
    startReveals();
    setTimeout(playNote, 380);
    var finish = function(){ gate.hidden = true; };
    if (reduce) setTimeout(finish, 300);
    else {
      var fired = false;
      gate.addEventListener("transitionend", function h(e){
        if (e.propertyName !== "transform" || fired) return;
        fired = true; gate.removeEventListener("transitionend", h); finish();
      });
      setTimeout(function(){ if (!fired){ fired = true; finish(); } }, 1400);  /* belt and braces */
    }
  }

  function go(){
    if (running || done) return;
    if (reduce){ lift(); return; }
    $("gReady").classList.add("off");
    $("gReady").setAttribute("aria-hidden","true");
    $("gGoing").classList.remove("off");
    $("gGoing").removeAttribute("aria-hidden");
    running = true; t0 = performance.now(); dist = 0; lastV = 0;
    requestAnimationFrame(frame);
  }

  $("gGo").addEventListener("click", go);
  $("gSkip").addEventListener("click", function(){ running = false; arrive(); });
  addEventListener("keydown", function(e){
    if (done) return;
    if (e.key === "Escape"){ running = false; lift(); }
  });
})();
