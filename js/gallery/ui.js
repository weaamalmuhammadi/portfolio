/**
 * ui.js — the HTML layer on top of the 3D hall.
 *
 *   Controls legend   key caps along the bottom that light up as you press them
 *   Floating tag      title hovering over the nearest viewing circle
 *   Info panel        project details (or contact details) while the camera
 *                     is looking at something
 *   Menu              full-screen index of the hall — pick an item to walk there
 *
 * The UI never moves the visitor itself; it calls the handlers passed in
 * from main.js (onTravel, onNav, onClose, onMenuChange).
 */

import { SITE, CONTACT, ARTWORKS } from './config.js';

const $ = (sel, root = document) => root.querySelector(sel);
const pad2 = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
));
const hasLink = (url) => Boolean(url) && url !== '#';

/* Opens the visitor's own mail app on a new, empty message addressed to you */
const mailtoHref = () => `mailto:${CONTACT.email}`;

const ARROW = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M1 7.5h12M8 2l6 5.5-6 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ARROW_L = '<svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true"><path d="M14 7.5H2M7 2L1 7.5 7 13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function createUI(handlers) {
  const body = document.body;
  const el = {
    hud:     $('#hud'),
    menuBtn: $('#menuBtn'),
    menuLbl: $('#menuBtn .menu-btn-label'),
    menu:    $('#menu'),
    panel:   $('#panel'),
    tag:     $('#tag'),
    tagTitle: $('#tag .tag-title'),
    tagHint:  $('#tag .tag-hint'),
  };

  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  body.classList.toggle('is-touch', isTouch);

  /* ---------- key caps ---------- */
  const keyEls = {};
  document.querySelectorAll('[data-key]').forEach((k) => {
    (keyEls[k.dataset.key] ||= []).push(k);
  });
  const setKey = (name, down) => (keyEls[name] || []).forEach((k) => k.classList.toggle('down', down));

  /* ---------- menu ---------- */
  buildMenu();

  function buildMenu() {
    const items = ARTWORKS.map((a) => `
      <li style="--i:${a.index}">
        <button class="menu-item" type="button" data-target="${a.index}">
          <span class="menu-num">${pad2(a.index + 1)}</span>
          <span class="menu-title">${esc(a.title)}</span>
          <span class="menu-meta">${esc(a.category)} · ${esc(a.year)}</span>
          <span class="menu-go">Walk there ${ARROW}</span>
        </button>
      </li>`).join('');

    const contactItem = `
      <li style="--i:${ARTWORKS.length}">
        <button class="menu-item menu-item--contact" type="button" data-target="${ARTWORKS.length}">
          <span class="menu-num">—</span>
          <span class="menu-title">Get in touch</span>
          <span class="menu-meta">Say hello</span>
          <span class="menu-go">Walk there ${ARROW}</span>
        </button>
      </li>`;

    const socials = CONTACT.socials.map((s) =>
      `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('');

    el.menu.innerHTML = `
      <div class="menu-inner">
        <section class="menu-col menu-works">
          <span class="menu-eyebrow">The hall · ${pad2(ARTWORKS.length)} works</span>
          <ol class="menu-list">${items}${contactItem}</ol>
        </section>
        <aside class="menu-col menu-side">
          <div class="menu-block">
            <span class="menu-eyebrow">About</span>
            <p class="menu-bio">${esc(SITE.bio[0])}</p>
          </div>
          <div class="menu-block">
            <span class="menu-eyebrow">Contact</span>
            <a class="menu-email" href="${esc(mailtoHref())}">${esc(CONTACT.email)}</a>
            ${socials ? `<ul class="menu-socials">${socials}</ul>` : ''}
          </div>
          <div class="menu-block">
            <span class="menu-eyebrow">How to visit</span>
            <ul class="menu-help">
              <li><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> or arrows</span>Walk</li>
              <li><span>Click / tap the floor</span>Walk there</li>
              <li><span>Stand still in a circle</span>Look closer</li>
              <li><span><kbd>Esc</kbd></span>Open / close this menu</li>
            </ul>
          </div>
          <p class="menu-foot">© ${new Date().getFullYear()} ${esc(SITE.name)} — ${esc(SITE.role)}</p>
        </aside>
      </div>`;

    el.menu.addEventListener('click', (e) => {
      const item = e.target.closest('[data-target]');
      if (!item) return;
      closeMenu();
      handlers.onTravel(Number(item.dataset.target));
    });
  }

  let menuOpen = false;
  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    body.classList.add('menu-open');
    el.menu.setAttribute('aria-hidden', 'false');
    el.menu.inert = false;
    el.menuBtn.setAttribute('aria-expanded', 'true');
    el.menuLbl.textContent = 'Close';
    setTimeout(() => { if (menuOpen) $('.menu-item', el.menu)?.focus({ preventScroll: true }); }, 350);
    handlers.onMenuChange?.(true);
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    body.classList.remove('menu-open');
    el.menu.setAttribute('aria-hidden', 'true');
    el.menu.inert = true;
    el.menuBtn.setAttribute('aria-expanded', 'false');
    el.menuLbl.textContent = 'Menu';
    if (el.menu.contains(document.activeElement)) document.activeElement.blur();
    handlers.onMenuChange?.(false);
  }
  el.menu.inert = true;
  el.menuBtn.addEventListener('click', () => (menuOpen ? closeMenu() : openMenu()));

  /* ---------- info panel ---------- */
  function reveal(html) {
    el.panel.innerHTML = html;
    el.panel.querySelectorAll('.reveal').forEach((node, i) => node.style.setProperty('--i', i));
    el.panel.classList.remove('visible');
    void el.panel.offsetWidth;          // restart the staggered reveal
    el.panel.classList.add('visible');
    el.panel.inert = false;
    body.classList.add('panel-open');
  }

  /* A few short lines under the description — only for projects that define them */
  const highlights = (a) => (a.highlights?.length
    ? `<ul class="panel-highlights reveal">${a.highlights.map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`
    : '');

  const panelFoot = (index) => `
    <div class="panel-foot reveal">
      <button type="button" class="panel-nav" data-nav="-1">${ARROW_L}<span>Prev</span></button>
      <span class="panel-dots" aria-hidden="true">${
        Array.from({ length: ARTWORKS.length + 1 }, (_, i) => `<i class="${i === index ? 'on' : ''}"></i>`).join('')
      }</span>
      <button type="button" class="panel-nav" data-nav="1"><span>Next</span>${ARROW}</button>
    </div>
    <p class="panel-hint reveal">${isTouch ? 'Tap the floor' : 'Walk away'} to keep exploring</p>`;

  function showProject(index) {
    const a = ARTWORKS[index];
    // No link on the project? Then the panel simply doesn't mention one.
    const link = hasLink(a.link)
      ? `<div class="panel-actions reveal"><a class="panel-link" href="${esc(a.link)}" target="_blank" rel="noopener"><span>View project</span>${ARROW}</a></div>`
      : '';

    reveal(`
      <button type="button" class="panel-close" data-close aria-label="Close details">×</button>
      <span class="panel-rule reveal"></span>
      <span class="panel-index reveal">${pad2(index + 1)} <em>/ ${pad2(ARTWORKS.length)}</em></span>
      <h2 class="panel-title reveal">${esc(a.title)}</h2>
      <div class="panel-meta reveal"><span>${esc(a.category)}</span><span>${esc(a.year)}</span></div>
      <ul class="panel-tags reveal">${a.tech.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <p class="panel-desc reveal">${esc(a.desc)}</p>
      ${highlights(a)}
      ${link}
      ${panelFoot(index)}`);
  }

  function showContact() {
    const socials = CONTACT.socials.map((s) =>
      `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('');
    reveal(`
      <button type="button" class="panel-close" data-close aria-label="Close details">×</button>
      <span class="panel-rule reveal"></span>
      <span class="panel-index reveal">Get in touch</span>
      <h2 class="panel-title reveal">Let’s build something together</h2>
      <p class="panel-desc reveal">Have a project, a job offer, or just want to say hi? Drop me a line — I read every message.</p>
      <div class="panel-email reveal">
        <a class="panel-mail" href="${esc(mailtoHref())}">${esc(CONTACT.email)}${ARROW}</a>
        <button type="button" class="panel-copy" data-copy>Copy</button>
      </div>
      ${socials ? `<ul class="panel-socials reveal">${socials}</ul>` : ''}
      ${panelFoot(ARTWORKS.length)}`);
  }

  function hidePanel() {
    el.panel.classList.remove('visible');
    el.panel.inert = true;
    body.classList.remove('panel-open');
    if (el.panel.contains(document.activeElement)) document.activeElement.blur();
  }
  el.panel.inert = true;

  el.panel.addEventListener('click', (e) => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { handlers.onNav(Number(nav.dataset.nav)); return; }
    if (e.target.closest('[data-close]')) { handlers.onClose(); return; }
    const copy = e.target.closest('[data-copy]');
    if (copy) copyEmail(copy);
  });

  function copyEmail(btn) {
    const done = (ok) => {
      btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
      setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(CONTACT.email).then(() => done(true), () => done(false));
    } else {
      done(false);
    }
  }

  /* ---------- floating tag ---------- */
  let tagVisible = false;
  function setTag(visible, title = '', hint = '', x = 0, y = 0) {
    if (visible) {
      if (el.tagTitle.textContent !== title) el.tagTitle.textContent = title;
      if (el.tagHint.textContent !== hint) el.tagHint.textContent = hint;
      el.tag.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -100%)`;
    }
    if (visible !== tagVisible) {
      tagVisible = visible;
      el.tag.classList.toggle('visible', visible);
    }
  }

  return {
    isTouch,
    setKey,
    flashKey(name) { setKey(name, true); setTimeout(() => setKey(name, false), 160); },
    clearKeys() { document.querySelectorAll('[data-key].down').forEach((k) => k.classList.remove('down')); },
    openMenu, closeMenu,
    toggleMenu() { menuOpen ? closeMenu() : openMenu(); },
    isMenuOpen: () => menuOpen,
    showProject, showContact, hidePanel,
    setTag,
  };
}
