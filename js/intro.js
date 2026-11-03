/**
 * intro.js — cinematic intro sequence
 *
 * Responsibilities:
 *  1. Animated particle field behind the title
 *  2. Custom cursor (dot + lagging ring)
 *  3. GSAP timeline: staggered reveal of name, divider, controls, button
 *  4. Curtain wipe transition into the 3D gallery
 *  5. Fires `galleryStart` event so gallery.js begins the game loop
 */

/* =============================================
   PARTICLE BACKGROUND
   ============================================= */
(function () {
  const canvas = document.getElementById('ciParticles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H;

  const COUNT = 90;
  const particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  for (let i = 0; i < COUNT; i++) {
    particles.push({
      x: Math.random() * (typeof W !== 'undefined' ? W : window.innerWidth),
      y: Math.random() * (typeof H !== 'undefined' ? H : window.innerHeight),
      r: 0.4 + Math.random() * 1.4,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.08 - Math.random() * 0.14,
      a: 0.15 + Math.random() * 0.45,
    });
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.a})`;
      ctx.fill();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -4) { p.y = H + 4; p.x = Math.random() * W; }
      if (p.x < -4) p.x = W + 4;
      if (p.x > W + 4) p.x = -4;
    });
    requestAnimationFrame(tick);
  }
  tick();
})();

/* =============================================
   CUSTOM CURSOR
   ============================================= */
(function () {
  const dot      = document.getElementById('cursor');
  const follower = document.getElementById('cursorFollower');
  if (!dot || !follower) return;

  let mx = -200, my = -200;
  let fx = -200, fy = -200;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Follower smoothly chases the dot
  (function animFollower() {
    fx += (mx - fx) * 0.11;
    fy += (my - fy) * 0.11;
    follower.style.left = fx + 'px';
    follower.style.top  = fy + 'px';
    requestAnimationFrame(animFollower);
  })();

  // Grow/shrink on interactive elements
  function addHover(selector) {
    document.querySelectorAll(selector).forEach((el) => {
      el.addEventListener('mouseenter', () => { dot.classList.add('hover'); follower.classList.add('hover'); });
      el.addEventListener('mouseleave', () => { dot.classList.remove('hover'); follower.classList.remove('hover'); });
    });
  }
  addHover('button');
  addHover('a');

  // Hide the custom cursor once we enter the gallery (normal pointer returns)
  window.addEventListener('galleryStart', () => {
    dot.style.display = 'none';
    follower.style.display = 'none';
  });
})();

/* =============================================
   GSAP INTRO TIMELINE
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const gsap = window.gsap;
  if (!gsap) {
    // Fallback: show everything immediately if GSAP fails to load
    ['ci-eyebrow','ci-name-letter','ci-name-tail','ci-divider','ci-role','ci-controls','ci-btn']
      .forEach((cls) => {
        document.querySelectorAll('.' + cls).forEach((el) => {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
      });
    document.querySelector('.ci-divider').style.width = '120px';
    return;
  }

  const tl = gsap.timeline({ delay: 0.35 });

  tl
    /* eyebrow row slides down and fades in */
    .to('.ci-eyebrow', {
      opacity: 1, y: 0,
      duration: 0.9, ease: 'power3.out',
    }, 0)

    /* "W" letter sweeps up out of clip */
    .to('.ci-name-letter', {
      opacity: 1, y: '0%',
      duration: 1.0, ease: 'power4.out',
    }, 0.25)

    /* "eaam" tail fades and rises */
    .to('.ci-name-tail', {
      opacity: 1, y: 0,
      duration: 0.95, ease: 'power4.out',
    }, 0.45)

    /* horizontal divider expands from center */
    .to('.ci-divider', {
      width: 180,
      duration: 0.85, ease: 'power2.out',
    }, 0.72)

    /* subtitle */
    .to('.ci-role', {
      opacity: 1, y: 0,
      duration: 0.7, ease: 'power3.out',
    }, 0.9)

    /* controls box */
    .to('.ci-controls', {
      opacity: 1, y: 0,
      duration: 0.65, ease: 'power3.out',
    }, 1.2)

    /* enter button */
    .to('.ci-btn', {
      opacity: 1, y: 0,
      duration: 0.6, ease: 'power3.out',
    }, 1.45);
});

/* =============================================
   CURTAIN TRANSITION → GALLERY
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const curtain  = document.getElementById('ciCurtain');
  const ci       = document.getElementById('ci');
  const hud      = document.getElementById('hud');

  if (!startBtn) return;

  startBtn.addEventListener('click', () => {
    // Disable double-click
    startBtn.disabled = true;

    const gsap = window.gsap;

    /* Once the curtain covers the screen: hide the intro content, start the
       gallery (its camera begins a slow crane-down) and fade the curtain away */
    const startGallery = () => {
      ci.classList.add('revealing');
      hud.classList.add('visible');
      window.dispatchEvent(new CustomEvent('galleryStart'));
    };

    if (gsap) {
      /* GSAP version — wipe up, then dissolve into the hall */
      gsap.timeline()
        .to(curtain, {
          /* wipe curtain up from bottom */
          clipPath: 'inset(0% 0 0 0)',
          duration: 0.55,
          ease: 'power4.in',
          onStart() { curtain.style.clipPath = 'inset(100% 0 0 0)'; },
        })
        .call(startGallery)
        .to(curtain, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, '+=0.05')
        .call(() => ci.classList.add('gone'));
    } else {
      /* CSS-only fallback */
      curtain.classList.add('wipe');
      curtain.addEventListener('transitionend', () => {
        startGallery();
        curtain.style.transition = 'opacity 1.1s ease';
        curtain.style.opacity = '0';
        setTimeout(() => ci.classList.add('gone'), 1150);
      }, { once: true });
    }
  });
});
