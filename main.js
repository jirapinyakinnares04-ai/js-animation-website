/**
 * ============================================================================
 * ATELIER FORMA — Main Interactive & Animation Controller
 * Handles 3D Tilt, Lighting Raycaster, Magnetic Cursor, Momentum Carousel,
 * Sound Interactions & Theme Orchestration
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initCustomCursor();
  initSculpture3DStage();
  initStudioDock();
  initThemeManager();
  initMomentumCarousel();
  initScrollAnimations();
  initAudioControls();
});

/**
 * 1. Custom Smooth Elastic Cursor & Magnetic Interactions
 */
function initCustomCursor() {
  const dot = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  const mouse = { x: -100, y: -100, targetX: -100, targetY: -100 };
  const ringPos = { x: -100, y: -100 };

  window.addEventListener('mousemove', (e) => {
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
  });

  // Magnetic elements
  const magnetics = document.querySelectorAll('button, a, .annotation-pin, .collection-card');
  magnetics.forEach((el) => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('active');
      if (window.soundEngine) window.soundEngine.playHover();
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('active');
    });
    el.addEventListener('click', () => {
      if (window.soundEngine) window.soundEngine.playTap();
    });
  });

  function renderCursor() {
    // Lerp dot swiftly
    mouse.x += (mouse.targetX - mouse.x) * 0.75;
    mouse.y += (mouse.targetY - mouse.y) * 0.75;
    dot.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0) translate(-50%, -50%)`;

    // Lerp outer ring smoothly with elastic spring lag
    ringPos.x += (mouse.targetX - ringPos.x) * 0.18;
    ringPos.y += (mouse.targetY - ringPos.y) * 0.18;
    ring.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0) translate(-50%, -50%)`;

    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

/**
 * 2. 3D Kinetic Sculpture Stage & Raycast Lighting
 */
function initSculpture3DStage() {
  const card = document.getElementById('sculpture-card');
  const specular = document.getElementById('specular-light');
  if (!card) return;

  const state = {
    targetRotX: 0,
    targetRotY: 0,
    currRotX: 0,
    currRotY: 0,
    lightX: 50,
    lightY: 50,
    currLightX: 50,
    currLightY: 50,
    shadowX: 0,
    shadowY: 20,
    isHovered: false,
    mode: 'default', // 'default', 'exploded', 'kinetic'
    time: 0
  };

  const handlePointerMove = (clientX, clientY) => {
    const rect = card.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (clientX - centerX) / (rect.width / 2);
    const normY = (clientY - centerY) / (rect.height / 2);

    // Limit maximum tilt angle
    state.targetRotY = Math.max(-18, Math.min(18, normX * 18));
    state.targetRotX = Math.max(-18, Math.min(18, -normY * 18));

    // Dynamic light position (in percentage 0-100)
    const cardRelX = ((clientX - rect.left) / rect.width) * 100;
    const cardRelY = ((clientY - rect.top) / rect.height) * 100;
    state.lightX = Math.max(0, Math.min(100, cardRelX));
    state.lightY = Math.max(0, Math.min(100, cardRelY));

    // Dynamic drop shadow offset
    state.shadowX = -normX * 35;
    state.shadowY = -normY * 35 + 20;
  };

  window.addEventListener('mousemove', (e) => {
    handlePointerMove(e.clientX, e.clientY);
  });

  // Mobile Device Orientation Gyroscope support
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (e) => {
      if (e.gamma !== null && e.beta !== null) {
        state.targetRotY = Math.max(-20, Math.min(20, e.gamma * 0.8));
        state.targetRotX = Math.max(-20, Math.min(20, (e.beta - 45) * 0.8));
      }
    });
  }

  // Animation Loop
  function update3DStage() {
    state.time += 0.03;

    // Apply Kinetic Wave oscillation when in 'kinetic' mode
    let waveX = 0;
    let waveY = 0;
    if (state.mode === 'kinetic') {
      waveX = Math.sin(state.time * 2) * 5;
      waveY = Math.cos(state.time * 1.5) * 6;
    }

    // Damping interpolation
    state.currRotX += (state.targetRotX + waveX - state.currRotX) * 0.08;
    state.currRotY += (state.targetRotY + waveY - state.currRotY) * 0.08;

    state.currLightX += (state.lightX - state.currLightX) * 0.1;
    state.currLightY += (state.lightY - state.currLightY) * 0.1;

    // Update Card Transform
    card.style.transform = `rotateX(${state.currRotX}deg) rotateY(${state.currRotY}deg) scale3d(1.02, 1.02, 1.02)`;

    // Update Specular Highlight Overlay
    if (specular) {
      specular.style.background = `radial-gradient(circle 280px at ${state.currLightX}% ${state.currLightY}%, rgba(255, 255, 255, 0.5) 0%, transparent 80%)`;
    }

    // Dynamic Cast Shadow on Card
    const isDark = document.body.getAttribute('data-theme') === 'obsidian';
    const shadowColor = isDark ? 'rgba(0,0,0,0.85)' : 'rgba(20,18,15,0.14)';
    card.style.boxShadow = `${state.shadowX}px ${state.shadowY}px 50px -10px ${shadowColor}, 0 10px 25px -10px rgba(0,0,0,0.06)`;

    requestAnimationFrame(update3DStage);
  }
  requestAnimationFrame(update3DStage);

  // Store mode controller on window for dock buttons
  window.sculptureState = state;
}

/**
 * 3. Studio Dock Controls (Modes & Presets)
 */
function initStudioDock() {
  const dockBtns = document.querySelectorAll('.dock-btn');
  const card = document.getElementById('sculpture-card');
  if (!dockBtns.length || !card) return;

  dockBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      dockBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const mode = btn.getAttribute('data-mode');
      if (window.sculptureState) {
        window.sculptureState.mode = mode;
      }

      if (mode === 'exploded') {
        card.classList.add('exploded');
      } else {
        card.classList.remove('exploded');
      }

      if (window.soundEngine) {
        window.soundEngine.playTransitionChord();
      }
    });
  });
}

/**
 * 4. Theme Manager (Material Finishes)
 */
function initThemeManager() {
  const pills = document.querySelectorAll('.theme-pill');
  if (!pills.length) return;

  pills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');

      const theme = pill.getAttribute('data-set-theme');
      if (theme === 'porcelain') {
        document.body.removeAttribute('data-theme');
      } else {
        document.body.setAttribute('data-theme', theme);
      }

      if (window.soundEngine) {
        window.soundEngine.playTransitionChord();
      }
    });
  });
}

/**
 * 5. Horizontal Collection Carousel with Drag Momentum Physics
 */
function initMomentumCarousel() {
  const viewport = document.getElementById('carousel-viewport');
  const track = document.getElementById('carousel-track');
  if (!viewport || !track) return;

  let isDown = false;
  let startX = 0;
  let currentTranslate = 0;
  let prevTranslate = 0;
  let velocity = 0;
  let lastX = 0;
  let animationId = null;

  const getBoundaries = () => {
    const trackWidth = track.scrollWidth;
    const viewportWidth = viewport.clientWidth;
    return {
      min: Math.min(0, viewportWidth - trackWidth - 40),
      max: 0
    };
  };

  const setSliderPosition = () => {
    track.style.transform = `translate3d(${currentTranslate}px, 0, 0)`;
  };

  const applyMomentum = () => {
    if (Math.abs(velocity) > 0.1) {
      currentTranslate += velocity;
      velocity *= 0.94; // Friction damping

      const bounds = getBoundaries();
      // Elastic bounce back
      if (currentTranslate > bounds.max) {
        currentTranslate += (bounds.max - currentTranslate) * 0.15;
        velocity *= 0.5;
      } else if (currentTranslate < bounds.min) {
        currentTranslate += (bounds.min - currentTranslate) * 0.15;
        velocity *= 0.5;
      }

      setSliderPosition();
      animationId = requestAnimationFrame(applyMomentum);
    }
  };

  // Mouse / Touch events
  viewport.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.clientX;
    lastX = e.clientX;
    prevTranslate = currentTranslate;
    cancelAnimationFrame(animationId);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    const currentX = e.clientX;
    const deltaX = currentX - startX;
    velocity = currentX - lastX;
    lastX = currentX;

    currentTranslate = prevTranslate + deltaX;
    setSliderPosition();
  });

  window.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    animationId = requestAnimationFrame(applyMomentum);
  });

  // Touch Events for mobile
  viewport.addEventListener('touchstart', (e) => {
    isDown = true;
    startX = e.touches[0].clientX;
    lastX = startX;
    prevTranslate = currentTranslate;
    cancelAnimationFrame(animationId);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    velocity = currentX - lastX;
    lastX = currentX;

    currentTranslate = prevTranslate + deltaX;
    setSliderPosition();
  }, { passive: true });

  window.addEventListener('touchend', () => {
    if (!isDown) return;
    isDown = false;
    animationId = requestAnimationFrame(applyMomentum);
  });
}

/**
 * 6. Scroll Stagger Reveals
 */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.feature-box, .section-header, .collection-card');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.08}s`;
    observer.observe(el);
  });
}

/**
 * 7. Audio Controls
 */
function initAudioControls() {
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (!audioBtn) return;

  audioBtn.addEventListener('click', () => {
    if (window.soundEngine) {
      const isPlaying = window.soundEngine.toggle();
      if (isPlaying) {
        audioBtn.classList.add('playing');
        audioBtn.querySelector('.audio-text').textContent = 'Audio: ON';
      } else {
        audioBtn.classList.remove('playing');
        audioBtn.querySelector('.audio-text').textContent = 'Audio: OFF';
      }
    }
  });
}
