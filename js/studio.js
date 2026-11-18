// 淺色攝影棚：燈光、陰影、環繞鏡頭、點選。所有 3D 頁共用。
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createStudio(canvas, o = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: !!o.keep });
  const low = matchMedia('(max-width: 760px)').matches || (navigator.hardwareConcurrency || 4) <= 4;
  renderer.setPixelRatio(Math.min(devicePixelRatio, low ? 1.25 : 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg ?? 0xeef3f8);
  if (o.fog !== false) scene.fog = new THREE.Fog(scene.background, o.fogNear ?? 14, o.fogFar ?? 40);
  const camera = new THREE.PerspectiveCamera(o.fov ?? 40, 1, 0.05, 400);
  camera.position.set(...(o.cam ?? [2.2, 1.5, 2.6]));
  const hemi = new THREE.HemisphereLight(0xffffff, 0xb8c4d4, 1.4); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(4, 7, 3); key.castShadow = true;
  key.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048); const sc = o.shadowSize ?? 4;
  Object.assign(key.shadow.camera, { left: -sc, right: sc, top: sc, bottom: -sc, near: 0.5, far: 30 }); key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(0xdbeafe, 0.9); rim.position.set(-5, 3, -4); scene.add(rim);
  if (o.floor !== false) {
    const floor = new THREE.Mesh(new THREE.CircleGeometry(o.floorR ?? 8, 64), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = o.floorY ?? 0; scene.add(floor);
    const grid = new THREE.GridHelper(o.floorR ? o.floorR * 2 : 16, 32, 0xcbd5e1, 0xe2e8f0); grid.position.y = (o.floorY ?? 0) + 0.002; scene.add(grid);
  }
  let controls = null;
  if (o.orbit !== false) {
    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true; controls.target.set(...(o.target ?? [0, 0.3, 0]));
    controls.minDistance = o.minD ?? 0.8; controls.maxDistance = o.maxD ?? 9; controls.maxPolarAngle = Math.PI * 0.49;
  }
  const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); };
  addEventListener('resize', resize); resize();
  const subs = [];
  const clock = new THREE.Clock();
  let running = true;
  renderer.setAnimationLoop(() => {
    if (!running) return;
    const dt = Math.min(0.05, clock.getDelta());
    for (const f of subs) f(dt, clock.elapsedTime);
    controls?.update();
    renderer.render(scene, camera);
  });
  document.addEventListener('visibilitychange', () => { running = !document.hidden; clock.getDelta(); });
  // 點選：回傳打到的物件
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  function pick(ev, objs) {
    const r = canvas.getBoundingClientRect();
    ptr.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ptr, camera);
    return ray.intersectObjects(objs, true)[0] || null;
  }
  // 拖曳和點擊要分開：移動超過 6px 就當成轉鏡頭
  function onClick(handler) {
    let sx = 0, sy = 0;
    canvas.addEventListener('pointerdown', e => { sx = e.clientX; sy = e.clientY; });
    canvas.addEventListener('pointerup', e => { if (Math.hypot(e.clientX - sx, e.clientY - sy) < 6) handler(e); });
  }
  return { THREE, renderer, scene, camera, controls, key, onFrame: f => subs.push(f), pick, onClick, resize, low };
}

// 平滑：狀態切換曲線 cubic-bezier(0.65,0,0.35,1) 的近似
export const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const approach = (cur, target, dt, speed = 6) => cur + (target - cur) * Math.min(1, dt * speed);
