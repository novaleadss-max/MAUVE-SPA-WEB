/**
 * MAUVE — el tulipán del logo, en 3D y procedural (sin modelo .glb).
 *
 * Cada pétalo es un plano deformado (ancho de almendra, curvatura en copa,
 * panza hacia afuera y punta que se cierra) colgado de una bisagra en su base.
 * Abrir la flor = rotar las bisagras; no se recalcula geometría por cuadro.
 *
 * Los capítulos solo mueven `tulip.state` con GSAP; aquí se convierte ese
 * estado en posición de pantalla, se suma el parallax del mouse / giroscopio
 * y se dibuja. Si la flor no está visible, no se dibuja nada.
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { gsap } from "gsap";
import { TULIPAN, COLORS } from "../config.js";

const TAU = Math.PI * 2;

function petalGeometry(seg, { w = 1, h = 1.9, cup = 0.34, bulge = 0.3, curl = 0.2 } = {}) {
  const g = new THREE.PlaneGeometry(1, 1, seg, Math.round(seg * 1.6));
  const p = g.attributes.position;
  const shade = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5;
    const t = p.getY(i) + 0.5;
    // Almond outline: narrow base, widest around 60%, pointed tip
    const wp = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.85);
    const width = w * (0.14 + 0.86 * wp);
    const xn = (u - 0.5) * 2;
    const x = xn * width * 0.5;
    const y = t * h;
    // +z faces the flower's axis: edges cup inwards, belly bulges out, tip curls in
    const z =
      -bulge * Math.sin(Math.PI * t) * (1 - 0.25 * t) +
      cup * xn * xn * (0.35 + 0.65 * wp) +
      curl * Math.pow(t, 3);
    p.setXYZ(i, x, y, z);
    // Darker at the base and in the middle vein, lighter towards the tip
    const v = 0.62 + 0.42 * Math.pow(t, 0.8) - 0.06 * (1 - Math.abs(xn));
    shade[i * 3] = shade[i * 3 + 1] = shade[i * 3 + 2] = v;
  }
  g.setAttribute("color", new THREE.BufferAttribute(shade, 3));
  g.computeVertexNormals();
  return g;
}

export class Tulip {
  /**
   * state / intro / hover are plain objects created before Three.js loads
   * (see createTulipState), so the chapters can animate them from the start
   * and the flower picks them up whenever it arrives.
   */
  constructor(canvas, { mobile = false, state, intro, hover } = {}) {
    this.canvas = canvas;
    this.mobile = mobile;
    this.state = state;
    this.intro = intro;
    this.hover = hover;
    // Late arrival: the flower fades in on its own instead of popping in
    this.appear = { v: 0 };
    this.ready = false;

    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.time = 0;
    this.ok = this.init();
  }

  init() {
    try {
      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return false;
    }
    const r = this.renderer;
    r.setPixelRatio(Math.min(window.devicePixelRatio, this.mobile ? TULIPAN.dprMaxMovil : TULIPAN.dprMax));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.92;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
    this.camera.position.set(0, 0, 12);

    // Reflections from a generated studio room. Phones skip it: it is the
    // most expensive step to build, and the lights below carry the look
    if (!this.mobile) {
      const pmrem = new THREE.PMREMGenerator(r);
      this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }

    this.scene.add(new THREE.HemisphereLight(0xfff1ef, 0x2a1520, this.mobile ? 1.6 : 0.7));
    const key = new THREE.DirectionalLight(0xffe2dc, 2.3);
    key.position.set(3, 5, 7);
    const rim = new THREE.DirectionalLight(0xb3b0dd, 3.2);
    rim.position.set(-6, 2, -5);
    this.scene.add(key, rim);

    this.build();
    this.resize();
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("pointermove", (e) => {
      this.pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    this.listenGyro();

    this.canvas.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.lost = true;
    });

    // Compile shaders without blocking the main thread where the GPU allows it,
    // then fade the flower in
    const start = () => {
      this.ready = true;
      gsap.to(this.appear, { v: 1, duration: 1.1, ease: "m-out" });
    };
    (r.compileAsync ? r.compileAsync(this.scene, this.camera) : Promise.resolve()).then(start, start);

    this.tick = this.tick.bind(this);
    gsap.ticker.add(this.tick);
    return true;
  }

  build() {
    const seg = this.mobile ? Math.round(TULIPAN.segmentos / 2) : TULIPAN.segmentos;
    const physical = (color, extra = {}) =>
      new THREE.MeshPhysicalMaterial({
        color,
        vertexColors: true,
        roughness: 0.5,
        metalness: 0,
        sheen: 1,
        sheenColor: new THREE.Color(COLORS.lavanda),
        envMapIntensity: 0.55,
        sheenRoughness: 0.4,
        clearcoat: this.mobile ? 0 : 0.18,
        clearcoatRoughness: 0.5,
        side: THREE.DoubleSide,
        ...extra,
      });

    this.root = new THREE.Group(); // screen position + size
    this.tilt = new THREE.Group(); // pointer parallax
    this.flower = new THREE.Group(); // spin
    this.root.add(this.tilt);
    this.tilt.add(this.flower);
    this.scene.add(this.root);

    const outerMat = physical(new THREE.Color(COLORS.mauve));
    const innerMat = physical(new THREE.Color("#a29dd6"));
    const outerGeo = petalGeometry(seg, { w: 1.25, h: 2.1, cup: 0.42, bulge: 0.34, curl: 0.24 });
    const innerGeo = petalGeometry(seg, { w: 1.05, h: 1.95, cup: 0.36, bulge: 0.26, curl: 0.3 });

    this.hinges = [];
    const ring = (count, geo, mat, radius, offset, closed, open, lift) => {
      for (let k = 0; k < count; k++) {
        const pivot = new THREE.Group();
        pivot.rotation.y = offset + (k / count) * TAU;
        const hinge = new THREE.Group();
        hinge.position.set(0, lift, -radius);
        const mesh = new THREE.Mesh(geo, mat);
        hinge.add(mesh);
        pivot.add(hinge);
        this.flower.add(pivot);
        this.hinges.push({ hinge, closed, open, jitter: (k % 2 ? 1 : -1) * 0.04 });
      }
    };
    ring(3, outerGeo, outerMat, 0.1, 0, 0.2, 1.22, 0);
    ring(3, innerGeo, innerMat, 0.04, Math.PI / 3, 0.06, 0.74, 0.06);

    // Pistil: only visible once the flower opens
    const pistil = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 24, 16),
      new THREE.MeshPhysicalMaterial({ color: COLORS.rosaPalido, roughness: 0.35, sheen: 1, sheenColor: new THREE.Color(COLORS.crema) }),
    );
    pistil.scale.set(1, 1.7, 1);
    pistil.position.y = 0.42;
    this.flower.add(pistil);

    // The flower is built from its base up; centre it on its visual middle
    this.flower.position.y = -1.0;

    // Loose petals drifting around the flower
    this.loose = new THREE.Group();
    this.tilt.add(this.loose);
    const looseGeo = petalGeometry(Math.max(8, seg / 2), { w: 1, h: 1.7, cup: 0.4, bulge: 0.25, curl: 0.1 });
    this.drifters = Array.from({ length: this.mobile ? 4 : 6 }, (_, i) => {
      const m = new THREE.Mesh(looseGeo, i % 2 ? innerMat : outerMat);
      const a = (i / (this.mobile ? 4 : 6)) * TAU + 0.4;
      const d = { mesh: m, a, r: 1.55 + (i % 3) * 0.3, y: (i % 3 - 1) * 0.6, s: 0.26 + (i % 3) * 0.06, speed: 0.12 + (i % 4) * 0.04, spin: 0.4 + i * 0.13 };
      this.loose.add(m);
      return d;
    });
  }

  listenGyro() {
    const onOrient = (e) => {
      if (e.gamma == null) return;
      this.pointer.tx = gsap.utils.clamp(-1, 1, e.gamma / 25);
      this.pointer.ty = gsap.utils.clamp(-1, 1, (e.beta - 45) / 25);
    };
    const DOE = window.DeviceOrientationEvent;
    if (!DOE || !matchMedia("(pointer: coarse)").matches) return;
    if (typeof DOE.requestPermission === "function") {
      // iOS: needs a gesture. Ask once, on the first tap anywhere.
      window.addEventListener("touchend", () => {
        DOE.requestPermission().then((s) => s === "granted" && window.addEventListener("deviceorientation", onOrient)).catch(() => {});
      }, { once: true });
    } else {
      window.addEventListener("deviceorientation", onOrient);
    }
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dist = this.camera.position.z;
    this.viewH = 2 * Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * dist;
    this.viewW = this.viewH * this.camera.aspect;
  }


  tick(time, deltaMs) {
    const s = this.state;
    const alpha = s.opacity * Math.min(1, this.intro.v * 1.6) * this.appear.v;
    const visible = this.ready && alpha > 0.01 && !document.hidden && !this.lost;
    this.canvas.style.opacity = alpha.toFixed(3);
    if (!visible) return;

    const dt = Math.min(deltaMs / 1000, 0.05);
    this.time += dt;

    // Frame-rate independent smoothing for the pointer
    const k = 1 - Math.pow(1 - TULIPAN.respuestaMouse, dt * 60);
    this.pointer.x += (this.pointer.tx - this.pointer.x) * k;
    this.pointer.y += (this.pointer.ty - this.pointer.y) * k;

    const unit = Math.min(this.viewH, this.viewW * 1.3);
    const size = (s.scale * unit * (0.55 + 0.45 * this.intro.v)) / 2.6;
    const bob = Math.sin(this.time * 1.1) * TULIPAN.flotacion * unit;

    this.root.position.set((s.x * this.viewW) / 2, (s.y * this.viewH) / 2 + bob, 0);
    this.root.scale.setScalar(size);
    this.root.rotation.set(s.rotX, 0, s.rotZ);

    const tiltMax = TULIPAN.inclinacionMouse;
    this.tilt.rotation.x = this.pointer.y * tiltMax * 0.7 + 0.18;
    this.tilt.rotation.y = this.pointer.x * tiltMax + this.hover.look * -0.5;
    this.tilt.rotation.z = -this.pointer.x * tiltMax * 0.25;

    this.flower.rotation.y = this.time * TULIPAN.giroLento + s.rotY + (1 - this.intro.v) * -2.4;

    const open = gsap.utils.clamp(0, 1.15, s.open + this.hover.open);
    for (const h of this.hinges) {
      h.hinge.rotation.x = -(h.closed + (h.open - h.closed) * open + h.jitter * Math.sin(this.time * 1.3));
    }

    for (const d of this.drifters) {
      const a = d.a + this.time * d.speed;
      d.mesh.position.set(Math.cos(a) * d.r, d.y + Math.sin(this.time * 0.9 + d.a) * 0.25, Math.sin(a) * d.r * 0.6);
      d.mesh.rotation.set(this.time * d.spin, a, this.time * d.spin * 0.6);
      d.mesh.scale.setScalar(d.s * s.loose);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
