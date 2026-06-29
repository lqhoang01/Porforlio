// ============================================
// LE QUANG HOANG — PORTFOLIO SCRIPT v2
// ============================================

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotionGlobal = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Hero name: split into per-letter spans for a cascading reveal once loaded ---
  const heroNameEl = document.querySelector('.hero-name');
  if (heroNameEl && !prefersReducedMotionGlobal) {
    const text = heroNameEl.textContent;
    heroNameEl.innerHTML = '';
    let visibleIndex = 0;
    text.split('').forEach((char) => {
      const span = document.createElement('span');
      span.className = 'hero-name-char';
      span.textContent = char;
      if (char !== ' ') {
        span.style.setProperty('--char-delay', `${0.7 + visibleIndex * 0.045}s`);
        visibleIndex++;
      } else {
        span.style.setProperty('--char-delay', '0s');
      }
      heroNameEl.appendChild(span);
    });
  }

  // --- Hero role pills: stagger each pill's entrance individually ---
  const rolePills = document.querySelectorAll('.hero-role-pills .role-pill');
  rolePills.forEach((pill, i) => {
    pill.style.setProperty('--pill-delay', `${1.15 + i * 0.1}s`);
  });

  // ============================================
  // LOADING SCREEN
  // ============================================
  const loader = document.getElementById('loader');
  const loaderBarFill = document.getElementById('loaderBarFill');
  const loaderStatus = document.getElementById('loaderStatus');
  document.body.classList.add('is-loading');

  const loadSteps = [
    { pct: 18, msg: 'booting workspace…' },
    { pct: 42, msg: 'mounting components…' },
    { pct: 68, msg: 'compiling styles…' },
    { pct: 90, msg: 'starting dev server…' },
    { pct: 100, msg: 'ready' },
  ];

  function runLoader() {
    let stepIndex = 0;
    function nextStep() {
      if (stepIndex >= loadSteps.length) {
        finishLoading();
        return;
      }
      const step = loadSteps[stepIndex];
      if (loaderBarFill) loaderBarFill.style.width = step.pct + '%';
      if (loaderStatus) loaderStatus.textContent = step.msg;
      stepIndex++;
      setTimeout(nextStep, 280 + Math.random() * 180);
    }
    nextStep();
  }

  function finishLoading() {
    if (loader) loader.classList.add('loader-hidden');
    document.body.classList.remove('is-loading');
    document.body.classList.add('loaded');
    setTimeout(() => { if (loader) loader.style.display = 'none'; }, 650);
  }

  if (prefersReducedMotionGlobal) {
    finishLoading();
  } else {
    runLoader();
  }

  // ============================================
  // CUSTOM CURSOR
  // ============================================
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  const hasFinePointerGlobal = window.matchMedia('(pointer: fine)').matches;

  if (cursorDot && cursorRing && hasFinePointerGlobal) {
    document.body.classList.add('has-custom-cursor');
    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    function animateRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(animateRing);
    }
    requestAnimationFrame(animateRing);

    const hoverTargets = 'a, button, .card, .project-card, .skill-tag, .cmdk-item, input';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverTargets)) cursorRing.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverTargets)) cursorRing.classList.remove('cursor-hover');
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.classList.add('cursor-hidden');
      cursorRing.classList.add('cursor-hidden');
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.classList.remove('cursor-hidden');
      cursorRing.classList.remove('cursor-hidden');
    });
  }

  // ============================================
  // MAGNETIC BUTTONS + RIPPLE
  // ============================================
  document.querySelectorAll('.btn').forEach(btn => {
    if (hasFinePointerGlobal && !prefersReducedMotionGlobal) {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.35}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0, 0)';
      });
    }

    btn.addEventListener('click', (e) => {
      const rect = btn.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height);
      ripple.className = 'btn-ripple';
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
      ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });

  // ============================================
  // NAVIGATION + COMMAND PALETTE
  // ============================================
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const navProgress = document.getElementById('navProgress');
  const scrollTopBtn = document.getElementById('scrollTop');
  const scrollTopProgress = document.getElementById('scrollTopProgress');
  const sections = document.querySelectorAll('section[id]');

  let lastScrollTop = 0;
  const RING_CIRCUMFERENCE = 119.4; // 2 * PI * r(19)

  function handleScroll() {
    const scrollY = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollY / docHeight, 1) : 0;

    navbar.classList.toggle('scrolled', scrollY > 20);
    if (navProgress) navProgress.style.width = (progress * 100) + '%';

    // Hide navbar on scroll down, show on scroll up (only past a threshold)
    if (scrollY > lastScrollTop && scrollY > 160) {
      navbar.classList.add('nav-hidden');
    } else {
      navbar.classList.remove('nav-hidden');
    }
    lastScrollTop = scrollY;

    scrollTopBtn.classList.toggle('visible', scrollY > 480);
    if (scrollTopProgress) {
      const offset = RING_CIRCUMFERENCE * (1 - progress);
      scrollTopProgress.style.strokeDashoffset = offset.toFixed(1);
    }

    updateActiveLink();
  }

  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });

  document.querySelectorAll('.nav-menu a').forEach(link => {
    link.addEventListener('click', () => navMenu.classList.remove('active'));
  });

  function updateActiveLink() {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 140;
      if (window.scrollY >= sectionTop) current = section.getAttribute('id');
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
  }

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // --- Command Palette (Ctrl/Cmd + K) ---
  const cmdkOverlay = document.getElementById('cmdkOverlay');
  const cmdkInput = document.getElementById('cmdkInput');
  const cmdkList = document.getElementById('cmdkList');
  const cmdkTrigger = document.getElementById('cmdkTrigger');

  const cmdkCommands = [
    { label: 'Go to Home', hint: 'Section', icon: 'home', action: () => scrollToSection('home') },
    { label: 'Go to About', hint: 'Section', icon: 'user', action: () => scrollToSection('about') },
    { label: 'Go to Experience', hint: 'Section', icon: 'briefcase', action: () => scrollToSection('experience') },
    { label: 'Go to Projects', hint: 'Section', icon: 'folder', action: () => scrollToSection('projects') },
    { label: 'Go to Skills', hint: 'Section', icon: 'code', action: () => scrollToSection('skills') },
    { label: 'Go to Contact', hint: 'Section', icon: 'mail', action: () => scrollToSection('contact') },
    { label: 'Download CV', hint: 'PDF', icon: 'download', action: () => { window.location.href = 'LeQuangHoang.pdf'; } },
    { label: 'Open GitHub', hint: 'External', icon: 'github', action: () => window.open('https://github.com/lqhoang01', '_blank') },
    { label: 'Email Me', hint: 'Contact', icon: 'mail', action: () => { window.location.href = 'mailto:lequanghoang1001@gmail.com'; } },
  ];

  const cmdkIcons = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    user: '<circle cx="12" cy="8" r="4"></circle><path d="M6 21v-2a6 6 0 0 1 12 0v2"></path>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>',
    code: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>',
    github: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>',
  };

  function scrollToSection(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  let cmdkActiveIndex = 0;
  let cmdkFiltered = cmdkCommands;

  function renderCmdkList(filter = '') {
    cmdkFiltered = cmdkCommands.filter(c => c.label.toLowerCase().includes(filter.toLowerCase()));
    cmdkList.innerHTML = '';

    if (cmdkFiltered.length === 0) {
      cmdkList.innerHTML = '<div class="cmdk-empty">No matching commands</div>';
      return;
    }

    cmdkFiltered.forEach((cmd, i) => {
      const item = document.createElement('div');
      item.className = 'cmdk-item' + (i === cmdkActiveIndex ? ' cmdk-active' : '');
      item.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${cmdkIcons[cmd.icon] || ''}</svg><span class="cmdk-item-label">${cmd.label}</span><span class="cmdk-item-hint">${cmd.hint}</span>`;
      item.addEventListener('click', () => { cmd.action(); closeCmdk(); });
      cmdkList.appendChild(item);
    });
  }

  function openCmdk() {
    cmdkOverlay.classList.add('active');
    cmdkInput.value = '';
    cmdkActiveIndex = 0;
    renderCmdkList();
    setTimeout(() => cmdkInput.focus(), 50);
  }

  function closeCmdk() {
    cmdkOverlay.classList.remove('active');
  }

  if (cmdkTrigger) cmdkTrigger.addEventListener('click', openCmdk);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      cmdkOverlay.classList.contains('active') ? closeCmdk() : openCmdk();
    } else if (e.key === 'Escape' && cmdkOverlay.classList.contains('active')) {
      closeCmdk();
    } else if (cmdkOverlay.classList.contains('active')) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdkActiveIndex = Math.min(cmdkActiveIndex + 1, cmdkFiltered.length - 1);
        renderCmdkList(cmdkInput.value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdkActiveIndex = Math.max(cmdkActiveIndex - 1, 0);
        renderCmdkList(cmdkInput.value);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (cmdkFiltered[cmdkActiveIndex]) {
          cmdkFiltered[cmdkActiveIndex].action();
          closeCmdk();
        }
      }
    }
  });

  if (cmdkInput) {
    cmdkInput.addEventListener('input', () => {
      cmdkActiveIndex = 0;
      renderCmdkList(cmdkInput.value);
    });
  }

  if (cmdkOverlay) {
    cmdkOverlay.addEventListener('click', (e) => {
      if (e.target === cmdkOverlay) closeCmdk();
    });
  }

  // Scroll reveal animation (fade + blur + slide up)
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // Counter animation for hero stats (animates numeric stat values once visible)
  const counters = document.querySelectorAll('.hero-stat-num');
  let countersAnimated = false;

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    counters.forEach(el => {
      const fullText = el.textContent.trim();
      const match = fullText.match(/^(\d+)/);
      if (!match) return; // skip non-numeric (e.g. "2025" still numeric, handled below)

      const target = parseInt(match[1], 10);
      const suffix = fullText.replace(match[1], ''); // keeps "+" unit span text if present
      const unitEl = el.querySelector('.unit');
      const duration = 900;
      const start = performance.now();

      function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * target);
        el.textContent = current;
        if (unitEl) {
          const span = document.createElement('span');
          span.className = 'unit';
          span.textContent = unitEl.textContent;
          el.appendChild(span);
        }
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target;
          if (unitEl) {
            const span = document.createElement('span');
            span.className = 'unit';
            span.textContent = unitEl.textContent;
            el.appendChild(span);
          }
        }
      }
      requestAnimationFrame(tick);
    });
  }

  const heroStats = document.querySelector('.hero-stats');
  if (heroStats) {
    const statsObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounters();
          statsObserver.disconnect();
        }
      });
    }, { threshold: 0.4 });
    statsObserver.observe(heroStats);
  }

  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // ============================================
  // SIGNATURE 3D WORKSTATION
  // ============================================

  const scene = document.getElementById('workstationScene');
  const rig = document.getElementById('workstationRig');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

  const BASE_TILT_X = 8;   // resting rotateX
  const BASE_TILT_Y = -16; // resting rotateY
  let targetRX = BASE_TILT_X;
  let targetRY = BASE_TILT_Y;
  let currentRX = BASE_TILT_X;
  let currentRY = BASE_TILT_Y;

  if (scene && rig) {
    if (hasFinePointer && !prefersReducedMotion) {
      scene.addEventListener('mousemove', (e) => {
        const rect = scene.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        targetRX = BASE_TILT_X - y * 14;
        targetRY = BASE_TILT_Y + x * 22;

        // Dynamic lighting follows cursor position
        const monitorGlow = document.querySelector('.ws-monitor-glow');
        if (monitorGlow) {
          monitorGlow.style.setProperty('--light-intensity', (0.16 + Math.abs(x) * 0.12).toFixed(2));
        }

        // Desk lamp head subtly redirects its light cone toward the cursor
        const lampCone = document.getElementById('wsLampCone');
        if (lampCone) {
          lampCone.style.setProperty('--cone-rotate', `${x * 14}deg`);
        }

        // Contact shadow drifts opposite the cursor for a believable sense of depth
        const contactShadow = document.querySelector('.ws-contact-shadow');
        if (contactShadow) {
          contactShadow.style.transform = `translate(calc(-50% + ${(-x * 14).toFixed(1)}px), calc(-50% + ${(-y * 8).toFixed(1)}px)) rotateX(90deg) translateZ(-39px)`;
        }

        // Keyboard tilts a touch toward the cursor, like a hand resting near it
        const keyboard = document.querySelector('.ws-keyboard');
        if (keyboard) {
          keyboard.style.transform = `translate(-50%, -50%) rotateX(${90 + y * 2}deg) translateZ(6px) rotateZ(${(x * 1.5).toFixed(2)}deg)`;
        }
      });

      scene.addEventListener('mouseleave', () => {
        targetRX = BASE_TILT_X;
        targetRY = BASE_TILT_Y;
      });

      // Smoothly interpolate toward target rotation for a natural, lagging feel
      function animateTilt() {
        currentRX += (targetRX - currentRX) * 0.08;
        currentRY += (targetRY - currentRY) * 0.08;
        rig.style.setProperty('--tilt-x', `${currentRX}deg`);
        rig.style.setProperty('--tilt-y', `${currentRY}deg`);
        rig.style.transform = `rotateX(${currentRX}deg) rotateY(${currentRY}deg)`;
        requestAnimationFrame(animateTilt);
      }
      requestAnimationFrame(animateTilt);
    }
  }

  // --- RGB ambient: slowly cycle the lamp bulb tint in sync with the desk LED strip ---
  if (!prefersReducedMotion) {
    const lampBulb = document.getElementById('wsLampBulb');
    const rgbPalette = ['#ffd9a0', '#a0c4ff', '#ffa0c4', '#a0ffd9'];
    let paletteIndex = 0;
    if (lampBulb) {
      setInterval(() => {
        paletteIndex = (paletteIndex + 1) % rgbPalette.length;
        lampBulb.style.setProperty('--lamp-color', rgbPalette[paletteIndex]);
      }, 4000);
    }
  }

  // --- VS Code: typewriter effect through real snippets inspired by this site's own code ---
  const codeFiles = {
    'script.js': [
      [{ t: 'tok-com', v: '// scroll reveal — fade, slide & blur in' }],
      [{ t: 'tok-kw', v: 'const ' }, { t: 'tok-var', v: 'revealEls ' }, { t: 'tok-punc', v: '= ' }, { t: 'tok-fn', v: 'document.querySelectorAll' }, { t: 'tok-punc', v: '(' }, { t: 'tok-str', v: "'.reveal'" }, { t: 'tok-punc', v: ');' }],
      [{ t: 'tok-kw', v: 'const ' }, { t: 'tok-var', v: 'observer ' }, { t: 'tok-punc', v: '= ' }, { t: 'tok-kw', v: 'new ' }, { t: 'tok-fn', v: 'IntersectionObserver' }, { t: 'tok-punc', v: '((' }, { t: 'tok-var', v: 'entries' }, { t: 'tok-punc', v: ') => {' }],
      [{ t: 'tok-var', v: '  entries' }, { t: 'tok-punc', v: '.' }, { t: 'tok-fn', v: 'forEach' }, { t: 'tok-punc', v: '((' }, { t: 'tok-var', v: 'entry' }, { t: 'tok-punc', v: ') => {' }],
      [{ t: 'tok-kw', v: '    if ' }, { t: 'tok-punc', v: '(' }, { t: 'tok-var', v: 'entry.isIntersecting' }, { t: 'tok-punc', v: ') {' }],
      [{ t: 'tok-var', v: '      entry.target.classList' }, { t: 'tok-punc', v: '.' }, { t: 'tok-fn', v: 'add' }, { t: 'tok-punc', v: '(' }, { t: 'tok-str', v: "'visible'" }, { t: 'tok-punc', v: ');' }],
      [{ t: 'tok-punc', v: '    }' }],
      [{ t: 'tok-punc', v: '  });' }],
      [{ t: 'tok-punc', v: '}, { ' }, { t: 'tok-var', v: 'threshold' }, { t: 'tok-punc', v: ': ' }, { t: 'tok-num', v: '0.1 ' }, { t: 'tok-punc', v: '});' }],
      [{ t: 'tok-com', v: '' }],
      [{ t: 'tok-fn', v: 'revealEls.forEach' }, { t: 'tok-punc', v: '(' }, { t: 'tok-var', v: 'el ' }, { t: 'tok-punc', v: '=> ' }, { t: 'tok-var', v: 'observer.observe' }, { t: 'tok-punc', v: '(' }, { t: 'tok-var', v: 'el' }, { t: 'tok-punc', v: '));' }],
    ],
    'index.html': [
      [{ t: 'tok-punc', v: '<' }, { t: 'tok-kw', v: 'section' }, { t: 'tok-var', v: ' class' }, { t: 'tok-punc', v: '="' }, { t: 'tok-str', v: 'hero' }, { t: 'tok-punc', v: '">' }],
      [{ t: 'tok-com', v: '  <!-- signature 3D workstation -->' }],
      [{ t: 'tok-punc', v: '  <' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-var', v: ' class' }, { t: 'tok-punc', v: '="' }, { t: 'tok-str', v: 'workstation-scene' }, { t: 'tok-punc', v: '">' }],
      [{ t: 'tok-punc', v: '    <' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-var', v: ' class' }, { t: 'tok-punc', v: '="' }, { t: 'tok-str', v: 'ws-monitor' }, { t: 'tok-punc', v: '">' }],
      [{ t: 'tok-punc', v: '      <' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-var', v: ' class' }, { t: 'tok-punc', v: '="' }, { t: 'tok-str', v: 'vscode' }, { t: 'tok-punc', v: '">…</' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-punc', v: '>' }],
      [{ t: 'tok-punc', v: '    </' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-punc', v: '>' }],
      [{ t: 'tok-punc', v: '  </' }, { t: 'tok-kw', v: 'div' }, { t: 'tok-punc', v: '>' }],
      [{ t: 'tok-com', v: '' }],
      [{ t: 'tok-com', v: '  <!-- built with HTML, CSS & JS — no 3D libraries -->' }],
      [{ t: 'tok-punc', v: '</' }, { t: 'tok-kw', v: 'section' }, { t: 'tok-punc', v: '>' }],
    ],
  };

  const fileOrder = ['script.js', 'index.html'];
  let currentFileIndex = 0;
  const codeEl = document.getElementById('vscodeCode');
  const vscodeTabs = document.querySelectorAll('.vtab');
  const vscodeFilename = document.querySelector('.vscode-filename');
  const vftActiveFile = document.querySelector('.vft-item.active-file');

  function renderLineHTML(tokens) {
    return tokens.map(tok => `<span class="${tok.t}">${escapeHtml(tok.v)}</span>`).join('');
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function switchToFile(fileName) {
    vscodeTabs.forEach(tab => tab.classList.toggle('active', tab.textContent.trim() === fileName));
    if (vscodeFilename) vscodeFilename.textContent = `${fileName} — portfolio`;
    if (vftActiveFile) vftActiveFile.textContent = fileName === 'index.html' ? 'index.html' : fileName;
  }

  function typeCode() {
    if (!codeEl) return;
    const fileName = fileOrder[currentFileIndex];
    const codeLines = codeFiles[fileName];
    switchToFile(fileName);
    codeEl.innerHTML = '';
    let lineIndex = 0;

    function nextLine() {
      if (lineIndex >= codeLines.length) {
        // brief pause, then switch to the other file for a living, looping workspace
        setTimeout(() => {
          currentFileIndex = (currentFileIndex + 1) % fileOrder.length;
          typeCode();
        }, 3200);
        return;
      }
      const lineNum = lineIndex + 1;
      const row = document.createElement('div');
      row.innerHTML = `<span class="tok-com" style="opacity:.35">${String(lineNum).padStart(2, ' ')}</span>  `;
      codeEl.appendChild(row);

      const tokens = codeLines[lineIndex];
      const full = renderLineHTML(tokens);
      const cursor = document.createElement('span');
      cursor.className = 'code-cursor';
      row.appendChild(cursor);

      // Reveal line content quickly (typewriter feel without per-character cost)
      row.querySelector('.code-cursor').insertAdjacentHTML('beforebegin', full);

      lineIndex++;
      setTimeout(nextLine, 160 + Math.random() * 90);
    }
    nextLine();
  }

  typeCode();

  // --- Terminal: realistic dev command sequence with typed-out lines ---
  const terminalSequence = [
    { type: 'cmd', text: 'whoami' },
    { type: 'out', text: 'hoang' },
    { type: 'cmd', text: 'git status' },
    { type: 'out', text: 'On branch main' },
    { type: 'out', text: "Your branch is up to date with 'origin/main'." },
    { type: 'ok', text: 'nothing to commit, working tree clean' },
    { type: 'cmd', text: 'npm run dev' },
    { type: 'out', text: 'vite v5.2.0 dev server running' },
    { type: 'ok', text: '➜  Local:   http://localhost:5173/' },
    { type: 'cmd', text: 'git add . && git commit -m "polish hero"' },
    { type: 'out', text: '[main 4e1a02c] polish hero section' },
    { type: 'out', text: ' 3 files changed, 142 insertions(+)' },
    { type: 'cmd', text: 'npm run build' },
    { type: 'out', text: 'building for production...' },
    { type: 'ok', text: '✓ built in 1.84s' },
    { type: 'cmd', text: 'git push origin main' },
    { type: 'ok', text: 'Deployment successful ✓' },
  ];

  const terminalEl = document.getElementById('terminalBody');
  const PROMPT = 'hoang@dev ~/portfolio $ ';

  function appendTermLine(html) {
    if (!terminalEl) return;
    const row = document.createElement('div');
    row.innerHTML = html;
    terminalEl.appendChild(row);
    while (terminalEl.children.length > 9) {
      terminalEl.removeChild(terminalEl.firstChild);
    }
    terminalEl.scrollTop = terminalEl.scrollHeight;
  }

  function runTerminal() {
    if (!terminalEl) return;
    terminalEl.innerHTML = '';
    let i = 0;

    function step() {
      if (i >= terminalSequence.length) {
        setTimeout(() => { terminalEl.innerHTML = ''; i = 0; step(); }, 2600);
        return;
      }
      const item = terminalSequence[i];

      if (item.type === 'cmd') {
        // typewriter effect for commands
        const row = document.createElement('div');
        row.innerHTML = `<span class="term-prompt">${escapeHtml(PROMPT)}</span><span class="term-cmd-text"></span><span class="code-cursor"></span>`;
        terminalEl.appendChild(row);
        const cmdSpan = row.querySelector('.term-cmd-text');
        let charIndex = 0;
        const text = item.text;

        function typeChar() {
          if (charIndex <= text.length) {
            cmdSpan.textContent = text.slice(0, charIndex);
            charIndex++;
            setTimeout(typeChar, 28 + Math.random() * 35);
          } else {
            row.querySelector('.code-cursor')?.remove();
            i++;
            setTimeout(step, 260);
          }
        }
        typeChar();
        while (terminalEl.children.length > 9) terminalEl.removeChild(terminalEl.firstChild);
      } else {
        const cls = item.type === 'ok' ? 'term-ok' : item.type === 'err' ? 'term-err' : 'term-out';
        appendTermLine(`<span class="${cls}">${escapeHtml(item.text)}</span>`);
        i++;
        setTimeout(step, 180 + Math.random() * 140);
      }
    }
    step();
  }

  runTerminal();

  // --- Keyboard: subtle random key-light pulses to feel "alive" while typing happens elsewhere ---
  const kbRowsContainer = document.getElementById('keyboardRows');
  if (kbRowsContainer) {
    const rowLengths = [12, 12, 11, 9];
    rowLengths.forEach(len => {
      const row = document.createElement('div');
      row.className = 'kb-row';
      for (let k = 0; k < len; k++) {
        const key = document.createElement('div');
        key.className = 'kb-key';
        row.appendChild(key);
      }
      kbRowsContainer.appendChild(row);
    });

    const allKeys = kbRowsContainer.querySelectorAll('.kb-key');
    if (!prefersReducedMotion) {
      setInterval(() => {
        const key = allKeys[Math.floor(Math.random() * allKeys.length)];
        key.classList.add('lit');
        setTimeout(() => key.classList.remove('lit'), 140);
      }, 110);
    }
  }

  // Subtle parallax drift for ambient background blobs based on scroll position
  const blobs = document.querySelectorAll('.bg-blob');
  let lastScrollY = window.scrollY;
  let ticking = false;

  function updateParallax() {
    blobs.forEach((blob, i) => {
      const speed = 0.04 + i * 0.015;
      const offset = lastScrollY * speed;
      blob.style.transform = `translateY(${offset}px)`;
    });
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    lastScrollY = window.scrollY;
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  });

  // Reveal-stagger: apply incremental delay to direct children of staggered groups
  document.querySelectorAll('.about-story, .achievements-grid, .skills-grid, .projects-grid').forEach(group => {
    Array.from(group.children).forEach((child, i) => {
      child.style.transitionDelay = `${i * 60}ms`;
    });
  });

  // ============================================
  // PROJECT MODAL — case studies built only from real, confirmed information
  // ============================================

  const bannerSvg = (gradId, colorA, colorB) => `
    <svg viewBox="0 0 880 220" preserveAspectRatio="none">
      <defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${colorA}" stop-opacity="0.45"/>
        <stop offset="100%" stop-color="${colorB}" stop-opacity="0.08"/>
      </linearGradient></defs>
      <rect width="880" height="220" fill="url(#${gradId})"/>
      <rect x="40" y="34" width="800" height="36" rx="6" fill="none" stroke="${colorA}" stroke-width="1.2" opacity="0.5"/>
      <rect x="40" y="86" width="380" height="100" rx="8" fill="none" stroke="${colorB}" stroke-width="1.2" opacity="0.4"/>
      <rect x="440" y="86" width="400" height="46" rx="8" fill="none" stroke="${colorB}" stroke-width="1.2" opacity="0.35"/>
      <rect x="440" y="140" width="400" height="46" rx="8" fill="none" stroke="${colorA}" stroke-width="1.2" opacity="0.35"/>
    </svg>`;

  const gallerySvg = (colorA) => `
    <svg viewBox="0 0 200 125" preserveAspectRatio="none">
      <rect width="200" height="125" fill="#16161a"/>
      <rect x="14" y="14" width="172" height="18" rx="3" fill="none" stroke="${colorA}" stroke-width="1" opacity="0.5"/>
      <rect x="14" y="42" width="80" height="68" rx="5" fill="none" stroke="${colorA}" stroke-width="1" opacity="0.4"/>
      <rect x="104" y="42" width="82" height="30" rx="5" fill="none" stroke="${colorA}" stroke-width="1" opacity="0.35"/>
      <rect x="104" y="80" width="82" height="30" rx="5" fill="none" stroke="${colorA}" stroke-width="1" opacity="0.35"/>
    </svg>`;

  // Real screenshot helpers — used wherever an actual image is available, instead of an abstract mockup
  const bannerImg = (src, alt) => `<img src="${src}" alt="${alt}" loading="lazy" class="pm-banner-img">`;
  const galleryImg = (src, alt) => `<img src="${src}" alt="${alt}" loading="lazy">`;

  // Only confirmed, real details are included. Where information wasn't provided
  // (e.g. ongoing confidential work), the modal stays short rather than inventing specifics.
  const projectData = {
    vietforture: {
      eyebrow: 'Freelance Web Developer · VietForture',
      title: 'VietForture — Credit & Housing Platform',
      subtitle: 'Responsive business website with an integrated chat assistant',
      banner: bannerImg('images/vietforture/hero.jpg', 'VietForture homepage'),
      meta: [
        { k: 'Role', v: 'Web Developer & Front-End Consultant' },
        { k: 'Stack', v: 'HTML, CSS, JavaScript' },
        { k: 'Year', v: '2025' },
        { k: 'Status', v: 'Live' },
      ],
      overview: 'VietForture is a credit-and-housing company that needed a professional website to present both its services clearly. The build also includes "VietForture Chat" — a lightweight assistant embedded in the site for quick visitor lookups, building on an earlier personal experiment with a local AI assistant setup.',
      problem: "VietForture needed a modern website to present its services in a more professional and organized way. The previous structure lacked a clear information hierarchy, making it difficult for visitors to quickly understand the company's offerings and navigate through different service categories.",
      solution: 'I redesigned and developed a responsive website with a clean user interface and improved user experience. The project focused on organizing information into clear sections, creating reusable UI components, improving visual consistency, and making the website easier to navigate across desktop and mobile devices.',
      challenges: [
        'Organizing a large amount of business information into a simple layout.',
        'Designing reusable components while keeping the interface consistent.',
        'Balancing modern visual design with readability.',
        'Ensuring responsive behavior across different screen sizes.',
        'Creating smooth animations without sacrificing performance.',
      ],
      results: [
        'Delivered a cleaner and more professional company website.',
        'Improved navigation and content organization.',
        'Created a scalable front-end structure for future expansion.',
        'Enhanced visual consistency and overall user experience.',
        'Optimized responsiveness and front-end performance.',
      ],
      gallery: [
        galleryImg('images/vietforture/hero.jpg', 'VietForture homepage'),
        galleryImg('images/vietforture/vietbot.jpg', 'VIETBOT chat assistant'),
        galleryImg('images/vietforture/careers.jpg', 'Careers page'),
        galleryImg('images/vietforture/news.jpg', 'News section'),
        galleryImg('images/vietforture/contact.jpg', 'Contact page with office map'),
        galleryImg('images/vietforture/ktx.jpg', 'Dormitory meal ordering page'),
      ],
      links: [
        { label: 'Live Site', url: 'https://www.vietforture.com.vn/', icon: 'external' },
        { label: 'GitHub', url: 'https://github.com/lqhoang01/VietForture', icon: 'github' },
      ],
    },

    landing: {
      eyebrow: 'Personal Practice Project',
      title: 'Landing Page Project',
      subtitle: 'A self-directed build to sharpen core front-end fundamentals',
      banner: bannerSvg('blp', '#a78bfa', '#34d399'),
      meta: [
        { k: 'Role', v: 'Solo Developer' },
        { k: 'Stack', v: 'HTML, CSS, JavaScript' },
        { k: 'Type', v: 'Practice Project' },
        { k: 'Status', v: 'Live' },
      ],
      overview: 'A simple, responsive landing page built outside of client work to practice core HTML and CSS layout skills — sections, navigation, and basic responsive design — without a framework.',
      problem: 'As a self-taught developer, I wanted a focused exercise to practice structuring a complete page (navigation, hero, features, contact) using clean, semantic HTML and CSS, without relying on a framework.',
      solution: 'Built a single-page responsive layout from scratch: a navigation bar, a hero section with a call-to-action, a features grid, and a contact section — focusing on clean markup, consistent spacing, and mobile responsiveness.',
      challenges: [
        'Keeping the layout clean and consistent using plain CSS, without a framework.',
        'Making the page fully responsive across mobile, tablet, and desktop.',
      ],
      results: [
        'Shipped a working, deployed responsive landing page.',
        'Strengthened fundamentals in HTML/CSS layout that carried directly into client work.',
      ],
      gallery: [gallerySvg('#a78bfa'), gallerySvg('#34d399')],
      links: [
        { label: 'Live Demo', url: 'https://landing-page-project-kappa-gilt.vercel.app', icon: 'external' },
        { label: 'GitHub', url: 'https://github.com/lqhoang01/landing-page-project', icon: 'github' },
      ],
    },

    voice: {
      eyebrow: 'Volga Partners · Sharework AI (Vietnam)',
      title: 'AI Voice Training',
      subtitle: 'Ongoing freelance work — remote, currently active',
      banner: bannerSvg('bvoice', '#a78bfa', '#34d399'),
      meta: [
        { k: 'Role', v: 'AI Voice Trainer (Freelance)' },
        { k: 'Type', v: 'Remote, ongoing' },
        { k: 'Started', v: '2025' },
        { k: 'Status', v: 'Active' },
      ],
      overview: 'Ongoing remote freelance work recording and evaluating voice data for AI model training, across two platforms in parallel. Work is task-based and confidential, so this case study stays at the overview level rather than listing specific deliverables.',
      note: 'This is active, confidential platform work — detailed challenges and results aren\u2019t shared here to respect the platforms\u2019 confidentiality. Get in touch if you\u2019d like to know more about the nature of the work.',
      gallery: [],
      links: [],
    },

    business: {
      eyebrow: 'Nasani · Freelance',
      title: 'Business & Landing Page Websites',
      subtitle: 'Client web consulting and delivery',
      banner: bannerSvg('bbiz', '#7c3aed', '#a78bfa'),
      meta: [
        { k: 'Role', v: 'Web Solutions Consultant' },
        { k: 'Stack', v: 'WordPress, Webflow, HTML/CSS/JS' },
        { k: 'Type', v: 'Client work' },
        { k: 'Status', v: 'Private' },
      ],
      overview: 'Advised small-business clients on website solutions across the full sales journey — from understanding their needs to proposing, building, and launching — using WordPress, Webflow, and custom HTML/CSS/JS, with basic SEO and analytics setup.',
      note: 'These are private client projects, so individual sites aren\u2019t shown here — but I\u2019m happy to walk through the work and approach directly.',
      gallery: [],
      links: [],
    },

    prompt: {
      eyebrow: 'Self-Directed Learning',
      title: 'Prompt Engineering Practice',
      subtitle: 'Ongoing hands-on practice, not formal coursework',
      banner: bannerSvg('bprompt', '#7c3aed', '#a78bfa'),
      meta: [
        { k: 'Role', v: 'Self-Directed' },
        { k: 'Type', v: 'Ongoing practice' },
        { k: 'Context', v: 'Alongside AI training work' },
        { k: 'Status', v: 'Active' },
      ],
      overview: 'Ongoing hands-on practice writing and refining prompts while working on AI training and evaluation tasks — learning the craft by doing rather than through formal coursework.',
      gallery: [],
      links: [],
    },

    portfolio: {
      eyebrow: 'Personal Project',
      title: 'Portfolio Website',
      subtitle: 'This site — built from scratch, no templates',
      banner: bannerSvg('bport', '#7c3aed', '#a78bfa'),
      meta: [
        { k: 'Role', v: 'Solo Designer & Developer' },
        { k: 'Stack', v: 'HTML, CSS, JavaScript' },
        { k: 'Year', v: '2026' },
        { k: 'Status', v: 'Live — you\'re looking at it' },
      ],
      overview: 'My personal portfolio, built entirely from scratch with HTML, CSS, and JavaScript — including a custom CSS-only 3D developer workspace, animated case studies, and a full interaction layer, with no page builders or 3D libraries involved.',
      solution: 'Designed and built every section myself: a CSS 3D workspace scene, a command palette, custom cursor, scroll-driven reveal animations, and this very project modal system — all hand-coded to push my front-end skills further.',
      results: [
        'A complete, hand-built front-end project with no templates or 3D libraries.',
        'A live demonstration of front-end and UI/UX skills for recruiters and clients.',
      ],
      gallery: [],
      links: [
        { label: 'GitHub', url: 'https://github.com/lqhoang01', icon: 'github' },
      ],
    },
  };

  const projectOrder = ['vietforture', 'landing', 'voice', 'business', 'prompt', 'portfolio'];

  const pmIcons = {
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line>',
    github: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>',
    problem: '<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>',
    solution: '<path d="M9 18h6M10 22h4M15 14c.83-.83 1.5-1.95 1.5-3.5A4.5 4.5 0 0 0 12 6a4.5 4.5 0 0 0-4.5 4.5c0 1.55.67 2.67 1.5 3.5"></path>',
    challenge: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>',
    result: '<polyline points="20 6 9 17 4 12"></polyline>',
    overview: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="9" y1="9" x2="15" y2="9"></line><line x1="9" y1="13" x2="15" y2="13"></line>',
  };

  function renderProjectModal(key) {
    const data = projectData[key];
    const scroll = document.getElementById('projectModalScroll');
    if (!data || !scroll) return;

    let html = `
      <div class="pm-banner">
        ${data.banner}
        <div class="pm-banner-overlay">
          <div class="pm-eyebrow">${data.eyebrow}</div>
          <h3 class="pm-title">${data.title}</h3>
          <div class="pm-subtitle">${data.subtitle}</div>
        </div>
      </div>
      <div class="pm-body">
        <div class="pm-meta-row">
          ${data.meta.map(m => `<div class="pm-meta-item"><span class="k">${m.k}</span><span class="v">${m.v}</span></div>`).join('')}
        </div>
        <div class="pm-section">
          <h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pmIcons.overview}</svg>Overview</h4>
          <p>${data.overview}</p>
        </div>`;

    if (data.problem) {
      html += `<div class="pm-section"><h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pmIcons.problem}</svg>Problem</h4><p>${data.problem}</p></div>`;
    }
    if (data.solution) {
      html += `<div class="pm-section"><h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pmIcons.solution}</svg>Solution</h4><p>${data.solution}</p></div>`;
    }
    if (data.challenges && data.challenges.length) {
      html += `<div class="pm-section"><h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pmIcons.challenge}</svg>Challenges</h4><ul class="pm-list">${data.challenges.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
    }
    if (data.results && data.results.length) {
      html += `<div class="pm-section"><h4><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${pmIcons.result}</svg>Results</h4><ul class="pm-list results">${data.results.map(r => `<li>${r}</li>`).join('')}</ul></div>`;
    }
    if (data.gallery && data.gallery.length) {
      html += `<div class="pm-section"><h4>Gallery</h4><div class="pm-gallery">${data.gallery.map((g, i) => `<div class="pm-gallery-item" data-gallery-index="${i}">${g}<span class="pm-gallery-zoom-hint"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg></span></div>`).join('')}</div></div>`;
    }
    if (data.note) {
      html += `<div class="pm-section"><p class="pm-note">${data.note}</p></div>`;
    }

    if (data.links && data.links.length) {
      html += `<div class="pm-links-row">${data.links.map(l => `<a href="${l.url}" target="_blank" rel="noopener" class="btn btn-outline"><svg width="15" height="15" viewBox="0 0 24 24" fill="${l.icon === 'github' ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">${pmIcons[l.icon]}</svg>${l.label}</a>`).join('')}</div>`;
    }

    html += `</div>`;
    scroll.innerHTML = html;
    scroll.scrollTop = 0;

    // Bind the fullscreen lightbox to this render's gallery items
    const galleryItems = scroll.querySelectorAll('.pm-gallery-item');
    galleryItems.forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-gallery-index'), 10);
        openLightbox(data.gallery, idx);
      });
    });

    // Reveal sections progressively as the modal body is scrolled
    const revealTargets = scroll.querySelectorAll('.pm-section, .pm-meta-row');
    if (!('IntersectionObserver' in window)) {
      revealTargets.forEach(el => el.classList.add('pm-visible'));
    } else {
      const pmObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('pm-visible');
            pmObserver.unobserve(entry.target);
          }
        });
      }, { root: scroll, threshold: 0.15, rootMargin: '0px 0px -30px 0px' });
      revealTargets.forEach(el => pmObserver.observe(el));
    }
  }

  // --- Fullscreen gallery lightbox ---
  let lightboxImages = [];
  let lightboxIndex = 0;
  let pmLightboxEl = null;

  function ensureLightbox() {
    if (pmLightboxEl) return pmLightboxEl;
    const el = document.createElement('div');
    el.className = 'pm-lightbox';
    el.id = 'pmLightbox';
    el.innerHTML = `
      <button class="pm-lightbox-close" id="pmLightboxClose" aria-label="Close image">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <button class="project-modal-nav prev" id="pmLightboxPrev" style="left:24px; right:auto;" aria-label="Previous image">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>
      <button class="project-modal-nav next" id="pmLightboxNext" style="right:24px;" aria-label="Next image">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
      <div class="pm-lightbox-stage" id="pmLightboxStage"></div>`;
    document.body.appendChild(el);
    pmLightboxEl = el;

    el.querySelector('#pmLightboxClose').addEventListener('click', closeLightbox);
    el.querySelector('#pmLightboxPrev').addEventListener('click', () => stepLightbox(-1));
    el.querySelector('#pmLightboxNext').addEventListener('click', () => stepLightbox(1));
    el.addEventListener('click', (e) => { if (e.target === el) closeLightbox(); });

    return el;
  }

  function renderLightboxImage() {
    const stage = document.getElementById('pmLightboxStage');
    if (stage) stage.innerHTML = lightboxImages[lightboxIndex] || '';
  }

  function openLightbox(images, index) {
    if (!images || !images.length) return;
    lightboxImages = images;
    lightboxIndex = index;
    const el = ensureLightbox();
    renderLightboxImage();
    el.classList.add('active');
  }

  function closeLightbox() {
    if (pmLightboxEl) pmLightboxEl.classList.remove('active');
  }

  function stepLightbox(direction) {
    lightboxIndex = (lightboxIndex + direction + lightboxImages.length) % lightboxImages.length;
    renderLightboxImage();
  }

  document.addEventListener('keydown', (e) => {
    if (!pmLightboxEl || !pmLightboxEl.classList.contains('active')) return;
    if (e.key === 'Escape') { closeLightbox(); e.stopPropagation(); }
    else if (e.key === 'ArrowRight') stepLightbox(1);
    else if (e.key === 'ArrowLeft') stepLightbox(-1);
  });

  const projectModalOverlay = document.getElementById('projectModalOverlay');
  const projectModalClose = document.getElementById('projectModalClose');
  const projectModalPrev = document.getElementById('projectModalPrev');
  const projectModalNext = document.getElementById('projectModalNext');
  let currentProjectIndex = 0;

  function openProjectModal(key) {
    currentProjectIndex = projectOrder.indexOf(key);
    if (currentProjectIndex === -1) currentProjectIndex = 0;
    renderProjectModal(projectOrder[currentProjectIndex]);
    projectModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    projectModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function navigateProject(direction) {
    currentProjectIndex = (currentProjectIndex + direction + projectOrder.length) % projectOrder.length;
    renderProjectModal(projectOrder[currentProjectIndex]);
  }

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => {
      const key = card.getAttribute('data-project');
      if (key) openProjectModal(key);
    });
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const key = card.getAttribute('data-project');
        if (key) openProjectModal(key);
      }
    });
  });

  if (projectModalClose) projectModalClose.addEventListener('click', closeProjectModal);
  if (projectModalPrev) projectModalPrev.addEventListener('click', () => navigateProject(-1));
  if (projectModalNext) projectModalNext.addEventListener('click', () => navigateProject(1));

  if (projectModalOverlay) {
    projectModalOverlay.addEventListener('click', (e) => {
      if (e.target === projectModalOverlay) closeProjectModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!projectModalOverlay || !projectModalOverlay.classList.contains('active')) return;
    if (pmLightboxEl && pmLightboxEl.classList.contains('active')) return; // let the lightbox handle its own keys
    if (e.key === 'Escape') closeProjectModal();
    else if (e.key === 'ArrowRight') navigateProject(1);
    else if (e.key === 'ArrowLeft') navigateProject(-1);
  });

  // --- Featured project: thumbnail switcher (stops click from opening the modal) ---
  const featuredImg = document.getElementById('featuredImg');
  const featuredThumbs = document.querySelectorAll('.featured-thumb');
  if (featuredImg && featuredThumbs.length) {
    featuredThumbs.forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        e.stopPropagation();
        const src = thumb.getAttribute('data-img');
        if (!src) return;
        featuredImg.style.opacity = '0';
        setTimeout(() => {
          featuredImg.setAttribute('src', src);
          featuredImg.style.opacity = '1';
        }, 180);
        featuredThumbs.forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });
  }

  // Clicking the featured project card (outside the thumbs/links) opens its case study
  const featuredProjectEl = document.querySelector('.featured-project');
  if (featuredProjectEl) {
    featuredProjectEl.addEventListener('click', () => {
      const key = featuredProjectEl.getAttribute('data-project');
      if (key) openProjectModal(key);
    });
    featuredProjectEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const key = featuredProjectEl.getAttribute('data-project');
        if (key) openProjectModal(key);
      }
    });
  }

  // --- 3D tilt on project cards (desktop, fine pointer only) ---
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-5px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    });
  }

  // --- Timeline: connector line animates in as each item scrolls into view ---
  const timelineItems = document.querySelectorAll('.timeline-item');
  if (timelineItems.length) {
    const timelineObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, { threshold: 0.3, rootMargin: '0px 0px -60px 0px' });
    timelineItems.forEach(item => timelineObserver.observe(item));
  }

  // --- About cards: subtle 3D tilt + cursor-following spotlight glow ---
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.about-block').forEach(block => {
      block.addEventListener('mousemove', (e) => {
        const rect = block.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        block.style.setProperty('--mx', `${px}%`);
        block.style.setProperty('--my', `${py}%`);

        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        block.style.transform = `rotateX(${(-y * 2.5).toFixed(2)}deg) rotateY(${(x * 2.5).toFixed(2)}deg)`;
      });
      block.addEventListener('mouseleave', () => {
        block.style.transform = 'rotateX(0) rotateY(0)';
      });
    });
  }

  // --- Footer: keep the copyright year current automatically ---
  const footerYearEl = document.getElementById('footerYear');
  if (footerYearEl) footerYearEl.textContent = new Date().getFullYear();

  // --- Contact: click-to-copy email with visual feedback ---
  const copyEmailBtn = document.getElementById('copyEmailBtn');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', async () => {
      const email = copyEmailBtn.getAttribute('data-email');
      try {
        await navigator.clipboard.writeText(email);
      } catch (err) {
        // Clipboard API unavailable — fail silently, the email is still visible to copy manually
      }
      copyEmailBtn.classList.add('copied');
      setTimeout(() => copyEmailBtn.classList.remove('copied'), 1800);
    });
  }

  // --- Skill cards: subtle 3D tilt on hover ---
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.skill-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `translateY(-3px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 5).toFixed(2)}deg)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) rotateX(0) rotateY(0)';
      });
    });
  }
});
