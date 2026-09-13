import { initAtmospheres } from './atmospheres.js';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
const compactQuery = matchMedia('(max-width: 900px)');
const pointerQuery = matchMedia('(hover: hover) and (pointer: fine)');
const scenes = $$('[data-scene]');
const root = document.documentElement;
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
