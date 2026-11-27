/* لوحة النشر: يقرأ /data.json ويعرضه. كل النصوص تُدرج كنص فقط (بدون innerHTML). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
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

  /* theme (shared with the main site) */
  var root = document.documentElement;
  try { var saved = localStorage.getItem("theme"); if (saved) root.setAttribute("data-theme", saved); } catch (e) {}
  $("#themeBtn").addEventListener("click", function () {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
  });
  $("#year").textContent = new Date().getFullYear();

  var PLATFORMS = {
    youtube:   { name: "يوتيوب",   ico: "▶", color: "#ff5a5a" },
    instagram: { name: "إنستغرام", ico: "◎", color: "#e1306c" },
    tiktok:    { name: "تيك توك",  ico: "♪", color: "#25f4ee" },
    facebook:  { name: "فيسبوك",   ico: "f", color: "#4d9fff" },
    x:         { name: "إكس",      ico: "𝕏", color: "#b9c2d0" }
  };
  var ORDER = ["youtube", "instagram", "tiktok", "facebook", "x"];
  var STATUS = {
    connected:    { t: "متصل",         c: "#34d399" },
    review:       { t: "قيد المراجعة", c: "#fbbf24" },
    limited:      { t: "محدود",        c: "#fbbf24" },
    disconnected: { t: "غير متصل",     c: "#f87171" },
    unknown:      { t: "غير معروف",    c: "#9aa6c7" }
  };
  function st(s) { return STATUS[s] || STATUS.unknown; }
  function plat(k) { return PLATFORMS[k] || { name: k, ico: "•", color: "#9aa6c7" }; }
  function ok(url) { return typeof url === "string" && /^https:\/\//.test(url); }

  function empty(t, d) {
    return h("div", { class: "empty-state reveal in" }, [
      h("span", { class: "ring" }), h("h3", { text: t }), h("p", { class: "muted", text: d })
    ]);
  }

  function platCard(k, info) {
    info = info || {};
    var p = plat(k), s = st(info.status);
    var kids = [
      h("div", { class: "plat-ico", text: p.ico, style: { "--pc": p.color } }),
      h("h3", { text: p.name }),
      h("span", { class: "st-badge", text: s.t, style: { "--sc": s.c } })
    ];
    if (info.handle) kids.push(h("p", { class: "muted plat-handle", text: "@" + info.handle }));
    if (ok(info.url)) kids.push(h("a", { class: "plat-link", href: info.url, target: "_blank", rel: "noopener noreferrer", text: "الصفحة ↗" }));
    (info.accounts || []).forEach(function (a) {
      if (a && ok(a.url)) kids.push(h("a", { class: "plat-link", href: a.url, target: "_blank", rel: "noopener noreferrer", text: (a.name || "صفحة") + " ↗" }));
    });
    if (info.note) kids.push(h("p", { class: "muted plat-note", text: info.note }));
    return h("div", { class: "plat reveal in", style: { "--pc": p.color } }, kids);
  }

  function chip(k, url, note) {
    var p = plat(k);
    var label = p.name + (note ? " • " + note : "");
    if (ok(url)) {
      return h("a", { class: "pchip", href: url, target: "_blank", rel: "noopener noreferrer", style: { "--pc": p.color } },
        [h("span", { class: "p-ico", text: p.ico }), label]);
    }
    return h("span", { class: "pchip off", style: { "--pc": p.color } },
      [h("span", { class: "p-ico", text: p.ico }), label]);
  }

  function postCard(p, opts) {
    opts = opts || {};
    var chipsBox = h("div", { class: "chips", style: { margin: "10px 0 0" } });
    if (p.links || p.notes) {
      ORDER.forEach(function (k) {
        var url = p.links && p.links[k];
        var note = p.notes && p.notes[k];
        if (url || note) chipsBox.appendChild(chip(k, url, note));
      });
    }
    (p.platforms || []).forEach(function (k) { chipsBox.appendChild(chip(k, null, null)); });
    var head = h("div", { class: "p-top" }, [
      h("div", null, [
        h("h3", { text: p.title || p.id || "عنصر" }),
        h("small", { class: "muted", text: [p.id, p.date, p.kind].filter(Boolean).join(" • ") })
      ]),
      opts.best ? h("span", { class: "best-badge", text: "★ الأفضل" }) : null
    ]);
    var kids = [head, chipsBox];
    if (p.reason) kids.push(h("p", { class: "fail-reason", text: p.reason }));
    if (p.message) kids.push(h("p", { class: "fail-reason", text: p.message }));
    if (p.ts) kids.push(h("p", { class: "err-when", text: p.ts }));
    return h("article", { class: "post reveal in" }, kids);
  }

  function kpi(n, label) {
    return h("li", null, [h("b", { text: String(n) }), h("span", { text: label })]);
  }

  function fill(id, items, render, emptyTitle, emptyDesc) {
    var box = $(id);
    box.textContent = "";
    if (!items || !items.length) { box.appendChild(empty(emptyTitle, emptyDesc)); return; }
    items.forEach(function (p) { box.appendChild(render(p)); });
  }

  function render(d) {
    var plats = $("#plats");
    plats.textContent = "";
    ORDER.forEach(function (k) { plats.appendChild(platCard(k, (d.platforms || {})[k])); });

    var pub = d.published || [], sch = d.scheduled || [], q = d.queue || [], fail = d.failed || [];
    var kpis = $("#kpis");
    kpis.textContent = "";
    [kpi(pub.length, "منشور"), kpi(sch.length, "مجدول"), kpi(q.length, "في الانتظار"), kpi(fail.length, "فاشل")]
      .forEach(function (li) { kpis.appendChild(li); });

    fill("#best", pub.filter(function (p) { return p.best; }),
      function (p) { return postCard(p, { best: true }); },
      "لم يُحدَّد أفضل محتوى بعد", "سيظهر هنا المحتوى الأعلى أداءً عند تحديده.");
    fill("#published", pub, function (p) { return postCard(p); },
      "لا منشورات بعد", "ستظهر هنا المنشورات مع روابطها وتواريخها.");
    fill("#scheduled", sch, function (p) { return postCard(p); },
      "لا شيء مجدولًا", "ستظهر هنا المنشورات المجدولة القادمة.");
    fill("#queue", q, function (p) { return postCard(p); },
      "القائمة فارغة", "ستظهر هنا العناصر بانتظار الجدولة أو النشر.");
    fill("#failed", fail, function (p) { return postCard(p); },
      "لا فشل", "أي نشر فاشل سيظهر هنا مع السبب.");
    fill("#errors", d.errors || [], function (p) { return postCard(p); },
      "لا أخطاء", "سجل الأخطاء فارغ حاليًا.");

    var up = $("#updated");
    if (d.updated) {
      var label = d.updated;
      try {
        var dt = new Date(d.updated);
        if (!isNaN(dt)) label = dt.toLocaleString("ar", { dateStyle: "medium", timeStyle: "short" });
      } catch (e) {}
      up.textContent = "آخر تحديث للبيانات: " + label;
    } else up.textContent = "";
  }

  var topBtn = $("#topBtn");
  if (topBtn) {
    window.addEventListener("scroll", function () { topBtn.classList.toggle("show", window.scrollY > 600); }, { passive: true });
    topBtn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  var lastRaw = "";
  function load() {
    fetch("/data.json", { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("http " + r.status);
      return r.text();
    }).then(function (raw) {
      if (raw === lastRaw) return;
      lastRaw = raw;
      render(JSON.parse(raw));
    }).catch(function () {
      if (lastRaw) return;
      $("#updated").textContent = "تعذّر تحميل بيانات اللوحة (data.json).";
      ["#best", "#published", "#scheduled", "#queue", "#failed", "#errors"].forEach(function (id) {
        var box = $(id);
        if (box && !box.children.length) box.appendChild(empty("البيانات غير متاحة", "تعذّر قراءة data.json حاليًا."));
      });
    });
  }
  load();
  setInterval(load, 300000);
})();
