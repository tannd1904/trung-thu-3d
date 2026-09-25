const container = document.getElementById("webgl-container");
const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  ) || window.innerWidth < 768;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060312, 0.008);

const camera = new THREE.PerspectiveCamera(
  isMobile ? 60 : 45,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);

const DEFAULT_CAM_POS = isMobile
  ? new THREE.Vector3(0, 12, 45)
  : new THREE.Vector3(0, 10, 40);
const DEFAULT_CAM_TARGET = new THREE.Vector3(0, 6.0, 0);

camera.position.copy(DEFAULT_CAM_POS);

const renderer = new THREE.WebGLRenderer({
  antialias: !isMobile,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
container.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2 + 0.05;
controls.minDistance = 8;
controls.maxDistance = 85;
controls.target.copy(DEFAULT_CAM_TARGET);

// LIGHTS
const ambientLight = new THREE.AmbientLight(0x2a103d, 1.4);
scene.add(ambientLight);

const treeLight = new THREE.PointLight(0xffb6c1, 2.5, 45);
treeLight.position.set(0, 8, 0);
scene.add(treeLight);

const warmLight = new THREE.PointLight(0xffaa33, 2.0, 30);
warmLight.position.set(0, -2, 0);
scene.add(warmLight);

// ISLAND
const islandGroup = new THREE.Group();
scene.add(islandGroup);

const islandGeo = new THREE.CylinderGeometry(
  8.5,
  2.2,
  7.5,
  isMobile ? 32 : 48,
  12,
);
const posAttr = islandGeo.attributes.position;
for (let i = 0; i < posAttr.count; i++) {
  const vx = posAttr.getX(i);
  const vy = posAttr.getY(i);
  const vz = posAttr.getZ(i);

  const distFromCenter = Math.sqrt(vx * vx + vz * vz);
  const noise =
    Math.sin(vx * 0.8) * Math.cos(vz * 0.8) * 0.6 +
    Math.sin(vx * 1.8 + vz * 1.5) * 0.3;

  if (vy > 0) {
    posAttr.setY(i, vy + noise * (1.0 - distFromCenter / 12));
  } else {
    posAttr.setX(i, vx + (Math.random() - 0.5) * 1.4);
    posAttr.setZ(i, vz + (Math.random() - 0.5) * 1.4);
  }
}
islandGeo.computeVertexNormals();

const islandMat = new THREE.MeshStandardMaterial({
  color: 0x3d231b,
  roughness: 0.85,
  flatShading: true,
});
const islandMesh = new THREE.Mesh(islandGeo, islandMat);
islandGroup.add(islandMesh);

const topGeo = new THREE.CylinderGeometry(8.6, 7.8, 0.8, isMobile ? 32 : 48, 4);
const topPos = topGeo.attributes.position;
for (let i = 0; i < topPos.count; i++) {
  const vx = topPos.getX(i);
  const vy = topPos.getY(i);
  const vz = topPos.getZ(i);
  const noise = Math.sin(vx * 0.9) * Math.cos(vz * 0.9) * 0.5;
  topPos.setY(i, vy + noise * 0.4);
}
topGeo.computeVertexNormals();
const topMat = new THREE.MeshStandardMaterial({
  color: 0x22130e,
  roughness: 0.9,
  flatShading: true,
});
const topMesh = new THREE.Mesh(topGeo, topMat);
topMesh.position.y = 3.6;
islandGroup.add(topMesh);

// BỆ MẶT ĐÁ NHỎ & ĐÁ TẢNG RẢI RÁC ÍT HƠN
const stoneMat = new THREE.MeshStandardMaterial({
  color: 0x4a4d52,
  roughness: 0.85,
  metalness: 0.1,
  flatShading: true,
});

// 1. Bệ đá nhỏ dẹt ẩn nhẹ dưới gốc cây
const mainStonePlatformGeo = new THREE.CylinderGeometry(2.5, 3.0, 0.15, 6);
const mainStonePlatform = new THREE.Mesh(mainStonePlatformGeo, stoneMat);
mainStonePlatform.position.set(0, 3.9, 0);
islandGroup.add(mainStonePlatform);

// 2. Chỉ 3 viên đá nhỏ điểm xuyết trên mặt đất
const rockCount = 3;
for (let i = 0; i < rockCount; i++) {
  const rockGeo = new THREE.DodecahedronGeometry(0.2 + Math.random() * 0.25, 0);
  const rockMesh = new THREE.Mesh(rockGeo, stoneMat);

  const angle = (i / rockCount) * Math.PI * 2 + 0.5;
  const dist = 3.8 + Math.random() * 2.0;

  rockMesh.position.set(Math.cos(angle) * dist, 3.9, Math.sin(angle) * dist);
  rockMesh.rotation.set(
    Math.random() * Math.PI,
    Math.random() * Math.PI,
    Math.random() * Math.PI,
  );
  islandGroup.add(rockMesh);
}

// TREE TRUNK & BRANCHES
const treeGroup = new THREE.Group();
treeGroup.position.set(0, 4.0, 0);
islandGroup.add(treeGroup);

const trunkMat = new THREE.MeshStandardMaterial({
  color: 0x2b140e,
  roughness: 0.85,
});

const trunkCurve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0.15, 2.5, -0.1),
  new THREE.Vector3(-0.1, 5.0, 0.1),
  new THREE.Vector3(0.0, 7.5, 0.0),
]);

const trunkGeo = new THREE.TubeGeometry(trunkCurve, 32, 0.28, 8, false);
const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
treeGroup.add(trunkMesh);

const branchClusters = [];
const mainBranchCount = 12;
for (let i = 0; i < mainBranchCount; i++) {
  const angle = (i / mainBranchCount) * Math.PI * 2 + Math.random() * 0.3;
  const h = 3.0 + Math.random() * 4.0;
  const startP = trunkCurve.getPointAt(h / 7.5);
  const len = 3.0 + Math.random() * 2.2;

  const endP = new THREE.Vector3(
    startP.x + Math.cos(angle) * len,
    startP.y + 0.8 + Math.random() * 1.0,
    startP.z + Math.sin(angle) * len,
  );

  const midP = new THREE.Vector3().addVectors(startP, endP).multiplyScalar(0.5);
  midP.y += 0.4;

  const bCurve = new THREE.CatmullRomCurve3([startP, midP, endP]);
  const bGeo = new THREE.TubeGeometry(bCurve, 10, 0.09, 6, false);
  const bMesh = new THREE.Mesh(bGeo, trunkMat);
  treeGroup.add(bMesh);

  branchClusters.push({ center: endP, radius: 3.2 + Math.random() * 1.0 });
}

// HỆ THỐNG TÁN LÁ
const particleCount = isMobile ? 22000 : 38000;
const blossomGeo = new THREE.BufferGeometry();
const blossomPos = new Float32Array(particleCount * 3);
const blossomColors = new Float32Array(particleCount * 3);

const colorDustyPink = new THREE.Color(0xe8a2a8);
const colorSoftPink = new THREE.Color(0xf0b6bc);
const colorPaleRose = new THREE.Color(0xf7d1d5);
const colorSoftWhite = new THREE.Color(0xfdf0f2);

const clusters = [
  { center: new THREE.Vector3(0, 9.5, 0), radius: 6.2 },
  { center: new THREE.Vector3(0, 7.5, 0), radius: 7.0 },
  { center: new THREE.Vector3(0, 5.5, 0), radius: 6.0 },
  ...branchClusters,
];

for (let i = 0; i < particleCount; i++) {
  const c = clusters[Math.floor(Math.random() * clusters.length)];

  const u = Math.random();
  const r = Math.pow(u, 0.65) * c.radius;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos(2 * Math.random() - 1);

  const x = c.center.x + r * Math.sin(phi) * Math.cos(theta);
  const y = c.center.y + r * Math.sin(phi) * Math.sin(theta) * 0.8;
  const z = c.center.z + r * Math.cos(phi);

  blossomPos[i * 3] = x;
  blossomPos[i * 3 + 1] = y;
  blossomPos[i * 3 + 2] = z;

  const heightFactor = THREE.MathUtils.clamp((y - 3) / 7, 0, 1);
  const randC = Math.random();
  let col;

  if (heightFactor < 0.3) {
    col = randC < 0.6 ? colorDustyPink : colorSoftPink;
  } else if (heightFactor < 0.7) {
    col =
      randC < 0.4
        ? colorSoftPink
        : randC < 0.8
          ? colorPaleRose
          : colorDustyPink;
  } else {
    col = randC < 0.5 ? colorSoftWhite : colorPaleRose;
  }

  blossomColors[i * 3] = col.r;
  blossomColors[i * 3 + 1] = col.g;
  blossomColors[i * 3 + 2] = col.b;
}

blossomGeo.setAttribute("position", new THREE.BufferAttribute(blossomPos, 3));
blossomGeo.setAttribute("color", new THREE.BufferAttribute(blossomColors, 3));

function createParticleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, "rgba(255,255,255,0.9)");
  grad.addColorStop(0.4, "rgba(240,182,188,0.6)");
  grad.addColorStop(1, "rgba(240,182,188,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(16, 16, 16, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const blossomMat = new THREE.PointsMaterial({
  size: isMobile ? 0.5 : 0.42,
  vertexColors: true,
  map: createParticleTexture(),
  transparent: true,
  opacity: 0.75,
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const blossomParticles = new THREE.Points(blossomGeo, blossomMat);
treeGroup.add(blossomParticles);

// RABBITS
function createRabbit() {
  const group = new THREE.Group();
  const rabbitMat = new THREE.MeshStandardMaterial({
    color: 0xf8f8ff,
    roughness: 0.5,
  });

  const bodyGeo = new THREE.SphereGeometry(0.5, 12, 12);
  bodyGeo.scale(0.8, 1, 0.9);
  const bodyMesh = new THREE.Mesh(bodyGeo, rabbitMat);
  bodyMesh.position.y = 0.4;
  group.add(bodyMesh);

  const headGeo = new THREE.SphereGeometry(0.35, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, rabbitMat);
  headMesh.position.set(0, 0.85, 0.2);
  group.add(headMesh);

  const earGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.5, 8);
  const earLeft = new THREE.Mesh(earGeo, rabbitMat);
  earLeft.position.set(-0.12, 1.25, 0.18);
  earLeft.rotation.z = 0.15;
  earLeft.rotation.x = -0.1;
  group.add(earLeft);

  const earRight = earLeft.clone();
  earRight.position.x = 0.12;
  earRight.rotation.z = -0.15;
  group.add(earRight);

  return group;
}

const rabbits = [];
for (let i = 0; i < 4; i++) {
  const rabbitMesh = createRabbit();
  islandGroup.add(rabbitMesh);

  rabbits.push({
    mesh: rabbitMesh,
    orbitRadius: 2.8 + Math.random() * 3.2,
    orbitSpeed: (0.12 + Math.random() * 0.15) * (i % 2 === 0 ? 1 : -1),
    phase: (i / 4) * Math.PI * 2,
    baseY: 4.05,
    hopSpeed: 4.5 + Math.random() * 2.0,
    hopHeight: 0.15,
    scale: 0.75 + Math.random() * 0.25,
  });
  rabbits[i].mesh.scale.setScalar(rabbits[i].scale);
}

function updateRabbits(time) {
  rabbits.forEach((r) => {
    const angle = r.phase + time * r.orbitSpeed;
    const sign = Math.sign(r.orbitSpeed) || 1;

    const x = Math.cos(angle) * r.orbitRadius;
    const z = Math.sin(angle) * r.orbitRadius;
    const hop = Math.abs(Math.sin(time * r.hopSpeed)) * r.hopHeight;

    r.mesh.position.set(x, r.baseY + hop, z);

    const dx = -Math.sin(angle) * sign;
    const dz = Math.cos(angle) * sign;
    r.mesh.rotation.y = Math.atan2(dx, dz);
  });
}

// LANTERNS & MESSAGES WITH IMAGES
const lanternsGroup = new THREE.Group();
scene.add(lanternsGroup);

const lanterns = [];
const interactiveObjects = [];

const wishList = [
  {
    text: "Chúc Hồng Vân xinh đẹp một mùa Trung Thu tràn ngập niềm vui và hạnh phúc!",
    img: "./assets/1.jpg",
  },
  {
    text: "Cầu chúc Hồng Vân luôn luôn may mắn, mọi nguyện ước đêm nay sẽ trở thành hiện thực.",
    img: "./assets/2.jpg",
  },
  {
    text: "Chúc công chúa Hồng Vân một đêm Trung Thu vui vẻ tuyệt vời và luôn xinh đẹp, vui vẻ với nụ cười thật tươi!",
    img: "./assets/3.jpg",
  },
  {
    text: "Chúc Hồng Vân mau sớm hết bệnh, ăn uống thật ngon miệng và nhanh khỏe lại nhé!",
    img: "./assets/1.jpg",
  },
  {
    text: "Nhớ giữ ấm, uống nhiều nước ấm và nghỉ ngơi thật nhiều nha Hồng Vân bé nhỏ đáng yêu. Sớm khỏe lại để đón những ngày rực rỡ phía trước!",
    img: "./assets/3.jpg",
  },
  {
    text: "Mong mọi mệt mỏi bệnh tật tan biến theo gió thu, chúc Hồng Vân sớm hồi phục và nụ cười rực rỡ lại nở trên môi.",
    img: "./assets/1.jpg",
  },
  {
    text: "Chúc Hồng Vân luôn giữ được tâm hồn trong trẻo, yêu đời như ánh trăng rằm.",
    img: "./assets/2.jpg",
  },
  {
    text: "Đêm nay trăng rằm sẽ mang theo điều ước chân thành: Cầu chúc Hồng Vân luôn bình an, mạnh khỏe và hạnh phúc mỗi ngày.",
    img: "./assets/3.jpg",
  },
  {
    text: "Trung Thu bình an, vạn sự như ý, sức khỏe dồi dào và miệng luôn mỉm cười thật tươi nha Hồng Vân!",
    img: "./assets/2.jpg",
  },
];

function createLanternTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, "#ff4d4d");
  grad.addColorStop(0.5, "#e63946");
  grad.addColorStop(1, "#ffb703");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 120, 120);
  return new THREE.CanvasTexture(canvas);
}

const lanternTex = createLanternTexture();

function createLanternMesh() {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(0.6, 0.45, 1.4, 6);
  const bodyMat = new THREE.MeshStandardMaterial({
    map: lanternTex,
    emissive: 0xff7700,
    emissiveIntensity: 0.7,
    roughness: 0.3,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  group.add(body);

  const capGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.1, 6);
  const capMat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    metalness: 0.5,
  });
  const capTop = new THREE.Mesh(capGeo, capMat);
  capTop.position.y = 0.7;
  group.add(capTop);

  const tagGeo = new THREE.PlaneGeometry(0.35, 0.7);
  const tagMat = new THREE.MeshBasicMaterial({
    color: 0xd90429,
    side: THREE.DoubleSide,
  });
  const tag = new THREE.Mesh(tagGeo, tagMat);
  tag.position.set(0, -1.1, 0);
  group.add(tag);

  const spriteMat = new THREE.SpriteMaterial({
    map: createParticleTexture(),
    color: 0xffaa00,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Sprite(spriteMat);
  glow.scale.set(3.2, 3.2, 1);
  group.add(glow);

  const hitGeo = new THREE.SphereGeometry(1.6, 8, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  group.add(hitMesh);

  return { group, hitMesh };
}

const lanternCount = isMobile ? 24 : 38;
for (let i = 0; i < lanternCount; i++) {
  const { group: lantern, hitMesh } = createLanternMesh();

  const radius = 9 + Math.random() * 25;
  const angle = Math.random() * Math.PI * 2;
  const y = -1 + Math.random() * 30;

  lantern.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);

  const wishData = wishList[Math.floor(Math.random() * wishList.length)];

  lantern.userData = {
    speedY: 0.008 + Math.random() * 0.012,
    swingSpeed: 0.8 + Math.random() * 1.2,
    initialX: lantern.position.x,
    initialZ: lantern.position.z,
    wish: wishData.text,
    imgUrl: wishData.img,
    id: i,
  };

  const sc = 0.75 + Math.random() * 0.5;
  lantern.scale.set(sc, sc, sc);

  hitMesh.userData.parentLantern = lantern;

  lanternsGroup.add(lantern);
  lanterns.push(lantern);
  interactiveObjects.push(hitMesh);
}

// FALLING PETALS & STARS
const fallingPetalsCount = isMobile ? 80 : 180;
const petalsGeo = new THREE.BufferGeometry();
const petalsPos = new Float32Array(fallingPetalsCount * 3);
const petalsData = [];

for (let i = 0; i < fallingPetalsCount; i++) {
  petalsPos[i * 3] = (Math.random() - 0.5) * 36;
  petalsPos[i * 3 + 1] = Math.random() * 36;
  petalsPos[i * 3 + 2] = (Math.random() - 0.5) * 36;

  petalsData.push({
    speedY: 0.02 + Math.random() * 0.03,
  });
}

petalsGeo.setAttribute("position", new THREE.BufferAttribute(petalsPos, 3));
const petalsMat = new THREE.PointsMaterial({
  size: isMobile ? 0.35 : 0.3,
  color: 0xf7d1d5,
  transparent: true,
  opacity: 0.75,
  map: createParticleTexture(),
  blending: THREE.NormalBlending,
  depthWrite: false,
});

const petalsParticles = new THREE.Points(petalsGeo, petalsMat);
scene.add(petalsParticles);

const starCount = isMobile ? 400 : 900;
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 180;
  starPos[i * 3 + 1] = Math.random() * 90;
  starPos[i * 3 + 2] = (Math.random() - 0.5) * 180;
}
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const starMat = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.4,
  transparent: true,
  opacity: 0.7,
});
scene.add(new THREE.Points(starGeo, starMat));

// 🌕 3D GLOWING FULL MOON & MOONLIGHT
function createMoonTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  grad.addColorStop(0, "#fffff5");
  grad.addColorStop(0.5, "#fff2b8");
  grad.addColorStop(0.85, "#ffd56b");
  grad.addColorStop(1, "#f39c12");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = "rgba(210, 160, 80, 0.2)";
  ctx.beginPath();
  ctx.arc(80, 90, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(165, 140, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(110, 175, 34, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

const moonGeo = new THREE.SphereGeometry(6.2, 32, 32);
const moonMat = new THREE.MeshStandardMaterial({
  map: createMoonTexture(),
  emissive: 0xffe680,
  emissiveIntensity: 0.85,
  roughness: 0.5,
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonMesh.position.set(22, 30, -38);
scene.add(moonMesh);

const moonGlowMat = new THREE.SpriteMaterial({
  map: createParticleTexture(),
  color: 0xfff0b3,
  transparent: true,
  opacity: 0.65,
  blending: THREE.AdditiveBlending,
});
const moonGlow = new THREE.Sprite(moonGlowMat);
moonGlow.scale.set(34, 34, 1);
moonMesh.add(moonGlow);

const moonLight = new THREE.PointLight(0xfff3cc, 1.8, 80);
moonLight.position.set(20, 28, -32);
scene.add(moonLight);

const moonHitGeo = new THREE.SphereGeometry(9.0, 12, 12);
const moonHitMat = new THREE.MeshBasicMaterial({ visible: false });
const moonHitMesh = new THREE.Mesh(moonHitGeo, moonHitMat);
moonHitMesh.userData.isMoon = true;
moonMesh.add(moonHitMesh);
interactiveObjects.push(moonHitMesh);

// SOUND SYNTHESIZER (WEB AUDIO API)
let audioCtx = null;
function playMagicChime() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      }, idx * 90);
    });
  } catch (err) {}
}

// FIREWORKS & HEART FIREWORKS
let fireworks = [];
function createFirework(pos, pCount = 50, customColor = 0xffd700) {
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(pCount * 3);
  const velocities = [];

  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 0.08 + Math.random() * 0.12;

    velocities.push(
      new THREE.Vector3(
        speed * Math.sin(phi) * Math.cos(theta),
        speed * Math.sin(phi) * Math.sin(theta),
        speed * Math.cos(phi),
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.38,
    color: customColor,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);

  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.0 });
}

// HEART FIREWORKS
function createHeartFirework(pos) {
  playMagicChime();
  const count = 90;
  const pGeo = new THREE.BufferGeometry();
  const pPositions = new Float32Array(count * 3);
  const velocities = [];

  for (let i = 0; i < count; i++) {
    pPositions[i * 3] = pos.x;
    pPositions[i * 3 + 1] = pos.y;
    pPositions[i * 3 + 2] = pos.z;

    const t = (i / count) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);

    const speed = 0.022 + Math.random() * 0.01;
    velocities.push(
      new THREE.Vector3(
        hx * speed,
        hy * speed,
        (Math.random() - 0.5) * 0.06,
      ),
    );
  }

  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({
    size: 0.45,
    color: 0xff758f,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
  });

  const pMesh = new THREE.Points(pGeo, pMat);
  scene.add(pMesh);
  fireworks.push({ mesh: pMesh, velocities: velocities, life: 1.5 });

  setTimeout(() => {
    createFirework(new THREE.Vector3(pos.x - 3, pos.y + 2, pos.z), 40, 0xffd700);
    createFirework(new THREE.Vector3(pos.x + 3, pos.y + 2, pos.z), 40, 0xffffff);
  }, 250);
}

// CUSTOM WISH LANTERNS
let customLanterns = [];
function spawnCustomWishLantern(customWish) {
  const { group: lantern } = createLanternMesh();
  const customTex = (function() {
    const cvs = document.createElement("canvas");
    cvs.width = 128; cvs.height = 128;
    const cx = cvs.getContext("2d");
    const gr = cx.createLinearGradient(0, 0, 0, 128);
    gr.addColorStop(0, "#ff4081");
    gr.addColorStop(0.5, "#f50057");
    gr.addColorStop(1, "#ffd700");
    cx.fillStyle = gr;
    cx.fillRect(0, 0, 128, 128);
    cx.strokeStyle = "#fff";
    cx.lineWidth = 6;
    cx.strokeRect(4, 4, 120, 120);
    return new THREE.CanvasTexture(cvs);
  })();

  lantern.children[0].material = new THREE.MeshStandardMaterial({
    map: customTex,
    emissive: 0xff3377,
    emissiveIntensity: 0.9,
    roughness: 0.25,
  });

  lantern.position.set(0, 2, 20);
  lantern.scale.set(1.4, 1.4, 1.4);
  scene.add(lantern);

  customLanterns.push({
    mesh: lantern,
    target: moonMesh.position.clone(),
    speedY: 0.04,
    life: 0,
    wish: customWish,
  });

  createHeartFirework(lantern.position);
}

// TOAST NOTIFICATIONS
const toastEl = document.getElementById("toastMessage");
let toastTimeout = null;
function showToast(text, duration = 3500) {
  if (!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add("active");
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove("active");
  }, duration);
}

// DYNAMIC GREETING ACCORDING TO REAL TIME
function updateGreetingBanner() {
  const banner = document.getElementById("greetingBanner");
  const greetingText = document.getElementById("greetingText");
  if (!banner || !greetingText) return;

  const hour = new Date().getHours();
  let message = "";
  let iconClass = "fas fa-moon";

  if (hour >= 0 && hour < 5) {
    message = "Khuya rồi, Hồng Vân ngủ ngoan để mau khỏe lại nhé 🌙";
    iconClass = "fas fa-bed";
  } else if (hour >= 5 && hour < 11) {
    message = "Chào buổi sáng Vân! Cậu thấy đỡ hơn chút nào chưa? Nhớ ăn sáng nhé ☀️";
    iconClass = "fas fa-sun";
  } else if (hour >= 11 && hour < 14) {
    message = "Trưa rồi, Hồng Vân nhớ ăn uống ấm bụng và chợp mắt một chút nha 🍱";
    iconClass = "fas fa-utensils";
  } else if (hour >= 14 && hour < 18) {
    message = "Chiều thu dịu mát, nhớ uống nước ấm và giữ ấm cổ họng nhé Vân 🍵";
    iconClass = "fas fa-mug-hot";
  } else {
    message = "Chúc Hồng Vân buổi tối bình an, ngập tràn niềm vui và mau khỏi ốm 🏮";
    iconClass = "fas fa-moon";
  }

  const iconEl = banner.querySelector(".greeting-icon");
  if (iconEl) iconEl.className = iconClass + " greeting-icon";
  greetingText.textContent = message;
}
updateGreetingBanner();
setInterval(updateGreetingBanner, 60000);

// RAYCASTER & INTERACTION
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let targetCamPos = null;
let targetCamTarget = null;
let selectedLantern = null;

const wishModal = document.getElementById("wishModal");
const wishText = document.getElementById("wishText");
const wishImage = document.getElementById("wishImage");
const closeWishBtn = document.getElementById("closeWishBtn");

// OTHER MODALS & BUTTONS
const customWishModal = document.getElementById("customWishModal");
const customWishInput = document.getElementById("customWishInput");
const submitWishBtn = document.getElementById("submitWishBtn");
const closeCustomWishBtn = document.getElementById("closeCustomWishBtn");

const vitaminModal = document.getElementById("vitaminModal");
const closeVitaminBtn = document.getElementById("closeVitaminBtn");
const nextPillBtn = document.getElementById("nextPillBtn");
const pillIcon = document.getElementById("pillIcon");
const pillContent = document.getElementById("pillContent");

const letterModal = document.getElementById("letterModal");
const closeLetterBtn = document.getElementById("closeLetterBtn");

const btnOpenWishForm = document.getElementById("btn-open-wish-form");
const btnOpenVitamin = document.getElementById("btn-open-vitamin");
const btnOpenLetter = document.getElementById("btn-open-letter");
const btnFireworkMoon = document.getElementById("btn-firework-moon");

let pointerDownPos = { x: 0, y: 0 };

function onPointerDown(event) {
  pointerDownPos.x =
    event.clientX || (event.touches && event.touches[0].clientX) || 0;
  pointerDownPos.y =
    event.clientY || (event.touches && event.touches[0].clientY) || 0;
}

function triggerMoonCelebration() {
  createHeartFirework(moonMesh.position);
  showToast("🌕 Trăng rằm soi sáng: Mong Hồng Vân luôn an nhiên, mau khỏe lại và mãi rạng rỡ! 💖", 4000);
}

function onPointerUp(event) {
  if (
    event.target.closest(".top-bar") ||
    event.target.closest(".wish-modal") ||
    event.target.closest(".bottom-dock") ||
    event.target.closest(".greeting-banner")
  ) {
    return;
  }

  const clientX =
    event.clientX ||
    (event.changedTouches && event.changedTouches[0].clientX) ||
    0;
  const clientY =
    event.clientY ||
    (event.changedTouches && event.changedTouches[0].clientY) ||
    0;

  const distMoved = Math.hypot(
    clientX - pointerDownPos.x,
    clientY - pointerDownPos.y,
  );
  if (distMoved > 8) return;

  mouse.x = (clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, false);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;

    if (hitMesh.userData.isMoon) {
      triggerMoonCelebration();
      return;
    }

    selectedLantern = hitMesh.userData.parentLantern || hitMesh.parent;
    const lPos = selectedLantern.position;

    createFirework(lPos, 45, 0xffd700);

    const offset = new THREE.Vector3()
      .subVectors(camera.position, lPos)
      .normalize()
      .multiplyScalar(5.5);
    targetCamPos = new THREE.Vector3().addVectors(lPos, offset);
    targetCamTarget = lPos.clone();

    wishText.textContent = `"${selectedLantern.userData.wish}"`;
    wishImage.src = selectedLantern.userData.imgUrl;

    setTimeout(() => {
      wishModal.classList.add("active");
    }, 300);
  }
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointerup", onPointerUp, { passive: true });

function resetCamera() {
  targetCamPos = DEFAULT_CAM_POS.clone();
  targetCamTarget = DEFAULT_CAM_TARGET.clone();
  selectedLantern = null;
}

function closeAllModals() {
  wishModal.classList.remove("active");
  customWishModal.classList.remove("active");
  vitaminModal.classList.remove("active");
  letterModal.classList.remove("active");
  resetCamera();
}

function closeWishCard(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }
  closeAllModals();
}

closeWishBtn.addEventListener("click", closeWishCard);
closeWishBtn.addEventListener("touchend", closeWishCard);

closeCustomWishBtn.addEventListener("click", closeWishCard);
closeVitaminBtn.addEventListener("click", closeWishCard);
closeLetterBtn.addEventListener("click", closeWishCard);

[wishModal, customWishModal, vitaminModal, letterModal].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeWishCard(e);
  });
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeWishCard();
});

// DOCK BUTTON HANDLERS
if (btnOpenWishForm) {
  btnOpenWishForm.addEventListener("click", () => {
    closeAllModals();
    customWishModal.classList.add("active");
    if (customWishInput) customWishInput.focus();
  });
}

if (submitWishBtn) {
  submitWishBtn.addEventListener("click", () => {
    const text = (customWishInput.value || "").trim();
    if (!text) {
      showToast("Vân ơi, hãy gõ một điều ước trước khi thả đèn nhé! 🏮");
      return;
    }
    spawnCustomWishLantern(text);
    wishList.push({
      text: text,
      img: "./assets/1.jpg",
    });
    customWishInput.value = "";
    closeAllModals();
    showToast("✨ Điều ước của Vân đã cất cánh bay lên cung trăng rồi!", 4500);
  });
}

// VITAMINS / RX HAPPINESS CARE
const vitaminsForVan = [
  { icon: "🍵", text: "Uống ngay 1 ly nước ấm đầy, giữ ấm ngực và cổ họng thật kỹ nhé Hồng Vân." },
  { icon: "🛌", text: "Hôm nay Vân đã rất cố gắng rồi. Tạm gác mọi âu lo lại và ngủ một giấc thật sâu nhé." },
  { icon: "🍯", text: "Uống chút nước ấm pha mật ong chanh cho dịu họng nha cô gái xinh đẹp." },
  { icon: "🌸", text: "Bệnh tật chỉ là thử thách nhỏ thôi, Hồng Vân kiên cường sắp khỏe re và lại líu lo vui vẻ rồi!" },
  { icon: "💖", text: "Luôn có một người âm thầm quan tâm và cầu chúc cho Vân khỏe lại từng phút giây." },
  { icon: "🧸", text: "Không được bỏ bữa đâu đấy, nhớ ăn món ấm nóng và bồi bổ sức khỏe nha." },
  { icon: "✨", text: "Gửi tặng Hồng Vân 1000 nụ cười và triệu năng lượng tích cực từ phương xa!" },
  { icon: "🌙", text: "Mong mọi mệt mỏi tan biến theo gió thu, chúc Vân sớm hồi phục và miệng luôn mỉm cười." }
];

let lastPillIdx = 0;
function showNextPill() {
  lastPillIdx = (lastPillIdx + 1) % vitaminsForVan.length;
  const pill = vitaminsForVan[lastPillIdx];
  const display = document.getElementById("pillDisplay");
  display.style.transform = "scale(0.85)";
  display.style.opacity = "0.5";
  setTimeout(() => {
    pillIcon.textContent = pill.icon;
    pillContent.textContent = `"${pill.text}"`;
    display.style.transform = "scale(1)";
    display.style.opacity = "1";
    playMagicChime();
  }, 180);
}

if (btnOpenVitamin) {
  btnOpenVitamin.addEventListener("click", () => {
    closeAllModals();
    vitaminModal.classList.add("active");
    playMagicChime();
  });
}

if (nextPillBtn) {
  nextPillBtn.addEventListener("click", showNextPill);
}

if (btnOpenLetter) {
  btnOpenLetter.addEventListener("click", () => {
    closeAllModals();
    letterModal.classList.add("active");
    playMagicChime();
  });
}

if (btnFireworkMoon) {
  btnFireworkMoon.addEventListener("click", () => {
    targetCamPos = new THREE.Vector3(12, 18, -10);
    targetCamTarget = moonMesh.position.clone();
    triggerMoonCelebration();
  });
}

// ✨ MAGIC TOUCH / CURSOR TRAIL CANVAS
(function initMagicTrail() {
  const canvas = document.getElementById("magic-trail-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener("resize", () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const trailParticles = [];
  const colors = ["#ffd700", "#ff758f", "#ffb6c1", "#ffffff", "#ffd166"];

  function addParticle(x, y) {
    for (let i = 0; i < 2; i++) {
      trailParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        size: Math.random() * 3.5 + 1.5,
        speedX: (Math.random() - 0.5) * 1.5,
        speedY: (Math.random() - 0.5) * 1.5 - 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1.0,
        decay: Math.random() * 0.02 + 0.02,
        isHeart: Math.random() < 0.25,
      });
    }
  }

  function onMove(e) {
    const x = e.clientX || (e.touches && e.touches[0].clientX);
    const y = e.clientY || (e.touches && e.touches[0].clientY);
    if (x && y) addParticle(x, y);
  }

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });

  function renderTrail() {
    ctx.clearRect(0, 0, width, height);

    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.x += p.speedX;
      p.y += p.speedY;
      p.life -= p.decay;

      if (p.life <= 0) {
        trailParticles.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;

      if (p.isHeart) {
        ctx.font = `${p.size * 2.5}px sans-serif`;
        ctx.fillText("♥", p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
      }
      ctx.restore();
    }
    requestAnimationFrame(renderTrail);
  }
  renderTrail();
})();

// AUDIO
const bgm = document.getElementById("bgm");
const audioBtn = document.getElementById("audio-btn");
let isPlaying = false;

audioBtn.addEventListener("click", () => {
  if (isPlaying) {
    bgm.pause();
    audioBtn.innerHTML = '<i class="fas fa-music" style="opacity:0.5;"></i>';
  } else {
    bgm
      .play()
      .then(() => {
        audioBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
      })
      .catch(() => {});
  }
  isPlaying = !isPlaying;
});

// ANIMATION
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  moonMesh.rotation.y += 0.001;

  lanterns.forEach((lantern) => {
    lantern.position.y += lantern.userData.speedY;
    lantern.position.x =
      lantern.userData.initialX +
      Math.sin(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.position.z =
      lantern.userData.initialZ +
      Math.cos(time * lantern.userData.swingSpeed + lantern.userData.id) * 0.4;
    lantern.rotation.y += 0.005;

    if (lantern.position.y > 30) {
      lantern.position.y = -3;
    }
  });

  // Custom Wish Lanterns
  for (let i = customLanterns.length - 1; i >= 0; i--) {
    const cl = customLanterns[i];
    cl.life += delta;
    cl.mesh.position.y += cl.speedY;
    cl.mesh.position.x += (moonMesh.position.x - cl.mesh.position.x) * 0.003;
    cl.mesh.position.z += (moonMesh.position.z - cl.mesh.position.z) * 0.003;
    cl.mesh.rotation.y += 0.01;

    if (Math.random() < 0.25) {
      createFirework(cl.mesh.position, 6, 0xff758f);
    }

    if (cl.mesh.position.y > 35 || cl.life > 20) {
      createHeartFirework(cl.mesh.position);
      scene.remove(cl.mesh);
      customLanterns.splice(i, 1);
    }
  }

  const pPos = petalsGeo.attributes.position.array;
  for (let i = 0; i < fallingPetalsCount; i++) {
    pPos[i * 3 + 1] -= petalsData[i].speedY;
    pPos[i * 3] += Math.sin(time + i) * 0.01;
    pPos[i * 3 + 2] += Math.cos(time + i) * 0.01;

    if (pPos[i * 3 + 1] < -3) {
      pPos[i * 3 + 1] = 30;
      pPos[i * 3] = (Math.random() - 0.5) * 36;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 36;
    }
  }
  petalsGeo.attributes.position.needsUpdate = true;

  for (let i = fireworks.length - 1; i >= 0; i--) {
    const fw = fireworks[i];
    fw.life -= delta * 1.2;
    const posArr = fw.mesh.geometry.attributes.position.array;

    for (let j = 0; j < fw.velocities.length; j++) {
      posArr[j * 3] += fw.velocities[j].x;
      posArr[j * 3 + 1] += fw.velocities[j].y;
      posArr[j * 3 + 2] += fw.velocities[j].z;
    }
    fw.mesh.geometry.attributes.position.needsUpdate = true;
    fw.mesh.material.opacity = fw.life;

    if (fw.life <= 0) {
      scene.remove(fw.mesh);
      fireworks.splice(i, 1);
    }
  }

  islandGroup.rotation.y = Math.sin(time * 0.15) * 0.05;

  updateRabbits(time);

  if (targetCamPos && targetCamTarget) {
    camera.position.lerp(targetCamPos, 0.04);
    controls.target.lerp(targetCamTarget, 0.04);

    if (camera.position.distanceTo(targetCamPos) < 0.1) {
      targetCamPos = null;
      targetCamTarget = null;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener("resize", () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  camera.aspect = width / height;
  camera.fov = width < 768 ? 60 : 45;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, width < 768 ? 1.5 : 2),
  );
});

