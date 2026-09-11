
(() => {
  const root = document.getElementById('cinema-portfolio');
  if (!root) return;
  const stage = root.querySelector('[data-qh-stage]');
  const portrait = root.querySelector('[data-qh-portrait]');
  const halo = root.querySelector('[data-qh-halo]');
  const motionButton = root.querySelector('[data-qh-motion]');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const animations = new Set();
  let paused = reduce.matches;
  let frame = 0;
  let px = 0, py = 0, tx = 0, ty = 0;
  let replayTimer;
  function play(element, keyframes, options) {
    if (paused || typeof element.animate !== 'function') return;
    const animation = element.animate(keyframes, options);
    animations.add(animation);
    const release = () => animations.delete(animation);
    animation.addEventListener('finish', release, { once:true });
    animation.addEventListener('cancel', release, { once:true });
  }
  function intro() {
    animations.forEach(a => a.cancel());
    if (paused) return;
    root.querySelectorAll('.qh-name > span').forEach((letter, index) => {
      play(letter, [{ opacity:0,transform:'translateY(70px) rotate(3deg)' },{ opacity:1,transform:'translateY(0) rotate(0)' }], {duration:850,delay:index*42,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
    });
    play(halo,[{opacity:0,scale:'.65'},{opacity:1,scale:'1'}],{duration:1050,delay:60,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
    play(portrait,[{opacity:0,transform:'translate3d(0,95px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:1200,delay:190,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
  }
  function resetMotion() {
    cancelAnimationFrame(frame); frame=0;
    px=py=tx=ty=0;
    root.style.setProperty('--qh-x','0px');
    root.style.setProperty('--qh-y','0px');
    root.style.setProperty('--qh-scroll','0px');
    root.style.setProperty('--qh-rotation','0deg');
  }
  function syncMotion() {
    root.dataset.motion=paused?'off':'on';
    motionButton.setAttribute('aria-pressed',String(!paused));
    motionButton.querySelector('[data-qh-motion-text]').textContent=paused?'Motion off':'Motion on';
    motionButton.querySelector('[data-motion-symbol]').textContent=paused?'▶':'Ⅱ';
    motionButton.disabled=reduce.matches;
    motionButton.setAttribute('aria-label', reduce.matches ? 'Motion follows your reduced-motion preference' : paused ? 'Enable motion' : 'Pause motion');
    if (paused) { animations.forEach(a=>a.cancel()); resetMotion(); }
  }
  function moveFrame() {
    frame=0;
    if (paused || document.hidden) return;
    px+=(tx-px)*.12; py+=(ty-py)*.12;
    root.style.setProperty('--qh-x',px.toFixed(2)+'px');
    root.style.setProperty('--qh-y',py.toFixed(2)+'px');
    root.style.setProperty('--qh-rotation',(px*.075).toFixed(2)+'deg');
    if (Math.abs(tx-px)+Math.abs(ty-py)>.03) frame=requestAnimationFrame(moveFrame);
  }
  stage.addEventListener('pointermove',event=>{
    if(paused || !pointer.matches || event.pointerType==='touch') return;
    const rect=stage.getBoundingClientRect();
    tx=((event.clientX-rect.left)/rect.width-.5)*15;
    ty=((event.clientY-rect.top)/rect.height-.5)*8;
    if(!frame) frame=requestAnimationFrame(moveFrame);
  },{passive:true});
  stage.addEventListener('pointerleave',()=>{tx=ty=0;if(!paused&&!frame)frame=requestAnimationFrame(moveFrame);});
  motionButton.addEventListener('click',()=>{paused=!paused;syncMotion();});
  root.querySelector('[data-qh-replay]').addEventListener('click',()=>{
    root.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});
    clearTimeout(replayTimer);
    if(!reduce.matches) {paused=false;syncMotion();}
    replayTimer=setTimeout(intro,350);
  });
  root.querySelectorAll('a[href^="#"]').forEach(link=>{
    link.addEventListener('click',event=>{
      const target=document.getElementById(link.getAttribute('href').slice(1));
      if(target){event.preventDefault();target.scrollIntoView({behavior:reduce.matches?'instant':'smooth',block:'start'});}
    });
  });
  if('IntersectionObserver' in window){
    let started=false;
    const heroObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting&&!started){started=true;document.fonts ? document.fonts.ready.then(intro) : intro();}
        if(!paused&&entry.isIntersecting){
          const clipped=Math.max(0,entry.intersectionRect.top-entry.boundingClientRect.top);
          const progress=Math.min(1,clipped/Math.max(1,entry.boundingClientRect.height));
          root.style.setProperty('--qh-scroll',(-progress*35).toFixed(2)+'px');
        }
      });
    },{threshold:Array.from({length:21},(_,i)=>i/20)});
    heroObserver.observe(stage);
    const reveal=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          play(entry.target,[{opacity:.25,transform:'translateY(28px)'},{opacity:1,transform:'translateY(0)'}],{duration:720,easing:'cubic-bezier(.16,1,.3,1)'});
          reveal.unobserve(entry.target);
        }
      });
    },{threshold:.12});
    root.querySelectorAll('[data-qh-reveal]').forEach(el=>reveal.observe(el));
  }else{intro();}
  reduce.addEventListener('change',()=>{paused=reduce.matches;syncMotion();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)resetMotion();});
  let scrollFrame=0;
  const scrollBar=document.getElementById('scrollProgress');
  function updateScroll(){
    scrollFrame=0;
    const max=document.documentElement.scrollHeight-window.innerHeight;
    if(scrollBar) scrollBar.style.transform='scaleX('+Math.min(1,Math.max(0,max>0?window.scrollY/max:0))+')';
    if(!paused){
      const box=stage.getBoundingClientRect();
      const shift=Math.max(0,Math.min(1,-box.top/Math.max(1,box.height)));
      root.style.setProperty('--qh-scroll',(-shift*42).toFixed(2)+'px');
    }
  }
  const queueScroll=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(updateScroll);};
  window.addEventListener('scroll',queueScroll,{passive:true});
  window.addEventListener('resize',queueScroll,{passive:true});
  window.addEventListener('pagehide',resetMotion);
  updateScroll();
  syncMotion();
})();
