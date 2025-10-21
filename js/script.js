// ...existing code...
// Interactivity: canvas particles, parallax, drift toggle, headlight flicker, simple engine hum
(() => {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const parts = [];
  const MAX = 120;

  function rand(min, max){ return Math.random()*(max-min)+min }

  // create drifting sparks/particles
  function spawn(){
    if(parts.length > MAX) return;
    parts.push({
      x: rand(w*0.35, w*0.65),
      y: h*0.7 + rand(-20,20),
      vx: rand(-3,3),
      vy: rand(-5,-1.2),
      size: rand(1,4),
      life: rand(40,100),
      age:0,
      hue: rand(0,360)
    });
  }

  function resize(){ w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  addEventListener('resize', resize);

  function step(){
    ctx.clearRect(0,0,w,h);
    // semi transparent gradient ground glow
    const g = ctx.createLinearGradient(0,h*0.6,0,h);
    g.addColorStop(0,'rgba(0,200,255,0.02)');
    g.addColorStop(1,'rgba(0,0,0,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,h*0.6,w,h*0.4);

    // update & draw particles
    for(let i = parts.length-1;i>=0;i--){
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.985;
      p.age++;
      const alpha = 1 - p.age / p.life;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},90%,60%,${alpha})`;
      ctx.arc(p.x, p.y, p.size * (0.6 + alpha*0.8), 0, Math.PI*2);
      ctx.fill();
      if(p.age > p.life || p.y < -50 || p.x < -50 || p.x > w+50) parts.splice(i,1);
    }

    // spawn occasionally
    if(Math.random() < 0.6) spawn();
    requestAnimationFrame(step);
  }
  step();

  // parallax: move car a bit with mouse
  const carWrap = document.getElementById('carWrapper');
  const scene = document.getElementById('scene');
  scene.addEventListener('mousemove', e => {
    const rect = scene.getBoundingClientRect();
    const cx = rect.left + rect.width/2;
    const cy = rect.top + rect.height/2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    carWrap.style.transform = `translate3d(${dx*12}px,${dy*6}px,0)`;
  });
  scene.addEventListener('mouseleave', ()=> carWrap.style.transform = '');

  // drift button toggles animation + stronger particle spawn + headlights flicker
  const btn = document.getElementById('driftBtn');
  const smoke = carWrap.querySelector('.smoke');
  const headlights = document.querySelectorAll('.headlight');
  let drifting = false;
  let flickerInt = null;

  btn.addEventListener('click', () => {
    drifting = !drifting;
    carWrap.classList.toggle('drift', drifting);
    btn.textContent = drifting ? 'Detener drift' : 'Activar drift';
    // smoke visibility handled by CSS when .drift is present (opacity + animation)
    // stronger particle spawn while drifting
    if(drifting){
      // increase particle frequency by injecting more
      for(let i=0;i<18;i++) spawn();
      // headlights flicker interval
      flickerInt = setInterval(()=>{
        headlights.forEach(h => h.classList.toggle('flicker'));
        // random extra burst of particles when flicker
        for(let i=0;i<8;i++) spawn();
      }, 420);
      engineStart();
    } else {
      clearInterval(flickerInt);
      headlights.forEach(h => h.classList.remove('flicker'));
      engineStop();
    }
  });

  // Simple engine hum using WebAudio (no external files)
  let audioCtx, osc, gain;
  function engineStart(){
    if(audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 80; // low rumble
    gain.gain.value = 0.0001;
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine'; lfo.frequency.value = 2; lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    lfo.start();
    // fade in
    const now = audioCtx.currentTime;
    gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
  }
  function engineStop(){
    if(!audioCtx) return;
    const now = audioCtx.currentTime;
    gain.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(()=>{
      try{ osc.stop(); }catch(e){}
      audioCtx.close();
      audioCtx = null; osc = null; gain = null;
    },700);
  }

  // small ambient additions: click scene to produce burst
  scene.addEventListener('click', (e)=>{
    for(let i=0;i<20;i++){
      parts.push({
        x: e.clientX + rand(-40,40),
        y: e.clientY + rand(-20,20),
        vx: rand(-6,6),
        vy: rand(-9,-1),
        size: rand(1,5),
        life: rand(30,100),
        age:0,
        hue: 230 + rand(-40,40)
      });
    }
  });
})();