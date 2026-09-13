// Decorative project worlds share one clock and sleep whenever they are unseen.
export function initAtmospheres({ motionQuery, compactQuery } = {}) {
  if (typeof document === 'undefined') return () => {};
  motionQuery ||= window.matchMedia('(prefers-reduced-motion: reduce)');
  compactQuery ||= window.matchMedia('(max-width: 900px)');
  const effects = [];
  let frameId = 0, lastPaint = 0, disposed = false, flash = null;
  const lightning = document.getElementById('lightning');
  if (lightning) lightning.style.background = 'radial-gradient(ellipse at 76% 18%, #c7e5fa, transparent 54%)';

  for (const [id, kind] of [['skyCanvas', 'rain'], ['coinCanvas', 'coins'], ['dataCanvas', 'data']]) {
    const canvas = document.getElementById(id);
    const section = canvas?.closest('section');
    let ctx = null;
    try { ctx = canvas?.getContext('2d'); } catch { /* Decorative canvas is optional. */ }
    if (ctx && section) effects.push({ canvas, section, ctx, kind, width: 0, height: 0, dpr: 0, visible: false, particles: null, elapsed: 0, nextFlash: 18 });
  }
  if (!effects.length) return () => {};

  const random = (min, max) => min + Math.random() * (max - min);
  const canRun = () => !disposed && !document.hidden && !motionQuery.matches && effects.some(e => e.visible && e.width > 0 && e.height > 0);
  function cancelFlash() { flash?.cancel(); flash = null; }
  function sync() {
    if (document.hidden || motionQuery.matches || !effects.some(e => e.kind === 'rain' && e.visible)) cancelFlash();
    if (!canRun()) {
      cancelAnimationFrame(frameId);
      frameId = 0;
      lastPaint = 0;
    } else if (!frameId) {
      lastPaint = 0;
      frameId = requestAnimationFrame(frame);
    }
  }

  function resize(effect, width, height) {
    const dpr = Math.min(window.devicePixelRatio || 1, compactQuery.matches ? 1.25 : 1.5);
    width = Math.max(0, width); height = Math.max(0, height);
    if (effect.width === width && effect.height === height && effect.dpr === dpr) return;
    Object.assign(effect, { width, height, dpr, particles: null });
    effect.canvas.width = Math.max(1, Math.round(width * dpr));
    effect.canvas.height = Math.max(1, Math.round(height * dpr));
    effect.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sync();
  }

  function seed(effect) {
    const { width: w, height: h, kind } = effect;
    const compact = compactQuery.matches;
    if (kind === 'rain') {
      effect.particles = Array.from({ length: compact ? 40 : 96 }, (_, i) => ({
        x: random(0, w), y: random(0, h), depth: i % 3, length: random(9, 25), speed: random(250, 470)
      }));
    } else if (kind === 'coins') {
      effect.particles = Array.from({ length: compact ? 8 : 16 }, () => {
        const depth = random(0.2, 1);
        return { x: random(0, w), y: random(0, h), depth, radius: 7 + depth * 9, speed: 8 + depth * 13, angle: random(0, Math.PI * 2), spin: random(0.18, 0.4) };
      });
    } else {
      effect.particles = Array.from({ length: compact ? 3 : 5 }, (_, row) => ({
        progress: Math.random(),
        points: Array.from({ length: 6 }, (_, col) => ({
          x: w * (0.08 + col * 0.165), y: h * (0.28 + row * 0.12 - col * 0.017 + random(-0.01, 0.01))
        }))
      }));
    }
  }

  function drawRain(effect, dt) {
    const { ctx, width: w, height: h, particles } = effect;
    for (const drop of particles) {
      drop.x -= (24 + drop.depth * 11) * dt;
      drop.y += drop.speed * dt;
      if (drop.y > h + drop.length || drop.x < -drop.length) { drop.y = -drop.length; drop.x = random(0, w + 20); }
    }
    ctx.lineWidth = 1;
    for (let depth = 0; depth < 3; depth++) {
      ctx.strokeStyle = `rgba(190,225,255,${0.11 + depth * 0.065})`;
      ctx.beginPath();
      for (const drop of particles) if (drop.depth === depth) {
        ctx.moveTo(drop.x, drop.y); ctx.lineTo(drop.x - 3, drop.y + drop.length);
      }
      ctx.stroke();
    }
    effect.elapsed += dt;
    if (effect.elapsed >= effect.nextFlash) {
      effect.elapsed = 0; effect.nextFlash = random(18, 34);
      if (lightning?.animate) {
        cancelFlash();
        flash = lightning.animate([{ opacity: 0 }, { opacity: 0.085, offset: 0.32 }, { opacity: 0 }], { duration: 1100, easing: 'ease-out' });
      }
    }
  }

  function drawCoins(effect, dt) {
    const { ctx, width: w, height: h, particles } = effect;
    for (const coin of particles) {
      coin.y += coin.speed * dt; coin.angle += coin.spin * dt;
      coin.x += Math.sin(coin.angle * 0.6) * (1 + coin.depth * 2) * dt;
      if (coin.y > h + coin.radius * 2) { coin.y = -coin.radius * 2; coin.x = random(0, w); }
      const face = Math.cos(coin.angle), rx = Math.max(1.4, Math.abs(face) * coin.radius);
      ctx.save();
      ctx.translate(coin.x, coin.y); ctx.rotate(Math.sin(coin.angle * 0.4) * 0.18);
      ctx.globalAlpha = 0.13 + coin.depth * 0.2;
      ctx.fillStyle = '#76521e';
      ctx.beginPath(); ctx.ellipse(1.7, 0.8, rx, coin.radius, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = face < 0 ? '#ba9144' : '#e9c461'; ctx.strokeStyle = '#684715'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, coin.radius, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (rx > 3) {
        ctx.strokeStyle = face < 0 ? '#9a742e' : '#fff0af';
        ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.65, coin.radius * 0.72, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawData(effect, dt) {
    const { ctx, particles } = effect;
    ctx.lineWidth = 1;
    for (const row of particles) {
      row.progress = (row.progress + dt * 0.055) % 1;
      ctx.strokeStyle = 'rgba(139,255,238,0.085)'; ctx.beginPath();
      row.points.forEach((point, i) => i ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
      ctx.stroke(); ctx.fillStyle = 'rgba(139,255,238,0.18)';
      for (const point of row.points) { ctx.beginPath(); ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2); ctx.fill(); }
      const position = row.progress * (row.points.length - 1), index = Math.floor(position), fraction = position - index;
      const a = row.points[index], b = row.points[index + 1];
      ctx.fillStyle = 'rgba(163,255,238,0.43)'; ctx.beginPath();
      ctx.arc(a.x + (b.x - a.x) * fraction, a.y + (b.y - a.y) * fraction, 2.3, 0, Math.PI * 2); ctx.fill();
    }
  }

  const renderers = { rain: drawRain, coins: drawCoins, data: drawData };
  function frame(time) {
    frameId = 0;
    if (!canRun()) { lastPaint = 0; return; }
    if (!lastPaint || time - lastPaint >= 1000 / 30 - 1) {
      const dt = lastPaint ? Math.min((time - lastPaint) / 1000, 0.08) : 1 / 30;
      lastPaint = time;
      for (const effect of effects) if (effect.visible && effect.width && effect.height) {
        if (!effect.particles) seed(effect);
        effect.ctx.clearRect(0, 0, effect.width, effect.height);
        renderers[effect.kind](effect, dt);
      }
    }
    frameId = requestAnimationFrame(frame);
  }

  const visibilityObserver = typeof IntersectionObserver === 'function' ? new IntersectionObserver(entries => {
    for (const entry of entries) for (const effect of effects) if (effect.section === entry.target) effect.visible = entry.isIntersecting && entry.intersectionRatio > 0;
    sync();
  }, { threshold: [0, 0.01] }) : null;
  const resizeObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    for (const entry of entries) {
      const effect = effects.find(item => item.canvas === entry.target);
      if (effect) resize(effect, entry.contentRect.width, entry.contentRect.height);
    }
  }) : null;

  function onResize() {
    for (const effect of effects) {
      const bounds = resizeObserver ? effect : effect.canvas.getBoundingClientRect();
      resize(effect, bounds.width, bounds.height);
    }
  }
  function onPreferenceChange() {
    for (const effect of effects) {
      effect.particles = null;
      if (motionQuery.matches) effect.ctx.clearRect(0, 0, effect.width, effect.height);
    }
    onResize(); sync();
  }
  for (const effect of effects) {
    const bounds = effect.canvas.getBoundingClientRect();
    resize(effect, bounds.width, bounds.height);
    if (visibilityObserver) visibilityObserver.observe(effect.section);
    resizeObserver?.observe(effect.canvas);
  }
  // Without visibility observation, leave these optional decorations static.
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', onResize, { passive: true });
  motionQuery.addEventListener?.('change', onPreferenceChange);
  compactQuery.addEventListener?.('change', onPreferenceChange);
  sync();

  return () => {
    disposed = true; sync(); cancelFlash();
    visibilityObserver?.disconnect(); resizeObserver?.disconnect();
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('resize', onResize);
    motionQuery.removeEventListener?.('change', onPreferenceChange);
    compactQuery.removeEventListener?.('change', onPreferenceChange);
  };
}
