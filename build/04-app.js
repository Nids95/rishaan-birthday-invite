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
  timeLabel: "6:00 PM onwards",
  timeShort: "6 PM onwards",
  timeNote:  "The cake is ready. The fun is waiting. All we need is YOU!",
  venue:     "The Locus",
  address:   "Punnapra, Alappuzha, Kerala",
  dressCode: "Blue & White",
  dressNote: "Dress to match the birthday vibe!",
  hosts:     "Rishaan\u2019s Favorite Crew",
  /* read only by the parked "Tell us you're coming" button */
  whatsapp:  "919400000000",
  /* geo: "9.4603,76.3319"  <- paste "lat,lng" from a Google Maps pin and the
     directions link becomes an exact route instead of a name search */
  geo:       "",
  calTitle:  "Rishaan Turns One",
  calNote:   "Rishaan's first birthday. 6:00 PM onwards at The Locus, Punnapra. Dress code: blue & white."
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
   ["lEleph2",ART.eleph]
   /* parked with the "Meet the birthday boy" section:
   ,["lRacer1",ART.racer1],["lWv1",ART.wave1],["lWv2",ART.wave2],["lWv3",ART.wave3] */
  ].forEach(function(p){ var el = $(p[0]); if (el){ el.src = p[1]; el.decoding = "async"; } });
  /* the crawl strip is a background, so it is set now and downloads while
     the ride is still playing — not when he is already due on stage */
  if (ART.crawl && $("lKid")) $("lKid").style.setProperty("--sprite", 'url("' + ART.crawl + '")');

  /* ══════════════════════════════════════════════════════
     THE INVITATION
     ══════════════════════════════════════════════════════ */
  var dot = '<span>&#9670;</span>';
  var facts = $("lFacts");
  facts.innerHTML = "<b>"+E.dateShort+"</b>"+dot+"<b>"+E.timeShort+"</b>"+dot+"<b>"+E.venue+"</b>";
  set("lHosts", E.hosts);

  /* The three facts belong on one line. Whether they fit is a question about
     THIS text at THIS width in THIS font — not about a width someone guessed
     at once — so it gets measured. A fixed breakpoint is what made a 430px
     iPhone and a 360px Android disagree.

     It has to run again after the webfont arrives: Cormorant is wider than
     the fallback serif, and a row measured against Georgia will overflow the
     moment the real face swaps in. */
  function fitFacts(){
    facts.classList.remove("stack");
    if (facts.scrollWidth > facts.clientWidth + 1) facts.classList.add("stack");
  }
  fitFacts();
  addEventListener("resize", fitFacts);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitFacts).catch(function(){});

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
  set("tTimeNote", E.timeNote);
  set("tVenue", E.venue);
  set("tAddr", E.address);
  set("tDress", E.dressCode);
  set("tDressNote", E.dressNote);
  set("lFoot", E.name + " · First Birthday · " + (fmt({ year:"numeric" }) || "2026"));

  $("lMap").href = IV.map();
  $("lCal").href = IV.gcal();
  /* parked with the RSVP button at the foot of build/03-body.html:
  $("lWa").href  = "https://wa.me/" + E.whatsapp + "?text=" +
    encodeURIComponent("We'll be there for " + E.name + "'s first birthday!"); */

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
  function playNote(tIn, tType){
    if (tIn == null) tIn = 520;
    if (tType == null) tType = 1420;
    var note = $("lNote");
    if (!note || note.dataset.done) return;
    note.dataset.done = "1";
    if (reduce){ note.classList.add("in","typed"); return; }

    /* Every word is laid out before the first one appears, so the bubble
       never changes size mid-sentence. The walk is over child NODES rather
       than the flattened text, because the message is two paragraphs and
       one of its words is in bold — splitting textContent would throw the
       markup away. */
    var n = 0;
    [].forEach.call(note.querySelectorAll("p"), function(p){
      var kids = [].slice.call(p.childNodes);
      p.textContent = "";
      kids.forEach(function(node){
        if (node.nodeType === 3){
          node.textContent.split(/(\s+)/).forEach(function(t){
            if (!t) return;
            if (/^\s+$/.test(t)){ p.appendChild(document.createTextNode(" ")); return; }
            var s = document.createElement("span");
            s.className = "w"; s.style.setProperty("--i", n++); s.textContent = t;
            p.appendChild(s);
          });
        } else {
          node.classList.add("w"); node.style.setProperty("--i", n++);
          p.appendChild(node);
        }
      });
    });

    setTimeout(function(){ note.classList.add("in"); }, tIn);
    setTimeout(function(){ note.classList.add("typed"); }, tType);
    setTimeout(function(){ note.classList.add("live"); }, tType + n * 55 + 620);
  }

  /* ══════════════════════════════════════════════════════
     HE CRAWLS IN
     As the note scrolls into view, Rishaan crawls in from the left, sits
     down beside it, and only then does the bubble pop up and type.

     Three rules keep it from looking like a sticker sliding across glass:

     1. His hands are tied to DISTANCE, not time. One gait cycle is a fixed
        fraction of his own length, and the frame shown is wherever he is
        in that cycle — so a hand is planted while it is on the floor, and
        the knees never skate.
     2. He goes at a baby's pace, and once he has set off he goes the whole
        way by himself — no scrolling needed. Scrolling only decides when
        he starts: straight away where his row is already on screen, as it
        is on a phone when the curtain lifts.
     3. One look, then he stops. On a long path he pauses halfway and looks
        at you; on a short one he looks at you when he arrives. Then he
        plops down, and speaks.
     ══════════════════════════════════════════════════════ */
  function initKid(){
    var say = $("lSay"), kid = $("lKid");
    if (!say || !kid) { playNote(); return; }
    var slot = kid.parentNode;
    var body = kid.querySelector(".k-body");
    var base = kid.querySelector(".k-base"), over = kid.querySelector(".k-over");
    /* cell i of 6 in the strip: 0-3 crawl, 4 looks at you, 5 sits */
    var cell = function(el, i){ el.style.backgroundPosition = (i * 20) + "% 0"; };

    function sitNow(){
      cell(over, 5); kid.classList.add("over");
      kid.style.opacity = "1"; kid.style.transform = "none";
      kid.classList.add("sat");
    }
    if (reduce || !("IntersectionObserver" in window) || !ART.crawl){
      sitNow(); playNote(0, 0); return;
    }

    var kh, cw, run, fade, speed, stride, restLeft;
    var p = 0, v = 0, phase = 0, looked = false, started = false;
    var state = "crawl", lookUntil = 0, raf = 0, last = 0, onScreen = false;

    function measure(){
      kh = kid.offsetHeight; cw = kid.offsetWidth;
      var r = slot.getBoundingClientRect();
      restLeft = r.left + kid.offsetLeft;                  /* the cell's left edge when seated */
      var offscreen = restLeft + cw + 12;                  /* how far to be fully out of sight */
      run = Math.min(offscreen, cw * 4.6);                 /* on a big monitor, do not crawl the whole width */
      fade = run < offscreen;                              /* starting on-screen: fade in rather than pop */
      /* a baby's pace: about one and a half of his own heights a second, but
         never so fast that a short phone-width entrance is over in a blink */
      speed = Math.min(kh * 1.45, run / 2.3);
      stride = cw * .62;                                    /* one full crawl cycle */
    }

    function look(now, ms){
      state = "look"; looked = true; v = 0;
      cell(base, 0);                                        /* hands down, the pose he stops in */
      cell(over, 4); kid.classList.add("over");             /* ...and the head turns to you */
      lookUntil = now + (ms || 1050);
    }

    function sit(){
      state = "sat";
      kid.style.transform = "none"; kid.style.opacity = "1";
      cell(over, 5); kid.classList.add("over");
      kid.classList.add("sat");
      cancelAnimationFrame(raf);
      io.disconnect(); cue.disconnect();
      playNote(220, 820);                                   /* he sits, THEN he talks */
    }

    /* Once he has set off, he crawls the whole way on his own. His journey
       used to follow the scroll position, and he only finished unaided once
       the note was well up the screen. On a real phone Safari's address and
       tool bars take ~180px, the note sits lower than it does in a
       full-height test, and he stopped halfway and waited to be scrolled.
       Now scrolling only decides WHEN he starts, never how far he gets. */
    function frame(now){
      raf = 0;
      if (state === "sat") return;
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now;

      if (state === "look"){
        if (now >= lookUntil){
          /* a look on arrival goes straight into sitting down — a cut from
             facing you to sitting, never back through the profile */
          if (p >= 1){ sit(); return; }
          kid.classList.remove("over"); state = "crawl";
        }
      } else {
        /* speed up from rest, slow down on arrival */
        var dp = 1 - p, vmax = speed / run;
        var want = Math.min(vmax, dp * 3.2);
        v += (want - v) * Math.min(1, dt * 5);
        var step = v * dt;
        if (dp < .002){ step = dp; v = 0; }
        p = Math.min(1, p + step);

        /* the hands are tied to distance, so they plant and never skate */
        phase += step * run / stride;
        cell(base, ((Math.floor(phase * 4) % 4) + 4) % 4);

        /* a look only lands if you can see his face — his heels trailing off
           the edge of the screen do not matter, his nose being off it does */
        var inView = restLeft - run * (1 - p) + cw * .35 > 6;
        /* a long desktop path earns a look on the way; a short phone path
           gets one on arrival instead — crawls up, turns to you, plops down */
        if (inView && !looked && run > cw * 2.4 && p >= .5) look(now);
        else if (p >= 1){ if (!looked) look(now, 850); else { sit(); return; } }
      }

      /* two pushes per cycle, one per hand: he surges a little on each, the
         body dips as the hand lands, and rocks by under a degree */
      var moving = state === "crawl" && v > 1e-4;
      var w = phase * Math.PI * 4;
      var surge = moving ? Math.sin(w) * stride * .035 : 0;
      var bob = moving ? -Math.abs(Math.sin(w)) * kh * .018 : 0;
      var rock = moving ? Math.sin(w) * .7 : 0;
      var x = -run * (1 - p) + surge;
      kid.style.transform = "translate3d(" + x.toFixed(1) + "px," + bob.toFixed(1) + "px,0) rotate(" + rock.toFixed(2) + "deg)";
      kid.style.opacity = fade ? Math.min(1, p / .14).toFixed(3) : "1";

      if (onScreen) raf = requestAnimationFrame(frame);
    }

    function kick(){
      if (started && onScreen && !raf && state !== "sat"){ last = 0; raf = requestAnimationFrame(frame); }
    }
    /* he sets off once half his row is on screen — straight away on a phone,
       where it already is when the curtain lifts; on the first scroll that
       brings it into view anywhere it starts below the fold */
    var cue = new IntersectionObserver(function(en){
      if (en[0].intersectionRatio >= .5){ started = true; cue.disconnect(); kick(); }
    }, { threshold: [0, .5, 1] });
    /* and the loop only runs while the row is anywhere near the screen: if
       the guest scrolls away mid-crawl he waits, and carries on when they
       come back, rather than finishing to an empty room */
    var io = new IntersectionObserver(function(en){
      onScreen = en[0].isIntersecting; kick();
    }, { rootMargin: "240px 0px 240px 0px" });

    measure();
    cell(base, 0); cell(over, 4);
    kid.style.transform = "translate3d(" + (-run) + "px,0,0)";
    io.observe(say); cue.observe(say);
    addEventListener("resize", function(){ if (state !== "sat") measure(); });
  }

  /* ══════════════════════════════════════════════════════
     THE LANDING PARTY
     Two poppers go off from the bottom corners and a release of balloons
     rises behind the first section — once, as the curtain lifts.

     The paper is real paper, not dots: each piece flips as it tumbles
     (a rotateX on top of its spin), goes up fast and comes down slow, and
     is blown inward, towards the middle of the page. White pieces carry a
     hairline edge, or on an ivory page they would not be there at all.
     ══════════════════════════════════════════════════════ */
  var TINTS = ["var(--dusty)","var(--accent)","var(--dusty-2)","white","var(--navy-2)","#D9A93F","var(--powder)"];

  function popper(el, side, vw, vh){
    var host = $("party");
    var r = el.getBoundingClientRect();
    /* the mouth is the popper's far end, lifted by its tilt */
    var mx = side > 0 ? r.right - r.width * .12 : r.left + r.width * .12;
    var my = r.top + r.height * .16;
    var base = side > 0 ? "rotate(-38deg)" : "scaleX(-1) rotate(-38deg)";

    /* in with a pop, a kick back as it fires, then away */
    el.animate([
      { opacity:0, transform: base + " scale(.4)" },
      { opacity:1, transform: base + " scale(1.08)", offset:.1 },
      { opacity:1, transform: base + " scale(1)", offset:.16 },
      { opacity:1, transform: base + " scale(1)", offset:.2 },
      { opacity:1, transform: base + " rotate(7deg) translateX(-7%)", offset:.26 },
      { opacity:1, transform: base + " scale(1)", offset:.4 },
      { opacity:1, transform: base + " scale(1)", offset:.78 },
      { opacity:0, transform: base + " scale(.85)" }
    ], { duration: 2200, easing:"ease-out", fill:"forwards" });

    var flash = document.createElement("i");
    flash.className = "flash"; flash.style.left = mx + "px"; flash.style.top = my + "px";
    host.appendChild(flash);
    flash.animate([{ opacity:0, transform:"scale(.2)" },{ opacity:1, transform:"scale(.9)", offset:.3 },
                   { opacity:0, transform:"scale(1.7)" }],
                  { duration: 460, delay: 440, easing:"ease-out", fill:"both" });

    var n = vw < 600 ? 26 : 38;
    for (var i = 0; i < n; i++){
      var b = document.createElement("i");
      var t = TINTS[i % TINTS.length];
      b.className = "bit" + (i % 6 === 2 ? " dot" : i % 7 === 4 ? " curl" : "") + (t === "white" ? " white" : "");
      if (t !== "white") b.style.background = t;
      b.style.left = (mx - 4) + "px"; b.style.top = (my - 6) + "px";
      host.appendChild(b);

      /* blown up and inwards; the spread widens with the screen */
      var dx = side * (vw * (.1 + Math.random() * .34));
      var up = -(vh * (.32 + Math.random() * .38));
      var fall = vh * (.28 + Math.random() * .42);
      var spin = (Math.random() * 720 - 360) | 0, flip = (360 + Math.random() * 720) | 0;
      var dur = 1900 + Math.random() * 1300;
      b.animate([
        { opacity:0, transform:"translate(0,0) rotate(0deg) rotateX(0deg) scale(.4)" },
        { opacity:1, transform:"translate(" + (dx * .12) + "px," + (up * .25) + "px) rotate(" + (spin * .1) + "deg) rotateX(" + (flip * .1) + "deg) scale(1)", offset:.06, easing:"cubic-bezier(.1,.7,.3,1)" },
        { opacity:1, transform:"translate(" + (dx * .7) + "px," + up + "px) rotate(" + (spin * .5) + "deg) rotateX(" + (flip * .5) + "deg) scale(1)", offset:.4, easing:"cubic-bezier(.45,0,.8,.6)" },
        { opacity:0, transform:"translate(" + dx + "px," + (up + fall) + "px) rotate(" + spin + "deg) rotateX(" + flip + "deg) scale(.9)" }
      ], { duration: dur, delay: 440 + Math.random() * 120, fill:"both" });
    }
  }

  function balloon(sky, x, y, size, rise, opts){
    var tint = ["var(--dusty)","var(--powder)","white","var(--dusty-2)","var(--accent)"][opts.tint % 5];
    var edge = tint === "white" ? ' stroke="rgba(74,136,190,.38)" stroke-width="1"' : "";
    var g = document.createElement("div");
    g.className = "h-bal";
    g.style.width = size + "px";
    g.style.left = x + "px"; g.style.top = y + "px";
    g.innerHTML = '<i><svg viewBox="0 0 40 74" aria-hidden="true">' +
      '<path d="M20 35 C22 46 17 58 20 73" stroke="rgba(74,136,190,.38)" stroke-width="1" fill="none"/>' +
      '<path d="M16.5 37.5 L20 32 L23.5 37.5 Z" fill="' + tint + '"' + edge + '/>' +
      '<ellipse cx="20" cy="19" rx="16" ry="18.5" fill="' + tint + '"' + edge + '/>' +
      '<ellipse cx="13.5" cy="11.5" rx="4.6" ry="6.4" fill="rgba(255,255,255,.55)" transform="rotate(-18 13.5 11.5)"/>' +
      '</svg></i>';
    sky.appendChild(g);
    /* up, drifting a little sideways; faint at birth and at the top */
    var drift = (Math.random() * 2 - 1) * size * 2.2;
    var a = g.animate([
      { transform:"translate3d(0,0,0)", opacity:0 },
      { opacity:opts.alpha, offset:.08 },
      { opacity:opts.alpha, offset:.82 },
      { transform:"translate3d(" + drift.toFixed(0) + "px," + (-rise).toFixed(0) + "px,0)", opacity:0 }
    ], { duration: opts.dur, delay: opts.delay || 0, easing:"cubic-bezier(.35,0,.65,1)", fill:"both" });
    /* and sways on its string as it goes */
    g.firstChild.animate([{ transform:"rotate(-5deg)" },{ transform:"rotate(5deg)" }],
      { duration: 2200 + Math.random() * 1400, direction:"alternate", iterations:Infinity, easing:"ease-in-out" });
    a.onfinish = function(){ g.remove(); };
  }

  function celebrate(){
    if (reduce || !Element.prototype.animate) return;
    var vw = innerWidth, vh = innerHeight;

    /* the poppers */
    var party = $("party");
    party.hidden = false;
    popper(party.querySelector(".popper.l"),  1, vw, vh);
    popper(party.querySelector(".popper.r"), -1, vw, vh);
    setTimeout(function(){
      party.hidden = true;
      [].slice.call(party.querySelectorAll(".bit,.flash")).forEach(function(n){ n.remove(); });
    }, 4200);

    /* the release: they start just below the bottom of the SCREEN, not the
       bottom of the section, which on a phone is a screen and a half down —
       otherwise the guest waits two seconds for balloons that are on their
       way up from somewhere they cannot see */
    var head = $("top"), sky = $("hSky");
    if (!head || !sky) return;
    var hr = head.getBoundingClientRect();
    var W = head.clientWidth, H = head.clientHeight;
    var startY = Math.min(H, vh - hr.top) + 10;
    var n = vw < 600 ? 7 : 11;
    for (var i = 0; i < n; i++){
      var size = (vw < 600 ? 24 : 32) + Math.random() * (vw < 600 ? 14 : 20);
      var lane = (i + .5) / n, x = W * (lane + (Math.random() - .5) * .08) - size / 2;
      balloon(sky, x, startY, size, startY + size * 2 + 40,
        { tint:i, alpha:.92, dur: 6200 + Math.random() * 3600, delay: 380 + i * 110 + Math.random() * 260 });
    }

    /* afterwards, one now and then while the section is on screen — paler,
       slower, from the very bottom of it, and never more than a few at once */
    var visible = true;
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }).observe(head);
    var k = 0;
    (function trickle(){
      setTimeout(function(){
        if (visible && sky.childElementCount < n + 4){
          var s = (vw < 600 ? 20 : 26) + Math.random() * 12;
          balloon(sky, Math.random() * (W - s), H + 10, s, H + s * 2 + 60,
            { tint:k++, alpha:.55, dur: 12000 + Math.random() * 6000 });
        }
        trickle();
      }, 2800 + Math.random() * 2600);
    })();
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
  var CQ = !!(window.CSS && CSS.supports && CSS.supports("width", "1cqh"));
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
    /* CSS already has these where container units exist (see .g-scene);
       writing the same numbers again, rounded, would only nudge things */
    if (!CQ){
      scene.style.setProperty("--road", road.toFixed(0) + "px");
      scene.style.setProperty("--carw", carW.toFixed(0) + "px");
    }
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
  var speedEl = $("gSpeed"), dustEl = $("gDust");
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
    speedEl.style.opacity = (u * .85).toFixed(3);
    dustEl.style.opacity = u.toFixed(3);
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
  var capAt = -1, capTimer = 0;
  /* A new caption is never a hard swap of the text: the current line fades
     out, the words change while nothing is visible, and the new line fades
     back in. The first caption is already in the markup, so it is left
     alone rather than faded out and back in as itself. */
  function caption(text){
    if (cap.textContent === text) return;
    clearTimeout(capTimer);
    cap.classList.add("swap");
    capTimer = setTimeout(function(){
      cap.textContent = text;
      cap.classList.remove("swap");
    }, reduce ? 0 : 330);
  }

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
    /* Which caption is due is the LATEST one whose time has passed. The old
       loop asked "is this one due and not already showing?" and broke on the
       first yes — so past 1.6s it chose "Mind the puddles", and on the next
       frame, with that now showing, fell through to "Hold on tight" instead.
       The text flipped between two lines every frame, 60 times a second. */
    var due = 0;
    for (var i = CAPS.length - 1; i >= 0; i--){ if (t >= CAPS[i][0]){ due = i; break; } }
    if (due !== capAt){ capAt = due; caption(CAPS[due][1]); }
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
    /* the party goes off while the curtain is on its way up, so the guest
       sees it being revealed rather than finding it already over */
    celebrate();
    /* give the header a moment to settle before he sets off */
    setTimeout(initKid, 650);
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
    gate.classList.add("riding");
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
