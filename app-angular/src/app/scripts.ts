// Interactivity: canvas particles, parallax, drift toggle, headlight flicker, simple engine hum
(() => {
  const canvas = document.getElementById('particles') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;

  interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    age: number;
    hue: number;
  }

  const parts: Particle[] = [];
  const MAX = 120;

  function rand(min: number, max: number): number { 
    return Math.random() * (max - min) + min; 
  }

  function spawn(): void {
    if (parts.length > MAX) return;
    parts.push({
      x: rand(w * 0.35, w * 0.65),
      y: h * 0.7 + rand(-20, 20),
      vx: rand(-3, 3),
      vy: rand(-5, -1.2),
      size: rand(1, 4),
      life: rand(40, 100),
      age: 0,
      hue: rand(0, 360)
    });
  }

  function resize(): void {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);

  function step(): void {
    ctx.clearRect(0, 0, w, h);

    const g = ctx.createLinearGradient(0, h * 0.6, 0, h);
    g.addColorStop(0, 'rgba(0,200,255,0.02)');
    g.addColorStop(1, 'rgba(0,0,0,0.0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy *= 0.985;
      p.age++;
      const alpha = 1 - p.age / p.life;
      ctx.beginPath();
      ctx.fillStyle = `hsla(${p.hue},90%,60%,${alpha})`;
      ctx.arc(p.x, p.y, p.size * (0.6 + alpha * 0.8), 0, Math.PI * 2);
      ctx.fill();
      if (p.age > p.life || p.y < -50 || p.x < -50 || p.x > w + 50) parts.splice(i, 1);
    }

    if (Math.random() < 0.6) spawn();
    requestAnimationFrame(step);
  }
  step();

  const carWrap = document.getElementById('carWrapper')!;
  const scene = document.getElementById('scene')!;
  
  scene.addEventListener('mousemove', (e: MouseEvent) => {
    const rect = scene.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;
    const dy = (e.clientY - cy) / rect.height;
    (carWrap.style as CSSStyleDeclaration).transform = `translate3d(${dx * 12}px,${dy * 6}px,0)`;
  });
  
  scene.addEventListener('mouseleave', () => carWrap.style.transform = '');

  const btn = document.getElementById('driftBtn')!;
  const smoke = carWrap.querySelector('.smoke') as HTMLElement;
  const headlights = document.querySelectorAll<HTMLElement>('.headlight');
  let drifting = false;
  let flickerInt: number | null = null;

  btn.addEventListener('click', () => {
    drifting = !drifting;
    carWrap.classList.toggle('drift', drifting);
    btn.textContent = drifting ? 'Detener drift' : 'Activar drift';

    if (drifting) {
      for (let i = 0; i < 18; i++) spawn();
      flickerInt = window.setInterval(() => {
        headlights.forEach(h => h.classList.toggle('flicker'));
        for (let i = 0; i < 8; i++) spawn();
      }, 420);
      engineStart();
    } else {
      if (flickerInt) clearInterval(flickerInt);
      headlights.forEach(h => h.classList.remove('flicker'));
      engineStop();
    }
  });

  let audioCtx: AudioContext | null = null;
  let osc: OscillatorNode | null = null;
  let gain: GainNode | null = null;

  function engineStart(): void {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    osc = audioCtx.createOscillator();
    gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 80;
    gain.gain.value = 0.0001;
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 2;
    lfoGain.gain.value = 20;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    lfo.start();
    const now = audioCtx.currentTime;
    gain.gain.linearRampToValueAtTime(0.02, now + 0.5);
  }

  function engineStop(): void {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    gain!.gain.linearRampToValueAtTime(0.0001, now + 0.6);
    setTimeout(() => {
      try { osc!.stop(); } catch (e) {}
      audioCtx!.close();
      audioCtx = null; osc = null; gain = null;
    }, 700);
  }

  scene.addEventListener('click', (e: MouseEvent) => {
    for (let i = 0; i < 20; i++) {
      parts.push({
        x: e.clientX + rand(-40, 40),
        y: e.clientY + rand(-20, 20),
        vx: rand(-6, 6),
        vy: rand(-9, -1),
        size: rand(1, 5),
        life: rand(30, 100),
        age: 0,
        hue: 230 + rand(-40, 40)
      });
    }
  });

})();
