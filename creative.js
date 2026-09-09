(() => {
  const slides = [...document.querySelectorAll('.reel-slide')];
  const controls = [...document.querySelectorAll('.reel-controls button')];
  const title = document.getElementById('reelTitle');
  const type = document.getElementById('reelType');
  const count = document.getElementById('reelCount');
  const progress = document.getElementById('scrollProgress');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let timer;

  function showSlide(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === active));
    controls.forEach((button, i) => button.classList.toggle('is-active', i === active));
    title.textContent = slides[active].dataset.title;
    type.textContent = slides[active].dataset.type;
    count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }

  function restartTimer() {
    if (reduceMotion) return;
    window.clearInterval(timer);
    timer = window.setInterval(() => showSlide(active + 1), 4200);
  }

  controls.forEach((button, index) => {
    button.addEventListener('click', () => {
      showSlide(index);
      restartTimer();
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  } else {
    document.querySelectorAll('[data-reveal]').forEach((element) => element.classList.add('is-visible'));
  }

  const tiltStage = document.querySelector('[data-tilt]');
  if (tiltStage && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    tiltStage.addEventListener('pointermove', (event) => {
      const rect = tiltStage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - .5) * 7;
      const y = ((event.clientY - rect.top) / rect.height - .5) * -7;
      tiltStage.style.setProperty('--tilt-x', x.toFixed(2));
      tiltStage.style.setProperty('--tilt-y', y.toFixed(2));
    });
    tiltStage.addEventListener('pointerleave', () => {
      tiltStage.style.setProperty('--tilt-x', 0);
      tiltStage.style.setProperty('--tilt-y', 0);
    });
  }

  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max > 0 ? (window.scrollY / max) * 100 : 0;
    progress.style.width = `${Math.min(100, Math.max(0, value))}%`;
  }

  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
  showSlide(0);
  restartTimer();
})();
