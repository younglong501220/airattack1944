import * as THREE from 'three';
import { PlaneModelType, WingmanType, EnemyAircraftType } from './types';

// Shared materials cache for performance and memory optimization
const materials = {
  // British Spitfire Camo
  spitfireGreen: new THREE.MeshStandardMaterial({ color: 0x3d4f3b, roughness: 0.45, metalness: 0.2 }),
  spitfireGrey: new THREE.MeshStandardMaterial({ color: 0x47555e, roughness: 0.45, metalness: 0.25 }),
  spitfireYellow: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 }),
  roundelBlue: new THREE.MeshBasicMaterial({ color: 0x1d4ed8 }),
  roundelWhite: new THREE.MeshBasicMaterial({ color: 0xf8fafc }),
  roundelRed: new THREE.MeshBasicMaterial({ color: 0xb91c1c }),

  // P-38 Lightning Silver
  lightningMetal: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.65 }),
  lightningOlive: new THREE.MeshStandardMaterial({ color: 0x434c38, roughness: 0.5 }),

  // F4U Corsair Navy Blue
  corsairNavy: new THREE.MeshStandardMaterial({ color: 0x172554, roughness: 0.35, metalness: 0.4 }),
  corsairWhite: new THREE.MeshBasicMaterial({ color: 0xe2e8f0 }),

  // Wingmen Specific Materials
  hurricaneBrown: new THREE.MeshStandardMaterial({ color: 0x54432d, roughness: 0.5 }),
  mosquitoWood: new THREE.MeshStandardMaterial({ color: 0x5b6570, roughness: 0.35, metalness: 0.3 }),
  tempestTeal: new THREE.MeshStandardMaterial({ color: 0x2e4945, roughness: 0.4, metalness: 0.3 }),

  // Cockpit canopy glass
  canopyGlass: new THREE.MeshStandardMaterial({
    color: 0x7dd3fc,
    roughness: 0.1,
    metalness: 0.85,
    transparent: true,
    opacity: 0.85,
  }),

  // Propellers & Gun Barrels
  propellerBlack: new THREE.MeshBasicMaterial({ color: 0x0f172a }),
  propellerYellowTip: new THREE.MeshBasicMaterial({ color: 0xfacc15 }),
  gunMetal: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.2, metalness: 0.8 }),

  // Enemy Aircraft Materials
  enemyDarkGrey: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 }),
  enemyYellowNose: new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.35 }),
  enemyCamoGreen: new THREE.MeshStandardMaterial({ color: 0x3f4f3c, roughness: 0.5 }),
  enemyJetSteel: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.25, metalness: 0.6 }),
  enemyCrossBlack: new THREE.MeshBasicMaterial({ color: 0x09090b }),
  enemyCrossWhite: new THREE.MeshBasicMaterial({ color: 0xffffff }),
  jetExhaustGlow: new THREE.MeshBasicMaterial({ color: 0x06b6d4 }),

  // Ground Structures
  factoryBrick: new THREE.MeshStandardMaterial({ color: 0x7f2f25, roughness: 0.85 }),
  factoryRoof: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 }),
  chimneyBrick: new THREE.MeshStandardMaterial({ color: 0x58251e, roughness: 0.9 }),
  flakConcrete: new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.75, metalness: 0.1 }),
  oilTankSilver: new THREE.MeshStandardMaterial({ color: 0xa1a1aa, roughness: 0.35, metalness: 0.5 }),
  oilHazardOrange: new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.4 }),

  // Boss & Armor
  bossSteel: new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4, metalness: 0.7 }),
  bossZeppelinCloth: new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.6, metalness: 0.2 }),
  bossRedTrim: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.3 }),
  bossCoreGlow: new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.2,
  }),
};

export interface AircraftMeshGroup extends THREE.Group {
  propellers: THREE.Object3D[];
  turrets?: THREE.Object3D[];
  leftMuzzle?: THREE.Vector3;
  rightMuzzle?: THREE.Vector3;
}

// Helper: Create a spinning propeller with yellow blade tips
function createPropeller(size = 3.2): THREE.Group {
  const propGroup = new THREE.Group();
  const bladeMat = materials.propellerBlack;

  // Blade 1 & 2
  const blade1 = new THREE.Mesh(new THREE.BoxGeometry(size, 0.16, 0.04), bladeMat);
  propGroup.add(blade1);

  // Cross blade for 4-blade propeller
  const blade2 = new THREE.Mesh(new THREE.BoxGeometry(0.16, size, 0.04), bladeMat);
  propGroup.add(blade2);

  // Yellow tips
  const tipGeo = new THREE.BoxGeometry(0.5, 0.17, 0.05);
  const tip1 = new THREE.Mesh(tipGeo, materials.propellerYellowTip);
  tip1.position.x = size / 2 - 0.25;
  const tip2 = new THREE.Mesh(tipGeo, materials.propellerYellowTip);
  tip2.position.x = -(size / 2 - 0.25);
  propGroup.add(tip1, tip2);

  // Spinner cone in center
  const spinnerGeo = new THREE.ConeGeometry(0.35, 0.8, 8);
  const spinner = new THREE.Mesh(spinnerGeo, materials.gunMetal);
  spinner.rotation.x = Math.PI / 2;
  spinner.position.z = 0.2;
  propGroup.add(spinner);

  return propGroup;
}

// 1. SPITFIRE MK.IX MODEL
function createSpitfire(): AircraftMeshGroup {
  const plane = new THREE.Group() as AircraftMeshGroup;
  plane.propellers = [];

  // Fuselage: tapered aerodynamic cylinder
  const bodyGeo = new THREE.CylinderGeometry(0.68, 0.38, 7.0, 10);
  const body = new THREE.Mesh(bodyGeo, materials.spitfireGreen);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  plane.add(body);

  // Iconic Elliptical Wings
  const wingGroup = new THREE.Group();
  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.16, 2.4), materials.spitfireGreen);
  mainWing.position.z = 0.3;
  mainWing.castShadow = true;
  wingGroup.add(mainWing);

  // Yellow leading edge stripes
  const edgeStripe = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.17, 0.2), materials.spitfireYellow);
  edgeStripe.position.set(0, 0, -0.9);
  wingGroup.add(edgeStripe);

  // RAF Roundels on wings
  const createRoundel = (x: number) => {
    const roundel = new THREE.Group();
    const bCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.05, 16), materials.roundelBlue);
    const wCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16), materials.roundelWhite);
    const rCircle = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.07, 16), materials.roundelRed);
    roundel.add(bCircle, wCircle, rCircle);
    roundel.position.set(x, 0.1, 0.3);
    return roundel;
  };
  wingGroup.add(createRoundel(3.2));
  wingGroup.add(createRoundel(-3.2));

  // Wingtip fairings
  const tipGeo = new THREE.CylinderGeometry(1.2, 0.2, 0.14, 8);
  const leftTip = new THREE.Mesh(tipGeo, materials.spitfireGreen);
  leftTip.rotation.z = Math.PI / 2;
  leftTip.position.set(-4.8, 0, 0.3);
  const rightTip = leftTip.clone();
  rightTip.position.set(4.8, 0, 0.3);
  wingGroup.add(leftTip, rightTip);

  // 20mm Hispano Cannons on wings
  const cannonGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 6);
  const leftCannon = new THREE.Mesh(cannonGeo, materials.gunMetal);
  leftCannon.rotation.x = Math.PI / 2;
  leftCannon.position.set(-2.0, 0, -1.0);
  const rightCannon = leftCannon.clone();
  rightCannon.position.set(2.0, 0, -1.0);
  wingGroup.add(leftCannon, rightCannon);

  plane.add(wingGroup);

  // Tail Horizontal Stabilizers
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.1), materials.spitfireGreen);
  tailH.position.set(0, 0.25, 3.0);
  plane.add(tailH);

  // Vertical Fin / Rudder
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, 1.3), materials.spitfireGreen);
  fin.position.set(0, 0.8, 3.0);
  plane.add(fin);

  // Teardrop Cockpit Canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.55, 8, 8), materials.canopyGlass);
  canopy.scale.set(0.75, 0.85, 2.2);
  canopy.position.set(0, 0.55, -0.1);
  plane.add(canopy);

  // Propeller in front
  const prop = createPropeller(3.2);
  prop.position.set(0, 0, -3.5);
  plane.add(prop);
  plane.propellers.push(prop);

  return plane;
}

// 2. P-38 LIGHTNING TWIN-BOOM MODEL
function createP38Lightning(): AircraftMeshGroup {
  const plane = new THREE.Group() as AircraftMeshGroup;
  plane.propellers = [];

  // Central Cockpit Pod
  const podGeo = new THREE.CylinderGeometry(0.55, 0.4, 4.6, 8);
  const pod = new THREE.Mesh(podGeo, materials.lightningMetal);
  pod.rotation.x = Math.PI / 2;
  pod.position.set(0, 0, -0.2);
  pod.castShadow = true;
  plane.add(pod);

  // Central Canopy
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), materials.canopyGlass);
  canopy.scale.set(0.7, 0.8, 1.8);
  canopy.position.set(0, 0.5, -0.4);
  plane.add(canopy);

  // Main Wing connecting booms
  const mainWing = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.16, 2.2), materials.lightningMetal);
  mainWing.position.set(0, 0, -0.2);
  mainWing.castShadow = true;
  plane.add(mainWing);

  // Twin Booms (Left & Right)
  [-2.2, 2.2].forEach(x => {
    const boomGeo = new THREE.CylinderGeometry(0.48, 0.3, 7.8, 8);
    const boom = new THREE.Mesh(boomGeo, materials.lightningMetal);
    boom.rotation.x = Math.PI / 2;
    boom.position.set(x, 0, 0.8);
    boom.castShadow = true;
    plane.add(boom);

    // Vertical Twin Tail Fins
    const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.5, 1.2), materials.lightningMetal);
    tailFin.position.set(x, 0.7, 4.5);
    plane.add(tailFin);

    // Propeller for each engine nacelle
    const engineProp = createPropeller(2.6);
    engineProp.position.set(x, 0, -3.1);
    plane.add(engineProp);
    plane.propellers.push(engineProp);
  });

  // Tail Connecting Wing
  const tailConnector = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.12, 1.0), materials.lightningMetal);
  tailConnector.position.set(0, 0.7, 4.5);
  plane.add(tailConnector);

  // Nose Quad Guns
  const noseGuns = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.1, 0.8), materials.gunMetal);
  noseGuns.position.set(0, 0.1, -2.6);
  plane.add(noseGuns);

  return plane;
}

// 3. F4U CORSAIR GULL-WING FIGHTER MODEL
function createF4UCorsair(): AircraftMeshGroup {
  const plane = new THREE.Group() as AircraftMeshGroup;
  plane.propellers = [];

  // Heavy Fuselage
  const bodyGeo = new THREE.CylinderGeometry(0.78, 0.42, 6.8, 10);
  const body = new THREE.Mesh(bodyGeo, materials.corsairNavy);
  body.rotation.x = Math.PI / 2;
  body.castShadow = true;
  plane.add(body);

  // Radial Engine Cowling at nose
  const cowlGeo = new THREE.CylinderGeometry(0.85, 0.8, 1.4, 12);
  const cowl = new THREE.Mesh(cowlGeo, materials.gunMetal);
  cowl.rotation.x = Math.PI / 2;
  cowl.position.set(0, 0, -2.8);
  plane.add(cowl);

  // Cockpit
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.58, 8, 8), materials.canopyGlass);
  canopy.scale.set(0.75, 0.85, 2.0);
  canopy.position.set(0, 0.65, 0.5);
  plane.add(canopy);

  // Inverted Gull Wings
  const leftRoot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 2.4), materials.corsairNavy);
  leftRoot.position.set(-1.2, -0.3, 0.2);
  leftRoot.rotation.z = 0.22;
  leftRoot.castShadow = true;

  const leftOuter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.1), materials.corsairNavy);
  leftOuter.position.set(-3.8, 0.1, 0.2);
  leftOuter.rotation.z = -0.15;
  leftOuter.castShadow = true;

  const rightRoot = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.18, 2.4), materials.corsairNavy);
  rightRoot.position.set(1.2, -0.3, 0.2);
  rightRoot.rotation.z = -0.22;
  rightRoot.castShadow = true;

  const rightOuter = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.16, 2.1), materials.corsairNavy);
  rightOuter.position.set(3.8, 0.1, 0.2);
  rightOuter.rotation.z = 0.15;
  rightOuter.castShadow = true;

  plane.add(leftRoot, leftOuter, rightRoot, rightOuter);

  // Tail
  const tailH = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.12, 1.1), materials.corsairNavy);
  tailH.position.set(0, 0.3, 3.0);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.5, 1.2), materials.corsairNavy);
  fin.position.set(0, 0.85, 3.0);
  plane.add(tailH, fin);

  // Huge 3-Blade Propeller
  const prop = createPropeller(3.6);
  prop.position.set(0, 0, -3.6);
  plane.add(prop);
  plane.propellers.push(prop);

  return plane;
}

export function createPlayerAircraft(type: PlaneModelType): AircraftMeshGroup {
  switch (type) {
    case 'spitfire':
      return createSpitfire();
    case 'lightning':
      return createP38Lightning();
    case 'corsair':
      return createF4UCorsair();
    default:
      return createSpitfire();
  }
}

// 4. DISTINCT WINGMEN AIRCRAFT MODELS
export function createWingmanDrone(type: WingmanType = 'hurricane'): AircraftMeshGroup {
  const drone = new THREE.Group() as AircraftMeshGroup;
  drone.propellers = [];

  if (type === 'hurricane') {
    // Hurricane Gunner: Sturdy fighter with 4 wing cannons
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.26, 3.6, 8), materials.hurricaneBrown);
    body.rotation.x = Math.PI / 2;
    drone.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 1.2), materials.hurricaneBrown);
    wings.position.set(0, 0, 0.1);
    drone.add(wings);

    // 4 Guns
    [-1.6, -1.0, 1.0, 1.6].forEach(x => {
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 5), materials.gunMetal);
      barrel.rotation.x = Math.PI / 2;
      barrel.position.set(x, 0, -0.6);
      drone.add(barrel);
    });

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.32, 6, 6), materials.canopyGlass);
    canopy.scale.set(0.65, 0.75, 1.3);
    canopy.position.set(0, 0.32, -0.1);
    drone.add(canopy);

    const prop = createPropeller(2.0);
    prop.position.set(0, 0, -1.9);
    drone.add(prop);
    drone.propellers.push(prop);
  } else if (type === 'mosquito') {
    // Mosquito Bomber: Twin engine with twin mini bomb pods
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.22, 4.0, 8), materials.mosquitoWood);
    body.rotation.x = Math.PI / 2;
    drone.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.12, 1.4), materials.mosquitoWood);
    wings.position.set(0, 0, 0.1);
    drone.add(wings);

    // Twin Engines with props
    [-1.6, 1.6].forEach(x => {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 1.8, 6), materials.mosquitoWood);
      eng.rotation.x = Math.PI / 2;
      eng.position.set(x, -0.1, 0.2);
      drone.add(eng);

      const prop = createPropeller(1.6);
      prop.position.set(x, -0.1, -1.0);
      drone.add(prop);
      drone.propellers.push(prop);

      // Mini bomb rack
      const miniBomb = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 6), materials.bossSteel);
      miniBomb.rotation.x = Math.PI / 2;
      miniBomb.position.set(x, -0.35, 0.2);
      drone.add(miniBomb);
    });

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 6, 6), materials.canopyGlass);
    canopy.scale.set(0.7, 0.8, 1.5);
    canopy.position.set(0, 0.35, -0.2);
    drone.add(canopy);
  } else {
    // Tempest Interceptor: Heavy chin radiator and sharp wings
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.28, 3.8, 8), materials.tempestTeal);
    body.rotation.x = Math.PI / 2;
    drone.add(body);

    // Chin Radiator
    const chin = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.8), materials.gunMetal);
    chin.position.set(0, -0.3, -1.0);
    drone.add(chin);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.12, 1.3), materials.tempestTeal);
    wings.position.set(0, 0, 0.1);
    drone.add(wings);

    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.34, 6, 6), materials.canopyGlass);
    canopy.scale.set(0.65, 0.75, 1.4);
    canopy.position.set(0, 0.35, -0.1);
    drone.add(canopy);

    const prop = createPropeller(2.2);
    prop.position.set(0, 0, -2.0);
    drone.add(prop);
    drone.propellers.push(prop);
  }

  return drone;
}

// 5. ENEMY AIRCRAFT (Scout, Stuka Dive Bomber, Torpedo Bomber, Me-262 Jet, Heavy Bomber)
export function createEnemyAircraft(type: EnemyAircraftType): AircraftMeshGroup {
  const plane = new THREE.Group() as AircraftMeshGroup;
  plane.propellers = [];

  if (type === 'scout') {
    // Bf-109 Scout Interceptor
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.3, 5.2, 8), materials.enemyDarkGrey);
    body.rotation.x = -Math.PI / 2;
    body.castShadow = true;
    plane.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(7.8, 0.12, 1.8), materials.enemyDarkGrey);
    wings.position.set(0, 0, -0.2);
    wings.castShadow = true;
    plane.add(wings);

    // Yellow Nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.52, 1.2, 8), materials.enemyYellowNose);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 2.9);
    plane.add(nose);

    // Tail
    const tailH = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.08, 0.8), materials.enemyDarkGrey);
    tailH.position.set(0, 0.15, -2.4);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 0.9), materials.enemyDarkGrey);
    fin.position.set(0, 0.6, -2.4);
    plane.add(tailH, fin);

    const prop = createPropeller(2.4);
    prop.position.set(0, 0, 3.4);
    plane.add(prop);
    plane.propellers.push(prop);
  } else if (type === 'stuka') {
    // Ju-87 Stuka Dive Bomber
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.4, 6.4, 8), materials.enemyCamoGreen);
    body.rotation.x = -Math.PI / 2;
    body.castShadow = true;
    plane.add(body);

    // Inverted Gull Wings
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.15, 2.2), materials.enemyCamoGreen);
    wingL.position.set(-2.4, -0.2, -0.3);
    wingL.rotation.z = -0.15;
    const wingR = wingL.clone();
    wingR.position.x = 2.4;
    wingR.rotation.z = 0.15;
    plane.add(wingL, wingR);

    // Fixed Landing Gear spats under wings with Jericho Trumpet sirens
    [-2.2, 2.2].forEach(x => {
      const spat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.8), materials.enemyDarkGrey);
      spat.position.set(x, -0.9, -0.3);
      plane.add(spat);

      // Siren trumpet
      const siren = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 6), materials.propellerYellowTip);
      siren.rotation.x = -Math.PI / 2;
      siren.position.set(x, -0.5, 0.4);
      plane.add(siren);
    });

    // Heavy belly bomb
    const bellyBomb = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 6), materials.gunMetal);
    bellyBomb.rotation.x = Math.PI / 2;
    bellyBomb.position.set(0, -0.6, 0.2);
    plane.add(bellyBomb);

    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.68, 1.2, 8), materials.enemyYellowNose);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 3.5);
    plane.add(nose);

    const prop = createPropeller(2.8);
    prop.position.set(0, 0, 4.0);
    plane.add(prop);
    plane.propellers.push(prop);
  } else if (type === 'torpedo') {
    // Ju-88 Torpedo Bomber / Heavy Attacker
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.5, 8.2, 8), materials.enemyDarkGrey);
    body.rotation.x = -Math.PI / 2;
    body.castShadow = true;
    plane.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.18, 2.8), materials.enemyDarkGrey);
    wings.position.set(0, 0, 0.1);
    wings.castShadow = true;
    plane.add(wings);

    // Twin Engines & Props
    [-2.8, 2.8].forEach(x => {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.42, 3.4, 8), materials.enemyDarkGrey);
      eng.rotation.x = -Math.PI / 2;
      eng.position.set(x, 0, 0.8);
      plane.add(eng);

      const prop = createPropeller(2.5);
      prop.position.set(x, 0, 2.6);
      plane.add(prop);
      plane.propellers.push(prop);

      // Underslung Heavy Aerial Torpedo
      const torp = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 2.4, 8), materials.bossSteel);
      torp.rotation.x = Math.PI / 2;
      torp.position.set(x, -0.7, 0.6);
      plane.add(torp);
    });

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), materials.canopyGlass);
    nose.scale.set(0.9, 0.8, 1.4);
    nose.position.set(0, 0.1, 4.0);
    plane.add(nose);
  } else if (type === 'jet') {
    // Me-262 Vanguard Jet Interceptor (Swept wings + twin jet nacelles)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.35, 7.5, 8), materials.enemyJetSteel);
    body.rotation.x = -Math.PI / 2;
    body.castShadow = true;
    plane.add(body);

    // Swept wings
    const wingGeo = new THREE.BoxGeometry(9.0, 0.14, 2.0);
    const wings = new THREE.Mesh(wingGeo, materials.enemyJetSteel);
    wings.position.set(0, 0, -0.2);
    wings.rotation.y = 0.08;
    wings.castShadow = true;
    plane.add(wings);

    // Twin Underslung Jumo-004 Jet Engines
    [-2.2, 2.2].forEach(x => {
      const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 4.0, 8), materials.gunMetal);
      nacelle.rotation.x = -Math.PI / 2;
      nacelle.position.set(x, -0.25, 0.4);
      plane.add(nacelle);

      // Glowing Cyan/Blue Jet Exhaust Disc
      const exhaust = new THREE.Mesh(new THREE.CircleGeometry(0.35, 8), materials.jetExhaustGlow);
      exhaust.position.set(x, -0.25, -1.65);
      plane.add(exhaust);
    });

    // Shark nose with 4 heavy 30mm cannons
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.58, 1.6, 8), materials.enemyYellowNose);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, 0, 3.9);
    plane.add(nose);

    // Tail
    const tailH = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.08, 0.8), materials.enemyJetSteel);
    tailH.position.set(0, 0.25, -3.2);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.4, 1.1), materials.enemyJetSteel);
    fin.position.set(0, 0.85, -3.2);
    plane.add(tailH, fin);
  } else {
    // He-111 Heavy Bomber
    const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 9.5, 10), materials.enemyDarkGrey);
    body.rotation.x = -Math.PI / 2;
    body.castShadow = true;
    plane.add(body);

    const wings = new THREE.Mesh(new THREE.BoxGeometry(15.0, 0.22, 3.2), materials.enemyDarkGrey);
    wings.position.set(0, 0, 0.2);
    wings.castShadow = true;
    plane.add(wings);

    [-3.8, 3.8].forEach(x => {
      const eng = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.5, 3.8, 8), materials.enemyDarkGrey);
      eng.rotation.x = -Math.PI / 2;
      eng.position.set(x, 0, 0.8);
      plane.add(eng);

      const prop = createPropeller(2.6);
      prop.position.set(x, 0, 2.8);
      plane.add(prop);
      plane.propellers.push(prop);
    });

    const nose = new THREE.Mesh(new THREE.SphereGeometry(1.0, 8, 8), materials.canopyGlass);
    nose.scale.set(1.0, 0.9, 1.5);
    nose.position.set(0, 0.1, 4.5);
    plane.add(nose);
  }

  return plane;
}

// 6. GROUND TARGETS (Factories, Flak Bunkers, Refineries, Battleships)
export function createGroundStructure(type: 'factory' | 'flak' | 'refinery' | 'warship'): THREE.Group & {
  turret?: THREE.Object3D;
  targetType: string;
  hp: number;
  maxHp: number;
  scoreVal: number;
} {
  const group = new THREE.Group() as THREE.Group & {
    turret?: THREE.Object3D;
    targetType: string;
    hp: number;
    maxHp: number;
    scoreVal: number;
  };
  group.targetType = type;

  if (type === 'factory') {
    group.hp = 180;
    group.maxHp = 180;
    group.scoreVal = 600;

    const hall = new THREE.Mesh(new THREE.BoxGeometry(6.5, 3.2, 8.5), materials.factoryBrick);
    hall.position.y = 1.6;
    hall.castShadow = true;
    hall.receiveShadow = true;
    group.add(hall);

    const roofGeo = new THREE.ConeGeometry(4.8, 1.6, 4);
    roofGeo.rotateY(Math.PI / 4);
    roofGeo.scale(1.0, 1.0, 1.6);
    const roof = new THREE.Mesh(roofGeo, materials.factoryRoof);
    roof.position.set(0, 3.9, 0);
    roof.castShadow = true;
    group.add(roof);

    const chimGeo = new THREE.CylinderGeometry(0.45, 0.6, 5.5, 8);
    const chim1 = new THREE.Mesh(chimGeo, materials.chimneyBrick);
    chim1.position.set(2.0, 3.6, 2.4);
    const chim2 = new THREE.Mesh(chimGeo, materials.chimneyBrick);
    chim2.position.set(-2.0, 3.6, -2.4);
    group.add(chim1, chim2);

    const crate = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.8, 3.0), materials.lightningOlive);
    crate.position.set(-4.2, 0.9, 1.0);
    group.add(crate);
  } else if (type === 'flak') {
    group.hp = 90;
    group.maxHp = 90;
    group.scoreVal = 350;

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 3.4, 2.0, 8), materials.flakConcrete);
    base.position.y = 1.0;
    base.castShadow = true;
    group.add(base);

    const turret = new THREE.Group();
    turret.position.y = 2.0;

    const turretShield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.4), materials.gunMetal);
    turretShield.position.y = 0.5;
    turret.add(turretShield);

    const barrelGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.4, 6);
    const b1 = new THREE.Mesh(barrelGeo, materials.gunMetal);
    b1.rotation.x = Math.PI / 3;
    b1.position.set(0.45, 0.8, -1.2);
    const b2 = b1.clone();
    b2.position.x = -0.45;
    turret.add(b1, b2);

    group.add(turret);
    group.turret = turret;
  } else if (type === 'refinery') {
    group.hp = 220;
    group.maxHp = 220;
    group.scoreVal = 750;

    [-2.2, 2.2].forEach(x => {
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 3.8, 12), materials.oilTankSilver);
      tank.position.set(x, 1.9, 0);
      tank.castShadow = true;
      group.add(tank);

      const band = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.4, 12), materials.oilHazardOrange);
      band.position.set(x, 2.2, 0);
      group.add(band);
    });

    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 4.4, 6), materials.gunMetal);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 3.2, 0);
    group.add(pipe);
  } else {
    // Coastal Warship / Destroyer
    group.hp = 300;
    group.maxHp = 300;
    group.scoreVal = 1000;

    const hullGeo = new THREE.BoxGeometry(4.8, 2.0, 15.0);
    const hull = new THREE.Mesh(hullGeo, materials.bossSteel);
    hull.position.y = 0.2;
    hull.castShadow = true;
    group.add(hull);

    const bridge = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 4.5), materials.flakConcrete);
    bridge.position.set(0, 2.0, -1.0);
    group.add(bridge);

    const turret = new THREE.Group();
    turret.position.set(0, 1.8, 4.0);
    const tBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.8, 8), materials.bossSteel);
    const tGun = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3.2, 6), materials.gunMetal);
    tGun.rotation.x = Math.PI / 2.5;
    tGun.position.set(0, 0.6, -1.2);
    turret.add(tBase, tGun);
    group.add(turret);
    group.turret = turret;
  }

  return group;
}

// 7. EPIC BOSS: LAND TITAN FORTRESS "GOLIATH"
export function createLandTitanBoss(): THREE.Group & {
  turrets: THREE.Object3D[];
  hp: number;
  maxHp: number;
  scoreVal: number;
  coreMesh?: THREE.Mesh;
} {
  const boss = new THREE.Group() as THREE.Group & {
    turrets: THREE.Object3D[];
    hp: number;
    maxHp: number;
    scoreVal: number;
    coreMesh?: THREE.Mesh;
  };
  boss.turrets = [];
  boss.hp = 1800;
  boss.maxHp = 1800;
  boss.scoreVal = 8000;

  const mainHull = new THREE.Mesh(new THREE.BoxGeometry(16, 4.5, 20), materials.bossSteel);
  mainHull.position.y = 2.5;
  mainHull.castShadow = true;
  boss.add(mainHull);

  [-9, 9].forEach(x => {
    const track = new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.0, 24), materials.gunMetal);
    track.position.set(x, 2.0, 0);
    boss.add(track);
  });

  const frontMegaGun = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 8.0, 10), materials.gunMetal);
  frontMegaGun.rotation.x = Math.PI / 2;
  frontMegaGun.position.set(0, 3.8, 12);
  boss.add(frontMegaGun);

  const turretOffsets = [
    [-5, 5.0, 5],
    [5, 5.0, 5],
    [-5, 5.0, -5],
    [5, 5.0, -5],
  ];

  turretOffsets.forEach(([tx, ty, tz]) => {
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, ty, tz);

    const tDome = new THREE.Mesh(new THREE.SphereGeometry(1.3, 8, 8), materials.bossSteel);
    tDome.position.y = 0.5;
    tGroup.add(tDome);

    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 3.2, 6), materials.bossRedTrim);
    b1.rotation.x = Math.PI / 3;
    b1.position.set(0.4, 0.8, -1.2);
    const b2 = b1.clone();
    b2.position.x = -0.4;
    tGroup.add(b1, b2);

    boss.add(tGroup);
    boss.turrets.push(tGroup);
  });

  const coreGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.2, 12);
  const core = new THREE.Mesh(coreGeo, materials.bossCoreGlow);
  core.position.set(0, 5.2, 0);
  boss.add(core);
  boss.coreMesh = core;

  return boss;
}

// 8. EPIC BOSS: ZEPPELIN LEVIATHAN "VALKYRIE" (Sky Dreadnought)
export function createZeppelinBoss(): THREE.Group & {
  turrets: THREE.Object3D[];
  hp: number;
  maxHp: number;
  scoreVal: number;
  coreMesh?: THREE.Mesh;
} {
  const boss = new THREE.Group() as THREE.Group & {
    turrets: THREE.Object3D[];
    hp: number;
    maxHp: number;
    scoreVal: number;
    coreMesh?: THREE.Mesh;
  };
  boss.turrets = [];
  boss.hp = 2400;
  boss.maxHp = 2400;
  boss.scoreVal = 10000;

  // Main Envelope (Giant cigar shape)
  const envGeo = new THREE.CylinderGeometry(5.5, 4.0, 36.0, 16);
  const envelope = new THREE.Mesh(envGeo, materials.bossZeppelinCloth);
  envelope.rotation.x = Math.PI / 2;
  envelope.position.y = 9.0;
  envelope.castShadow = true;
  boss.add(envelope);

  // Nose cap
  const noseCap = new THREE.Mesh(new THREE.SphereGeometry(4.0, 12, 12), materials.bossZeppelinCloth);
  noseCap.position.set(0, 9.0, 18.0);
  boss.add(noseCap);

  // Tail cap
  const tailCap = new THREE.Mesh(new THREE.ConeGeometry(5.5, 8.0, 12), materials.bossZeppelinCloth);
  tailCap.rotation.x = -Math.PI / 2;
  tailCap.position.set(0, 9.0, -22.0);
  boss.add(tailCap);

  // Cruciform tail fins (Stabilizers)
  const finH = new THREE.Mesh(new THREE.BoxGeometry(16.0, 0.4, 6.0), materials.bossSteel);
  finH.position.set(0, 9.0, -20.0);
  const finV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 16.0, 6.0), materials.bossSteel);
  finV.position.set(0, 9.0, -20.0);
  boss.add(finH, finV);

  // Lower Command Gondola
  const gondola = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.0, 12.0), materials.bossSteel);
  gondola.position.set(0, 3.2, 4.0);
  boss.add(gondola);

  // 4 Rotating Defensive Gun Pods
  const podPositions = [
    [-6.2, 9.0, 6.0],
    [6.2, 9.0, 6.0],
    [-6.2, 9.0, -6.0],
    [6.2, 9.0, -6.0],
  ];

  podPositions.forEach(([px, py, pz]) => {
    const pod = new THREE.Group();
    pod.position.set(px, py, pz);

    const blister = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), materials.bossSteel);
    pod.add(blister);

    const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), materials.bossRedTrim);
    gun.rotation.x = Math.PI / 3;
    gun.position.set(0, 0, -1.0);
    pod.add(gun);

    boss.add(pod);
    boss.turrets.push(pod);
  });

  // Exposed Hydrogen Pressure Core (Bomb Critical Target)
  const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 10), materials.bossCoreGlow);
  core.position.set(0, 9.0, 0);
  boss.add(core);
  boss.coreMesh = core;

  return boss;
}

// 9. AERIAL TORPEDO / ROCKET PROJECTILE
export function createTorpedoRocket(): THREE.Mesh {
  const group = new THREE.Group();

  const torpGeo = new THREE.CylinderGeometry(0.24, 0.24, 2.2, 8);
  const torpMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.3,
    metalness: 0.7,
  });
  const torpMesh = new THREE.Mesh(torpGeo, torpMat);
  torpMesh.rotation.x = Math.PI / 2;
  group.add(torpMesh);

  // Fiery rocket exhaust tip
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.28, 0.8, 6),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  flame.rotation.x = -Math.PI / 2;
  flame.position.set(0, 0, 1.4);
  group.add(flame);

  return group as unknown as THREE.Mesh;
}

// 10. POWERUP CRATE MESH
export function createPowerupMesh(type: 'weapon' | 'wingman' | 'bomb' | 'repair' | 'fury'): THREE.Group {
  const group = new THREE.Group();

  let boxColor = 0xeab308;
  if (type === 'weapon') boxColor = 0x38bdf8;
  if (type === 'wingman') boxColor = 0xa855f7;
  if (type === 'bomb') boxColor = 0xf97316;
  if (type === 'repair') boxColor = 0x22c55e;
  if (type === 'fury') boxColor = 0xef4444;

  const crate = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({
      color: boxColor,
      roughness: 0.2,
      metalness: 0.6,
      emissive: boxColor,
      emissiveIntensity: 0.3,
    })
  );
  group.add(crate);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, side: THREE.DoubleSide })
  );
  canopy.position.y = 2.2;
  group.add(canopy);

  return group;
}
