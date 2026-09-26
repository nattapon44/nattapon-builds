import { initLanguage } from '../i18n.js';

const root = document.documentElement;
const header = document.querySelector('.service-header');
const measureHeader = () => root.style.setProperty('--sticky-header-height', `${header.getBoundingClientRect().height}px`);
measureHeader();
new ResizeObserver(measureHeader).observe(header);
const status = document.querySelector('#copy-status');
initLanguage(() => {
  measureHeader();
  status.textContent = '';
});

document.querySelector('#copy-email').addEventListener('click', async () => {
  const email = document.querySelector('#contact-email');
  try {
    await navigator.clipboard.writeText(email.textContent);
    status.textContent = document.querySelector('#copy-success').textContent;
  } catch {
    const range = document.createRange();
    range.selectNodeContents(email);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = document.querySelector('#copy-fallback').textContent;
  }
});

// Native anchors retain scrolling; keyboard users follow the destination.
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = document.getElementById(link.hash.slice(1));
  if (!target) return;
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});
