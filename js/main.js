(function () {
  "use strict";
  var D = window.SITE;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  /* إنشاء عناصر بدون innerHTML: كل النصوص تُدرج كنص فقط */
  function h(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "class") e.className = props[k];
      else if (k === "text") e.textContent = props[k];
      else if (k === "style") Object.keys(props[k]).forEach(function (p) { e.style.setProperty(p, props[k][p]); });
      else e.setAttribute(k, props[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* toasts */
  function toast(msg) {
    var box = $("#toasts");
    var t = h("div", { class: "toast", text: msg });
    box.appendChild(t);
    setTimeout(function () { t.classList.add("out"); setTimeout(function () { t.remove(); }, 400); }, 2600);
  }

  /* theme */
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  $("#themeBtn").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    toast(next === "light" ? "الوضع النهاري" : "الوضع الليلي");
  });

  /* nav */
  var nav = $("#nav"), links = $("#links"), burger = $("#burger");
  burger.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    burger.setAttribute("aria-expanded", open ? "true" : "false");
  });
  $$("#links a").forEach(function (a) { a.addEventListener("click", function () { links.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); }); });
  var lastY = 0, prog = $("#progress");
  window.addEventListener("scroll", function () {
    var y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
    prog.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    nav.classList.toggle("hide", y > lastY && y > 300 && !links.classList.contains("open"));
    lastY = y;
  }, { passive: true });
  var secs = $$("main section[id]");
  if ("IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) $$("#links a").forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { so.observe(s); });
  }

  /* courses */
  var grid = $("#courses");
  function renderCourses(q) {
    grid.textContent = "";
    q = (q || "").trim().toLowerCase();
    var shown = 0;
    D.courses.forEach(function (c) {
      var hay = [c.name, c.en, c.desc].concat(c.tags, c.notes.map(function (n) { return n.title + " " + n.tags.join(" "); })).join(" ").toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      shown++;
      var card = h("button", { class: "course tilt reveal in", type: "button", style: { "--cc": c.color }, "aria-label": "افتح ملخصات " + c.name }, [
        h("div", { class: "c-ico", text: c.ico }),
        h("h3", { text: c.name }),
        h("div", { class: "en", text: c.en }),
        h("p", { text: c.desc }),
        h("div", { class: "c-foot" }, [h("span", { class: "badge", text: c.notes.length + " ملخص" }), h("span", { class: "open", text: "فتح ←" })])
      ]);
      card.addEventListener("click", function () { openCourse(c); });
      grid.appendChild(card);
    });
    if (!shown) grid.appendChild(emptyState("لا توجد ملخصات منشورة حاليًا", "ستظهر هنا المواد والملخصات عند إضافتها."));
    attachFx();
  }
  /* modal */
  var modal = $("#modal"), lastFocus = null;
  function openCourse(c) {
    lastFocus = document.activeElement;
    $("#mIco").textContent = c.ico;
    $("#mTitle").textContent = c.name;
    $("#mSub").textContent = c.en;
    var tags = $("#mTags"); tags.textContent = "";
    c.tags.forEach(function (t) { tags.appendChild(h("span", { class: "chip", text: t })); });
    var list = $("#mNotes"); list.textContent = "";
    if (!c.notes.length) list.appendChild(h("li", { class: "note", text: "الملخصات قادمة قريبًا." }));
    c.notes.forEach(function (n) {
      var inner = [h("div", null, [h("b", { text: n.title }), h("br"), h("small", { text: n.date + (n.tags.length ? " • " + n.tags.join("، ") : "") })])];
      if (n.demo) inner.push(h("span", { class: "demo", text: "نموذج" }));
      var li;
      if (n.link && /^https:\/\//.test(n.link)) {
        li = h("li", null, [h("a", { class: "note", href: n.link, target: "_blank", rel: "noopener noreferrer" }, inner)]);
      } else li = h("li", { class: "note" }, inner);
      list.appendChild(li);
    });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    $(".close", modal).focus();
  }
  function closeModal() { modal.hidden = true; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  $$("[data-close]", modal).forEach(function (b) { b.addEventListener("click", closeModal); });

  function emptyState(t, d) {
    return h("div", { class: "empty-state reveal in" }, [h("span", { class: "ring" }), h("h3", { text: t }), h("p", { class: "muted", text: d })]);
  }
  var sv = $("#services");
  if (!D.services.length) sv.appendChild(emptyState("لا توجد خدمات منشورة حاليًا", "ستُضاف عند الجاهزية."));
  D.services.forEach(function (s) { sv.appendChild(h("div", { class: "svc reveal tilt" }, [h("h3", { text: s.title }), h("p", { text: s.text })])); });
  var pg = $("#projectGrid");
  if (!D.projects.length) pg.appendChild(emptyState("لا توجد مشاريع منشورة حاليًا", "سيظهر هنا معرض الأعمال عند إضافة أول مشروع."));
  D.projects.forEach(function (p) {
    var kids = [h("h3", { text: p.title }), h("p", { text: p.text }), h("div", { class: "tech" }, (p.tech || []).map(function (t) { return h("span", { text: t }); }))];
    if (p.link && /^https:\/\//.test(p.link)) kids.push(h("a", { href: p.link, target: "_blank", rel: "noopener noreferrer", text: "افتح المشروع ↗" }));
    pg.appendChild(h("article", { class: "proj tilt" }, kids));
  });
  renderCourses();

  /* 3D tilt + spotlight */
  function attachFx() {
    if (reduce) return;
    $$(".tilt").forEach(function (el) {
      if (el._fx) return; el._fx = true;
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%");
        el.style.transform = "perspective(800px) rotateX(" + (0.5 - y) * 7 + "deg) rotateY(" + (x - 0.5) * 7 + "deg) translateY(-4px)";
      });
      el.addEventListener("pointerleave", function () { el.style.transform = ""; });
    });
  }
  attachFx();

  /* effect 1: curtain transition between sections */
  var curtain = $("#curtain");
  function goTo(hash) {
    var t = $(hash); if (!t) return;
    if (reduce) { t.scrollIntoView(); return; }
    curtain.classList.remove("go"); void curtain.offsetWidth; curtain.classList.add("go");
    setTimeout(function () { t.scrollIntoView({ behavior: "auto" }); history.replaceState(null, "", hash); }, 330);
    setTimeout(function () { curtain.classList.remove("go"); }, 750);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) { var hs = a.getAttribute("href"); if (hs.length > 1) { e.preventDefault(); goTo(hs); } });
  });
  /* effect 2: word-by-word blur-in headings */
  $$(".split").forEach(function (el) {
    var words = el.textContent.split(" "); el.textContent = "";
    words.forEach(function (w, i) { el.appendChild(h("span", { class: "w", style: { "--i": i }, text: w })); if (i < words.length - 1) el.appendChild(document.createTextNode(" ")); });
  });
  /* effect 3: cursor glow + magnetic buttons with ripple */
  var glow = $("#glow");
  if (!reduce) {
    window.addEventListener("pointermove", function (e) { glow.classList.add("on"); glow.style.transform = "translate(" + e.clientX + "px," + e.clientY + "px)"; }, { passive: true });
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("pointermove", function (e) { var r = b.getBoundingClientRect(); b.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * .15 + "px," + (e.clientY - r.top - r.height / 2) * .25 + "px)"; });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
      b.addEventListener("click", function (e) {
        var r = b.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2;
        var rp = h("span", { class: "rip", style: { width: d + "px", height: d + "px", left: e.clientX - r.left - d / 2 + "px", top: e.clientY - r.top - d / 2 + "px" } });
        b.appendChild(rp); setTimeout(function () { rp.remove(); }, 650);
      });
    });
  }

  /* reveal + counters + meters */
  function countUp(el) {
    var to = +el.dataset.count, suf = el.dataset.suffix || "", t0 = null;
    if (reduce) { el.textContent = to + suf; return; }
    function f(t) { if (!t0) t0 = t; var p = Math.min((t - t0) / 1400, 1); el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suf; if (p < 1) requestAnimationFrame(f); }
    requestAnimationFrame(f);
  }
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add("in");
      $$("[data-count]", en.target).forEach(countUp);
      $$(".bar i", en.target).forEach(function (b) { b.style.width = b.dataset.v + "%"; });
      io.unobserve(en.target);
    });
  }, { threshold: 0.15 }) : null;
  $$(".reveal").forEach(function (el) { if (io) io.observe(el); else el.classList.add("in"); });
  $$(".bar i").forEach(function (b) { if (!io) b.style.width = b.dataset.v + "%"; });

  /* buttons */
  var url = "https://ahmed-notes.github.io/";
  function copy() {
    if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { toast("تم نسخ الرابط"); }, function () { toast(url); });
    else toast(url);
  }
  $("#shareBtn").addEventListener("click", function () {
    if (navigator.share) navigator.share({ title: "أحمد نوتس", url: url }).catch(function () {});
    else copy();
  });
  $$("[data-toast]").forEach(function (a) { a.addEventListener("click", function () { toast(a.dataset.toast); }); });
  $("#year").textContent = new Date().getFullYear();

  /* command palette */
  var cmd = $("#cmd"), cin = $("#cmdInput"), clist = $("#cmdList"), items = [], sel = 0;
  function buildItems() {
    items = [
      { t: "الدراسة", k: "قسم", go: "#study" }, { t: "العمل الحر", k: "قسم", go: "#work" },
      { t: "المشاريع", k: "قسم", go: "#projects" }, { t: "الخزنة الخاصة", k: "قسم", go: "#vault" }, { t: "تواصل", k: "قسم", go: "#contact" }
    ];
    D.courses.forEach(function (c) { items.push({ t: c.name, k: "مادة", fn: function () { openCourse(c); } }); });
    D.projects.forEach(function (p) { items.push({ t: p.title, k: "مشروع", go: "#projects" }); });
  }
  function renderCmd() {
    var q = cin.value.trim().toLowerCase(); clist.textContent = "";
    var res = items.filter(function (i) { return !q || i.t.toLowerCase().indexOf(q) >= 0; }).slice(0, 8);
    sel = 0;
    res.forEach(function (i, n) {
      var b = h("button", { type: "button", class: n === 0 ? "sel" : "" }, [h("span", { text: i.t }), h("small", { class: "muted", text: i.k })]);
      b.addEventListener("click", function () { run(i); });
      clist.appendChild(h("li", null, [b]));
    });
    clist._res = res;
  }
  function run(i) { closeCmd(); if (i.go) goTo(i.go); if (i.fn) setTimeout(i.fn, 50); }
  function openCmd() { buildItems(); cmd.hidden = false; cin.value = ""; renderCmd(); cin.focus(); }
  function closeCmd() { cmd.hidden = true; }
  $("#cmdBtn").addEventListener("click", openCmd);
  $("[data-close-cmd]").addEventListener("click", closeCmd);
  cin.addEventListener("input", renderCmd);
  cin.addEventListener("keydown", function (e) {
    var bs = $$("button", clist); if (!bs.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault(); bs[sel].classList.remove("sel");
      sel = (sel + (e.key === "ArrowDown" ? 1 : bs.length - 1)) % bs.length; bs[sel].classList.add("sel");
    } else if (e.key === "Enter") { e.preventDefault(); run(clist._res[sel]); }
  });
  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmd(); }
    if (e.key === "Escape") { closeCmd(); if (!modal.hidden) closeModal(); }
  });


  /* vault: AES-256-GCM in the browser. The password is never stored or sent. */
  (function () {
    var MAGIC = [65, 78, 86, 49], MAX = 50 * 1024 * 1024, ITER = 600000, te = new TextEncoder();
    var urls = [], lockT = null;
    function key(pw, salt, use) {
      return crypto.subtle.importKey("raw", te.encode(pw), "PBKDF2", false, ["deriveKey"]).then(function (km) {
        return crypto.subtle.deriveKey({ name: "PBKDF2", salt: salt, iterations: ITER, hash: "SHA-256" }, km, { name: "AES-GCM", length: 256 }, false, use);
      });
    }
    function stat(el, msg, cls) { el.textContent = msg; el.className = "vstat" + (cls ? " " + cls : ""); }
    function readBuf(f) { return new Promise(function (ok, no) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = no; r.readAsArrayBuffer(f); }); }
    function save(blob, name) {
      var u = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
    }
    var pw = $("#encPw"), bar = $("#strBar");
    pw.addEventListener("input", function () {
      var v = pw.value, sc = 0;
      if (v.length >= 10) sc++; if (v.length >= 14) sc++; if (/[a-z]/.test(v) && /[A-Z]/.test(v)) sc++; if (/\d/.test(v)) sc++; if (/[^A-Za-z0-9]/.test(v)) sc++;
      bar.style.width = sc * 20 + "%"; bar.style.background = sc < 3 ? "#f87171" : sc < 5 ? "#fbbf24" : "#34d399";
    });
    $("#encForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $("#encStat"), f = $("#encFile").files[0], p1 = pw.value, p2 = $("#encPw2").value;
      if (!f) return;
      if (p1 !== p2) return stat(st, "كلمتا السر غير متطابقتين.", "err");
      if (p1.length < 10) return stat(st, "كلمة السر قصيرة.", "err");
      if (f.size > MAX) return stat(st, "الملف أكبر من 50 ميجا.", "err");
      stat(st, "جارٍ التشفير...");
      var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
      Promise.all([readBuf(f), key(p1, salt, ["encrypt"])]).then(function (r) {
        var meta = te.encode(JSON.stringify({ n: f.name, t: f.type })), data = new Uint8Array(r[0]);
        var plain = new Uint8Array(2 + meta.length + data.length);
        plain[0] = meta.length >> 8; plain[1] = meta.length & 255; plain.set(meta, 2); plain.set(data, 2 + meta.length);
        return crypto.subtle.encrypt({ name: "AES-GCM", iv: iv, additionalData: new Uint8Array(MAGIC) }, r[1], plain);
      }).then(function (ct) {
        save(new Blob([new Uint8Array(MAGIC), salt, iv, ct], { type: "application/octet-stream" }), f.name + ".enc");
        stat(st, "تم. حمّل الملف المشفّر واحفظه عندك. احفظ كلمة السر أيضًا.", "ok");
        toast("تم تشفير الملف");
        $("#encForm").reset(); bar.style.width = "0";
      }, function () { stat(st, "تعذّر التشفير.", "err"); });
    });
    function lock() {
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = [];
      $("#vout").textContent = ""; clearTimeout(lockT);
    }
    $("#decForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var st = $("#decStat"), f = $("#decFile").files[0], out = $("#vout"), p = $("#decPw").value;
      if (!f) return; lock();
      if (f.size > MAX + 1024) return stat(st, "الملف كبير جدًا.", "err");
      stat(st, "جارٍ الفك...");
      readBuf(f).then(function (buf) {
        var b = new Uint8Array(buf);
        if (b.length < 50 || MAGIC.some(function (m, i) { return b[i] !== m; })) throw new Error("fmt");
        var salt = b.slice(4, 20), iv = b.slice(20, 32), ct = b.slice(32);
        return key(p, salt, ["decrypt"]).then(function (k) { return crypto.subtle.decrypt({ name: "AES-GCM", iv: iv, additionalData: new Uint8Array(MAGIC) }, k, ct); });
      }).then(function (pt) {
        var b = new Uint8Array(pt), ml = (b[0] << 8) | b[1], meta = JSON.parse(new TextDecoder().decode(b.slice(2, 2 + ml))), data = b.slice(2 + ml);
        var name = String(meta.n || "file").replace(/[\\\/:*?"<>|]/g, "_"), type = String(meta.t || "");
        stat(st, "تم الفك: " + name, "ok");
        if (/^image\/(png|jpeg|gif|webp)$/.test(type)) {
          var u = URL.createObjectURL(new Blob([data], { type: type })); urls.push(u);
          out.appendChild(h("img", { src: u, alt: name }));
        } else if (type === "text/plain") {
          out.appendChild(h("pre", { text: new TextDecoder().decode(data.slice(0, 20000)) }));
        }
        var dl = h("button", { class: "btn ghost", type: "button", text: "نزّل الملف" });
        dl.addEventListener("click", function () { save(new Blob([data], { type: "application/octet-stream" }), name); });
        out.appendChild(dl);
        lockT = setTimeout(function () { lock(); stat(st, "أُغلقت الخزنة تلقائيًا بعد 5 دقائق.", ""); }, 300000);
        $("#decPw").value = "";
      }).catch(function () { stat(st, "كلمة السر غير صحيحة أو الملف ليس مشفّرًا بهذه الخزنة.", "err"); });
    });
  })();

  /* animated network background (no libraries) */
  (function () {
    var cv = $("#bg"), ctx = cv.getContext("2d"), pts = [], W, H, mouse = { x: -999, y: -999 }, asleep = false;
    var pulses = [];
    window.addEventListener("pointerdown", function (e) {
      if (reduce) return;
      pulses.push({ x: e.clientX, y: e.clientY, r: 0 });
      if (pulses.length > 6) pulses.shift();
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && asleep) { asleep = false; requestAnimationFrame(draw); }
    });
    function size() { var d = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d; ctx.setTransform(d, 0, 0, d, 0, 0); W /= d; H /= d; }
    function init() { size(); pts = []; var n = Math.min(70, Math.floor(innerWidth / 18)); for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35 }); }
    function col() { return getComputedStyle(root).getPropertyValue("--a").trim() || "#6ee7d4"; }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      var c = col();
      ctx.fillStyle = c; ctx.strokeStyle = c;
      pts.forEach(function (p, i) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.globalAlpha = .5; ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, 6.3); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14000) { ctx.globalAlpha = (1 - d / 14000) * .22; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
        var mx = p.x - mouse.x, my = p.y - mouse.y, md = mx * mx + my * my;
        if (md < 20000) { ctx.globalAlpha = (1 - md / 20000) * .5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
      });
      for (var pi = pulses.length - 1; pi >= 0; pi--) {
        var pu = pulses[pi]; pu.r += 3.2;
        var pa = 1 - pu.r / 240;
        if (pa <= 0) { pulses.splice(pi, 1); continue; }
        ctx.globalAlpha = pa * .4; ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.r, 0, 6.3); ctx.stroke();
      }
      if (!document.hidden) requestAnimationFrame(draw); else asleep = true;
    }
    init(); window.addEventListener("resize", init);
    window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
    if (reduce) { draw = function () {}; }
    requestAnimationFrame(draw);
  })();
})();
