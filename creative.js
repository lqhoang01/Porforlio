(() => {
  'use strict';
  const root = document.getElementById('cinema-portfolio');
  if (!root) return;
  const stage = root.querySelector('[data-qh-stage]');
  const scene = root.querySelector('[data-hero-scene]');
  const portrait = root.querySelector('[data-qh-portrait]');
  const halo = root.querySelector('[data-qh-halo]');
  const motionButton = root.querySelector('[data-qh-motion]');
  const replayButton = root.querySelector('[data-qh-replay]');
  const bar = document.getElementById('scrollProgress');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 901px)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  let paused = reduce.matches;
  let pointerFrame = 0;
  let scrollFrame = 0;
  let x = 0, targetX = 0;
  let started = false;
  let replayTimer = 0;
  let openingGeneration = 0;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const set = (key, value) => root.style.setProperty(key, value);
  function animate(element, frames, options) {
    if (!element || paused || !element.animate) return;
    const a = element.animate(frames, options);
    animations.add(a);
    const release = () => animations.delete(a);
    a.addEventListener('finish', release, { once: true });
    a.addEventListener('cancel', release, { once: true });
    return a;
  }
  function cancelAnimations() {
    [...animations].forEach(a => a.cancel());
    animations.clear();
  }
  function resetSpatialMotion() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    x = targetX = 0;
    set('--mx', '0px');
    set('--rotation', '0deg');
    set('--name-y', '0px');
    set('--name-scale', '1');
    set('--portrait-scale', '1');
    set('--halo-scale', '1');
    set('--halo-y', '0px');
    set('--poster-dim', '0');
  }
  function syncMotion() {
    root.dataset.motion = paused ? 'off' : 'on';
    motionButton.setAttribute('aria-pressed', String(!paused));
    motionButton.querySelector('[data-qh-motion-text]').textContent = paused ? 'Motion off' : 'Motion on';
    motionButton.querySelector('[data-motion-symbol]').textContent = paused ? '▶' : 'Ⅱ';
    motionButton.disabled = reduce.matches;
    motionButton.setAttribute('aria-label', reduce.matches ? 'Animation disabled by your reduced-motion preference' : paused ? 'Enable animation' : 'Pause animation');
    if (paused) { cancelAnimations(); resetSpatialMotion(); }
    else queueScroll();
  }
  function opening() {
    cancelAnimations();
    if (paused || document.hidden) return;
    const ease = 'cubic-bezier(.16,1,.3,1)';
    animate(stage.querySelector('.qh-curtain-left'), [
      {transform:'translateX(0)'}, {transform:'translateX(-102%)'}
    ], {duration:1050, easing:'cubic-bezier(.76,0,.24,1)', fill:'backwards'});
    animate(stage.querySelector('.qh-curtain-right'), [
      {transform:'translateX(0)'}, {transform:'translateX(102%)'}
    ], {duration:1050, easing:'cubic-bezier(.76,0,.24,1)', fill:'backwards'});
    stage.querySelectorAll('.qh-name > span').forEach((letter, i) => {
      animate(letter, [
        {opacity:0, transform:'perspective(800px) translateY(90px) rotateY(-55deg) scale(.83)', filter:'blur(8px)'},
        {opacity:1, transform:'perspective(800px) translateY(-5px) rotateY(0deg) scale(1.015)', filter:'blur(0px)', offset:.76},
        {opacity:1, transform:'perspective(800px) translateY(0) rotateY(0deg) scale(1)', filter:'blur(0px)'}
      ], {duration:1150, delay:180+i*44, easing:ease, fill:'backwards'});
    });
    animate(halo, [
      {opacity:0, scale:'.16'}, {opacity:1, scale:'1.035', offset:.8}, {opacity:1, scale:'1'}
    ], {duration:1450, delay:220, easing:ease, fill:'backwards'});
    animate(portrait, [
      {opacity:0, transform:'translate3d(0,160px,0) scale(.93)', filter:'brightness(.55)'},
      {opacity:1, transform:'translate3d(0,0,0) scale(1)', filter:'brightness(1)'}
    ], {duration:1600, delay:370, easing:ease, fill:'backwards'});
    animate(stage.querySelector('.qh-light-pass'), [
      {opacity:0, transform:'translateX(-100%)'},
      {opacity:.65, offset:.35},
      {opacity:0, transform:'translateX(100%)'}
    ], {duration:1700, delay:420, easing:'cubic-bezier(.25,.46,.45,.94)'});
    root.querySelectorAll('.qh-hero-bottom > *, .qh-credits, .qh-disciplines').forEach((element, i) => {
      animate(element, [
        {opacity:0, transform:'translateY(18px)'}, {opacity:1, transform:'translateY(0)'}
      ], {duration:850, delay:800+i*75, easing:ease, fill:'backwards'});
    });
  }
  async function startOpening() {
    const generation = ++openingGeneration;
    const image = portrait.querySelector('img');
    await Promise.allSettled([
      image.decode ? image.decode() : Promise.resolve(),
      document.fonts ? document.fonts.ready : Promise.resolve()
    ]);
    if (generation !== openingGeneration || document.hidden) return;
    const box = stage.getBoundingClientRect();
    if (box.bottom > 100 && box.top < innerHeight*.8) opening();
  }
  function pointerTick() {
    pointerFrame = 0;
    if (paused || document.hidden) return;
    x += (targetX-x)*.09;
    set('--mx', x.toFixed(2)+'px');
    set('--rotation', (x*.11).toFixed(2)+'deg');
    if (Math.abs(targetX-x)>.02) pointerFrame=requestAnimationFrame(pointerTick);
  }
  stage.addEventListener('pointermove', event => {
    if (paused || !finePointer.matches || !desktop.matches || event.pointerType==='touch') return;
    const b=stage.getBoundingClientRect();
    targetX=clamp((event.clientX-b.left)/b.width-.5,-.5,.5)*22;
    if (!pointerFrame) pointerFrame=requestAnimationFrame(pointerTick);
  }, {passive:true});
  stage.addEventListener('pointerleave', () => {
    targetX=0;
    if (!paused && !pointerFrame) pointerFrame=requestAnimationFrame(pointerTick);
  });
  function updateScroll() {
    scrollFrame=0;
    const maximum=document.documentElement.scrollHeight-innerHeight;
    if (bar) bar.style.transform='scaleX('+clamp(maximum>0?scrollY/maximum:0)+')';
    if (paused) return;
    const bounds=scene.getBoundingClientRect();
    const runway=scene.offsetHeight-stage.offsetHeight;
    const progress=desktop.matches && runway>20 ? clamp(-bounds.top/runway) : 0;
    set('--name-y', (-progress*70).toFixed(2)+'px');
    set('--name-scale', (1+progress*.045).toFixed(4));
    set('--portrait-scale', (1+progress*.08).toFixed(4));
    set('--halo-scale', (1+progress*.14).toFixed(4));
    set('--halo-y', (-progress*25).toFixed(2)+'px');
    set('--poster-dim', (progress*.06).toFixed(3));
  }
  function queueScroll() {
    if (!scrollFrame) scrollFrame=requestAnimationFrame(updateScroll);
  }
  motionButton.addEventListener('click', () => { paused=!paused; syncMotion(); });
  replayButton.addEventListener('click', () => {
    clearTimeout(replayTimer);
    cancelAnimations();
    window.scrollTo({top:0, behavior:reduce.matches?'instant':'smooth'});
    if (!reduce.matches) { paused=false; syncMotion(); }
    const deadline=Date.now()+2200;
    const whenAtTop=()=>{
      if (window.scrollY<35 || Date.now()>deadline) {startOpening();return;}
      replayTimer=setTimeout(whenAtTop,90);
    };
    replayTimer=setTimeout(whenAtTop,120);
  });
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const target=document.getElementById(link.getAttribute('href').slice(1));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({behavior:reduce.matches?'instant':'smooth', block:'start'});
    });
  });
  if ('IntersectionObserver' in window) {
    const heroObserver=new IntersectionObserver(entries => {
      if (!started && entries.some(e=>e.isIntersecting)) {
        started=true; startOpening(); heroObserver.disconnect();
      }
    }, {threshold:.12});
    heroObserver.observe(stage);
    const reveal=new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const e=entry.target;
        const isSkill=e.classList.contains('cap-row');
        const isHeading=/^H[23]$/.test(e.tagName);
        animate(e, isHeading ? [
          {opacity:.15, transform:'translateY(42px)', clipPath:'inset(0 0 75% 0)'},
          {opacity:1, transform:'translateY(0)', clipPath:'inset(0 0 0 0)'}
        ] : [
          {opacity:.12, transform:'translateY('+(isSkill?38:30)+'px)'},
          {opacity:1, transform:'translateY(0)'}
        ], {duration:isHeading?1100:850, easing:'cubic-bezier(.16,1,.3,1)'});
        reveal.unobserve(e);
      });
    }, {threshold:.12, rootMargin:'0px 0px -20px 0px'});
    const revealNodes=new Set(root.querySelectorAll('[data-qh-reveal], .ai-list > div:not(.ai-ledger-head)'));
    revealNodes.forEach(e=>reveal.observe(e));
  } else { startOpening(); }
  reduce.addEventListener('change', () => {paused=reduce.matches; syncMotion();});
  desktop.addEventListener('change', () => {resetSpatialMotion(); queueScroll();});
  window.addEventListener('scroll',queueScroll,{passive:true});
  window.addEventListener('resize',queueScroll,{passive:true});
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) {cancelAnimationFrame(pointerFrame);pointerFrame=0;cancelAnimations();}
    else queueScroll();
  });
  window.addEventListener('pagehide',()=>{clearTimeout(replayTimer);openingGeneration++;cancelAnimations();resetSpatialMotion();cancelAnimationFrame(scrollFrame);});
  updateScroll();
  syncMotion();
})();
