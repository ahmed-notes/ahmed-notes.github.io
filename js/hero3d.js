/* Hero: rotating wireframe icosahedron rendered in 3D on a plain 2D canvas. No libraries.
   Leans gently toward the cursor, pauses when the hero is off-screen or the tab is hidden,
   and renders a single static frame when the visitor prefers reduced motion. */
(function () {
  "use strict";
  var cv = document.getElementById("hero3d");
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext("2d");
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* icosahedron: 12 vertices on the unit sphere */
  var t = (1 + Math.sqrt(5)) / 2;
  var V = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ].map(function (v) {
    var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / l, v[1] / l, v[2] / l];
  });
  /* edges: vertex pairs at the shortest distance */
  var E = [], i, j;
  for (i = 0; i < V.length; i++) {
    for (j = i + 1; j < V.length; j++) {
      var dx = V[i][0] - V[j][0], dy = V[i][1] - V[j][1], dz = V[i][2] - V[j][2];
      if (dx * dx + dy * dy + dz * dz < 1.2) E.push([i, j]);
    }
  }

  var W = 0, H = 0, R = 0;
  function size() {
    var d = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    W = Math.max(r.width, 1); H = Math.max(r.height, 1);
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    ctx.setTransform(d, 0, 0, d, 0, 0);
    R = Math.min(W, H) * 0.34;
  }

  function cssVar(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }

  function frame(angY, angX) {
    ctx.clearRect(0, 0, W, H);
    var cb = Math.cos(angY), sb = Math.sin(angY), ca = Math.cos(angX), sa = Math.sin(angX);
    var P = V.map(function (v) {
      var x = v[0] * cb + v[2] * sb;
      var z1 = -v[0] * sb + v[2] * cb;
      var y = v[1] * ca - z1 * sa;
      var z = v[1] * sa + z1 * ca;
      var s = 3 / (3 - z);
      return [W / 2 + x * R * s, H / 2 + y * R * s, z];
    });
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, cssVar("--a", "#6ee7d4"));
    grad.addColorStop(1, cssVar("--b", "#8b5cf6"));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.1;
    E.forEach(function (e) {
      var p = P[e[0]], q = P[e[1]];
      ctx.globalAlpha = 0.5 + ((p[2] + q[2]) / 2) * 0.3;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    });
    ctx.fillStyle = cssVar("--a", "#6ee7d4");
    P.forEach(function (p) {
      ctx.globalAlpha = 0.7 + p[2] * 0.25;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 2.1, 0, 6.3);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  var base = 0.6, ex = 0, ey = 0, mx = 0, my = 0;
  var running = false, onScreen = true;

  window.addEventListener("pointermove", function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function loop() {
    base += 0.0035;
    ex += (mx * 0.45 - ex) * 0.05;
    ey += (my * 0.35 - ey) * 0.05;
    frame(base + ex, 0.42 + ey);
    if (running) requestAnimationFrame(loop);
  }
  function start() {
    if (!running && onScreen && !document.hidden && !reduce) {
      running = true;
      requestAnimationFrame(loop);
    }
  }
  function stop() { running = false; }

  size();
  window.addEventListener("resize", function () {
    size();
    if (!running) frame(base + ex, 0.42 + ey);
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      onScreen = es[0].isIntersecting;
      if (onScreen) start(); else stop();
    }, { threshold: 0.05 }).observe(cv);
  }
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  if (reduce) frame(0.6, 0.42);
  else start();
})();
