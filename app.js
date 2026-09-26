import { initLanguage } from './i18n.js';
import { initAtmospheres } from './atmospheres.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const compactQuery = matchMedia('(max-width: 900px)');
const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
const scenes = $$('[data-scene]');
const root = document.documentElement;
// Keep anchor clearance in sync with the header across widths and languages.
const stickyHeader = $('.site-header');
const updateAnchorOffset = () => {
  root.style.setProperty('--sticky-header-height', `${stickyHeader.getBoundingClientRect().height}px`);
};
updateAnchorOffset();
new ResizeObserver(updateAnchorOffset).observe(stickyHeader);
const visibleScenes = new Set();
const rail = $('#sceneRail');
const mobileNav = $('.mobile-nav');
let activeIndex = -1;
let frame = 0;
let sceneBounds = [];
let viewportHeight = innerHeight;
let scrollRange = 1;
let measureNeeded = true;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Real anchors preserve keyboard navigation and browser history.
scenes.forEach(scene => {
  const link = document.createElement('a');
  link.href = `#${scene.id}`;
  link.setAttribute('aria-label', scene.dataset.nav);
  rail.append(link);
});
const chapterLinks = $$('.scene-rail a, .mobile-nav a');
const primaryLinks = $$('.nav a');
const progress = $('#progressBar');
const nowViewing = $('#nowViewing');

function setActive(index) {
  if (index === activeIndex) return;
  scenes[activeIndex]?.classList.remove('is-active');
  activeIndex = index;
  const scene = scenes[index];
  scene.classList.add('is-active');
  root.style.setProperty('--active-accent', scene.dataset.accent);
  document.body.dataset.activeScene = scene.dataset.scene;
  document.body.classList.toggle('light-scene', scene.dataset.surface === 'light');
  nowViewing.textContent = scene.dataset.nav.toUpperCase();
  chapterLinks.forEach(link => {
    if (link.hash === `#${scene.id}`) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const group = scene.matches('.project, .projects-intro, .fun') ? '#projects' : `#${scene.id}`;
  primaryLinks.forEach(link => {
    if (link.hash === group) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

// Read geometry on resize; scroll uses cached bounds and one frame of writes.
function measure() {
  const y = scrollY;
  viewportHeight = innerHeight;
  scrollRange = Math.max(1, root.scrollHeight - viewportHeight);
  sceneBounds = scenes.map(scene => {
    const rect = scene.getBoundingClientRect();
    return { top: rect.top + y, height: rect.height };
  });
  measureNeeded = false;
}
function updateScroll() {
  frame = 0;
  if (measureNeeded) measure();
  const y = scrollY;
  const focus = y + viewportHeight * .48;
  let nearest = 0;
  let distance = Infinity;
  sceneBounds.forEach(({ top, height }, index) => {
    const delta = Math.max(top - focus, focus - top - height, 0);
    if (delta < distance) { distance = delta; nearest = index; }
  });
  setActive(nearest);
  progress.style.transform = `scaleX(${clamp(y / scrollRange, 0, 1)})`;
  document.body.classList.toggle('scrolled', y > 24);
  if (motionQuery.matches || compactQuery.matches) return;
  visibleScenes.forEach(scene => {
    const { top, height } = sceneBounds[scenes.indexOf(scene)];
    const offset = clamp((top + height / 2 - y - viewportHeight / 2) / Math.max(viewportHeight, height), -1, 1);
    scene.style.setProperty('--scene-offset', offset.toFixed(3));
    scene.style.setProperty('--chapter-light', (1 - Math.abs(offset)).toFixed(3));
  });
}
function queueScroll() {
  if (!frame && !document.hidden) frame = requestAnimationFrame(updateScroll);
}
const sceneObserver = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    target.classList.toggle('is-visible', isIntersecting);
    if (isIntersecting) visibleScenes.add(target);
    else visibleScenes.delete(target);
  });
  queueScroll();
});
scenes.forEach(scene => sceneObserver.observe(scene));

// Reveal once; the page remains readable before or without JavaScript.
const reveals = $$('.reveal');
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(({ target, isIntersecting }) => {
    if (!isIntersecting) return;
    target.classList.add('in');
    revealObserver.unobserve(target);
  });
}, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
reveals.forEach(element => revealObserver.observe(element));
document.addEventListener('focusin', event => event.target.closest('.reveal')?.classList.add('in'));

// Focus the destination while leaving scroll behavior to the native anchor.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  $$('.reveal', target).forEach(element => element.classList.add('in'));
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  if (mobileNav.contains(link)) mobileNav.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileNav.open) {
    mobileNav.open = false;
    $('summary', mobileNav).focus();
  }
});
document.addEventListener('pointerdown', event => {
  if (mobileNav.open && !mobileNav.contains(event.target)) mobileNav.open = false;
});
document.addEventListener('focusin', event => {
  if (mobileNav.open && !mobileNav.contains(event.target)) mobileNav.open = false;
});

// Coalesce ambient light, tilt and magnetic response into one pointer frame.
const aura = $('.pointer-aura');
const hero = $('.hero');
let pointerFrame = 0;
let pointer = null;
let previousTarget = null;
let targetRect = null;
let targetGeometryDirty = true;
function pointerEnabled() { return pointerQuery.matches && !compactQuery.matches && !motionQuery.matches; }
function clearTarget() {
  if (previousTarget) {
    previousTarget.style.removeProperty('--tilt-x');
    previousTarget.style.removeProperty('--tilt-y');
    previousTarget.style.removeProperty('translate');
  }
  previousTarget = null;
  targetRect = null;
}
function updatePointer() {
  pointerFrame = 0;
  if (!pointer || !pointerEnabled() || document.hidden) return;
  const target = pointer.target.closest('.project-visual, .btn, .fun-project a, .closing-actions a');
  if (target !== previousTarget) { clearTarget(); previousTarget = target; targetGeometryDirty = true; }
  if (target && targetGeometryDirty) {
    targetRect = target.getBoundingClientRect();
    targetGeometryDirty = false;
  }
  aura.style.transform = `translate3d(${pointer.x}px,${pointer.y}px,0)`;
  document.body.classList.add('pointer-present');
  if (visibleScenes.has(hero)) {
    hero.style.setProperty('--hero-x', `${(pointer.x / innerWidth - .5) * 22}px`);
    hero.style.setProperty('--hero-y', `${(pointer.y / viewportHeight - .5) * 16}px`);
  }
  if (!targetRect || !target) return;
  const nx = (pointer.x - targetRect.left) / targetRect.width - .5;
  const ny = (pointer.y - targetRect.top) / targetRect.height - .5;
  if (target.matches('.project-visual')) {
    target.style.setProperty('--tilt-x', `${(-5 + clamp(nx, -.5, .5) * 5).toFixed(2)}deg`);
    target.style.setProperty('--tilt-y', `${(2 - clamp(ny, -.5, .5) * 4).toFixed(2)}deg`);
  } else {
    target.style.translate = `${clamp(nx * 10, -5, 5).toFixed(1)}px ${clamp(ny * 7, -3.5, 3.5).toFixed(1)}px`;
  }
}
addEventListener('pointermove', event => {
  if (!pointerEnabled() || event.pointerType === 'touch') return;
  pointer = { x: event.clientX, y: event.clientY, target: event.target };
  if (!pointerFrame) pointerFrame = requestAnimationFrame(updatePointer);
}, { passive: true });
function resetPointer() {
  cancelAnimationFrame(pointerFrame);
  pointerFrame = 0;
  pointer = null;
  clearTarget();
  document.body.classList.remove('pointer-present');
  hero.style.removeProperty('--hero-x');
  hero.style.removeProperty('--hero-y');
}
root.addEventListener('pointerleave', resetPointer);
addEventListener('blur', resetPointer);

function syncPreferences() {
  root.classList.toggle('motion-ready', !motionQuery.matches);
  if (motionQuery.matches) reveals.forEach(element => element.classList.add('in'));
  if (!pointerEnabled()) resetPointer();
  if (!compactQuery.matches) mobileNav.open = false;
  scenes.forEach(scene => scene.style.setProperty('--scene-offset', '0'));
  measureNeeded = true;
  queueScroll();
}
[motionQuery, compactQuery, pointerQuery].forEach(query => query.addEventListener('change', syncPreferences));
addEventListener('scroll', () => { targetGeometryDirty = true; queueScroll(); }, { passive: true });
addEventListener('resize', () => { measureNeeded = true; targetGeometryDirty = true; queueScroll(); }, { passive: true });
new ResizeObserver(() => { measureNeeded = true; queueScroll(); }).observe($('main'));
addEventListener('pageshow', () => { measureNeeded = true; queueScroll(); });
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('page-hidden', document.hidden);
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
    resetPointer();
  } else { measureNeeded = true; queueScroll(); }
});
syncPreferences();
initAtmospheres({ motionQuery, compactQuery });
document.body.classList.add('js-ready');

// Native modal semantics provide focus containment and Escape dismissal.
const supportDialog = $('#supportDialog');
const supportOpen = $('#supportOpen');
const supportClose = $('.support-close', supportDialog);
let supportScrollY = 0;
let supportBodyStyle = null;
supportOpen.addEventListener('click', () => {
  supportScrollY = scrollY;
  supportBodyStyle = document.body.getAttribute('style');
  const scrollbarWidth = innerWidth - root.clientWidth;
  const paddingRight = parseFloat(getComputedStyle(document.body).paddingRight);
  Object.assign(document.body.style, {
    position: 'fixed', top: `-${supportScrollY}px`, width: '100%',
    overflow: 'hidden', paddingRight: `${paddingRight + scrollbarWidth}px`
  });
  supportDialog.showModal();
  supportDialog.scrollTop = 0;
  supportClose.focus({ preventScroll: true });
});
supportClose.addEventListener('click', () => supportDialog.close());
// Keep keyboard focus within the dialog, including its language controls.
supportDialog.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    const controls = [...supportDialog.querySelectorAll('button:not([disabled])')];
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last.focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first.focus({ preventScroll: true });
    }
  }
});
let supportBackdropPress = false;
const outsideSupport = event => {
  const rect = supportDialog.getBoundingClientRect();
  return event.clientX < rect.left || event.clientX > rect.right ||
    event.clientY < rect.top || event.clientY > rect.bottom;
};
supportDialog.addEventListener('pointerdown', event => {
  supportBackdropPress = event.target === supportDialog && outsideSupport(event);
});
supportDialog.addEventListener('click', event => {
  if (supportBackdropPress && event.target === supportDialog && outsideSupport(event)) supportDialog.close();
  supportBackdropPress = false;
});
supportDialog.addEventListener('close', () => {
  if (supportBodyStyle === null) document.body.removeAttribute('style');
  else document.body.setAttribute('style', supportBodyStyle);
  window.scrollTo({ top: supportScrollY, behavior: 'instant' });
  supportOpen.focus({ preventScroll: true });
  measureNeeded = true;
  queueScroll();
});



// Static coffee support: each tier has its own file, never an amount-mismatched fallback.
// Set available to true only when the exact final QR file has been supplied.
// Pending entries make no network request, so absent files do not produce 404 noise.
const coffeeAssets = {
  '50': { src: 'assets/support/coffee-50.png', available: true },
  '100': { src: 'assets/support/coffee-100.png', available: true },
  '200': { src: 'assets/support/coffee-200.png', available: true },
  custom: { src: 'assets/support/coffee-custom.png', available: true }
};
const coffeeTiers = $$('.coffee-tier');
const coffeeQr = $('#coffeeQr');
const coffeePlaceholder = $('#coffeePlaceholder');
const coffeePayment = $('#coffeePayment');
const coffeeThanks = $('#coffeeThanksMessage');
let coffeeRequest = 0;
let coffeeObjectUrl;
let coffeeTimer;
let selectedCoffee = '50';

async function loadCoffeeQr(tier) {
  const request = ++coffeeRequest;
  coffeeQr.hidden = true;
  coffeeQr.removeAttribute('src');
  coffeePlaceholder.hidden = false;
  if (coffeeObjectUrl) { URL.revokeObjectURL(coffeeObjectUrl); coffeeObjectUrl = null; }
  if (!coffeeAssets[tier].available) return;
  try {
    const response = await fetch(coffeeAssets[tier].src, { cache: 'no-store' });
    // Missing static routes may return HTML on the host; never show that as a QR.
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return;
    const blob = await response.blob();
    if (request !== coffeeRequest) return;
    const url = URL.createObjectURL(blob);
    coffeeObjectUrl = url;
    coffeeQr.src = url;
    await coffeeQr.decode();
    if (request !== coffeeRequest) return;
    coffeeQr.hidden = false;
    coffeePlaceholder.hidden = true;
  } catch { /* Missing, invalid, or offline assets remain a neutral placeholder. */ }
}
function selectCoffee(tier, animate = true) {
  selectedCoffee = tier;
  updateCoffeeLabels();
  coffeeTiers.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.coffee === tier));
    button.classList.remove('coffee-react');
  });
  coffeeThanks.hidden = true;
  coffeePayment.classList.remove('is-thanked');
  clearCoffeeCelebration();
  const selected = coffeeTiers.find(button => button.dataset.coffee === tier);
  if (animate && !motionQuery.matches) {
    void selected.offsetWidth;
    selected.classList.add('coffee-react');
  }
  loadCoffeeQr(tier);
}
coffeeTiers.forEach((button, index) => {
  button.addEventListener('click', () => selectCoffee(button.dataset.coffee));
  button.addEventListener('keydown', event => {
    const direction = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!direction && !['Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? coffeeTiers.length - 1 : (index + direction + coffeeTiers.length) % coffeeTiers.length;
    coffeeTiers[next].focus({ preventScroll: true });
    selectCoffee(coffeeTiers[next].dataset.coffee);
  });
});
supportOpen.addEventListener('click', () => selectCoffee(selectedCoffee, false));
supportDialog.addEventListener('close', () => {
  coffeeRequest++;
  clearCoffeeCelebration();
});
const coffeeLayer = $('.coffee-celebration');
supportDialog.append(coffeeLayer);
let coffeeThanksAnimation;
function clearCoffeeCelebration() {
  clearTimeout(coffeeTimer);
  coffeeLayer.getAnimations({ subtree: true }).forEach(animation => animation.cancel());
  coffeeLayer.replaceChildren();
  coffeeThanksAnimation?.cancel();
}
function positionCoffeeLayer() {
  const rect = supportDialog.getBoundingClientRect();
  Object.assign(coffeeLayer.style, {
    left: `${rect.left}px`, top: `${rect.top}px`,
    width: `${rect.width}px`, height: `${rect.height}px`
  });

}
function celebrateCoffee() {
  clearCoffeeCelebration();
  positionCoffeeLayer();
  const reduced = motionQuery.matches;
  const small = innerWidth <= 600;
  const count = reduced ? 4 : small ? 14 : 21;
  const layerRect = coffeeLayer.getBoundingClientRect();
  const buttonRect = $('#coffeeSupported').getBoundingClientRect();
  const originX = buttonRect.left + buttonRect.width / 2 - layerRect.left;
  const originY = buttonRect.top - layerRect.top;
  for (let index = 0; index < count; index++) {
    const cup = document.createElement('span');
    cup.className = 'coffee-rain-cup';
    cup.textContent = '☕';
    const nearButton = reduced;
    const size = reduced ? 20 : 18 + Math.random() * (small ? 10 : 16);
    const x = nearButton ? originX + (index - (reduced ? 1.5 : 1)) * 30 : (index + Math.random()) / count * (layerRect.width - 40) + 20;
    const y = nearButton ? Math.max(16,Math.min(layerRect.height - 45,originY - 26)) : -40;
    Object.assign(cup.style, { left: `${Math.max(8,Math.min(layerRect.width - size - 8,x))}px`, top: `${y}px`, fontSize: `${size}px` });
    coffeeLayer.append(cup);
    const rotation = Math.random() * 36 - 18;
    const drift = Math.random() * 32 - 16;
    const distance = nearButton ? Math.min(100,layerRect.height - y + 20) : layerRect.height + 70;
    const transform = (progress, scale = 1) => `translate(${drift * progress}px,${distance * progress}px) rotate(${rotation}deg) scale(${scale})`;
    const frames = reduced
      ? [{ opacity: 0 }, { opacity: .7, offset: .2 }, { opacity: .7, offset: .7 }, { opacity: 0 }]
      : [{ opacity: 0, transform: transform(0) }, { opacity: .65 + Math.random() * .2, transform: transform(.08), offset: .16 }, { opacity: .6, transform: transform(.78), offset: .8 }, { opacity: 0, transform: transform(1,.9) }];
    const animation = cup.animate(frames, {
      duration: reduced ? 1600 : 1800 + Math.random() * 600,
      delay: reduced ? index * 60 : index / (count - 1) * 400,
      easing: reduced ? 'ease' : 'cubic-bezier(.32,.05,.65,.85)', fill: 'both'
    });
    animation.finished.then(() => cup.remove()).catch(() => cup.remove());
  }
  coffeeThanksAnimation = coffeeThanks.animate(
    reduced ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }],
    { duration: 320, easing: 'ease-out' }
  );
  coffeeTimer = setTimeout(clearCoffeeCelebration, 3000);
}
addEventListener('resize', clearCoffeeCelebration);
supportDialog.addEventListener('scroll', () => { if (coffeeLayer.childElementCount) positionCoffeeLayer(); }, { passive: true });
motionQuery.addEventListener('change', clearCoffeeCelebration);
$('#coffeeSupported').addEventListener('click', () => {
  // Decorative acknowledgement only; no transaction verification.
  coffeeThanks.hidden = false;
  coffeePayment.classList.add('is-thanked');
  celebrateCoffee();
});

function updateCoffeeLabels() {
  coffeeQr.alt = document.querySelector(`[data-qr-alt="${selectedCoffee}"]`).textContent;
  document.querySelector('#coffeeAmount').textContent = document.querySelector(`[data-qr-amount="${selectedCoffee}"]`).textContent;
}
initLanguage(() => {
  updateCoffeeLabels();
  // Re-measure translated text without recreating scenes or resetting reveals.
  $$('.scene-rail a').forEach((link, index) => link.setAttribute('aria-label', scenes[index].dataset.nav));
  nowViewing.textContent = (scenes[activeIndex] || scenes[0]).dataset.nav.toUpperCase();
  measureNeeded = true;
  targetGeometryDirty = true;
  queueScroll();
});
