import * as THREE from 'three';
import { sound } from './audio';
import {
  createPlayerAircraft,
  createEnemyAircraft,
  createGroundStructure,
  createLandTitanBoss,
  createZeppelinBoss,
  createWingmanDrone,
  createTorpedoRocket,
  createPowerupMesh,
  AircraftMeshGroup,
} from './models';
import {
  PlaneModelType,
  WingmanType,
  WingmanTactics,
  EnemyAircraftType,
  PlayerStats,
  MissionStats,
  MissionConfig,
  MissionProgressState,
  DamageNumberItem,
  WeatherType,
} from './types';
import { CAMPAIGN_MISSIONS } from './missions';

export interface BossStatus {
  name: string;
  hp: number;
  maxHp: number;
  active: boolean;
}

export interface EngineCallbacks {
  onStatsUpdate: (stats: {
    score: number;
    hp: number;
    maxHp: number;
    bombs: number;
    maxBombs: number;
    combo: number;
    comboTimer: number;
    boss: BossStatus | null;
    gold: number;
    furyTimer: number;
    missionProgress: MissionProgressState;
    wingmanType: WingmanType;
    wingmanTactics: WingmanTactics;
    wingmanActive: boolean;
    damageNumbers: DamageNumberItem[];
    weather: WeatherType;
  }) => void;
  onGameOver: (missionStats: MissionStats) => void;
  onMissionVictory: (missionStats: MissionStats) => void;
}

export class GameEngine {
  private container: HTMLElement;
  private callbacks: EngineCallbacks;
  private playerStats: PlayerStats;

  // Three.js Core
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private isRunning: boolean = false;
  private isPaused: boolean = false;

  // Environment
  private terrainTiles: THREE.Group[] = [];
  private oceanMesh: THREE.Mesh;
  private clouds: THREE.Mesh[] = [];

  // Mission
  private currentMission: MissionConfig = CAMPAIGN_MISSIONS[0];
  private airKillsCount: number = 0;
  private groundDestroyedCount: number = 0;
  private bossDefeatedFlag: boolean = false;
  private friendlyHp: number = 100;
  private missionCompletedTriggered: boolean = false;

  // Player
  private playerMesh: AircraftMeshGroup;
  private wingmanMesh: AircraftMeshGroup | null = null;
  private currentWingmanType: WingmanType = 'hurricane';
  private wingmanTactics: WingmanTactics = 'auto';
  private bombReticle: THREE.Mesh;
  private playerHp: number = 100;
  private playerMaxHp: number = 100;
  private playerBombs: number = 3;
  private playerMaxBombs: number = 3;
  private playerFireRate: number = 8;
  private currentPlaneType: PlaneModelType;

  // Movement & Input
  private targetX: number = 0;
  private targetZ: number = 14;
  private keys: Record<string, boolean> = {};

  // Entities
  private playerBullets: { mesh: THREE.Mesh; isHeavy: boolean; damage: number }[] = [];
  private wingmanBullets: { mesh: THREE.Mesh; damage: number }[] = [];
  private enemyBullets: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
  private torpedoRockets: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
  private enemies: (AircraftMeshGroup & {
    enemyType: EnemyAircraftType;
    hp: number;
    maxHp: number;
    speed: number;
    fireCooldown: number;
    scoreVal: number;
    oscOffset: number;
    isDiving?: boolean;
  })[] = [];
  private groundTargets: ReturnType<typeof createGroundStructure>[] = [];
  private bombs: { mesh: THREE.Mesh; velocity: THREE.Vector3; isMini?: boolean }[] = [];
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    decay: number;
    gravity: number;
  }[] = [];
  private powerups: {
    mesh: THREE.Group;
    type: 'weapon' | 'wingman' | 'bomb' | 'repair' | 'fury';
  }[] = [];

  // Boss
  private currentBoss: (THREE.Group & {
    turrets: THREE.Object3D[];
    hp: number;
    maxHp: number;
    scoreVal: number;
    coreMesh?: THREE.Mesh;
    moveDir: number;
    fireTimer: number;
    bossName: string;
  }) | null = null;
  private bossSpawnScoreThreshold: number = 2000;

  // State & Metrics
  private frame: number = 0;
  private cameraShake: number = 0;
  private score: number = 0;
  private gold: number = 0;
  private combo: number = 1;
  private comboTimer: number = 0;
  private comboDuration: number = 180;
  private comboCounter: number = 0;
  private maxComboReached: number = 1;
  private bossesDefeated: number = 0;
  private bombsUsed: number = 0;
  private bombHits: number = 0;
  private furyTimer: number = 0;

  // Floating Damage Numbers
  private rawDamageNumbers: {
    id: number;
    text: string;
    pos: THREE.Vector3;
    velY: number;
    velX: number;
    life: number;
    color: string;
    isCrit?: boolean;
    isBomb?: boolean;
  }[] = [];
  private damageNumberIdCounter: number = 0;
  private cachedProjectedDamageNumbers: DamageNumberItem[] = [];

  // Raycasting for touch / mouse input
  private raycaster = new THREE.Raycaster();
  private pointerVector = new THREE.Vector2();
  private flightPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -8);

  // Dynamic Weather System
  private currentWeather: WeatherType = 'Sunny';
  private targetWeather: WeatherType = 'Sunny';
  private weatherTransition: number = 1.0;
  private weatherTimer: number = 0;
  private weatherCycleInterval: number = 1000;
  private ambientLight!: THREE.AmbientLight;
  private sunLight!: THREE.DirectionalLight;
  private rainGroup: THREE.Group | null = null;
  private rainParticles: { mesh: THREE.Mesh; velY: number; velZ: number }[] = [];
  private lightningTimer: number = 0;

  constructor(container: HTMLElement, playerStats: PlayerStats, callbacks: EngineCallbacks) {
    this.container = container;
    this.playerStats = playerStats;
    this.callbacks = callbacks;
    this.currentPlaneType = playerStats.selectedPlane;
    this.currentWingmanType = playerStats.selectedWingman || 'hurricane';

    // 1. Scene setup with atmospheric WWII haze
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x182430, 0.011);

    // 2. Camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 400);
    this.camera.position.set(0, 38, 28);
    this.camera.lookAt(0, 0, -4);

    // 3. Renderer with antialiasing and soft shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.container.appendChild(this.renderer.domElement);

    // 4. Lighting
    this.ambientLight = new THREE.AmbientLight(0x7e94a8, 1.4);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xfff0d6, 2.0);
    this.sunLight.position.set(25, 60, 25);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.left = -32;
    this.sunLight.shadow.camera.right = 32;
    this.sunLight.shadow.camera.top = 35;
    this.sunLight.shadow.camera.bottom = -35;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 120;
    this.scene.add(this.sunLight);

    // Weather Rain Particle System
    this.buildRainSystem();

    // 5. Ocean Base
    const oceanGeo = new THREE.PlaneGeometry(180, 400);
    const oceanMat = new THREE.MeshStandardMaterial({
      color: 0x1a3a4d,
      roughness: 0.25,
      metalness: 0.6,
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, oceanMat);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.y = -0.6;
    this.oceanMesh.receiveShadow = true;
    this.scene.add(this.oceanMesh);

    // 6. Terrain Rolling Segments
    this.buildTerrain();

    // 7. Atmospheric Low Clouds
    this.buildClouds();

    // 8. Player Aircraft & Bomb Reticle
    this.playerMesh = createPlayerAircraft(this.currentPlaneType);
    this.playerMesh.position.set(0, 8, 14);
    this.scene.add(this.playerMesh);

    // Reticle
    const reticleGeo = new THREE.RingGeometry(1.4, 1.8, 24);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    this.bombReticle = new THREE.Mesh(reticleGeo, reticleMat);
    this.bombReticle.rotation.x = -Math.PI / 2;
    this.scene.add(this.bombReticle);

    // Wingman instantiation
    this.initWingman(this.currentWingmanType);

    this.initPlayerAttributes();
    this.bindEvents();
    this.renderer.render(this.scene, this.camera);
  }

  private initWingman(wType: WingmanType) {
    if (this.wingmanMesh) {
      this.scene.remove(this.wingmanMesh);
      this.wingmanMesh = null;
    }
    this.currentWingmanType = wType;
    this.wingmanMesh = createWingmanDrone(wType);
    this.wingmanMesh.position.set(this.playerMesh.position.x - 3.8, 7.6, this.playerMesh.position.z + 1.2);
    this.scene.add(this.wingmanMesh);
  }

  private initPlayerAttributes() {
    const { upgrades, selectedPlane } = this.playerStats;
    let baseHp = 100;
    let baseBombs = 3;
    let baseFireRate = 8;

    if (selectedPlane === 'lightning') {
      baseHp = 115;
      baseBombs = 4;
      baseFireRate = 7;
    } else if (selectedPlane === 'corsair') {
      baseHp = 140;
      baseBombs = 3;
      baseFireRate = 9;
    }

    this.playerMaxHp = baseHp + (upgrades.armor - 1) * 25;
    this.playerHp = this.playerMaxHp;
    this.playerMaxBombs = baseBombs + (upgrades.bombs - 1);
    this.playerBombs = this.playerMaxBombs;
    this.playerFireRate = Math.max(4, baseFireRate - Math.floor((upgrades.firepower - 1) * 0.8));
  }

  private buildTerrain() {
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x36482e,
      roughness: 0.85,
    });
    const beachMat = new THREE.MeshStandardMaterial({
      color: 0xd9b375,
      roughness: 0.9,
    });
    const roadMat = new THREE.MeshBasicMaterial({ color: 0x27272a });

    for (let i = 0; i < 5; i++) {
      const seg = new THREE.Group();

      const island = new THREE.Mesh(new THREE.BoxGeometry(48, 1.2, 70), groundMat);
      island.position.y = -0.1;
      island.receiveShadow = true;
      seg.add(island);

      [-25, 25].forEach(x => {
        const beach = new THREE.Mesh(new THREE.BoxGeometry(4, 0.8, 70), beachMat);
        beach.position.set(x, -0.3, 0);
        beach.receiveShadow = true;
        seg.add(beach);
      });

      const runway = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 70), roadMat);
      runway.rotation.x = -Math.PI / 2;
      runway.position.set(0, 0.52, 0);
      runway.receiveShadow = true;
      seg.add(runway);

      for (let rz = -30; rz <= 30; rz += 8) {
        const mark = new THREE.Mesh(
          new THREE.PlaneGeometry(0.8, 4),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        mark.rotation.x = -Math.PI / 2;
        mark.position.set(0, 0.53, rz);
        seg.add(mark);
      }

      for (let t = 0; t < 6; t++) {
        const treeX = (Math.random() > 0.5 ? 1 : -1) * (9 + Math.random() * 12);
        const treeZ = (Math.random() - 0.5) * 50;
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.3, 2, 5),
          new THREE.MeshStandardMaterial({ color: 0x5a3d28 })
        );
        trunk.position.set(treeX, 1.2, treeZ);
        const foliage = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 2.8, 5),
          new THREE.MeshStandardMaterial({ color: 0x22421f })
        );
        foliage.position.set(treeX, 2.8, treeZ);
        foliage.castShadow = true;
        seg.add(trunk, foliage);
      }

      seg.position.set(0, 0, -70 * i);
      this.scene.add(seg);
      this.terrainTiles.push(seg);
    }
  }

  private buildClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      transparent: true,
      opacity: 0.65,
    });

    for (let i = 0; i < 7; i++) {
      const cloud = new THREE.Mesh(new THREE.SphereGeometry(4 + Math.random() * 4, 7, 7), cloudMat);
      cloud.scale.set(1.8, 0.4, 1.2);
      cloud.position.set(
        (Math.random() - 0.5) * 60,
        3.5 + Math.random() * 2,
        -120 + i * 40
      );
      this.scene.add(cloud);
      this.clouds.push(cloud);
    }
  }

  private buildRainSystem() {
    this.rainGroup = new THREE.Group();
    const rainGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.5, 4);
    const rainMat = new THREE.MeshBasicMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.5,
    });

    for (let i = 0; i < 240; i++) {
      const mesh = new THREE.Mesh(rainGeo, rainMat);
      mesh.position.set(
        (Math.random() - 0.5) * 60,
        Math.random() * 30 + 5,
        (Math.random() - 0.5) * 70
      );
      mesh.rotation.x = Math.PI / 7;
      this.rainGroup.add(mesh);
      this.rainParticles.push({
        mesh,
        velY: 1.8 + Math.random() * 0.9,
        velZ: 0.7 + Math.random() * 0.5,
      });
    }

    this.rainGroup.visible = false;
    this.scene.add(this.rainGroup);
  }

  private updateWeather() {
    this.weatherTimer++;

    // Randomly cycle weather every 900 ~ 1500 frames (~15-25 seconds)
    if (this.weatherTimer >= this.weatherCycleInterval) {
      this.weatherTimer = 0;
      this.weatherCycleInterval = 900 + Math.floor(Math.random() * 600);

      const weathers: WeatherType[] = ['Sunny', 'Rainstorm', 'Dense Fog'];
      const candidates = weathers.filter(w => w !== this.currentWeather);
      this.targetWeather = candidates[Math.floor(Math.random() * candidates.length)];
      this.weatherTransition = 0;
    }

    if (this.weatherTransition < 1.0) {
      this.weatherTransition = Math.min(1.0, this.weatherTransition + 0.015);
      if (this.weatherTransition >= 1.0) {
        this.currentWeather = this.targetWeather;
        this.notifyStats();
      }
    }

    // Target atmospheric & lighting parameters
    let targetFogColor = new THREE.Color(0x182430);
    let targetFogDensity = 0.011;
    let targetAmbientColor = new THREE.Color(0x7e94a8);
    let targetAmbientIntensity = 1.4;
    let targetSunColor = new THREE.Color(0xfff0d6);
    let targetSunIntensity = 2.0;
    let targetExposure = 1.15;
    const isRaining = this.currentWeather === 'Rainstorm' || this.targetWeather === 'Rainstorm';

    if (this.targetWeather === 'Rainstorm') {
      targetFogColor = new THREE.Color(0x0a1017);
      targetFogDensity = 0.024;
      targetAmbientColor = new THREE.Color(0x3e4e5e);
      targetAmbientIntensity = 0.85;
      targetSunColor = new THREE.Color(0x5a6d80);
      targetSunIntensity = 0.65;
      targetExposure = 0.95;
    } else if (this.targetWeather === 'Dense Fog') {
      targetFogColor = new THREE.Color(0x283540);
      targetFogDensity = 0.038;
      targetAmbientColor = new THREE.Color(0x708596);
      targetAmbientIntensity = 1.7;
      targetSunColor = new THREE.Color(0xdf9b50);
      targetSunIntensity = 0.85;
      targetExposure = 1.25;
    }

    // Smoothly interpolate Fog
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.lerp(targetFogColor, 0.035);
      this.scene.fog.density = THREE.MathUtils.lerp(this.scene.fog.density, targetFogDensity, 0.035);
    }

    // Smoothly interpolate Lighting
    this.ambientLight.color.lerp(targetAmbientColor, 0.035);
    this.ambientLight.intensity = THREE.MathUtils.lerp(
      this.ambientLight.intensity,
      targetAmbientIntensity,
      0.035
    );
    this.sunLight.color.lerp(targetSunColor, 0.035);
    this.sunLight.intensity = THREE.MathUtils.lerp(this.sunLight.intensity, targetSunIntensity, 0.035);
    this.renderer.toneMappingExposure = THREE.MathUtils.lerp(
      this.renderer.toneMappingExposure,
      targetExposure,
      0.035
    );

    // Update Rain Particles & Lightning
    if (this.rainGroup) {
      this.rainGroup.visible = isRaining;
      if (isRaining) {
        for (const p of this.rainParticles) {
          p.mesh.position.y -= p.velY;
          p.mesh.position.z += p.velZ;
          if (p.mesh.position.y < 0.2) {
            p.mesh.position.y = 26 + Math.random() * 6;
            p.mesh.position.x = this.playerMesh.position.x + (Math.random() - 0.5) * 55;
            p.mesh.position.z = this.playerMesh.position.z - 35 + Math.random() * 65;
          }
        }

        // Random Lightning Flash during Rainstorm
        if (Math.random() < 0.007 && this.lightningTimer <= 0) {
          this.lightningTimer = 5;
          this.cameraShake = 0.35;
        }

        if (this.lightningTimer > 0) {
          this.lightningTimer--;
          this.sunLight.intensity = 3.8;
          this.ambientLight.intensity = 2.5;
        }
      }
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousemove', this.handleMouseMove);
    dom.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    dom.addEventListener('contextmenu', this.handleContextMenu);
  }

  private unbindEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    const dom = this.renderer.domElement;
    dom.removeEventListener('mousemove', this.handleMouseMove);
    dom.removeEventListener('touchmove', this.handleTouchMove);
    dom.removeEventListener('contextmenu', this.handleContextMenu);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
    if (e.code === 'Space') {
      e.preventDefault();
      this.dropBomb();
    }
    if (e.code === 'KeyP') {
      this.togglePause();
    }
    if (e.code === 'KeyT') {
      this.toggleWingmanTactics();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    this.dropBomb();
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (!this.isRunning || this.isPaused) return;
    const rect = this.container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.pointerVector.set(x, y);
    this.raycaster.setFromCamera(this.pointerVector, this.camera);
    const hit = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.flightPlane, hit);
    if (hit) {
      this.targetX = Math.max(-19, Math.min(19, hit.x));
      this.targetZ = Math.max(-2, Math.min(22, hit.z));
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isRunning || this.isPaused || e.touches.length === 0) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = this.container.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

    this.pointerVector.set(x, y);
    this.raycaster.setFromCamera(this.pointerVector, this.camera);
    const hit = new THREE.Vector3();
    this.raycaster.ray.intersectPlane(this.flightPlane, hit);
    if (hit) {
      this.targetX = Math.max(-19, Math.min(19, hit.x));
      this.targetZ = Math.max(-2, Math.min(22, hit.z));
    }
  };

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Start with chosen plane, mission, and wingman
  public start(
    planeType: PlaneModelType,
    mission: MissionConfig = CAMPAIGN_MISSIONS[0],
    wingmanType: WingmanType = 'hurricane'
  ) {
    this.currentPlaneType = planeType;
    this.currentMission = mission;
    this.currentWingmanType = wingmanType;

    sound.init();
    sound.startEngine();

    // Rebuild player aircraft
    this.scene.remove(this.playerMesh);
    this.playerMesh = createPlayerAircraft(planeType);
    this.playerMesh.position.set(0, 8, 14);
    this.scene.add(this.playerMesh);

    // Rebuild wingman
    this.initWingman(wingmanType);

    // Reset state & objectives
    this.score = 0;
    this.gold = 0;
    this.combo = 1;
    this.comboTimer = 0;
    this.comboCounter = 0;
    this.maxComboReached = 1;
    this.airKillsCount = 0;
    this.groundDestroyedCount = 0;
    this.bossesDefeated = 0;
    this.bossDefeatedFlag = false;
    this.friendlyHp = 100;
    this.bombsUsed = 0;
    this.bombHits = 0;
    this.furyTimer = 0;
    this.cameraShake = 0;
    this.frame = 0;
    this.targetX = 0;
    this.targetZ = 14;
    this.currentBoss = null;
    this.missionCompletedTriggered = false;
    this.bossSpawnScoreThreshold = 1800;

    this.initPlayerAttributes();
    this.clearAllEntities();

    this.isRunning = true;
    this.isPaused = false;

    if (!this.animFrameId) {
      this.loop();
    }

    this.notifyStats();
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      sound.stopEngine();
    } else {
      sound.startEngine();
    }
    return this.isPaused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  public toggleWingmanTactics(): WingmanTactics {
    sound.init();
    sound.playTacticsChime();
    if (this.wingmanTactics === 'auto') {
      this.wingmanTactics = 'focus';
    } else if (this.wingmanTactics === 'focus') {
      this.wingmanTactics = 'defense';
    } else {
      this.wingmanTactics = 'auto';
    }
    this.notifyStats();
    return this.wingmanTactics;
  }

  public dropBomb() {
    if (!this.isRunning || this.isPaused || this.playerBombs <= 0) return;
    this.playerBombs--;
    this.bombsUsed++;
    sound.playBombDrop();
    this.notifyStats();

    // Spawn 3D Heavy Bomb mesh
    const bombGeo = new THREE.CylinderGeometry(0.45, 0.45, 1.8, 8);
    const bombMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.3,
      metalness: 0.7,
    });
    const bombMesh = new THREE.Mesh(bombGeo, bombMat);
    bombMesh.rotation.x = Math.PI / 2.3;
    bombMesh.position.copy(this.playerMesh.position);

    const velocity = new THREE.Vector3(0, -0.22, -0.45);
    this.scene.add(bombMesh);
    this.bombs.push({ mesh: bombMesh, velocity });

    // Wingman support: If Mosquito Bomber, drop synchronized auxiliary bomb!
    if (this.currentWingmanType === 'mosquito' && this.wingmanMesh) {
      const miniGeo = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 6);
      const miniMat = new THREE.MeshStandardMaterial({ color: 0x374151 });
      const miniMesh = new THREE.Mesh(miniGeo, miniMat);
      miniMesh.rotation.x = Math.PI / 2.3;
      miniMesh.position.copy(this.wingmanMesh.position);
      const miniVel = new THREE.Vector3(0.08, -0.25, -0.42);
      this.scene.add(miniMesh);
      this.bombs.push({ mesh: miniMesh, velocity: miniVel, isMini: true });
    }
  }

  private clearAllEntities() {
    this.playerBullets.forEach(b => this.scene.remove(b.mesh));
    this.playerBullets = [];

    this.wingmanBullets.forEach(b => this.scene.remove(b.mesh));
    this.wingmanBullets = [];

    this.enemyBullets.forEach(b => this.scene.remove(b.mesh));
    this.enemyBullets = [];

    this.torpedoRockets.forEach(t => this.scene.remove(t.mesh));
    this.torpedoRockets = [];

    this.enemies.forEach(e => this.scene.remove(e));
    this.enemies = [];

    this.groundTargets.forEach(gt => this.scene.remove(gt));
    this.groundTargets = [];

    this.bombs.forEach(b => this.scene.remove(b.mesh));
    this.bombs = [];

    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    this.powerups.forEach(pw => this.scene.remove(pw.mesh));
    this.powerups = [];

    this.rawDamageNumbers = [];
    this.cachedProjectedDamageNumbers = [];

    if (this.currentBoss) {
      this.scene.remove(this.currentBoss);
      this.currentBoss = null;
    }
  }

  private loop = () => {
    this.animFrameId = requestAnimationFrame(this.loop);

    // Propellers animation
    if (this.playerMesh.propellers) {
      this.playerMesh.propellers.forEach(p => (p.rotation.z += 0.8));
    }
    if (this.wingmanMesh && this.wingmanMesh.propellers) {
      this.wingmanMesh.propellers.forEach(p => (p.rotation.z += 0.8));
    }

    // Camera Shake Decay
    if (this.cameraShake > 0) {
      this.camera.position.x = (Math.random() - 0.5) * this.cameraShake;
      this.camera.position.y = 38 + (Math.random() - 0.5) * this.cameraShake;
      this.cameraShake *= 0.88;
      if (this.cameraShake < 0.02) this.cameraShake = 0;
    }

    if (!this.isRunning || this.isPaused) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    this.frame++;

    // 1. Process Keyboard movement
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) this.targetX -= 0.6;
    if (this.keys['ArrowRight'] || this.keys['KeyD']) this.targetX += 0.6;
    if (this.keys['ArrowUp'] || this.keys['KeyW']) this.targetZ -= 0.6;
    if (this.keys['ArrowDown'] || this.keys['KeyS']) this.targetZ += 0.6;
    this.targetX = Math.max(-19, Math.min(19, this.targetX));
    this.targetZ = Math.max(-2, Math.min(22, this.targetZ));

    // 2. Player Interpolation & Banking Maneuver
    const deltaX = this.targetX - this.playerMesh.position.x;
    const deltaZ = this.targetZ - this.playerMesh.position.z;
    this.playerMesh.position.x += deltaX * 0.14;
    this.playerMesh.position.z += deltaZ * 0.14;

    this.playerMesh.rotation.z = -deltaX * 0.22;
    this.playerMesh.rotation.x = deltaZ * 0.12;

    // 3. Wingman Support Logic & Kinematics
    this.updateWingmanKinematics();

    sound.updateEnginePitch(Math.abs(deltaX) + Math.abs(deltaZ));

    // 4. Ground Reticle
    this.bombReticle.position.set(this.playerMesh.position.x, 0.12, this.playerMesh.position.z - 8.5);
    this.bombReticle.rotation.z += 0.02;

    // 5. Player Auto-Fire Guns
    const fireInterval = this.furyTimer > 0 ? Math.floor(this.playerFireRate / 2) : this.playerFireRate;
    if (this.frame % fireInterval === 0) {
      this.firePlayerGuns();
    }

    // 6. Environmental Scroll
    const scrollSpeed = 0.28;
    this.terrainTiles.forEach(tile => {
      tile.position.z += scrollSpeed;
      if (tile.position.z > 70) {
        tile.position.z -= 350;
      }
    });

    this.clouds.forEach(cloud => {
      cloud.position.z += scrollSpeed * 1.5;
      if (cloud.position.z > 50) {
        cloud.position.z = -140;
        cloud.position.x = (Math.random() - 0.5) * 60;
      }
    });

    // 7. Spawn Enemy Formations & Ground Bases
    if (this.frame % 70 === 0) {
      this.spawnTacticalEnemy();
    }
    if (this.frame % 105 === 0) {
      this.spawnGroundBase();
    }

    // Check Boss Spawning
    if (!this.currentBoss && !this.bossDefeatedFlag && this.score >= this.bossSpawnScoreThreshold) {
      this.spawnMissionBoss();
    }

    // 8. Update Entities
    this.updatePlayerBullets();
    this.updateWingmanBullets();
    this.updateBombs();
    this.updateEnemies();
    this.updateGroundTargets();
    this.updateEnemyBullets();
    this.updateTorpedoRockets();
    this.updateBoss();
    this.updatePowerups();
    this.updateParticles();
    this.updateWeather();

    // 9. Check Mission Objectives Completion
    this.checkMissionObjectives();

    // 10. Timers & Combos
    if (this.comboCounter > 0) {
      this.comboCounter--;
      this.comboTimer = this.comboCounter / this.comboDuration;
      if (this.comboCounter <= 0) {
        this.combo = 1;
        this.notifyStats();
      }
    }

    if (this.furyTimer > 0) {
      this.furyTimer--;
      if (this.furyTimer % 30 === 0) {
        this.notifyStats();
      }
    }

    if (this.frame % 720 === 0 && this.playerBombs < this.playerMaxBombs) {
      this.playerBombs++;
      this.notifyStats();
    }

    // 11. Update and project Floating Damage Numbers
    const projectedDamageNumbers: DamageNumberItem[] = [];
    const containerW = this.container.clientWidth;
    const containerH = this.container.clientHeight;

    for (let i = this.rawDamageNumbers.length - 1; i >= 0; i--) {
      const dn = this.rawDamageNumbers[i];
      dn.pos.y += dn.velY;
      dn.pos.x += dn.velX;
      dn.life -= 0.032;

      if (dn.life <= 0) {
        this.rawDamageNumbers.splice(i, 1);
        continue;
      }

      const proj = dn.pos.clone().project(this.camera);
      if (proj.z < 1) {
        const sx = (proj.x * 0.5 + 0.5) * containerW;
        const sy = (-(proj.y * 0.5) + 0.5) * containerH;
        projectedDamageNumbers.push({
          id: dn.id,
          text: dn.text,
          x: Math.round(sx),
          y: Math.round(sy),
          color: dn.color,
          isCrit: dn.isCrit,
          isBomb: dn.isBomb,
          opacity: Math.max(0, dn.life),
        });
      }
    }
    this.cachedProjectedDamageNumbers = projectedDamageNumbers;

    if (this.cachedProjectedDamageNumbers.length > 0 || this.frame % 15 === 0) {
      this.notifyStats();
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updateWingmanKinematics() {
    if (!this.wingmanMesh) return;

    let targetWingmanX = this.playerMesh.position.x - 3.8;
    let targetWingmanZ = this.playerMesh.position.z + 1.2;

    if (this.wingmanTactics === 'focus') {
      targetWingmanX = this.playerMesh.position.x - 2.2;
      targetWingmanZ = this.playerMesh.position.z - 1.5;
    } else if (this.wingmanTactics === 'defense') {
      // Orbit shield pattern
      const angle = this.frame * 0.08;
      targetWingmanX = this.playerMesh.position.x + Math.cos(angle) * 3.4;
      targetWingmanZ = this.playerMesh.position.z + Math.sin(angle) * 3.4;
    }

    this.wingmanMesh.position.x += (targetWingmanX - this.wingmanMesh.position.x) * 0.15;
    this.wingmanMesh.position.z += (targetWingmanZ - this.wingmanMesh.position.z) * 0.15;
    this.wingmanMesh.rotation.copy(this.playerMesh.rotation);

    // Wingman Autonomous Attack Behaviors:
    if (this.currentWingmanType === 'hurricane') {
      // Hurricane Gunner: Shoots nearest enemy aircraft
      if (this.frame % 12 === 0 && this.enemies.length > 0) {
        let nearestEnemy = this.enemies[0];
        let minDist = 999;
        this.enemies.forEach(en => {
          const d = this.wingmanMesh!.position.distanceTo(en.position);
          if (d < minDist) {
            minDist = d;
            nearestEnemy = en;
          }
        });

        if (minDist < 45) {
          this.fireWingmanGun(nearestEnemy.position);
        }
      }
    } else if (this.currentWingmanType === 'mosquito') {
      // Mosquito Bomber: Drops mini bombs on ground facilities every 220 frames (~3.6 sec)
      if (this.frame % 220 === 0 && this.groundTargets.length > 0) {
        const miniGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.9, 6);
        const miniMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const miniMesh = new THREE.Mesh(miniGeo, miniMat);
        miniMesh.rotation.x = Math.PI / 2.3;
        miniMesh.position.copy(this.wingmanMesh.position);
        const velocity = new THREE.Vector3(0, -0.22, -0.38);
        this.scene.add(miniMesh);
        this.bombs.push({ mesh: miniMesh, velocity, isMini: true });
        sound.playBombDrop();
      }
    } else if (this.currentWingmanType === 'tempest') {
      // Tempest Interceptor: Intercepts nearby enemy bullets and flak shells!
      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const eb = this.enemyBullets[i];
        if (eb.mesh.position.distanceTo(this.wingmanMesh.position) < 5.0) {
          this.createHitSparks(eb.mesh.position.x, eb.mesh.position.y, eb.mesh.position.z);
          sound.playHit();
          this.scene.remove(eb.mesh);
          this.enemyBullets.splice(i, 1);
          break;
        }
      }
    }
  }

  private fireWingmanGun(targetPos: THREE.Vector3) {
    if (!this.wingmanMesh) return;
    const geo = new THREE.BoxGeometry(0.12, 0.12, 1.4);
    const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const b = new THREE.Mesh(geo, mat);
    b.position.copy(this.wingmanMesh.position);
    b.position.z -= 1.4;

    this.scene.add(b);
    this.wingmanBullets.push({ mesh: b, damage: 16 });
  }

  private spawnDamageNumber(
    x: number,
    y: number,
    z: number,
    amount: number,
    type: 'bullet' | 'crit' | 'wingman' | 'bomb'
  ) {
    let color = '#facc15';
    let isCrit = false;
    let isBomb = false;
    let text = `${Math.round(amount)}`;

    if (type === 'crit') {
      color = '#ef4444';
      isCrit = true;
      text = `CRIT ${Math.round(amount)}!`;
    } else if (type === 'wingman') {
      color = '#38bdf8';
      text = `${Math.round(amount)}`;
    } else if (type === 'bomb') {
      color = '#f97316';
      isBomb = true;
      text = `💥 ${Math.round(amount)}!`;
    }

    this.rawDamageNumbers.push({
      id: ++this.damageNumberIdCounter,
      text,
      pos: new THREE.Vector3(x + (Math.random() - 0.5) * 0.8, y + 1.2, z),
      velY: 0.08 + Math.random() * 0.03,
      velX: (Math.random() - 0.5) * 0.04,
      life: 1.0,
      color,
      isCrit,
      isBomb,
    });

    if (this.rawDamageNumbers.length > 25) {
      this.rawDamageNumbers.shift();
    }
  }

  private updateWingmanBullets() {
    for (let i = this.wingmanBullets.length - 1; i >= 0; i--) {
      const b = this.wingmanBullets[i];
      b.mesh.position.z -= 1.8;

      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const en = this.enemies[j];
        if (b.mesh.position.distanceTo(en.position) < 2.5) {
          en.hp -= b.damage;
          sound.playHit();
          this.createHitSparks(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);
          this.spawnDamageNumber(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, b.damage, 'wingman');
          hit = true;

          if (en.hp <= 0) {
            this.createExplosion(en.position.x, en.position.y, en.position.z, 26, false);
            this.scene.remove(en);
            this.enemies.splice(j, 1);
            this.handleKill(en.scoreVal, false);
          }
          break;
        }
      }

      if (!hit) {
        for (let k = this.groundTargets.length - 1; k >= 0; k--) {
          const gt = this.groundTargets[k];
          const dist2D = new THREE.Vector2(
            b.mesh.position.x - gt.position.x,
            b.mesh.position.z - gt.position.z
          ).length();

          if (dist2D < 2.5 && b.mesh.position.z > -65 && b.mesh.position.z < 25) {
            gt.hp -= b.damage;
            sound.playHit();
            this.createHitSparks(b.mesh.position.x, 1.4, b.mesh.position.z);
            this.spawnDamageNumber(gt.position.x, 2.0, gt.position.z, b.damage, 'wingman');
            hit = true;

            if (gt.hp <= 0) {
              this.createExplosion(gt.position.x, 1.2, gt.position.z, 30, true);
              this.scene.remove(gt);
              this.groundTargets.splice(k, 1);
              this.handleKill(gt.scoreVal, true);
            }
            break;
          }
        }
      }

      if (hit || b.mesh.position.z < -65) {
        this.scene.remove(b.mesh);
        this.wingmanBullets.splice(i, 1);
      }
    }
  }

  private firePlayerGuns() {
    const isFury = this.furyTimer > 0;
    const upgradeLevel = this.playerStats.upgrades.firepower;
    sound.playShoot(isFury || upgradeLevel >= 3);

    const bulletGeo = new THREE.BoxGeometry(0.14, 0.14, 1.8);
    const bulletMat = new THREE.MeshBasicMaterial({
      color: isFury ? 0xf59e0b : 0xffe600,
    });

    const createBullet = (offsetX: number, angleX = 0) => {
      const b = new THREE.Mesh(bulletGeo, bulletMat);
      b.position.copy(this.playerMesh.position);
      b.position.x += offsetX;
      b.position.z -= 1.6;
      b.rotation.y = angleX;
      this.scene.add(b);
      this.playerBullets.push({
        mesh: b,
        isHeavy: isFury || upgradeLevel >= 3,
        damage: (16 + upgradeLevel * 6) * (isFury ? 1.5 : 1),
      });
    };

    createBullet(-1.4);
    createBullet(1.4);

    if (upgradeLevel >= 2) {
      createBullet(-2.6, 0.05);
      createBullet(2.6, -0.05);
    }
    if (upgradeLevel >= 4) {
      createBullet(-3.8, 0.1);
      createBullet(3.8, -0.1);
    }
  }

  // Diverse Enemy Spawning based on Mission
  private spawnTacticalEnemy() {
    const pool: EnemyAircraftType[] = ['scout', 'scout', 'stuka'];

    if (this.currentMission.id === 'mission_2') {
      pool.push('torpedo', 'jet', 'stuka');
    } else if (this.currentMission.id === 'mission_3') {
      pool.push('jet', 'jet', 'stuka', 'heavy');
    }

    const chosenType = pool[Math.floor(Math.random() * pool.length)];
    const enemy = createEnemyAircraft(chosenType) as AircraftMeshGroup & {
      enemyType: EnemyAircraftType;
      hp: number;
      maxHp: number;
      speed: number;
      fireCooldown: number;
      scoreVal: number;
      oscOffset: number;
      isDiving?: boolean;
    };
    enemy.enemyType = chosenType;
    enemy.oscOffset = Math.random() * Math.PI * 2;

    if (chosenType === 'scout') {
      enemy.hp = 35;
      enemy.maxHp = 35;
      enemy.speed = 0.28 + Math.random() * 0.12;
      enemy.fireCooldown = 40 + Math.random() * 40;
      enemy.scoreVal = 180;
    } else if (chosenType === 'stuka') {
      enemy.hp = 65;
      enemy.maxHp = 65;
      enemy.speed = 0.22;
      enemy.fireCooldown = 90;
      enemy.scoreVal = 320;
      enemy.isDiving = false;
    } else if (chosenType === 'torpedo') {
      enemy.hp = 110;
      enemy.maxHp = 110;
      enemy.speed = 0.18;
      enemy.fireCooldown = 80;
      enemy.scoreVal = 500;
    } else if (chosenType === 'jet') {
      enemy.hp = 85;
      enemy.maxHp = 85;
      enemy.speed = 0.48; // Ultra fast
      enemy.fireCooldown = 35;
      enemy.scoreVal = 600;
      sound.playJetRoar();
    } else {
      enemy.hp = 170;
      enemy.maxHp = 170;
      enemy.speed = 0.14;
      enemy.fireCooldown = 45;
      enemy.scoreVal = 750;
    }

    enemy.position.set((Math.random() - 0.5) * 32, 8, -55);
    this.scene.add(enemy);
    this.enemies.push(enemy);
  }

  private spawnGroundBase() {
    const types: ('factory' | 'flak' | 'refinery' | 'warship')[] = [
      'factory',
      'flak',
      'refinery',
      'warship',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const target = createGroundStructure(type);

    target.position.set((Math.random() - 0.5) * 28, 0, -65);
    this.scene.add(target);
    this.groundTargets.push(target);
  }

  private spawnMissionBoss() {
    sound.playAirRaidSiren();
    this.cameraShake = 1.4;

    if (this.currentMission.id === 'mission_3') {
      // Zeppelin Boss
      const boss = createZeppelinBoss() as unknown as NonNullable<GameEngine['currentBoss']>;
      boss.position.set(0, 0, -75);
      boss.moveDir = 1;
      boss.fireTimer = 70;
      boss.bossName = this.currentMission.bossName;
      this.scene.add(boss);
      this.currentBoss = boss;
    } else {
      // Land Titan Boss
      const boss = createLandTitanBoss() as unknown as NonNullable<GameEngine['currentBoss']>;
      boss.position.set(0, 0, -75);
      boss.moveDir = 1;
      boss.fireTimer = 80;
      boss.bossName = this.currentMission.bossName;
      this.scene.add(boss);
      this.currentBoss = boss;
    }

    this.notifyStats();
  }

  private updatePlayerBullets() {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.mesh.position.z -= 1.8;
      if (b.mesh.rotation.y !== 0) {
        b.mesh.position.x += Math.sin(b.mesh.rotation.y) * 1.8;
      }

      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const en = this.enemies[j];
        if (b.mesh.position.distanceTo(en.position) < 2.6) {
          en.hp -= b.damage;
          sound.playHit();
          this.createHitSparks(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);
          this.spawnDamageNumber(
            b.mesh.position.x,
            b.mesh.position.y,
            b.mesh.position.z,
            b.damage,
            b.isHeavy ? 'crit' : 'bullet'
          );
          hit = true;

          if (en.hp <= 0) {
            this.createExplosion(en.position.x, en.position.y, en.position.z, 28, false);
            this.scene.remove(en);
            this.enemies.splice(j, 1);
            this.handleKill(en.scoreVal, false);

            if (Math.random() < 0.28) {
              this.spawnPowerup(en.position.x, en.position.y, en.position.z);
            }
          }
          break;
        }
      }

      if (!hit && this.currentBoss) {
        if (b.mesh.position.distanceTo(this.currentBoss.position) < 16) {
          const bossDmg = b.damage * 0.4;
          this.currentBoss.hp -= bossDmg;
          sound.playHit();
          this.createHitSparks(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);
          this.spawnDamageNumber(
            b.mesh.position.x,
            b.mesh.position.y,
            b.mesh.position.z,
            bossDmg,
            b.isHeavy ? 'crit' : 'bullet'
          );
          hit = true;
          this.checkBossHp();
        }
      }

      // Strafe ground structures with gunfire
      if (!hit) {
        for (let k = this.groundTargets.length - 1; k >= 0; k--) {
          const gt = this.groundTargets[k];
          const dist2D = new THREE.Vector2(
            b.mesh.position.x - gt.position.x,
            b.mesh.position.z - gt.position.z
          ).length();

          if (dist2D < 2.8 && b.mesh.position.z > -65 && b.mesh.position.z < 25) {
            const strafeDamage = Math.round(b.damage * 0.75);
            gt.hp -= strafeDamage;
            sound.playHit();
            this.createHitSparks(b.mesh.position.x, 1.4, b.mesh.position.z);
            this.spawnDamageNumber(
              gt.position.x,
              2.0,
              gt.position.z,
              strafeDamage,
              b.isHeavy ? 'crit' : 'bullet'
            );
            hit = true;

            if (gt.hp <= 0) {
              this.createExplosion(gt.position.x, 1.2, gt.position.z, 36, true);
              this.scene.remove(gt);
              this.groundTargets.splice(k, 1);
              this.handleKill(gt.scoreVal, true);
              this.gold += 35;
              if (Math.random() < 0.35) {
                this.spawnPowerup(gt.position.x, 3, gt.position.z);
              }
            }
            break;
          }
        }
      }

      if (hit || b.mesh.position.z < -65) {
        this.scene.remove(b.mesh);
        this.playerBullets.splice(i, 1);
      }
    }
  }

  private updateBombs() {
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.mesh.position.add(b.velocity);
      b.velocity.y -= 0.022;
      b.mesh.rotation.x += 0.04;

      if (b.mesh.position.y <= 0.2) {
        const blastRadius = b.isMini ? 6.0 : 9.5;
        this.createExplosion(b.mesh.position.x, 0.5, b.mesh.position.z, b.isMini ? 35 : 55, !b.isMini);
        let hitAnyTarget = false;

        for (let k = this.groundTargets.length - 1; k >= 0; k--) {
          const gt = this.groundTargets[k];
          const dist = new THREE.Vector2(
            b.mesh.position.x - gt.position.x,
            b.mesh.position.z - gt.position.z
          ).length();

          if (dist < blastRadius) {
            hitAnyTarget = true;
            const dmg = b.isMini ? 120 : 220;
            gt.hp -= dmg;
            this.spawnDamageNumber(gt.position.x, 2, gt.position.z, dmg, 'bomb');
            if (gt.hp <= 0) {
              this.createExplosion(gt.position.x, 1.2, gt.position.z, 40, true);
              this.scene.remove(gt);
              this.groundTargets.splice(k, 1);
              this.handleKill(gt.scoreVal, true);

              this.gold += 35;
              if (Math.random() < 0.4) {
                this.spawnPowerup(gt.position.x, 3, gt.position.z);
              }
            } else {
              this.createExplosion(gt.position.x, 1, gt.position.z, 20, false);
            }
          }
        }

        if (this.currentBoss) {
          const bossDist = new THREE.Vector2(
            b.mesh.position.x - this.currentBoss.position.x,
            b.mesh.position.z - this.currentBoss.position.z
          ).length();

          if (bossDist < 14.0) {
            hitAnyTarget = true;
            const bombDmg = b.isMini ? 250 : 500;
            this.currentBoss.hp -= bombDmg;
            this.spawnDamageNumber(this.currentBoss.position.x, 3.5, this.currentBoss.position.z, bombDmg, 'bomb');
            this.createExplosion(b.mesh.position.x, 2, b.mesh.position.z, 50, true);
            this.checkBossHp();
          }
        }

        if (hitAnyTarget && !b.isMini) {
          this.bombHits++;
        }

        this.scene.remove(b.mesh);
        this.bombs.splice(i, 1);
      }
    }
  }

  // Diverse Enemy AI Movement & Tactical Attacks
  private updateEnemies() {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const en = this.enemies[i];

      if (en.propellers) {
        en.propellers.forEach(p => (p.rotation.z += 0.8));
      }

      // Tactical Kinematics
      if (en.enemyType === 'scout') {
        // Snake lateral weave
        en.position.z += en.speed;
        en.position.x += Math.sin(this.frame * 0.06 + en.oscOffset) * 0.35;
        en.rotation.z = -Math.sin(this.frame * 0.06 + en.oscOffset) * 0.4;
      } else if (en.enemyType === 'stuka') {
        // High-altitude dive bomber
        if (!en.isDiving && en.position.z > -25) {
          en.isDiving = true;
          sound.playStukaSiren();
          en.rotation.x = -Math.PI / 3; // Steep dive angle
        }
        en.position.z += en.isDiving ? en.speed * 2.2 : en.speed;
        if (en.isDiving && en.position.z > this.playerMesh.position.z - 4 && en.fireCooldown <= 0) {
          // Release Stuka airburst cluster bomb
          this.dropStukaAirburst(en.position);
          en.fireCooldown = 150;
        }
      } else if (en.enemyType === 'torpedo') {
        // Ju-88 Torpedo Bomber
        en.position.z += en.speed;
        en.fireCooldown--;
        if (en.fireCooldown <= 0 && en.position.z < this.playerMesh.position.z - 4) {
          this.launchTorpedoRocket(en.position);
          en.fireCooldown = 110;
        }
      } else if (en.enemyType === 'jet') {
        // Me-262 Jet: High velocity straight pierce
        en.position.z += en.speed;
        en.fireCooldown--;
        if (en.fireCooldown <= 0 && en.position.z < this.playerMesh.position.z - 1) {
          this.fireEnemyBullet(en.position, 0.55);
          en.fireCooldown = 40;
        }
      } else {
        // Heavy Bomber He-111
        en.position.z += en.speed;
        en.fireCooldown--;
        if (en.fireCooldown <= 0) {
          this.fireEnemyBullet(en.position);
          en.fireCooldown = 75;
        }
      }

      // Ramming collision
      if (en.position.distanceTo(this.playerMesh.position) < 3.2) {
        this.takeDamage(35);
        this.createExplosion(en.position.x, en.position.y, en.position.z, 30, true);
        this.scene.remove(en);
        this.enemies.splice(i, 1);
        continue;
      }

      if (en.position.z > 36) {
        this.scene.remove(en);
        this.enemies.splice(i, 1);
      }
    }
  }

  private dropStukaAirburst(fromPos: THREE.Vector3) {
    this.createExplosion(fromPos.x, fromPos.y, fromPos.z, 20, false);
    // 3 Frag shells
    [-0.3, 0, 0.3].forEach(dirX => {
      const geo = new THREE.SphereGeometry(0.32, 6, 6);
      const mat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const b = new THREE.Mesh(geo, mat);
      b.position.copy(fromPos);
      const velocity = new THREE.Vector3(dirX, -0.05, 0.38);
      this.scene.add(b);
      this.enemyBullets.push({ mesh: b, velocity });
    });
  }

  private launchTorpedoRocket(fromPos: THREE.Vector3) {
    sound.playTorpedoLaunch();
    const torp = createTorpedoRocket();
    torp.position.copy(fromPos);
    torp.position.y -= 0.6;
    const velocity = new THREE.Vector3(0, 0, 0.42);
    this.scene.add(torp);
    this.torpedoRockets.push({ mesh: torp, velocity });
  }

  private updateTorpedoRockets() {
    for (let i = this.torpedoRockets.length - 1; i >= 0; i--) {
      const t = this.torpedoRockets[i];
      t.mesh.position.add(t.velocity);

      // Smoke trail particle
      if (this.frame % 3 === 0) {
        const p = new THREE.Mesh(
          new THREE.BoxGeometry(0.3, 0.3, 0.3),
          new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
        );
        p.position.copy(t.mesh.position);
        this.scene.add(p);
        this.particles.push({
          mesh: p,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, 0.05, 0.1),
          life: 0.8,
          decay: 0.05,
          gravity: 0,
        });
      }

      // Hit player
      if (t.mesh.position.distanceTo(this.playerMesh.position) < 2.4) {
        this.takeDamage(28);
        this.createExplosion(t.mesh.position.x, t.mesh.position.y, t.mesh.position.z, 25, true);
        this.scene.remove(t.mesh);
        this.torpedoRockets.splice(i, 1);
        continue;
      }

      if (t.mesh.position.z > 36) {
        this.scene.remove(t.mesh);
        this.torpedoRockets.splice(i, 1);
      }
    }
  }

  private updateGroundTargets() {
    const scrollSpeed = 0.28;
    for (let i = this.groundTargets.length - 1; i >= 0; i--) {
      const gt = this.groundTargets[i];
      gt.position.z += scrollSpeed;

      if (gt.turret && gt.targetType === 'flak') {
        gt.turret.lookAt(
          this.playerMesh.position.x,
          this.playerMesh.position.y,
          this.playerMesh.position.z
        );

        if (this.frame % 85 === 0 && gt.position.z < this.playerMesh.position.z + 15) {
          sound.playFlakBurst();
          this.fireEnemyBullet(new THREE.Vector3(gt.position.x, 2.2, gt.position.z));
        }
      }

      if (gt.position.z > 42) {
        this.scene.remove(gt);
        this.groundTargets.splice(i, 1);
      }
    }
  }

  private updateBoss() {
    if (!this.currentBoss) return;
    const boss = this.currentBoss;

    if (boss.position.z < -10) {
      boss.position.z += 0.08;
    } else {
      boss.position.x += 0.06 * boss.moveDir;
      if (boss.position.x > 8) boss.moveDir = -1;
      if (boss.position.x < -8) boss.moveDir = 1;
    }

    boss.turrets.forEach((turret, idx) => {
      turret.lookAt(
        this.playerMesh.position.x,
        this.playerMesh.position.y,
        this.playerMesh.position.z
      );
      if ((this.frame + idx * 25) % 85 === 0) {
        const muzzlePos = new THREE.Vector3();
        turret.getWorldPosition(muzzlePos);
        muzzlePos.y += 1.0;
        this.fireEnemyBullet(muzzlePos);
      }
    });

    if (boss.coreMesh) {
      const scale = 1 + Math.sin(this.frame * 0.1) * 0.1;
      boss.coreMesh.scale.set(scale, 1, scale);
    }
  }

  private checkBossHp() {
    if (!this.currentBoss) return;
    this.notifyStats();

    if (this.currentBoss.hp <= 0) {
      sound.playExplosion(true, true);
      this.cameraShake = 2.0;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          if (!this.currentBoss) return;
          this.createExplosion(
            this.currentBoss.position.x + (Math.random() - 0.5) * 14,
            2 + Math.random() * 4,
            this.currentBoss.position.z + (Math.random() - 0.5) * 16,
            45,
            true
          );
        }, i * 200);
      }

      setTimeout(() => {
        if (!this.currentBoss) return;
        this.scene.remove(this.currentBoss);
        this.currentBoss = null;
        this.bossesDefeated++;
        this.bossDefeatedFlag = true;
        this.handleKill(8000, true);
        this.gold += 350;
        sound.playVictory();
        this.notifyStats();
      }, 1400);
    }
  }

  private fireEnemyBullet(fromPos: THREE.Vector3, speed = 0.42) {
    sound.playEnemyShoot();
    const geo = new THREE.SphereGeometry(0.3, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const b = new THREE.Mesh(geo, mat);
    b.position.copy(fromPos);

    const dir = new THREE.Vector3().subVectors(this.playerMesh.position, fromPos).normalize();
    const velocity = dir.multiplyScalar(speed);

    this.scene.add(b);
    this.enemyBullets.push({ mesh: b, velocity });
  }

  private updateEnemyBullets() {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const eb = this.enemyBullets[i];
      eb.mesh.position.add(eb.velocity);

      // Hit player
      if (eb.mesh.position.distanceTo(this.playerMesh.position) < 1.9) {
        this.takeDamage(16);
        this.createHitSparks(eb.mesh.position.x, eb.mesh.position.y, eb.mesh.position.z);
        this.scene.remove(eb.mesh);
        this.enemyBullets.splice(i, 1);
        continue;
      }

      if (eb.mesh.position.z > 36 || eb.mesh.position.y < -1) {
        this.scene.remove(eb.mesh);
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  private spawnPowerup(x: number, y: number, z: number) {
    const types: ('weapon' | 'wingman' | 'bomb' | 'repair' | 'fury')[] = [
      'weapon',
      'bomb',
      'repair',
      'fury',
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const mesh = createPowerupMesh(type);
    mesh.position.set(x, y, z);
    this.scene.add(mesh);
    this.powerups.push({ mesh, type });
  }

  private updatePowerups() {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pw = this.powerups[i];
      pw.mesh.position.z += 0.22;
      pw.mesh.rotation.y += 0.03;

      if (pw.mesh.position.distanceTo(this.playerMesh.position) < 3.2) {
        sound.playPickup();
        this.applyPowerup(pw.type);
        this.scene.remove(pw.mesh);
        this.powerups.splice(i, 1);
        continue;
      }

      if (pw.mesh.position.z > 36) {
        this.scene.remove(pw.mesh);
        this.powerups.splice(i, 1);
      }
    }
  }

  private applyPowerup(type: 'weapon' | 'wingman' | 'bomb' | 'repair' | 'fury') {
    if (type === 'repair') {
      this.playerHp = Math.min(this.playerMaxHp, this.playerHp + 35);
    } else if (type === 'bomb') {
      this.playerBombs = Math.min(this.playerMaxBombs, this.playerBombs + 2);
    } else if (type === 'fury') {
      this.furyTimer = 480;
    } else if (type === 'weapon') {
      this.playerStats.upgrades.firepower = Math.min(5, this.playerStats.upgrades.firepower + 1);
      this.initPlayerAttributes();
    }
    this.gold += 15;
    this.notifyStats();
  }

  private handleKill(basePoints: number, isGround: boolean) {
    const earned = basePoints * this.combo;
    this.score += earned;
    this.gold += Math.floor(basePoints * 0.05);

    if (isGround) {
      this.groundDestroyedCount++;
    } else {
      this.airKillsCount++;
    }

    this.combo = Math.min(5, this.combo + 1);
    this.comboCounter = this.comboDuration;
    this.comboTimer = 1.0;
    if (this.combo > this.maxComboReached) {
      this.maxComboReached = this.combo;
    }

    this.notifyStats();
  }

  private takeDamage(amount: number) {
    // If Wingman is in defense mode, reduce incoming damage by 35%
    const finalDamage = this.wingmanTactics === 'defense' ? Math.round(amount * 0.65) : amount;
    this.playerHp = Math.max(0, this.playerHp - finalDamage);
    this.cameraShake = 0.9;
    sound.playExplosion(false, false);

    this.combo = 1;
    this.comboCounter = 0;
    this.notifyStats();

    if (this.playerHp <= 0) {
      this.handleGameOver();
    }
  }

  // Check if all primary mission objectives are satisfied
  private checkMissionObjectives() {
    if (this.missionCompletedTriggered) return;

    const airDone = this.airKillsCount >= this.currentMission.objectives.airKillsTarget;
    const groundDone = this.groundDestroyedCount >= this.currentMission.objectives.groundDestroyedTarget;
    const bossDone = !this.currentMission.objectives.bossTarget || this.bossDefeatedFlag;

    if (airDone && groundDone && bossDone) {
      this.missionCompletedTriggered = true;
      this.handleMissionVictory();
    }
  }

  private handleMissionVictory() {
    this.isRunning = false;
    sound.stopEngine();
    sound.playVictory();

    const bombAccuracy =
      this.bombsUsed > 0
        ? Math.min(100, Math.round((this.bombHits / this.bombsUsed) * 100))
        : 100;

    const missionStats: MissionStats = {
      score: this.score,
      airKills: this.airKillsCount,
      groundDestroyed: this.groundDestroyedCount,
      bossesDefeated: this.bossesDefeated,
      bombsUsed: this.bombsUsed,
      bombHits: this.bombHits,
      bombAccuracy,
      maxCombo: this.maxComboReached,
      goldEarned: this.gold + this.currentMission.rewardGold,
      isVictory: true,
    };

    setTimeout(() => {
      this.callbacks.onMissionVictory(missionStats);
    }, 1200);
  }

  private handleGameOver() {
    this.isRunning = false;
    sound.stopEngine();
    this.createExplosion(
      this.playerMesh.position.x,
      this.playerMesh.position.y,
      this.playerMesh.position.z,
      60,
      true
    );

    const bombAccuracy =
      this.bombsUsed > 0
        ? Math.min(100, Math.round((this.bombHits / this.bombsUsed) * 100))
        : 100;

    const missionStats: MissionStats = {
      score: this.score,
      airKills: this.airKillsCount,
      groundDestroyed: this.groundDestroyedCount,
      bossesDefeated: this.bossesDefeated,
      bombsUsed: this.bombsUsed,
      bombHits: this.bombHits,
      bombAccuracy,
      maxCombo: this.maxComboReached,
      goldEarned: this.gold,
      isVictory: false,
    };

    setTimeout(() => {
      this.callbacks.onGameOver(missionStats);
    }, 1000);
  }

  private createHitSparks(x: number, y: number, z: number) {
    for (let i = 0; i < 6; i++) {
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.2, 0.2),
        new THREE.MeshBasicMaterial({ color: 0xfff000 })
      );
      p.position.set(x, y, z);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6,
          (Math.random() - 0.5) * 0.6
        ),
        life: 1.0,
        decay: 0.08,
        gravity: 0,
      });
    }
  }

  private createExplosion(x: number, y: number, z: number, count = 30, isHuge = false) {
    sound.playExplosion(isHuge, y <= 1.0);
    this.cameraShake = isHuge ? 1.4 : 0.65;

    for (let i = 0; i < count; i++) {
      const size = (Math.random() * 0.5 + 0.2) * (isHuge ? 2.4 : 1.0);
      const isFire = Math.random() > 0.3;
      const p = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        new THREE.MeshBasicMaterial({
          color: isFire ? (Math.random() > 0.5 ? 0xef4444 : 0xf59e0b) : 0x27272a,
        })
      );
      p.position.set(x, y, z);
      this.scene.add(p);
      this.particles.push({
        mesh: p,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * (isHuge ? 1.4 : 0.8),
          (Math.random() * 0.8 + 0.2) * (isHuge ? 1.5 : 0.9),
          (Math.random() - 0.5) * (isHuge ? 1.4 : 0.8)
        ),
        life: 1.0,
        decay: Math.random() * 0.03 + 0.02,
        gravity: 0.02,
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.mesh.position.add(p.velocity);
      p.velocity.y -= p.gravity;
      p.life -= p.decay;
      p.mesh.scale.setScalar(p.life);

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private notifyStats() {
    let bossInfo: BossStatus | null = null;
    if (this.currentBoss) {
      bossInfo = {
        name: this.currentBoss.bossName,
        hp: Math.max(0, this.currentBoss.hp),
        maxHp: this.currentBoss.maxHp,
        active: true,
      };
    }

    const airTarget = this.currentMission.objectives.airKillsTarget;
    const groundTarget = this.currentMission.objectives.groundDestroyedTarget;
    const bossRequired = this.currentMission.objectives.bossTarget;

    const isAllCompleted =
      this.airKillsCount >= airTarget &&
      this.groundDestroyedCount >= groundTarget &&
      (!bossRequired || this.bossDefeatedFlag);

    const missionProgress: MissionProgressState = {
      airKills: this.airKillsCount,
      airKillsTarget: airTarget,
      groundDestroyed: this.groundDestroyedCount,
      groundDestroyedTarget: groundTarget,
      bossDefeated: this.bossDefeatedFlag,
      bossRequired: bossRequired,
      friendlyHp: this.friendlyHp,
      isAllCompleted,
    };

    this.callbacks.onStatsUpdate({
      score: this.score,
      hp: this.playerHp,
      maxHp: this.playerMaxHp,
      bombs: this.playerBombs,
      maxBombs: this.playerMaxBombs,
      combo: this.combo,
      comboTimer: this.comboTimer,
      boss: bossInfo,
      gold: this.gold,
      furyTimer: this.furyTimer,
      missionProgress,
      wingmanType: this.currentWingmanType,
      wingmanTactics: this.wingmanTactics,
      wingmanActive: !!this.wingmanMesh,
      damageNumbers: this.cachedProjectedDamageNumbers,
      weather: this.currentWeather,
    });
  }

  public dispose() {
    this.isRunning = false;
    sound.stopEngine();
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.unbindEvents();
    this.clearAllEntities();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
