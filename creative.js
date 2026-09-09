(() => {
  const progress = document.getElementById('scrollProgress');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const runningAnimations = new Set();
  const tiltStage = document.querySelector('[data-tilt]');
  let revealObserver;
  let progressFrame = 0;
  let tiltFrame = 0;

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

  function updateProgress() {
    progressFrame = 0;
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? window.scrollY / max : 0;
    progress.style.transform = `scaleX(${Math.min(1, Math.max(0, value)).toFixed(4)})`;
  }

  function queueProgress() {
    if (!progressFrame) progressFrame = window.requestAnimationFrame(updateProgress);
  }

  function onMotionChange() {
    resetTilt();
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
    finePointer.addEventListener('change', resetTilt);
  }
  updateProgress();
})();
