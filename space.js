(() => {
  const canvas = document.getElementById('space-background');
  const context = canvas && canvas.getContext('2d', { alpha: false });
  if (!context) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const staticLayer = document.createElement('canvas');
  const staticContext = staticLayer.getContext('2d');
  let width = 0;
  let height = 0;
  let pixelRatio = 1;
  let stars = [];
  let orbiters = [];
  let frameId = 0;
  let lastFrame = 0;
  let resizeTimer = 0;

  function randomGenerator(seed) {
    let value = seed >>> 0;
    return () => {
      value = (1664525 * value + 1013904223) >>> 0;
      return value / 4294967296;
    };
  }

  function radialGlow(target, x, y, radius, stops) {
    const gradient = target.createRadialGradient(x, y, 0, x, y, radius);
    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    target.fillStyle = gradient;
    target.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function rebuild() {
    width = window.innerWidth;
    height = window.innerHeight;
    pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    staticLayer.width = canvas.width;
    staticLayer.height = canvas.height;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    staticContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const random = randomGenerator(20260929);
    const base = staticContext.createLinearGradient(0, 0, width, height);
    base.addColorStop(0, '#020511');
    base.addColorStop(0.48, '#0b1430');
    base.addColorStop(1, '#02030b');
    staticContext.fillStyle = base;
    staticContext.fillRect(0, 0, width, height);

    const spread = Math.max(width, height);
    radialGlow(staticContext, width * 0.16, height * 0.76, spread * 0.52, [
      [0, 'rgba(37, 75, 135, 0.35)'], [0.35, 'rgba(65, 36, 104, 0.20)'], [1, 'rgba(0, 0, 0, 0)'],
    ]);
    radialGlow(staticContext, width * 0.80, height * 0.44, spread * 0.46, [
      [0, 'rgba(83, 47, 137, 0.26)'], [0.42, 'rgba(28, 52, 115, 0.18)'], [1, 'rgba(0, 0, 0, 0)'],
    ]);
    radialGlow(staticContext, width * 0.61, height * 0.13, spread * 0.30, [
      [0, 'rgba(31, 100, 139, 0.22)'], [1, 'rgba(0, 0, 0, 0)'],
    ]);

    const count = Math.min(850, Math.max(280, Math.round(width * height / 1700)));
    stars = [];
    for (let i = 0; i < count; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const radius = random() < 0.965 ? 0.35 + random() * 1.1 : 1.4 + random() * 1.1;
      const opacity = 0.24 + random() * 0.65;
      const hue = random() < 0.14 ? '255, 195, 159' : random() < 0.28 ? '164, 202, 255' : '238, 245, 255';
      staticContext.beginPath();
      staticContext.arc(x, y, radius, 0, Math.PI * 2);
      staticContext.fillStyle = `rgba(${hue}, ${opacity})`;
      staticContext.fill();
      if (i < 105) stars.push({ x, y, radius: radius + 0.35, phase: random() * Math.PI * 2, hue });
    }

    orbiters = Array.from({ length: 170 }, () => ({
      angle: random() * Math.PI * 2,
      distance: 1.07 + random() * 0.68,
      speed: 0.15 + random() * 0.37,
      size: 0.45 + random() * 1.35,
      warm: random() > 0.23,
    }));
    render(performance.now() * 0.001);
  }

  function drawStars(time) {
    for (const star of stars) {
      const shimmer = 0.36 + (Math.sin(time * 1.1 + star.phase) + 1) * 0.25;
      context.beginPath();
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fillStyle = `rgba(${star.hue}, ${shimmer})`;
      context.fill();
    }
  }

  function drawDisk(radius, time, front) {
    const start = front ? 0 : Math.PI;
    const end = front ? Math.PI : Math.PI * 2;
    const gradient = context.createLinearGradient(-radius * 1.8, 0, radius * 1.8, 0);
    gradient.addColorStop(0, '#6ca6ff');
    gradient.addColorStop(0.28, '#bf8fff');
    gradient.addColorStop(0.49, '#ffe4bd');
    gradient.addColorStop(0.72, '#ff9e5c');
    gradient.addColorStop(1, '#cf5f6b');
    context.strokeStyle = gradient;
    context.shadowColor = front ? '#ffad6b' : '#83a5ff';
    context.shadowBlur = radius * 0.10;
    for (let band = 0; band < 23; band += 1) {
      const position = band / 22;
      const pulse = 0.78 + Math.sin(time * 0.55 + band * 0.7) * 0.12;
      context.globalAlpha = (0.055 + (1 - position) * 0.17) * pulse;
      context.lineWidth = Math.max(1, radius * (0.004 + position * 0.004));
      context.beginPath();
      context.ellipse(0, 0, radius * (1.05 + position * 0.82), radius * (0.23 + position * 0.19), 0, start, end);
      context.stroke();
    }
    context.globalAlpha = 1;
    context.shadowBlur = 0;
  }

  function drawOrbiters(radius, time, front) {
    for (const orbiter of orbiters) {
      const angle = orbiter.angle + time * orbiter.speed;
      if ((Math.sin(angle) >= 0) !== front) continue;
      const orbitalRadius = radius * orbiter.distance;
      const x = Math.cos(angle) * orbitalRadius;
      const y = Math.sin(angle) * orbitalRadius * 0.31;
      context.beginPath();
      context.ellipse(x, y, orbiter.size * 1.7, orbiter.size * 0.6, -0.25, 0, Math.PI * 2);
      context.fillStyle = orbiter.warm ? 'rgba(255, 201, 139, 0.76)' : 'rgba(167, 196, 255, 0.68)';
      context.fill();
    }
  }

  function drawBlackHole(time) {
    const radius = width < 700 ? Math.min(height * 0.22, width * 0.32) : Math.min(height * 0.30, width * 0.24);
    const centerX = width < 700 ? width * 0.68 : width * 0.78;
    const centerY = height * 0.46;
    radialGlow(context, centerX, centerY, radius * 2.5, [
      [0, 'rgba(255, 173, 107, 0.11)'],
      [0.32, 'rgba(116, 92, 194, 0.16)'],
      [0.7, 'rgba(45, 67, 145, 0.08)'],
      [1, 'rgba(0, 0, 0, 0)'],
    ]);

    context.save();
    context.translate(centerX, centerY);
    context.rotate(-0.22);
    context.globalCompositeOperation = 'screen';
    drawDisk(radius, time, false);
    drawOrbiters(radius, time, false);
    context.globalCompositeOperation = 'source-over';

    const halo = context.createRadialGradient(0, 0, radius * 0.52, 0, 0, radius * 0.91);
    halo.addColorStop(0, '#01020a');
    halo.addColorStop(0.78, '#01020a');
    halo.addColorStop(0.92, '#182141');
    halo.addColorStop(1, 'rgba(180, 163, 244, 0.5)');
    context.fillStyle = halo;
    context.beginPath();
    context.arc(0, 0, radius * 0.91, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = 'rgba(222, 208, 255, 0.52)';
    context.lineWidth = Math.max(1.3, radius * 0.009);
    context.shadowColor = '#d7baff';
    context.shadowBlur = radius * 0.09;
    context.beginPath();
    context.ellipse(0, 0, radius * 0.94, radius * 0.97, 0, Math.PI * 1.04, Math.PI * 1.95);
    context.stroke();
    context.shadowBlur = 0;

    context.globalCompositeOperation = 'screen';
    drawDisk(radius, time, true);
    drawOrbiters(radius, time, true);
    context.restore();
  }

  function render(time) {
    context.drawImage(staticLayer, 0, 0, width, height);
    drawStars(time);
    drawBlackHole(time);
  }

  function animate(timestamp) {
    frameId = window.requestAnimationFrame(animate);
    if (timestamp - lastFrame < 33) return;
    lastFrame = timestamp;
    render(timestamp * 0.001);
  }

  function updateMotion() {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
    if (document.hidden || reducedMotion.matches) {
      render(performance.now() * 0.001);
    } else {
      frameId = window.requestAnimationFrame(animate);
    }
  }

  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      rebuild();
      updateMotion();
    }, 120);
  });
  document.addEventListener('visibilitychange', updateMotion);
  if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', updateMotion);
  else reducedMotion.addListener(updateMotion);
  rebuild();
  updateMotion();
})();
