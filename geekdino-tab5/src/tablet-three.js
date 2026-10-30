/**
 * TabletThree — Interactive WebGL 3D Tablet for GEEKDINO TAB 5
 * High-performance, offline-capable Three.js rendering.
 * Features:
 *  - Chamfered metallic chassis with glass display & anodized back
 *  - Studio rim lighting with brand neon (#3CF5A0) reflections
 *  - Mouse & touch drag-to-rotate with spring damping
 *  - ScrollTrigger synced rotation matching Journey chapters
 *  - Viewport culling (pauses rendering when out of view)
 *  - Seamless fallback to CSS-3D when WebGL or reduced-motion is detected
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function hasWebGL() {
    try {
      var canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (reduceMotion || !hasWebGL() || typeof THREE === 'undefined') {
    // Keep standard CSS-3D cube
    return;
  }

  var container = null;
  var scene, camera, renderer;
  var tabletGroup, chassisMesh, screenMesh, backMesh, cameraBump;
  var isDragging = false;
  var prevPointerX = 0, prevPointerY = 0;
  var manualRotX = 0, manualRotY = 0;
  var targetManualRotX = 0, targetManualRotY = 0;
  var scrollRotX = -0.18, scrollRotY = -0.48; // Hero starting pose
  var parallaxX = 0, parallaxY = 0;
  var targetParallaxX = 0, targetParallaxY = 0;
  var isVisible = true;
  var animFrameId = 0;
  var currentPosX = 0;
  var W = 3.26, H = 5.0, D = 0.28, R = 0.22;

  function getTargetX() {
    var w = window.innerWidth;
    if (w < 992) return 0;
    if (!camera) return 2.6;
    var vFov = (camera.fov * Math.PI) / 180;
    var visibleHeight = 2 * Math.tan(vFov / 2) * camera.position.z;
    var visibleWidth = visibleHeight * camera.aspect;
    // Position tablet in right corner (~70% across viewport width)
    return Math.min(3.8, Math.max(2.2, visibleWidth * 0.22));
  }

  function createRoundedRectShape(w, h, r) {
    var shape = new THREE.Shape();
    var x = -w / 2, y = -h / 2;
    shape.moveTo(x + r, y);
    shape.lineTo(x + w - r, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + r);
    shape.lineTo(x + w, y + h - r);
    shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    shape.lineTo(x + r, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - r);
    shape.lineTo(x, y + r);
    shape.quadraticCurveTo(x, y, x + r, y);
    return shape;
  }

  function initThree() {
    var master = document.getElementById('tabletMaster');
    var sceneEl = document.getElementById('tabletScene');
    if (!master || !sceneEl) return;

    // Create Three.js mounting container
    container = document.createElement('div');
    container.className = 'tablet-three-canvas-wrap';
    container.style.position = 'absolute';
    container.style.inset = '0';
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.pointerEvents = 'auto';
    container.style.cursor = 'grab';
    container.style.zIndex = '5';
    container.setAttribute('aria-label', 'Interactive 3D GEEKDINO TAB 5 model. Drag to rotate.');
    master.appendChild(container);

    // Hide CSS-3D faces so Three.js takes over smoothly
    sceneEl.style.opacity = '0';
    sceneEl.style.pointerEvents = 'none';

    var width = container.clientWidth || window.innerWidth;
    var height = container.clientHeight || window.innerHeight;

    // Scene & Camera
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lighting
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    // Key Light
    var keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 7, 8);
    scene.add(keyLight);

    // Neon Rim Light (Geek Dino brand accent)
    var rimLight = new THREE.DirectionalLight(0x3cf5a0, 3.2);
    rimLight.position.set(-6, -2, -3);
    scene.add(rimLight);

    // Fill Light
    var fillLight = new THREE.DirectionalLight(0x4f8cff, 0.8);
    fillLight.position.set(4, -5, -4);
    scene.add(fillLight);

    // Subtle front highlight
    var frontLight = new THREE.PointLight(0xffffff, 0.6, 20);
    frontLight.position.set(0, 1, 6);
    scene.add(frontLight);

    // Model Group
    tabletGroup = new THREE.Group();
    scene.add(tabletGroup);

    // Texture Loader (uses WebP with fallback)
    var texLoader = new THREE.TextureLoader();
    var frontTex = texLoader.load('assets/tablet-3d/front.webp');
    var backTex = texLoader.load('assets/tablet-3d/back.webp');

    frontTex.generateMipmaps = true;
    backTex.generateMipmaps = true;

    // 1. Chassis Body (Matte Anodized Aluminum with rounded corners)
    var chassisShape = createRoundedRectShape(W, H, R);
    var extrudeSettings = {
      depth: D,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.04,
      bevelThickness: 0.04
    };
    var chassisGeo = new THREE.ExtrudeGeometry(chassisShape, extrudeSettings);
    chassisGeo.center();

    var chassisMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      metalness: 0.88,
      roughness: 0.32
    });
    chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
    tabletGroup.add(chassisMesh);

    // 2. Front Screen Glass (High-refraction display)
    var screenShape = createRoundedRectShape(W * 0.94, H * 0.95, R * 0.7);
    var screenGeo = new THREE.ShapeGeometry(screenShape);
    // Map UVs correctly to texture
    var pos = screenGeo.attributes.position;
    var uvs = [];
    var minX = -W * 0.47, maxX = W * 0.47;
    var minY = -H * 0.475, maxY = H * 0.475;
    for (var i = 0; i < pos.count; i++) {
      var px = pos.getX(i);
      var py = pos.getY(i);
      uvs.push((px - minX) / (maxX - minX), (py - minY) / (maxY - minY));
    }
    screenGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

    var screenMat = new THREE.MeshPhysicalMaterial({
      map: frontTex,
      roughness: 0.1,
      metalness: 0.05,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      reflectivity: 0.9
    });
    screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = D / 2 + 0.045;
    tabletGroup.add(screenMesh);

    // 3. Back Cover Panel (Geek Dino Logo & Matte Finish)
    var backShape = createRoundedRectShape(W * 0.96, H * 0.97, R * 0.85);
    var backGeo = new THREE.ShapeGeometry(backShape);
    var bPos = backGeo.attributes.position;
    var bUvs = [];
    var bMinX = -W * 0.48, bMaxX = W * 0.48;
    var bMinY = -H * 0.485, bMaxY = H * 0.485;
    for (var j = 0; j < bPos.count; j++) {
      var bx = bPos.getX(j);
      var by = bPos.getY(j);
      // Flip X for back view texture alignment
      bUvs.push(1.0 - (bx - bMinX) / (bMaxX - bMinX), (by - bMinY) / (bMaxY - bMinY));
    }
    backGeo.setAttribute('uv', new THREE.Float32BufferAttribute(bUvs, 2));

    var backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      roughness: 0.38,
      metalness: 0.82
    });
    backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.z = -D / 2 - 0.045;
    backMesh.rotation.y = Math.PI;
    tabletGroup.add(backMesh);

    // 4. Rear Camera Module Accent
    var camBoxGeo = new THREE.BoxGeometry(0.38, 0.72, 0.08);
    var camBoxMat = new THREE.MeshStandardMaterial({ color: 0x0a0c0e, roughness: 0.2, metalness: 0.9 });
    cameraBump = new THREE.Mesh(camBoxGeo, camBoxMat);
    cameraBump.position.set(W * 0.34, H * 0.36, -D / 2 - 0.07);
    tabletGroup.add(cameraBump);

    // 5. Volume & Power Buttons on side rail
    var buttonMat = new THREE.MeshStandardMaterial({ color: 0x22262b, metalness: 0.95, roughness: 0.2 });
    var powerBtn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.45, 0.1), buttonMat);
    powerBtn.position.set(W / 2 + 0.05, H * 0.28, 0);
    tabletGroup.add(powerBtn);

    var volBtn = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.85, 0.1), buttonMat);
    volBtn.position.set(W / 2 + 0.05, H * 0.08, 0);
    tabletGroup.add(volBtn);

    // Responsive scaling
    updateScale();
    window.addEventListener('resize', onResize, { passive: true });

    // Drag / Touch Controls
    bindDragEvents();

    // Mouse Parallax for Hero
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // Sync with ScrollTrigger
    initScrollSync();

    // Visibility toggle (culling when anatomy is active)
    bindVisibility();

    // Start RAF
    renderLoop();

    window.TabletThree = {
      group: tabletGroup,
      setRotation: function (xRad, yRad) {
        scrollRotX = xRad;
        scrollRotY = yRad;
      },
      show: function () {
        if (container) container.style.display = 'flex';
        isVisible = true;
      },
      hide: function () {
        if (container) container.style.display = 'none';
        isVisible = false;
      }
    };
  }

  function updateScale() {
    if (!camera || !renderer || !container) return;
    var w = container.clientWidth || window.innerWidth;
    var h = container.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);

    // Dynamically adjust scale based on screen width
    var scale = w < 768 ? 0.72 : (w < 1100 ? 0.88 : 1.05);
    if (tabletGroup) tabletGroup.scale.set(scale, scale, scale);
  }

  function onResize() {
    updateScale();
  }

  function onMouseMove(e) {
    if (window.scrollY > window.innerHeight * 1.5) return;
    var nx = (e.clientX / window.innerWidth) * 2 - 1;
    var ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetParallaxX = ny * 0.08;
    targetParallaxY = nx * 0.12;
  }

  function bindDragEvents() {
    container.addEventListener('pointerdown', function (e) {
      isDragging = true;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;
      container.style.cursor = 'grabbing';
      container.setPointerCapture(e.pointerId);
    });

    container.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      var dx = e.clientX - prevPointerX;
      var dy = e.clientY - prevPointerY;
      prevPointerX = e.clientX;
      prevPointerY = e.clientY;

      targetManualRotY += dx * 0.008;
      targetManualRotX += dy * 0.008;
      // Clamp vertical manual tilt
      targetManualRotX = Math.max(-0.6, Math.min(0.6, targetManualRotX));
    });

    function endDrag(e) {
      if (!isDragging) return;
      isDragging = false;
      container.style.cursor = 'grab';
      try { container.releasePointerCapture(e.pointerId); } catch (_) {}
    }

    container.addEventListener('pointerup', endDrag);
    container.addEventListener('pointercancel', endDrag);
  }

  function initScrollSync() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    var journey = document.querySelector('.journey');
    if (!journey) return;

    // Timeline synced with Journey panels: Work -> Learn -> Create -> Connect
    gsap.timeline({
      scrollTrigger: {
        trigger: journey,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.1,
        invalidateOnRefresh: true,
        onUpdate: function (self) {
          var p = self.progress;
          // Interpolate rotations smoothly
          if (p < 0.25) {
            // Panel 1: Work (Front view with slight 3D slant)
            var t = p / 0.25;
            scrollRotY = gsap.utils.interpolate(-0.48, -0.31, t);
            scrollRotX = gsap.utils.interpolate(-0.18, -0.12, t);
          } else if (p < 0.55) {
            // Panel 2: Learn (Full turn to showcase back panel & camera)
            var t = (p - 0.25) / 0.3;
            scrollRotY = gsap.utils.interpolate(-0.31, Math.PI - 0.1, t);
            scrollRotX = gsap.utils.interpolate(-0.12, 0.08, t);
          } else if (p < 0.8) {
            // Panel 3: Create (Profile edge view showing thin chassis & ports)
            var t = (p - 0.55) / 0.25;
            scrollRotY = gsap.utils.interpolate(Math.PI - 0.1, Math.PI * 1.48, t);
            scrollRotX = gsap.utils.interpolate(0.08, 0.14, t);
          } else {
            // Panel 4: Connect (Completes 360 loop back to heroic front)
            var t = (p - 0.8) / 0.2;
            scrollRotY = gsap.utils.interpolate(Math.PI * 1.48, Math.PI * 2 - 0.48, t);
            scrollRotX = gsap.utils.interpolate(0.14, -0.18, t);
          }
        }
      }
    });
  }

  function bindVisibility() {
    var stage = document.getElementById('modelStage');
    var master = document.getElementById('tabletMaster');

    // Hide Three.js canvas when entering exploded Anatomy or Features mode
    var observer = new MutationObserver(function () {
      if (stage && stage.classList.contains('is-visible')) {
        if (container) container.style.opacity = '0';
        isVisible = false;
      } else {
        if (container && master && master.style.visibility !== 'hidden' && master.style.opacity !== '0') {
          container.style.opacity = '1';
          isVisible = true;
        }
      }
    });

    if (stage) {
      observer.observe(stage, { attributes: true, attributeFilter: ['class', 'style'] });
    }
    if (master) {
      observer.observe(master, { attributes: true, attributeFilter: ['style'] });
    }
  }

  function renderLoop() {
    animFrameId = requestAnimationFrame(renderLoop);
    if (!isVisible || !tabletGroup) return;

    // Smooth manual drag damping
    manualRotX += (targetManualRotX - manualRotX) * 0.08;
    manualRotY += (targetManualRotY - manualRotY) * 0.08;

    // Return to track spring when not dragging
    if (!isDragging) {
      targetManualRotX *= 0.94;
      targetManualRotY *= 0.94;
    }

    // Parallax damping
    parallaxX += (targetParallaxX - parallaxX) * 0.06;
    parallaxY += (targetParallaxY - parallaxY) * 0.06;

    // Combine scroll rotation, manual interaction & mouse parallax
    tabletGroup.rotation.x = scrollRotX + manualRotX + parallaxX;
    tabletGroup.rotation.y = scrollRotY + manualRotY + parallaxY;

    // Smooth horizontal position transition to right side corner
    var targetX = getTargetX();
    currentPosX += (targetX - currentPosX) * 0.08;
    tabletGroup.position.x = currentPosX;

    // Gentle ambient floating bob
    var time = Date.now() * 0.0015;
    tabletGroup.position.y = Math.sin(time) * 0.08;

    renderer.render(scene, camera);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initThree);
  } else {
    initThree();
  }
})();

