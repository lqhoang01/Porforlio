(() => {
  const progress = document.getElementById('scrollProgress');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const runningAnimations = new Set();
  const tiltStage = document.querySelector('[data-tilt]');
  const gallery = document.querySelector('[data-hero-gallery]');
  const sceneSurface = gallery?.querySelector('.hero-scene');
  const motionToggle = gallery?.querySelector('[data-motion-toggle]');
  const compactScene = window.matchMedia('(max-width: 760px)');
  const livePreviews = document.querySelectorAll('[data-live-preview]');
  let revealObserver;
  let progressFrame = 0;
  let tiltFrame = 0;
  let sceneFrame = 0;
  let sceneVisible = true;
  let sceneFocused = false;
  let userMotionEnabled = true;
  let sceneBounds = null;
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let sceneTime = 0;
  let previousFrameTime = 0;

  // Show the actual portfolio at desktop proportions, fitted to its frame.
  // A full-size link stays usable with or without JavaScript.
  function fitLivePreview(frame) {
    const width = frame.clientWidth;
    if (width > 0) frame.style.setProperty('--preview-scale', String(width / 1280));
  }

  livePreviews.forEach(fitLivePreview);
  if ('ResizeObserver' in window) {
    const previewObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => fitLivePreview(entry.target));
    });
    livePreviews.forEach((frame) => previewObserver.observe(frame));
  } else {
    window.addEventListener('resize', () => livePreviews.forEach(fitLivePreview), { passive: true });
  }

  // Base styles are always visible; animations never gate access to content.
  function enter(element, delay = 0) {
    if (motionPreference.matches || typeof element.animate !== 'function') return;
    const animation = element.animate([
      { opacity: 0, transform: 'translateY(18px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], {
      duration: 620,
      delay,
      easing: 'cubic-bezier(.2, .7, .2, 1)',
      fill: 'backwards',
    });
    runningAnimations.add(animation);
    const release = () => runningAnimations.delete(animation);
    animation.addEventListener('finish', release, { once: true });
    animation.addEventListener('cancel', release, { once: true });
  }

  document.querySelectorAll('[data-hero-enter]').forEach((element, index) => {
    enter(element, Math.min(index * 55, 330));
  });

  if (!motionPreference.matches && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          enter(entry.target);
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -32px 0px' });
    // Reveal small groups, not entire case studies taller than a mobile screen.
    document.querySelectorAll([
      '[data-reveal]:not(.project)',
      '.project[data-reveal] .project-heading',
      '.project[data-reveal] .project-story',
      '.seahorse-intro',
      '.role-detail',
    ].join(',')).forEach((element) => revealObserver.observe(element));
  }

  function resetTilt() {
    window.cancelAnimationFrame(tiltFrame);
    tiltFrame = 0;
    if (!tiltStage) return;
    tiltStage.style.setProperty('--tilt-x', '0');
    tiltStage.style.setProperty('--tilt-y', '0');
  }

  if (tiltStage) {
    let pointerX = 0;
    let pointerY = 0;
    tiltStage.addEventListener('pointermove', (event) => {
      if (motionPreference.matches || !finePointer.matches) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (tiltFrame) return;
      tiltFrame = window.requestAnimationFrame(() => {
        tiltFrame = 0;
        const rect = tiltStage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = (Math.max(0, Math.min(1, (pointerX - rect.left) / rect.width)) - .5) * 3;
        const y = (Math.max(0, Math.min(1, (pointerY - rect.top) / rect.height)) - .5) * -3;
        tiltStage.style.setProperty('--tilt-x', x.toFixed(2));
        tiltStage.style.setProperty('--tilt-y', y.toFixed(2));
      });
    }, { passive: true });
    tiltStage.addEventListener('pointerleave', resetTilt);
    tiltStage.addEventListener('pointercancel', resetTilt);
    window.addEventListener('blur', resetTilt);
  }

  function sceneCanMove() {
    return gallery && userMotionEnabled && !motionPreference.matches && sceneVisible && !sceneFocused && !document.hidden;
  }

  function stopScene(reset = false) {
    window.cancelAnimationFrame(sceneFrame);
    sceneFrame = 0;
    previousFrameTime = 0;
    if (!reset || !gallery) return;
    targetX = targetY = currentX = currentY = 0;
    gallery.style.setProperty('--scene-rx', '0deg');
    gallery.style.setProperty('--scene-ry', '0deg');
    gallery.style.setProperty('--scene-lift', '0px');
  }

  function animateScene(timestamp) {
    sceneFrame = 0;
    if (!sceneCanMove()) return;
    const elapsed = previousFrameTime ? Math.min(timestamp - previousFrameTime, 64) : 16;
    previousFrameTime = timestamp;
    sceneTime += elapsed;
    const ease = 1 - Math.exp(-elapsed / 150);
    currentX += (targetX - currentX) * ease;
    currentY += (targetY - currentY) * ease;
    const strength = compactScene.matches ? .35 : 1;
    const rotateX = (-currentY * 4 + Math.sin(sceneTime / 4300) * 1.1) * strength;
    const rotateY = (currentX * 7 + Math.sin(sceneTime / 5800) * 1.8) * strength;
    const lift = (Math.sin(sceneTime / 3400) * 5 - currentY * 2) * strength;
    gallery.style.setProperty('--scene-rx', `${rotateX.toFixed(3)}deg`);
    gallery.style.setProperty('--scene-ry', `${rotateY.toFixed(3)}deg`);
    gallery.style.setProperty('--scene-lift', `${lift.toFixed(3)}px`);
    sceneFrame = window.requestAnimationFrame(animateScene);
  }

  function syncSceneMotion() {
    if (!gallery) return;
    const enabled = userMotionEnabled && !motionPreference.matches;
    gallery.classList.toggle('is-motion-off', !enabled);
    if (motionToggle) {
      motionToggle.hidden = false;
      motionToggle.disabled = motionPreference.matches;
      motionToggle.setAttribute('aria-pressed', String(enabled));
      motionToggle.setAttribute('aria-label', motionPreference.matches ? 'Hero motion follows your reduced-motion preference' : enabled ? 'Pause hero motion' : 'Enable hero motion');
      const label = motionToggle.querySelector('[data-motion-label]');
      const symbol = motionToggle.querySelector('.motion-symbol');
      if (label) label.textContent = motionPreference.matches ? 'Reduced motion' : enabled ? 'Motion on' : 'Motion off';
      if (symbol) symbol.textContent = enabled ? 'Ⅱ' : '▶';
    }
    if (sceneCanMove()) {
      if (!sceneFrame) sceneFrame = window.requestAnimationFrame(animateScene);
    } else {
      stopScene(!enabled || sceneFocused);
    }
  }

  if (gallery) {
    gallery.addEventListener('pointermove', (event) => {
      if (!sceneCanMove() || !finePointer.matches || event.pointerType === 'touch') return;
      if (!sceneBounds) sceneBounds = gallery.getBoundingClientRect();
      if (!sceneBounds.width || !sceneBounds.height) return;
      targetX = Math.max(-1, Math.min(1, ((event.clientX - sceneBounds.left) / sceneBounds.width - .5) * 2));
      targetY = Math.max(-1, Math.min(1, ((event.clientY - sceneBounds.top) / sceneBounds.height - .5) * 2));
      gallery.style.setProperty('--shine-x', `${(50 + targetX * 40).toFixed(1)}%`);
      gallery.style.setProperty('--shine-y', `${(50 + targetY * 40).toFixed(1)}%`);
    }, { passive: true });
    gallery.addEventListener('pointerleave', () => { targetX = targetY = 0; sceneBounds = null; });
    gallery.addEventListener('pointercancel', () => { targetX = targetY = 0; sceneBounds = null; });
    sceneSurface?.addEventListener('focusin', () => { sceneFocused = true; syncSceneMotion(); });
    sceneSurface?.addEventListener('focusout', (event) => {
      if (event.relatedTarget && sceneSurface.contains(event.relatedTarget)) return;
      sceneFocused = false;
      syncSceneMotion();
    });
    motionToggle?.addEventListener('click', () => {
      if (motionPreference.matches) return;
      userMotionEnabled = !userMotionEnabled;
      syncSceneMotion();
    });
    if ('IntersectionObserver' in window) {
      const sceneObserver = new IntersectionObserver((entries) => {
        sceneVisible = entries.some((entry) => entry.isIntersecting);
        syncSceneMotion();
      }, { threshold: 0 });
      sceneObserver.observe(gallery);
    }
    document.addEventListener('visibilitychange', syncSceneMotion);
    window.addEventListener('pagehide', () => stopScene());
    window.addEventListener('pageshow', syncSceneMotion);
    syncSceneMotion();
  }

  function updateProgress() {
    progressFrame = 0;
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value)).toFixed(4)})`;
  }

  function queueProgress() {
    sceneBounds = null;
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateProgress);
  }

  function onMotionChange() {
    resetTilt();
    syncSceneMotion();
    if (!motionPreference.matches) return;
    runningAnimations.forEach((animation) => animation.cancel());
    runningAnimations.clear();
    if (revealObserver) revealObserver.disconnect();
  }

  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  window.addEventListener('load', queueProgress);
  if (typeof motionPreference.addEventListener === 'function') {
    motionPreference.addEventListener('change', onMotionChange);
    finePointer.addEventListener('change', () => { resetTilt(); targetX = targetY = 0; });
    compactScene.addEventListener('change', () => { sceneBounds = null; syncSceneMotion(); });
  }
  updateProgress();
})();
