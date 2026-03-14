import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { AlertTriangle, Zap, Activity, Cpu, TrendingUp, Wrench, DollarSign, Power, Briefcase, ShieldCheck, Lock, Radio, Volume2 } from "lucide-react";

// ═══════════════════════════════════════════════════════════════════════
// ENRON: MELTDOWN MANAGER — Claude Sonnet 4.6 Edition
// Glass Stone © 2026 | CEO Gabriel B. Rodriguez
// A satirical corporate survival simulator.
// Manage a failing nuclear reactor and a fraudulent financial portfolio.
// ═══════════════════════════════════════════════════════════════════════

// ─── CONSTANTS ───────────────────────────────────────────────────────

const MAX_TEMP = 3000;
const MAX_PRES = 2000;
const MELTDOWN_TEMP = 2600;
const MELTDOWN_PRES = 1800;

const PRICES = {
  FIX_PUMP: 800, FIX_TURB: 1200, FIX_COND: 1000,
  SHRED: 3000, LOBBY: 2000, CREATE_SPE: 1000,
};

const CHAPTERS = [
  { id: 0, title: "Chapter 1: The Vision", year: "Early 2000", desc: "Establish Enron Energy Services. Keep the lights on and the stock moving up.", win: (s) => s.score > 60 && s.cash > 8000, mods: { demand: 1.0, vol: 0.5, regAgg: 0.2 } },
  { id: 1, title: "Chapter 2: The California Crisis", year: "Late 2000", desc: "Demand is skyrocketing. Create artificial shortages to spike prices.", win: (s) => s.score > 100 && s.offshore > 5000, mods: { demand: 1.5, vol: 1.2, regAgg: 0.4 } },
  { id: 2, title: "Chapter 3: Creative Accounting", year: "2001", desc: "The debt is piling up. Use SPEs to hide losses. Avoid the SEC.", win: (s) => s.score > 150 && s.spes.length >= 3, mods: { demand: 0.8, vol: 2.0, regAgg: 0.9 } },
  { id: 3, title: "Chapter 4: The Collapse", year: "Late 2001", desc: "It's all over. Extract as much personal wealth as possible before indictment.", win: (s) => s.offshore > 50000, mods: { demand: 0.5, vol: 3.0, regAgg: 1.5 } },
];

const EVENTS = [
  { id: "ebs", m: 1, y: 2000, title: "ENRON BROADBAND ANNOUNCED", desc: "Sun Microsystems partnership. Analysts are euphoric.", type: "info", fx: (s) => { s.score += 15; s.vol += 0.2; } },
  { id: "ca_crisis", m: 5, y: 2000, title: "CALIFORNIA ENERGY CRISIS BEGINS", desc: "Prices uncapped. Market volatility extreme.", type: "warn", fx: (s) => { s.gridDemand += 200; s.demandScale += 0.5; s.vol += 0.5; } },
  { id: "block", m: 7, y: 2000, title: "BLOCKBUSTER VOD DEAL", desc: "20-year deal for video-on-demand. It's vaporware, but the street loves it.", type: "info", fx: (s) => { s.score += 20; s.auditRisk += 5; } },
  { id: "ath", m: 8, y: 2000, title: "STOCK HITS ATH $90.56", desc: "Wall Street loves us. Expectations are impossible to meet.", type: "info", fx: (s) => { s.score = Math.max(s.score, 90.56); s.vol += 0.2; } },
  { id: "election", m: 11, y: 2000, title: "ELECTION CHAOS", desc: "Bush vs Gore. Uncertainty roils markets.", type: "warn", fx: (s) => { s.vol += 0.3; } },
  { id: "skilling_ceo", m: 12, y: 2000, title: "SKILLING NAMED CEO", desc: "Aggressive accounting is now mandatory policy.", type: "info", fx: (s) => { s.vol += 0.5; s.regAgg += 0.2; } },
  { id: "block_cancel", m: 3, y: 2001, title: "BLOCKBUSTER DEAL CANCELLED", desc: "The tech didn't work. Hide the losses in Raptor SPEs.", type: "danger", fx: (s) => { s.score -= 10; s.auditRisk += 10; s.regAgg += 0.3; } },
  { id: "ferc", m: 6, y: 2001, title: "FERC IMPOSES PRICE CAPS", desc: "Regulators step in. The California gold rush is over.", type: "danger", fx: (s) => { s.demandScale -= 0.4; s.regAgg += 0.5; } },
  { id: "skilling_quits", m: 8, y: 2001, title: "SKILLING RESIGNS", desc: "Cites 'personal reasons'. Stock plummets.", type: "danger", fx: (s) => { s.score *= 0.7; s.auditRisk += 20; s.vol += 1.0; s.regAgg += 0.5; } },
  { id: "watkins", m: 8, y: 2001, title: "SHERRON WATKINS MEMO", desc: "'We will implode in a wave of accounting scandals.'", type: "danger", fx: (s) => { s.auditRisk += 25; s.regAgg += 1.0; } },
  { id: "sept11", m: 9, y: 2001, title: "SEPTEMBER 11 ATTACKS", desc: "National tragedy. Regulators temporarily distracted.", type: "danger", fx: (s) => { s.auditRisk = Math.max(0, s.auditRisk - 20); s.gridDemand *= 0.5; s.score *= 0.8; s.regAgg = 0.5; } },
  { id: "q3", m: 10, y: 2001, title: "Q3 EARNINGS: $618M LOSS", desc: "$1.2B equity reduction. The Raptors are unwinding.", type: "danger", fx: (s) => { s.score *= 0.5; s.auditRisk += 30; s.vol += 2.0; } },
  { id: "sec", m: 10, y: 2001, title: "SEC INQUIRY OPENED", desc: "They are asking about the Fastow partnerships. Shred everything.", type: "danger", fx: (s) => { s.auditRisk = 90; s.regAgg += 2.0; s.vol += 2.0; } },
  { id: "fastow", m: 10, y: 2001, title: "FASTOW FIRED", desc: "CFO ousted. The market smells blood.", type: "danger", fx: (s) => { s.score *= 0.6; s.vol += 1.0; } },
  { id: "restate", m: 11, y: 2001, title: "EARNINGS RESTATED", desc: "Admitted accounting errors for 1997-2000. It's over.", type: "danger", fx: (s) => { s.score *= 0.3; s.auditRisk = 95; } },
  { id: "dynegy", m: 11, y: 2001, title: "DYNEGY MERGER FAILS", desc: "Nobody wants to buy us. Junk status.", type: "danger", fx: (s) => { s.score = 1; s.vol += 3.0; s.creditScore = 0; } },
  { id: "ch11", m: 12, y: 2001, title: "CHAPTER 11 BANKRUPTCY", desc: "The largest bankruptcy in US history.", type: "danger", fx: (s) => { s.score = 0; s.gameOver = true; s.failReason = "BANKRUPTCY DECLARED"; } },
];

const DIFFICULTY = {
  lay: { name: "Ken Lay", title: "Chairman & CEO", sub: '"I had no idea"', level: "EASY", color: "#4CAF50", icon: "🎩", startCash: 8000, auditMod: 0.5, degradeMod: 0.5, revenueBonus: 1.5 },
  fastow: { name: "Andy Fastow", title: "CFO", sub: '"The SPE Architect"', level: "MEDIUM", color: "#FF9800", icon: "📊", startCash: 5000, auditMod: 1.0, degradeMod: 1.0, revenueBonus: 1.0 },
  skilling: { name: "Jeff Skilling", title: "President & CEO", sub: '"Smartest Guy in the Room"', level: "HARD", color: "#f44336", icon: "🧠", startCash: 3000, auditMod: 1.5, degradeMod: 1.5, revenueBonus: 0.8 },
  watkins: { name: "Sherron Watkins", title: "The Whistleblower", sub: '"See through the lies"', level: "NIGHTMARE", color: "#9C27B0", icon: "🔍", startCash: 2000, auditMod: 2.0, degradeMod: 2.0, revenueBonus: 0.6 },
};

const makeState = (diff = "fastow") => {
  const d = DIFFICULTY[diff];
  return {
    temp: 300, pressure: 0, rods: 100, valve: 0, pump: true, fuel: 100,
    pumpHP: 100, turbHP: 100, condHP: 100, gridHz: 60, brownout: false,
    xenon: 0, flowRate: 100, reactivity: 0, meltdownProg: 0,
    power: 0, gridDemand: 600,
    score: 40, cash: d.startCash, loan: 0, unrealizedLoss: 0,
    creditScore: 50, offshore: 0, auditRisk: 0, politCap: 10,
    spes: [], totalHidden: 0, austerity: false, frozen: false,
    dayTime: 8.0, dayCount: 0, date: "Jan 2000", weather: "sunny",
    gameOver: false, failReason: null,
    lobbyShield: 0, chapter: 0,
    demandScale: 1.0, vol: 1.0, regAgg: 1.0, triggered: [],
    diff,
  };
};

// ─── AUDIO ENGINE ────────────────────────────────────────────────────

let audioCtx = null;
let humOsc = null;
let humGain = null;
let ambiOsc = null;
let ambiGain = null;

const initAudio = () => {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
};

const startAmbience = () => {
  if (!audioCtx) initAudio();
  if (!ambiOsc) {
    ambiOsc = audioCtx.createOscillator();
    ambiGain = audioCtx.createGain();
    const flt = audioCtx.createBiquadFilter();
    flt.type = "lowpass"; flt.frequency.value = 120;
    ambiOsc.type = "sawtooth"; ambiOsc.frequency.value = 40;
    ambiGain.gain.value = 0.025;
    ambiOsc.connect(flt); flt.connect(ambiGain); ambiGain.connect(audioCtx.destination);
    ambiOsc.start();
  }
  if (!humOsc) {
    humOsc = audioCtx.createOscillator();
    humGain = audioCtx.createGain();
    humOsc.type = "sine"; humOsc.frequency.value = 60; humGain.gain.value = 0;
    humOsc.connect(humGain); humGain.connect(audioCtx.destination);
    humOsc.start();
  }
};

const updateAmbience = (power, pressure, temp) => {
  if (!humOsc || !humGain) return;
  const now = audioCtx.currentTime;
  humOsc.frequency.setTargetAtTime(60 + (power / 1500) * 140, now, 0.2);
  const stress = (pressure / 2000) + Math.max(0, temp - 2000) / 1000;
  humGain.gain.setTargetAtTime(Math.min(0.18, stress * 0.14 + 0.01), now, 0.2);
};

const sfx = (type) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  g.connect(audioCtx.destination);
  const t = audioCtx.currentTime;
  if (type === "alarm") {
    o.type = "sawtooth"; o.frequency.setValueAtTime(600, t);
    o.frequency.exponentialRampToValueAtTime(100, t + 0.4);
    g.gain.setValueAtTime(0.15, t); g.gain.linearRampToValueAtTime(0, t + 0.5);
    o.start(); o.stop(t + 0.5);
  } else if (type === "cash") {
    o.type = "sine"; o.frequency.setValueAtTime(1000, t);
    g.gain.setValueAtTime(0.04, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.start(); o.stop(t + 0.3);
  } else if (type === "error") {
    o.type = "sawtooth"; o.frequency.setValueAtTime(150, t);
    o.frequency.linearRampToValueAtTime(100, t + 0.25);
    g.gain.setValueAtTime(0.08, t); g.gain.linearRampToValueAtTime(0, t + 0.25);
    o.start(); o.stop(t + 0.25);
  } else if (type === "repair") {
    o.type = "square"; o.frequency.setValueAtTime(100, t);
    o.frequency.exponentialRampToValueAtTime(50, t + 0.15);
    g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    o.start(); o.stop(t + 0.2);
  } else if (type === "shred") {
    o.type = "sawtooth"; o.frequency.setValueAtTime(80, t);
    const m = audioCtx.createOscillator(); m.type = "square"; m.frequency.value = 50;
    const mg = audioCtx.createGain(); mg.gain.value = 400;
    m.connect(mg); mg.connect(o.frequency); m.start(); m.stop(t + 0.5);
    g.gain.setValueAtTime(0.08, t); g.gain.linearRampToValueAtTime(0, t + 0.5);
    o.start(); o.stop(t + 0.5);
  } else if (type === "boom") {
    o.type = "triangle"; o.frequency.setValueAtTime(80, t);
    o.frequency.exponentialRampToValueAtTime(10, t + 0.5);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
    o.start(); o.stop(t + 0.5);
  } else {
    o.type = "square"; o.frequency.setValueAtTime(440, t);
    o.frequency.setValueAtTime(880, t + 0.08);
    g.gain.setValueAtTime(0.04, t); g.gain.linearRampToValueAtTime(0, t + 0.15);
    o.start(); o.stop(t + 0.15);
  }
};

// ─── 3D SCENE ────────────────────────────────────────────────────────

function Scene3D({ gsRef }) {
  const mountRef = useRef(null);
  const coreMatsRef = useRef(null);
  const rendererRef = useRef(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const w = mountRef.current.clientWidth;
    const h = mountRef.current.clientHeight;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050510, 0.012);

    const camera = new THREE.PerspectiveCamera(50, w / h, 1, 500);
    camera.position.set(55, 50, 55);
    camera.lookAt(0, 5, 0);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0a, 0.4));
    const sun = new THREE.DirectionalLight(0xfff5e6, 1.5);
    sun.position.set(80, 100, 40);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.near = 0.5; sc.far = 300; sc.left = -80; sc.right = 80; sc.top = 80; sc.bottom = -80;
    scene.add(sun);

    // Materials
    const mats = {
      concrete: new THREE.MeshStandardMaterial({ color: 0x546e7a, roughness: 0.8 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xcfd8dc, metalness: 0.9, roughness: 0.3 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x29b6f6, transparent: true, opacity: 0.4, metalness: 0.9 }),
      core: new THREE.MeshStandardMaterial({ color: 0x00b0ff, emissive: 0x0091ea, emissiveIntensity: 8.0, toneMapped: false }),
      glow: new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.0, transparent: true, opacity: 0.5 }),
      grass: new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 1.0 }),
      water: new THREE.MeshStandardMaterial({ color: 0x0277bd, roughness: 0.1, transparent: true, opacity: 0.7 }),
      hazard: new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 0.5 }),
      wire: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    };
    coreMatsRef.current = mats;

    // Ground & Water
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mats.grass);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.5; ground.receiveShadow = true;
    scene.add(ground);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), mats.water);
    water.rotation.x = -Math.PI / 2; water.position.y = -1.2;
    scene.add(water);

    // Build geometry via instancing
    const box = new THREE.BoxGeometry(1, 1, 1);
    const voxels = [];
    const addV = (t, x, y, z) => voxels.push({ t, x, y, z });

    // Reactor base
    for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) addV("concrete", x, 0, z);

    // Containment dome
    for (let y = 1; y < 14; y++) {
      for (let x = -6; x <= 6; x++) {
        for (let z = -6; z <= 6; z++) {
          if (z > 0) continue; // cutaway
          const d = Math.sqrt(x * x + z * z);
          if (d < 6.5 && d > 5) addV("concrete", x, y, z);
          if (y < 8 && d < 2.5) addV(d < 1.5 ? "core" : "glow", x, y, z);
        }
      }
    }

    // Cooling tower
    const cx = -15, cz = -15;
    for (let y = 0; y < 20; y++) {
      const r = 6 - y * 0.15 + (y > 15 ? (y - 15) * 0.3 : 0);
      for (let x = -8; x <= 8; x++) {
        for (let z = -8; z <= 8; z++) {
          const d = Math.sqrt(x * x + z * z);
          if (Math.abs(d - r) < 1) addV("concrete", cx + x, y, cz + z);
        }
      }
    }

    // City buildings
    const bldg = (bx, bz, h, w, mat) => {
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let z = 0; z < w; z++) {
        if (x > 0 && x < w - 1 && z > 0 && z < w - 1 && y < h - 1) continue;
        addV((x + z + y) % 2 === 0 && y > 0 ? "glass" : mat, bx + x, y, bz + z);
      }
    };
    bldg(30, 20, 15, 6, "steel");
    bldg(40, 30, 10, 5, "concrete");
    bldg(-30, 30, 20, 5, "steel");
    bldg(-40, 20, 25, 6, "steel");
    bldg(20, -40, 35, 8, "steel"); // Enron HQ
    bldg(-50, -50, 45, 10, "glass"); // Mega tower

    // Power line poles
    [[10, 10], [20, 15], [30, 20]].forEach(([px, pz]) => {
      for (let y = 0; y < 8; y++) addV("steel", px, y, pz);
      addV("hazard", px, 8, pz);
    });

    // Instance all voxels
    const groups = {};
    voxels.forEach(v => { if (!groups[v.t]) groups[v.t] = []; groups[v.t].push(v); });
    const meshes = [];
    Object.entries(groups).forEach(([type, vs]) => {
      const mat = mats[type];
      if (!mat) return;
      const mesh = new THREE.InstancedMesh(box, mat, vs.length);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const dummy = new THREE.Object3D();
      vs.forEach((v, i) => { dummy.position.set(v.x, v.y, v.z); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); });
      scene.add(mesh);
      meshes.push(mesh);
    });

    // Power line wires
    const cyl = new THREE.CylinderGeometry(0.08, 0.08, 1);
    const wireMesh = new THREE.InstancedMesh(cyl, mats.wire, 10);
    const path = [new THREE.Vector3(0, 10, 0), new THREE.Vector3(10, 8, 10), new THREE.Vector3(20, 8, 15), new THREE.Vector3(30, 8, 20)];
    const ld = new THREE.Object3D();
    let wi = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const a = path[i], b = path[i + 1];
      const dist = a.distanceTo(b);
      const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
      ld.position.copy(mid); ld.lookAt(b); ld.rotateX(Math.PI / 2);
      ld.scale.set(1, dist, 1); ld.updateMatrix();
      wireMesh.setMatrixAt(wi++, ld.matrix);
    }
    wireMesh.count = wi;
    wireMesh.instanceMatrix.needsUpdate = true;
    scene.add(wireMesh);

    // Camera orbit vars
    let angle = 0.8;
    let mouseDown = false;
    let lastX = 0;
    const el = renderer.domElement;
    el.style.pointerEvents = "auto";
    el.addEventListener("pointerdown", (e) => { mouseDown = true; lastX = e.clientX; });
    el.addEventListener("pointerup", () => { mouseDown = false; });
    el.addEventListener("pointermove", (e) => {
      if (mouseDown) { angle += (e.clientX - lastX) * 0.005; lastX = e.clientX; }
    });

    // Animation loop
    let fid;
    const animate = () => {
      fid = requestAnimationFrame(animate);
      const s = gsRef.current;
      if (!s) return;

      angle += 0.001;
      const radius = 70;
      camera.position.x = Math.cos(angle) * radius;
      camera.position.z = Math.sin(angle) * radius;
      camera.position.y = 45;
      camera.lookAt(0, 5, 0);

      // Sun cycle
      const tR = ((s.dayTime - 6) / 24) * Math.PI * 2;
      sun.position.x = Math.cos(tR) * 120;
      sun.position.y = Math.sin(tR) * 100;
      sun.intensity = Math.max(0, Math.sin(tR) * 1.5);

      // Sky
      let sky = 0x050510;
      if (s.dayTime > 6 && s.dayTime < 18) sky = 0x4a90d9;
      else if (s.dayTime >= 18 && s.dayTime < 20) sky = 0xff7043;
      if (s.weather === "thunderstorm") sky = 0x263238;
      scene.background = new THREE.Color(sky);

      // Core glow
      let ci = 2 + s.power / 80;
      if (s.temp > 2000) {
        const oh = Math.max(0, (s.temp - 2000) / 1000);
        ci += oh * 40 + (Math.random() - 0.5) * oh * 25;
      }
      mats.core.emissiveIntensity = Math.max(0, ci);

      // Wire color based on load
      const load = Math.min(1, s.power / 1500);
      const pulse = (Math.sin(Date.now() * 0.01 * (1 + load * 5)) + 1) / 2;
      mats.wire.color.setHSL(0.3 - load * 0.3, 1.0, 0.4 + pulse * 0.4);
      wireMesh.visible = s.power > 10;

      // Meltdown shake
      if (s.meltdownProg > 0) {
        const sh = (s.meltdownProg / 100) * 0.6;
        camera.position.x += (Math.random() - 0.5) * sh;
        camera.position.y += (Math.random() - 0.5) * sh;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth;
      const nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(fid);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      meshes.forEach(m => m.dispose());
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />;
}

// ─── CORPORATE SPIN (Claude API) ────────────────────────────────────

async function getCorporateSpin(gs) {
  try {
    const prompt = `You are a satirical Enron executive PR spokesperson. Current stock: $${gs.score.toFixed(2)}, audit risk: ${gs.auditRisk.toFixed(0)}%, hidden debt: $${gs.totalHidden}. Give a darkly funny, confident corporate-speak quote about Enron's bright future. Max 15 words. Just the quote, no attribution.`;
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 100,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "Synergies remain robust.";
  } catch {
    return "Communications link severed.";
  }
}

// ─── MAIN APP ────────────────────────────────────────────────────────

export default function EnronMeltdownManager() {
  const [phase, setPhase] = useState("boot"); // boot, menu, game, over
  const [bootLines, setBootLines] = useState([]);
  const [bootProg, setBootProg] = useState(0);
  const [diff, setDiff] = useState("fastow");
  const [ui, setUi] = useState(makeState("fastow"));
  const [tab, setTab] = useState("controls");
  const [logs, setLogs] = useState([]);
  const [stockHist, setStockHist] = useState([]);
  const [riskHist, setRiskHist] = useState([]);
  const [alert, setAlert] = useState(null);
  const [speFlash, setSpeFlash] = useState(false);
  const [spin, setSpin] = useState(null);
  const gsRef = useRef(makeState("fastow"));

  // Boot sequence
  useEffect(() => {
    if (phase !== "boot") return;
    const lines = [
      "INITIALIZING ENRON_OS V4.0...",
      "CHECKING MEMORY INTEGRITY... 64MB OK",
      "MOUNTING OFFSHORE ACCOUNTS...",
      "LOADING 3D REACTOR SCENE...",
      "CONNECTING TO CALIFORNIA GRID...",
      "BYPASSING SEC PROTOCOLS...",
      "CLAUDE SONNET 4.6 ONLINE",
      "SYSTEM READY.",
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i >= lines.length) { clearInterval(iv); setTimeout(() => setPhase("menu"), 400); return; }
      setBootLines(p => [...p, lines[i]]);
      setBootProg(((i + 1) / lines.length) * 100);
      i++;
    }, 280);
    return () => clearInterval(iv);
  }, [phase]);

  const addLog = useCallback((msg, type = "info") => {
    setLogs(p => [{ id: Date.now(), msg, type, ts: new Date().toLocaleTimeString() }, ...p].slice(0, 5));
  }, []);

  const triggerAlert = useCallback((title, message, type = "warn") => {
    setAlert({ title, message, type });
    addLog(`${title}: ${message}`, type);
    sfx(type === "danger" ? "alarm" : "repair");
    setTimeout(() => setAlert(null), 4000);
  }, [addLog]);

  const startGame = useCallback((d) => {
    setDiff(d);
    const s = makeState(d);
    gsRef.current = s;
    setUi({ ...s });
    setStockHist([]);
    setRiskHist([]);
    setLogs([]);
    setAlert(null);
    setSpeFlash(false);
    setTab("controls");
    initAudio();
    startAmbience();
    sfx("buy");
    setPhase("game");
  }, []);

  // ── MAIN PHYSICS LOOP ──────────────────────────────────────────

  useEffect(() => {
    if (phase !== "game") return;
    const loop = setInterval(() => {
      const s = gsRef.current;
      if (s.gameOver) return;
      const chap = CHAPTERS[s.chapter];
      const d = DIFFICULTY[s.diff];

      // Time
      s.dayTime += 0.05;
      if (s.dayTime >= 24) {
        s.dayTime = 0;
        s.dayCount++;
        const dt = new Date("2000-01-01");
        dt.setDate(dt.getDate() + s.dayCount * 7);
        s.date = dt.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        if (s.loan > 0) s.loan *= 1.01;

        // Events
        const ev = EVENTS.find(e => e.m === dt.getMonth() + 1 && e.y === dt.getFullYear() && !s.triggered.includes(e.id));
        if (ev) {
          s.triggered.push(ev.id);
          let tp = ev.type;
          if (s.lobbyShield > 0 && tp === "danger") tp = "warn";
          triggerAlert(ev.title, ev.desc, tp === "danger" ? "danger" : "warn");
          if (ev.fx) {
            if (s.lobbyShield > 0 && (ev.title.includes("SEC") || ev.title.includes("SKILLING"))) {
              addLog("Lobbyists mitigated event impact.", "success");
            } else {
              ev.fx(s);
            }
          }
        }
        // Weather
        const mo = dt.getMonth() + 1;
        if (mo >= 6 && mo <= 8) s.weather = "sunny";
        else if (mo >= 11 || mo <= 2) s.weather = "snowy";
        else s.weather = "cloudy";
      }

      // Reactor physics
      const rods = s.rods / 100;
      const pumpEff = (s.pump ? 1 : 0) * (s.pumpHP / 100);
      s.flowRate = s.flowRate * 0.95 + pumpEff * 100 * 0.05;
      const xenonPoison = s.xenon * 0.005;
      const tempFeedback = (s.temp - 300) * 0.0001;
      s.reactivity = (1 - rods) - xenonPoison - tempFeedback;
      s.xenon = Math.max(0, Math.min(100, s.xenon + s.power * 0.001 - s.xenon * s.reactivity * 0.01));
      const heatGen = Math.max(0, s.reactivity * 60) + s.power * 0.05;
      const cooling = (s.temp - 20) * 0.005 + (s.temp - 80) * 0.4 * (s.flowRate / 100) * (s.condHP / 100);
      s.temp = Math.max(20, s.temp + heatGen - cooling + (Math.random() - 0.5));
      const presBuild = Math.max(0, (s.temp - 100) * 0.7);
      const valveOpen = s.valve / 100;
      const presRelease = valveOpen * s.pressure * 0.2;
      s.pressure = Math.max(0, s.pressure + presBuild - presRelease);
      const turbTorque = presRelease * 30 * (s.turbHP / 100);
      s.power = s.power * 0.9 + turbTorque * 0.1;

      // Grid
      const totalDemand = Math.max(1, s.gridDemand * chap.mods.demand * s.demandScale);
      s.gridHz = s.gridHz * 0.95 + (60 * (s.power / totalDemand)) * 0.05;
      if (s.gridHz < 59) {
        if (!s.brownout) { s.brownout = true; addLog("BROWNOUT — Low Frequency", "warn"); s.politCap -= 1; }
        if (s.chapter === 1) s.cash += 50;
      } else { s.brownout = false; }

      s.austerity = s.cash < 0;
      s.frozen = s.auditRisk > 80;

      // Unrealized loss bleed
      if (s.unrealizedLoss > 0) {
        const bleed = Math.min(s.unrealizedLoss, 50);
        s.unrealizedLoss -= bleed;
        s.loan += bleed;
      }

      // Degradation
      const dg = s.austerity ? 2.0 : 1.0;
      const dgM = dg * d.degradeMod;
      if (s.power > 1000) { s.pumpHP -= 0.01 * dgM; s.condHP -= 0.01 * dgM; }
      if (s.temp > 2000) s.condHP -= 0.05 * dgM;
      if (s.gridHz > 61) { s.turbHP -= 0.1 * dgM; }
      s.pumpHP = Math.max(0, s.pumpHP);
      s.turbHP = Math.max(0, s.turbHP);
      s.condHP = Math.max(0, s.condHP);

      // Meltdown
      if (s.temp > MELTDOWN_TEMP || s.pressure > MELTDOWN_PRES) {
        s.meltdownProg += 0.4;
        if (s.meltdownProg > 99) { s.gameOver = true; s.failReason = "CRITICAL MASS"; }
      } else { s.meltdownProg = Math.max(0, s.meltdownProg - 0.5); }

      // Revenue
      const powerSold = Math.min(s.power, totalDemand);
      const rate = (s.chapter === 1 ? 0.05 : 0.02) * d.revenueBonus;
      s.cash += powerSold * rate;

      // Audit risk
      if (s.lobbyShield <= 0) {
        const speMult = s.spes.filter(x => x.active).length;
        const riskInc = (0.005 + speMult * 0.03) * s.regAgg * chap.mods.regAgg * d.auditMod;
        s.auditRisk = Math.min(100, s.auditRisk + riskInc);
      }
      if (s.auditRisk >= 100) { s.gameOver = true; s.failReason = "FEDERAL RAID — FRAUD EXPOSED"; }

      // Stock
      const stabPen = Math.abs(60 - s.gridHz) * 2;
      const revBonus = powerSold * 0.001;
      const riskPen = s.auditRisk * 0.04;
      const randFluc = (Math.random() - 0.5) * s.vol * chap.mods.vol;
      s.score = Math.max(0, s.score + revBonus - stabPen - riskPen + randFluc);

      // Chapter progression
      if (chap.win(s) && s.chapter < CHAPTERS.length - 1) {
        s.chapter++;
        triggerAlert("CHAPTER COMPLETE", CHAPTERS[s.chapter].title, "info");
        sfx("boom");
      }

      // Lobby decay
      if (s.lobbyShield > 0) {
        s.lobbyShield--;
        if (s.lobbyShield % 10 === 0 && s.auditRisk > 0) s.auditRisk -= 0.5;
      }

      // SPE checks
      s.spes.forEach(spe => {
        if (spe.active && s.score < spe.trigger) {
          spe.active = false;
          s.loan += spe.hidden;
          s.score -= spe.hidden / 50;
          triggerAlert("SPE COLLAPSE", `${spe.name} failed. Debt returned.`, "danger");
          setSpeFlash(true);
          setTimeout(() => setSpeFlash(false), 700);
        }
      });

      updateAmbience(s.power, s.pressure, s.temp);
      setUi({ ...s });
    }, 50);

    const chartIv = setInterval(() => {
      setStockHist(p => [...p.slice(-40), { t: "", p: gsRef.current.score }]);
      setRiskHist(p => [...p.slice(-40), { t: "", p: gsRef.current.auditRisk }]);
    }, 1000);

    return () => { clearInterval(loop); clearInterval(chartIv); };
  }, [phase, triggerAlert, addLog]);

  // ── ACTIONS ────────────────────────────────────────────────────

  const repair = (comp) => {
    const s = gsRef.current;
    if (s.frozen) { sfx("error"); addLog("Assets Frozen. Repairs halted.", "danger"); return; }
    const costMap = { pump: PRICES.FIX_PUMP, turb: PRICES.FIX_TURB, cond: PRICES.FIX_COND };
    const cost = costMap[comp] * (s.austerity ? 2 : 1);
    if (s.cash < cost) { sfx("error"); addLog("Insufficient funds.", "warn"); return; }
    s.cash -= cost;
    if (comp === "pump") s.pumpHP = 100;
    if (comp === "turb") s.turbHP = 100;
    if (comp === "cond") s.condHP = 100;
    sfx("repair"); addLog(`Repaired ${comp}${s.austerity ? " (austerity penalty)" : ""}`, "success");
  };

  const mtm = () => {
    const s = gsRef.current;
    if (s.frozen) { sfx("error"); addLog("Assets Frozen.", "danger"); return; }
    s.cash += 5000; s.score += 5; s.unrealizedLoss += 6000; s.auditRisk += 2;
    sfx("cash"); addLog("Mark-to-Market: +$5K cash. Future losses +$6K.", "warn");
  };

  const createSPE = () => {
    const s = gsRef.current;
    if (s.frozen) { sfx("error"); addLog("Assets Frozen.", "danger"); return; }
    if (s.cash < PRICES.CREATE_SPE) { sfx("error"); addLog("Insufficient cash.", "warn"); return; }
    let hide = 0;
    const max = 20000;
    if (s.unrealizedLoss > 0) { const h = Math.min(s.unrealizedLoss, max); s.unrealizedLoss -= h; hide += h; }
    if (hide < max && s.loan > 0) { const h = Math.min(s.loan, max - hide); s.loan -= h; hide += h; }
    if (hide === 0) { sfx("error"); addLog("No debt to hide.", "info"); return; }
    s.cash -= PRICES.CREATE_SPE;
    s.score += hide / 5000;
    const name = `LJM-${Math.floor(Math.random() * 100)}`;
    s.spes.push({ id: Math.random().toString(), name, hidden: hide, trigger: s.score * 0.85, active: true });
    s.totalHidden += hide;
    s.auditRisk += 7;
    sfx("buy"); addLog(`Created SPE ${name}. Hid $${Math.floor(hide)}. Risk +7%.`, "success");
  };

  const lobby = () => {
    const s = gsRef.current;
    if (s.cash < PRICES.LOBBY) { sfx("error"); addLog("Insufficient funds.", "warn"); return; }
    s.cash -= PRICES.LOBBY; s.auditRisk = Math.max(0, s.auditRisk - 15); s.lobbyShield = 600;
    sfx("cash"); addLog("Campaign donation. Regulators pacified.", "success");
  };

  const shred = () => {
    const s = gsRef.current;
    if (s.cash < PRICES.SHRED) { sfx("error"); addLog("Not enough cash for shredders.", "warn"); return; }
    s.cash -= PRICES.SHRED; s.auditRisk = Math.max(0, s.auditRisk - 20);
    sfx("shred"); addLog("Shredded documents. Risk -20%.", "success");
  };

  const takeLoan = () => {
    const s = gsRef.current;
    if (s.frozen) { sfx("error"); addLog("Assets Frozen.", "danger"); return; }
    s.loan += 5000; s.cash += 5000;
    sfx("cash"); addLog("Took $5K loan.", "info");
  };

  const repayLoan = () => {
    const s = gsRef.current;
    if (s.loan <= 0) { sfx("error"); return; }
    const r = Math.min(s.cash, s.loan, 5000);
    if (r <= 0) { sfx("error"); return; }
    s.cash -= r; s.loan -= r;
    sfx("cash"); addLog(`Repaid $${Math.floor(r)}.`, "success");
  };

  const askSpin = async () => {
    setSpin("Thinking...");
    const text = await getCorporateSpin(gsRef.current);
    setSpin(text);
    setTimeout(() => setSpin(null), 5000);
  };

  // ─── STYLES ──────────────────────────────────────────────────────

  const S = {
    root: { width: "100vw", height: "100vh", background: "#000", color: "#e0e0e0", fontFamily: "'Courier New', monospace", overflow: "hidden", position: "relative", userSelect: "none" },
    mono: { fontFamily: "'Courier New', monospace" },
  };

  // ─── BOOT SCREEN ─────────────────────────────────────────────────

  if (phase === "boot") {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", padding: 32 }}>
        <style>{`@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }`}</style>
        <div style={{ maxWidth: 600, width: "100%" }}>
          <div style={{ borderBottom: "2px solid #42a5f5", paddingBottom: 8, marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, fontStyle: "italic", color: "#fff", margin: 0 }}>ENRON BIOS</h1>
            <span style={{ color: "#42a5f5", fontSize: 12 }}>v.claude.4.6</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24, fontSize: 11, color: "#64b5f6" }}>
            <div>CPU: PENTIUM III @ 800MHZ</div>
            <div>RAM: 256MB ECC</div>
            <div>GPU: VOODOO 3 3000</div>
            <div>SECURE BOOT: DISABLED</div>
          </div>
          <div style={{ height: 200, overflow: "hidden", border: "1px solid #1a237e", background: "rgba(13,71,161,0.1)", padding: 16, marginBottom: 16, fontSize: 13 }}>
            {bootLines.map((l, i) => <div key={i} style={{ marginBottom: 4, color: "#42a5f5" }}>{`> ${l}`}</div>)}
            <span style={{ animation: "blink 1s infinite", color: "#42a5f5" }}>_</span>
          </div>
          <div style={{ height: 8, background: "#0d47a1", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${bootProg}%`, background: "#42a5f5", transition: "width 0.3s" }} />
          </div>
        </div>
      </div>
    );
  }

  // ─── MENU / DIFFICULTY SELECT ────────────────────────────────────

  if (phase === "menu") {
    return (
      <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        `}</style>
        <div style={{ maxWidth: 800, width: "100%", padding: 32, textAlign: "center" }}>
          <h1 style={{ fontSize: 64, fontWeight: 900, fontStyle: "italic", color: "#fff", margin: 0, letterSpacing: -2 }}>ENRON</h1>
          <h2 style={{ fontSize: 18, letterSpacing: 8, color: "#42a5f5", marginBottom: 8 }}>MELTDOWN MANAGER</h2>
          <div style={{ fontSize: 10, color: "#555", letterSpacing: 3, marginBottom: 32 }}>CLAUDE SONNET 4.6 EDITION — GLASS STONE © 2026</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 32 }}>
            {Object.entries(DIFFICULTY).map(([key, d], i) => (
              <div key={key} onClick={() => startGame(key)} style={{
                background: `${d.color}11`, border: `1px solid ${d.color}55`, borderRadius: 8, padding: 16,
                cursor: "pointer", transition: "all 0.3s", animation: `fadeUp ${0.4 + i * 0.12}s ease`,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${d.color}33`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
              >
                <span style={{ fontSize: 32 }}>{d.icon}</span>
                <span style={{ fontSize: 10, letterSpacing: 3, color: d.color, fontWeight: 700, padding: "2px 10px", border: `1px solid ${d.color}66`, borderRadius: 4 }}>{d.level}</span>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{d.name}</div>
                <div style={{ fontSize: 10, color: d.color }}>{d.title}</div>
                <div style={{ fontSize: 10, color: "#666", fontStyle: "italic" }}>{d.sub}</div>
                <div style={{ fontSize: 9, color: "#444", marginTop: 4 }}>
                  Cash: ${d.startCash} | Risk: ×{d.auditMod}
                </div>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 12, color: "#333", lineHeight: 1.6 }}>
            Manage a nuclear reactor <em>and</em> a fraudulent balance sheet.<br />
            Survive from Jan 2000 through the collapse. Extract maximum offshore wealth.
          </div>
        </div>
      </div>
    );
  }

  // ─── GAME OVER ───────────────────────────────────────────────────

  if (phase === "game" && ui.gameOver) {
    return (
      <div style={{ ...S.root, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.97)" }}>
        <h1 style={{ fontSize: "clamp(36px, 6vw, 72px)", color: "#ef5350", fontWeight: 900, letterSpacing: -2, marginBottom: 24 }}>{ui.failReason}</h1>
        <div style={{ fontSize: 24, color: "#aaa", marginBottom: 8 }}>Final Wealth Extracted</div>
        <div style={{ fontSize: 56, color: "#4caf50", fontWeight: 700, marginBottom: 8 }}>${Math.floor(ui.offshore).toLocaleString()}</div>
        <div style={{ fontSize: 14, color: "#666", marginBottom: 32 }}>Stock at collapse: ${ui.score.toFixed(2)} | Hidden debt: ${Math.floor(ui.totalHidden).toLocaleString()}</div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => startGame(diff)} style={{ padding: "12px 32px", background: "#1565c0", color: "#fff", border: "none", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 2, borderRadius: 4 }}>NEW GAME</button>
          <button onClick={() => setPhase("menu")} style={{ padding: "12px 32px", background: "transparent", color: "#666", border: "1px solid #333", fontSize: 14, cursor: "pointer", letterSpacing: 2, borderRadius: 4 }}>CHANGE DIFFICULTY</button>
        </div>
        <div style={{ marginTop: 48, fontSize: 10, color: "#333", letterSpacing: 2 }}>GLASS STONE © 2026 — CEO GABRIEL B. RODRIGUEZ</div>
      </div>
    );
  }

  // ─── GAME UI ─────────────────────────────────────────────────────

  if (phase !== "game") return null;

  const chap = CHAPTERS[ui.chapter];
  const dConf = DIFFICULTY[ui.diff];
  const timerCol = ui.temp > 2400 ? "#ef5350" : ui.temp > 1500 ? "#ff9800" : "#4caf50";
  const hzOk = Math.abs(ui.gridHz - 60) <= 0.5;
  const totalDem = Math.max(1, ui.gridDemand * chap.mods.demand * ui.demandScale);

  return (
    <div style={{ ...S.root, overflow: "hidden" }}>
      {/* SPE collapse flash */}
      {speFlash && <div style={{ position: "absolute", inset: 0, background: "rgba(244,67,54,0.3)", zIndex: 50, pointerEvents: "none" }} />}

      {/* 3D Scene */}
      <Scene3D gsRef={gsRef} />

      {/* ── TOP BAR ─────────────────────────────────────────── */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, padding: 12, display: "flex", justifyContent: "space-between", zIndex: 10, pointerEvents: "none" }}>
        {/* Left: Stock + Chapter */}
        <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ background: speFlash ? "rgba(183,28,28,0.9)" : "rgba(0,0,0,0.85)", borderLeft: `4px solid ${speFlash ? "#ef5350" : "#42a5f5"}`, padding: "12px 16px", borderRadius: "0 6px 6px 0", backdropFilter: "blur(8px)", minWidth: 180 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, color: "#666" }}>NYSE: ENE</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: ui.score >= 10 ? "#4caf50" : "#ef5350", ...S.mono }}>
              ${ui.score.toFixed(2)}
            </div>
            <div style={{ fontSize: 10, color: "#888", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <TrendingUp size={10} /> RISK: {ui.auditRisk.toFixed(0)}%
            </div>
          </div>
          <div style={{ background: "rgba(0,0,0,0.8)", borderLeft: "4px solid #7c4dff", padding: "6px 12px", borderRadius: "0 4px 4px 0" }}>
            <div style={{ fontSize: 9, color: "#999", fontWeight: 700, letterSpacing: 2 }}>{chap.title}</div>
            <div style={{ fontSize: 11, color: "#ccc", maxWidth: 240 }}>{chap.desc}</div>
          </div>

          {ui.lobbyShield > 0 && (
            <div style={{ background: "rgba(27,94,32,0.8)", borderLeft: "4px solid #4caf50", padding: "4px 10px", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "#a5d6a7", fontWeight: 700 }}>
              <ShieldCheck size={14} /> LOBBYING ACTIVE
            </div>
          )}
          {ui.austerity && (
            <div style={{ background: "rgba(230,81,0,0.8)", borderLeft: "4px solid #ff9800", padding: "4px 10px", borderRadius: "0 4px 4px 0", fontSize: 10, color: "#ffe0b2", fontWeight: 700 }}>
              ⚠ AUSTERITY MODE
            </div>
          )}
          {ui.frozen && (
            <div style={{ background: "rgba(183,28,28,0.8)", borderLeft: "4px solid #ef5350", padding: "4px 10px", borderRadius: "0 4px 4px 0", fontSize: 10, color: "#ffcdd2", fontWeight: 700 }}>
              🔒 ASSET FREEZE
            </div>
          )}
        </div>

        {/* Right: Date + spin */}
        <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
          <div style={{ background: "rgba(0,0,0,0.85)", borderRight: "4px solid #fff", padding: "12px 16px", borderRadius: "6px 0 0 6px", textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", ...S.mono }}>{ui.date}</div>
            <div style={{ fontSize: 10, color: "#42a5f5", letterSpacing: 2 }}>{ui.weather.toUpperCase()} <Activity size={10} style={{ display: "inline" }} /></div>
          </div>
          <button onClick={askSpin} style={{ background: "#1565c0", border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", boxShadow: "0 2px 12px rgba(21,101,192,0.5)" }}>
            <Volume2 size={18} />
          </button>
          {spin && (
            <div style={{ background: "rgba(0,0,0,0.9)", border: "1px solid #42a5f5", borderRadius: 6, padding: "8px 12px", maxWidth: 240, fontSize: 11, color: "#90caf9", fontStyle: "italic", textAlign: "right" }}>
              "{spin}"
            </div>
          )}
        </div>
      </div>

      {/* Meltdown Warning */}
      {ui.meltdownProg > 0 && (
        <div style={{ position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)", background: "rgba(62,0,0,0.95)", border: "2px solid #ef5350", padding: "20px 32px", borderRadius: 12, textAlign: "center", zIndex: 20, boxShadow: "0 0 50px rgba(244,67,54,0.5)" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#ef5350", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <AlertTriangle size={28} /> CORE CRITICAL
          </div>
          <div style={{ width: 280, height: 20, background: "#000", borderRadius: 10, marginTop: 12, overflow: "hidden", border: "1px solid #ef5350", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 700, zIndex: 1 }}>{ui.meltdownProg.toFixed(1)}% INTEGRITY LOSS</div>
            <div style={{ height: "100%", width: `${ui.meltdownProg}%`, background: "#c62828" }} />
          </div>
        </div>
      )}

      {/* Alert Popup */}
      {alert && (
        <div style={{ position: "fixed", top: 100, right: 16, padding: "16px 20px", borderLeft: `4px solid ${alert.type === "danger" ? "#ef5350" : "#ffb300"}`, borderRadius: 8, background: "rgba(30,30,30,0.97)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxWidth: 340, zIndex: 55 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
            {alert.type === "danger" && <AlertTriangle size={18} color="#ef5350" />}
            {alert.title}
          </div>
          <div style={{ fontSize: 12, color: "#aaa", lineHeight: 1.5, ...S.mono }}>{alert.message}</div>
        </div>
      )}

      {/* ── BOTTOM CONTROL PANEL ────────────────────────────── */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 250, background: "rgba(20,20,25,0.97)", borderTop: "1px solid #333", zIndex: 30, display: "flex" }}>

        {/* LEFT: Reactor Telemetry */}
        <div style={{ width: "25%", padding: 12, borderRight: "1px solid #333", background: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#666", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Radio size={12} /> REACTOR TELEMETRY
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div>
              <div style={{ fontSize: 9, color: "#666" }}>CORE TEMP</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: timerCol, ...S.mono }}>{ui.temp.toFixed(0)}<span style={{ fontSize: 11 }}>°C</span></div>
              <div style={{ height: 3, background: "#222", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(ui.temp / MAX_TEMP) * 100}%`, background: timerCol, transition: "width 0.3s" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#666" }}>PRESSURE</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: ui.pressure > 1600 ? "#ef5350" : "#26c6da", ...S.mono }}>{ui.pressure.toFixed(0)}<span style={{ fontSize: 11 }}>PSI</span></div>
              <div style={{ height: 3, background: "#222", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(ui.pressure / MAX_PRES) * 100}%`, background: ui.pressure > 1600 ? "#ef5350" : "#26c6da", transition: "width 0.3s" }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#666" }}>NEUTRON FLUX</div>
              <div style={{ fontSize: 18, color: "#ab47bc", ...S.mono }}>{ui.reactivity.toFixed(3)}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, color: "#666" }}>XENON</div>
              <div style={{ fontSize: 18, color: "#78909c", ...S.mono }}>{ui.xenon.toFixed(1)}%</div>
            </div>
          </div>
          {/* Logs */}
          <div style={{ flex: 1, overflow: "hidden", marginTop: 4 }}>
            {logs.slice(0, 3).map(l => (
              <div key={l.id} style={{ fontSize: 9, color: l.type === "danger" ? "#ef5350" : l.type === "warn" ? "#ffb300" : l.type === "success" ? "#4caf50" : "#666", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                [{l.ts}] {l.msg}
              </div>
            ))}
          </div>
        </div>

        {/* CENTER: Controls */}
        <div style={{ width: "50%", padding: 12, display: "flex", flexDirection: "column" }}>
          {/* Grid Hz */}
          <div style={{ position: "absolute", right: "26%", top: -36, display: "flex", flexDirection: "column", alignItems: "flex-end", zIndex: 31 }}>
            <div style={{ fontSize: 9, color: "#666", marginBottom: 2 }}>GRID FREQUENCY</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: hzOk ? "#4caf50" : "#ffb300", ...S.mono }}>
              {ui.gridHz.toFixed(2)} <span style={{ fontSize: 12, color: "#555" }}>Hz</span>
            </div>
            {ui.brownout && <div style={{ fontSize: 9, background: "rgba(255,179,0,0.15)", color: "#ffb300", padding: "2px 8px", borderRadius: 4, marginTop: 2 }}>BROWNOUT</div>}
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 16, borderBottom: "1px solid #333", marginBottom: 8, paddingBottom: 6 }}>
            {["controls", "maintenance"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#42a5f5" : "#555", fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: "pointer", textTransform: "uppercase", borderBottom: tab === t ? "2px solid #42a5f5" : "2px solid transparent", paddingBottom: 4 }}>{t}</button>
            ))}
          </div>

          {tab === "controls" ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
              {/* Rods */}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 6, border: "1px solid #333" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#888" }}>CONTROL RODS</span>
                  <span style={{ fontSize: 10, color: "#42a5f5", ...S.mono }}>{ui.rods}% IN</span>
                </div>
                <input type="range" value={ui.rods} onChange={e => gsRef.current.rods = parseInt(e.target.value)}
                  style={{ width: "100%", height: 36, accentColor: "#42a5f5", cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <button onClick={() => gsRef.current.rods = 0} style={{ fontSize: 9, padding: "4px 10px", background: "#333", border: "1px solid #555", borderRadius: 4, color: "#ef5350", cursor: "pointer" }}>PULL (MAX PWR)</button>
                  <button onClick={() => { gsRef.current.rods = 100; sfx("alarm"); }} style={{ fontSize: 9, padding: "4px 10px", background: "rgba(183,28,28,0.3)", border: "1px solid #ef5350", borderRadius: 4, color: "#ef9a9a", cursor: "pointer" }}>SCRAM</button>
                </div>
              </div>
              {/* Valve */}
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 6, border: "1px solid #333" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#888" }}>STEAM VALVE</span>
                  <span style={{ fontSize: 10, color: "#26c6da", ...S.mono }}>{ui.valve}% OPEN</span>
                </div>
                <input type="range" value={ui.valve} onChange={e => gsRef.current.valve = parseInt(e.target.value)}
                  style={{ width: "100%", height: 36, accentColor: "#26c6da", cursor: "pointer" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9, color: "#666" }}>
                  <span>OUTPUT: {ui.power.toFixed(0)} MW</span>
                  <span style={{ color: totalDem > ui.power ? "#ef5350" : "#4caf50" }}>DEMAND: {Math.floor(totalDem)} MW</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, flex: 1 }}>
              {[
                { label: "PUMP", hp: ui.pumpHP, key: "pump", cost: PRICES.FIX_PUMP },
                { label: "TURBINE", hp: ui.turbHP, key: "turb", cost: PRICES.FIX_TURB },
                { label: "CONDENSER", hp: ui.condHP, key: "cond", cost: PRICES.FIX_COND },
              ].map(c => (
                <div key={c.key} style={{ background: "rgba(255,255,255,0.02)", padding: 10, borderRadius: 6, border: "1px solid #333", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 9, color: "#888", fontWeight: 700 }}>{c.label}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c.hp > 50 ? "#fff" : c.hp > 25 ? "#ffb300" : "#ef5350", ...S.mono }}>{Math.floor(c.hp)}%</div>
                    <div style={{ height: 3, background: "#222", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
                      <div style={{ height: "100%", width: `${c.hp}%`, background: c.hp > 50 ? "#4caf50" : c.hp > 25 ? "#ffb300" : "#ef5350" }} />
                    </div>
                  </div>
                  <button onClick={() => repair(c.key)} style={{ marginTop: 8, width: "100%", padding: "6px 0", background: "rgba(21,101,192,0.2)", color: "#64b5f6", fontSize: 10, border: "1px solid #1565c0", borderRadius: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", paddingLeft: 8, paddingRight: 8 }}>
                    <span>REPAIR</span><span>${c.cost}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Corporate Dashboard */}
        <div style={{ width: "25%", background: "rgba(30,30,35,1)", borderLeft: "1px solid #333", padding: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sub-tabs */}
          <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
            {["finance", "fraud"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "4px 0", fontSize: 9, letterSpacing: 2, background: tab === t ? "#fff" : "transparent", color: tab === t ? "#000" : "#666", border: `1px solid ${tab === t ? "#fff" : "#444"}`, borderRadius: 4, cursor: "pointer", textTransform: "uppercase", fontWeight: 700 }}>{t}</button>
            ))}
          </div>

          {tab === "finance" ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { l: "CASH", v: `$${Math.floor(ui.cash).toLocaleString()}`, c: ui.cash < 2000 ? "#ef5350" : "#4caf50" },
                { l: "UNREALIZED", v: `$${Math.floor(ui.unrealizedLoss).toLocaleString()}`, c: "#ef5350" },
                { l: "HIDDEN DEBT", v: `$${Math.floor(ui.totalHidden).toLocaleString()}`, c: "#ab47bc" },
                { l: "REAL DEBT", v: `$${Math.floor(ui.loan).toLocaleString()}`, c: ui.loan > 0 ? "#ef5350" : "#666" },
              ].map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "rgba(0,0,0,0.3)", borderRadius: 4, fontSize: 10 }}>
                  <span style={{ color: "#888" }}>{r.l}</span>
                  <span style={{ color: r.c, ...S.mono, fontWeight: 700 }}>{r.v}</span>
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginTop: 4 }}>
                <button onClick={takeLoan} style={{ padding: "6px 0", background: "rgba(21,101,192,0.3)", color: "#64b5f6", fontSize: 9, border: "1px solid #1565c0", borderRadius: 4, cursor: "pointer" }}>LOAN $5K</button>
                <button onClick={repayLoan} style={{ padding: "6px 0", background: "rgba(27,94,32,0.3)", color: "#81c784", fontSize: 9, border: "1px solid #2e7d32", borderRadius: 4, cursor: "pointer" }}>REPAY</button>
              </div>
              <div style={{ flex: 1, minHeight: 60, marginTop: 4 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockHist}>
                    <Area type="monotone" dataKey="p" stroke="#4caf50" fill="rgba(76,175,80,0.1)" strokeWidth={2} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, overflow: "hidden" }}>
              {/* Audit risk chart */}
              <div style={{ height: 50, background: "rgba(0,0,0,0.2)", borderRadius: 4, border: "1px solid rgba(183,28,28,0.2)", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 2, left: 6, fontSize: 8, color: "#ef5350", fontWeight: 700, zIndex: 1 }}>AUDIT RISK</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={riskHist}>
                    <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef5350" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef5350" stopOpacity={0} /></linearGradient></defs>
                    <Area type="monotone" dataKey="p" stroke="#ef5350" fill="url(#rg)" strokeWidth={2} isAnimationActive={false} />
                    <YAxis hide domain={[0, 100]} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <button onClick={mtm} style={{ padding: "6px 10px", background: "rgba(21,101,192,0.4)", color: "#90caf9", fontSize: 10, fontWeight: 700, border: "1px solid #1565c0", borderRadius: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><TrendingUp size={12} /> MARK-TO-MARKET</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>+$5K</span>
              </button>

              <button onClick={lobby} style={{ padding: "6px 10px", background: "rgba(27,94,32,0.4)", color: "#a5d6a7", fontSize: 10, fontWeight: 700, border: "1px solid #2e7d32", borderRadius: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Briefcase size={12} /> LOBBY</span>
                <span style={{ fontSize: 9, opacity: 0.7 }}>-$2K / -15 risk</span>
              </button>

              <button onClick={createSPE} style={{ padding: "8px 12px", background: "#6a1b9a", color: "#fff", fontSize: 11, fontWeight: 700, border: "none", borderRadius: 4, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(106,27,154,0.4)" }}>
                <span>CREATE SPE</span><span style={{ opacity: 0.7 }}>-$1K</span>
              </button>

              {/* SPE list */}
              <div style={{ flex: 1, overflow: "auto", background: "rgba(0,0,0,0.2)", borderRadius: 4, border: "1px solid #333", padding: 4 }}>
                {ui.spes.length === 0 && <div style={{ fontSize: 9, color: "#555", textAlign: "center", marginTop: 12 }}>No active partnerships.</div>}
                {ui.spes.map(spe => (
                  <div key={spe.id} style={{ fontSize: 9, background: "rgba(0,0,0,0.4)", padding: "4px 8px", borderRadius: 4, marginBottom: 2, display: "flex", justifyContent: "space-between", border: "1px solid #333" }}>
                    <span style={{ color: spe.active ? "#fff" : "#ef5350", textDecoration: spe.active ? "none" : "line-through" }}>{spe.name}</span>
                    <span style={{ color: "#888" }}>${Math.floor(spe.hidden).toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <button onClick={shred} style={{ padding: "6px 10px", background: "rgba(183,28,28,0.3)", color: "#ef9a9a", fontSize: 9, border: "1px solid #c62828", borderRadius: 4, cursor: "pointer" }}>SHRED DOCUMENTS (-$3K / -20 risk)</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
