(() => {
  const progress = document.getElementById('scrollProgress');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const runningAnimations = new Set();
  const gallery = document.querySelector('[data-exhibit]');
  const sceneSurface = gallery?.querySelector('.exhibit-object');
  const motionToggle = gallery?.querySelector('[data-motion-toggle]');
  const compactScene = window.matchMedia('(max-width: 600px)');
  const livePreviews = document.querySelectorAll('[data-live-preview]');
  let revealObserver;
  let progressFrame = 0;
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

  // Without JavaScript these controls remain direct links to the real work.
  // Enhance them into a keyboard-accessible, manually selected exhibit.
  const tabList = gallery?.querySelector('[data-exhibit-tabs]');
  const tabs = Array.from(tabList?.querySelectorAll('[data-exhibit-tab]') || []);
  const panels = tabs.map((tab) => document.getElementById(tab.dataset.exhibitTab));
  const counter = gallery?.querySelector('[data-exhibit-counter]');
  let activeTab = 0;
  let panelAnimation;

  if (tabs.length && panels.every(Boolean)) {
    tabList.setAttribute('role', 'tablist');
    tabs.forEach((tab, index) => {
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panels[index].id);
      panels[index].setAttribute('role', 'tabpanel');
      panels[index].setAttribute('aria-labelledby', tab.id);
    });

    function selectTab(index, focus = false, animate = true) {
      const changed = activeTab !== index;
      activeTab = index;
      panelAnimation?.cancel();
      tabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === index;
        tab.classList.toggle('is-active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        panels[tabIndex].hidden = !selected;
      });
      if (counter) counter.textContent = `${String(index + 1).padStart(2, '0')} / ${String(tabs.length).padStart(2, '0')}`;
      livePreviews.forEach(fitLivePreview);
      if (focus) tabs[index].focus();
      if (changed && animate && !motionPreference.matches && typeof panels[index].animate === 'function') {
        panelAnimation = panels[index].animate([
          { opacity: .3, transform: 'translateY(5px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ], { duration: 260, easing: 'ease-out' });
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', (event) => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        selectTab(index);
      });
      tab.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else if (event.key === ' ') next = index;
        else return;
        event.preventDefault();
        selectTab(next, true);
      });
    });
    selectTab(0, false, false);
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
    const rotateX = (-currentY * 1.5 + Math.sin(sceneTime / 4300) * .35) * strength;
    const rotateY = (currentX * 2 + Math.sin(sceneTime / 5800) * .4) * strength;
    const lift = Math.sin(sceneTime / 3400) * 2 * strength;
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
      const symbol = motionToggle.querySelector('[aria-hidden="true"]');
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
    syncSceneMotion();
    if (!motionPreference.matches) return;
    panelAnimation?.cancel();
    runningAnimations.forEach((animation) => animation.cancel());
    runningAnimations.clear();
    if (revealObserver) revealObserver.disconnect();
  }

  window.addEventListener('scroll', queueProgress, { passive: true });
  window.addEventListener('resize', queueProgress, { passive: true });
  window.addEventListener('load', queueProgress);
  if (typeof motionPreference.addEventListener === 'function') {
    motionPreference.addEventListener('change', onMotionChange);
    finePointer.addEventListener('change', () => { targetX = targetY = 0; });
    compactScene.addEventListener('change', () => { sceneBounds = null; syncSceneMotion(); });
  }
  updateProgress();
})();
