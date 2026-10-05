import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PlaneModelType, PlayerStats, WingmanType, MissionConfig } from '../game/types';
import { createPlayerAircraft } from '../game/models';
import { sound } from '../game/audio';
import { CAMPAIGN_MISSIONS, WINGMEN_CONFIGS } from '../game/missions';
import hangarBg from '../assets/images/ww2_hangar_briefing_1791024121984.jpg';
import pilotWings from '../assets/images/ww2_pilot_wings_1791024133758.jpg';
import {
  Shield,
  Zap,
  Crosshair,
  Users,
  Trophy,
  Coins,
  Play,
  Volume2,
  VolumeX,
  Compass,
  Bomb,
  Radio,
  CheckCircle2,
  Gift,
  Sparkles,
  Clock,
  X,
  CalendarCheck,
  Cpu,
  BarChart2,
  Wrench,
  Award,
} from 'lucide-react';
import {
  canClaimDailyBonus,
  getStoredLastLoginTimestamp,
  saveDailyLoginClaim,
  getTimeUntilNextClaim,
  DAILY_REWARDS,
} from '../game/dailyBonus';
import { ACHIEVEMENTS } from '../game/achievements';
import { DailyLoginModal } from './DailyLoginModal';
import { TechLabPanel } from './TechLabPanel';
import { FlightLogPanel } from './FlightLogPanel';
import { MedalsPanel } from './MedalsPanel';

interface HangarViewProps {
  playerStats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
  onOpenBriefing: (plane: PlaneModelType, mission: MissionConfig, wingman: WingmanType) => void;
}

interface PlaneDetail {
  id: PlaneModelType;
  name: string;
  nameZh: string;
  code: string;
  historicalRole: string;
  firepowerRating: number;
  armorRating: number;
  speedRating: number;
  bombRating: number;
  description: string;
  accentColor: string;
}

const PLANES: PlaneDetail[] = [
  {
    id: 'spitfire',
    name: 'Supermarine Spitfire Mk.IX',
    nameZh: '噴火式 戰鬥機',
    code: 'RAF-1944',
    historicalRole: '不列顛空戰傳奇 · 高機動全能攔截機',
    firepowerRating: 75,
    armorRating: 70,
    speedRating: 88,
    bombRating: 70,
    description: '具備極致橢圓翼氣動佈局與勞斯萊斯梅林發動機，轉彎半徑極小，配備 20mm 西斯帕諾機砲。',
    accentColor: '#10b981',
  },
  {
    id: 'lightning',
    name: 'Lockheed P-38 Lightning',
    nameZh: 'P-38 閃電式 雙身惡魔',
    code: 'USAAF-P38',
    historicalRole: '太平洋重型雙發長程戰機 · 機頭重火力',
    firepowerRating: 92,
    armorRating: 80,
    speedRating: 82,
    bombRating: 90,
    description: '雙尾椼雙發動機重型戰機，機鼻集中裝載 4 挺白朗寧機槍與航砲，載彈量巨大，彈道高度密集。',
    accentColor: '#38bdf8',
  },
  {
    id: 'corsair',
    name: 'Chance Vought F4U Corsair',
    nameZh: 'F4U 海盜式 艦載戰機',
    code: 'USN-F4U',
    historicalRole: '倒海鷗翼重裝艦載機 · 裝甲極致厚重',
    firepowerRating: 85,
    armorRating: 95,
    speedRating: 80,
    bombRating: 80,
    description: '獨特倒海鷗翼與普惠巨型雙黃蜂發動機，裝甲耐久度極高，抗打擊能力拔群，適合攻堅。',
    accentColor: '#818cf8',
  },
];

export const HangarView: React.FC<HangarViewProps> = ({
  playerStats,
  onUpdateStats,
  onOpenBriefing,
}) => {
  const [selectedPlane, setSelectedPlane] = useState<PlaneModelType>(playerStats.selectedPlane);
  const [selectedMissionId, setSelectedMissionId] = useState<string>(
    playerStats.currentMissionId || 'mission_1'
  );
  const [selectedWingman, setSelectedWingman] = useState<WingmanType>(
    playerStats.selectedWingman || 'hurricane'
  );
  const [activeTab, setActiveTab] = useState<
    'campaign' | 'aircraft' | 'techLab' | 'flightLog' | 'medals' | 'records'
  >('campaign');
  const [isMuted, setIsMuted] = useState(sound.getIsMuted());
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [dismissNotificationBanner, setDismissNotificationBanner] = useState<boolean>(false);

  const claimableMedalsCount = ACHIEVEMENTS.filter(ach => {
    const progress = ach.getProgress(playerStats);
    const saved = playerStats.achievements?.[ach.id];
    return (progress.isCompleted || saved?.unlocked) && !saved?.claimed;
  }).length;

  const effectiveLastClaim =
    playerStats.dailyBonus?.lastClaimTimestamp || getStoredLastLoginTimestamp();
  const [claimTimer, setClaimTimer] = useState(getTimeUntilNextClaim(effectiveLastClaim));

  useEffect(() => {
    const interval = setInterval(() => {
      setClaimTimer(getTimeUntilNextClaim(effectiveLastClaim));
    }, 1000);
    return () => clearInterval(interval);
  }, [effectiveLastClaim]);

  const isDailyBonusReady = canClaimDailyBonus(effectiveLastClaim);
  const streakDays = playerStats.dailyBonus?.streakDays || 0;
  const currentClaimDay = isDailyBonusReady
    ? (streakDays % 7) + 1
    : Math.max(1, streakDays % 7 || 7);
  const todayReward = DAILY_REWARDS[currentClaimDay - 1];

  // 3D Turntable Preview
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const aircraftGroupRef = useRef<THREE.Group | null>(null);
  const animRef = useRef<number | null>(null);

  const currentPlaneInfo = PLANES.find(p => p.id === selectedPlane) || PLANES[0];
  const currentMission =
    CAMPAIGN_MISSIONS.find(m => m.id === selectedMissionId) || CAMPAIGN_MISSIONS[0];

  useEffect(() => {
    if (!previewCanvasRef.current) return;
    const container = previewCanvasRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 10, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    const dir = new THREE.DirectionalLight(0xffecd0, 2.2);
    dir.position.set(10, 20, 10);
    scene.add(amb, dir);

    const planeMesh = createPlayerAircraft(selectedPlane);
    scene.add(planeMesh);
    aircraftGroupRef.current = planeMesh;

    let rot = 0;
    const animate = () => {
      animRef.current = requestAnimationFrame(animate);
      rot += 0.008;
      if (aircraftGroupRef.current) {
        aircraftGroupRef.current.rotation.y = rot;
        aircraftGroupRef.current.rotation.x = Math.sin(rot * 0.8) * 0.08;
        const planeObj = aircraftGroupRef.current as unknown as { propellers?: THREE.Object3D[] };
        if (planeObj.propellers) {
          planeObj.propellers.forEach(p => (p.rotation.z += 0.8));
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    if (aircraftGroupRef.current) {
      sceneRef.current.remove(aircraftGroupRef.current);
    }
    const newMesh = createPlayerAircraft(selectedPlane);
    sceneRef.current.add(newMesh);
    aircraftGroupRef.current = newMesh;
  }, [selectedPlane]);

  const handleSelectPlane = (planeId: PlaneModelType) => {
    setSelectedPlane(planeId);
    sound.init();
    sound.playPickup();
    onUpdateStats({ ...playerStats, selectedPlane: planeId });
  };

  const handleSelectMission = (mId: string) => {
    setSelectedMissionId(mId);
    sound.init();
    sound.playTacticsChime();
    onUpdateStats({ ...playerStats, currentMissionId: mId });
  };

  const handleSelectWingman = (wId: WingmanType) => {
    setSelectedWingman(wId);
    sound.init();
    sound.playTacticsChime();
    onUpdateStats({ ...playerStats, selectedWingman: wId });
  };

  const toggleSound = () => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleBriefingLaunch = () => {
    sound.init();
    sound.playTacticsChime();
    onOpenBriefing(selectedPlane, currentMission, selectedWingman);
  };

  const handleClaimDailyReward = (awardedGold: number, nextStreak: number) => {
    const now = Date.now();
    saveDailyLoginClaim(now, nextStreak);
    const updatedStats: PlayerStats = {
      ...playerStats,
      gold: playerStats.gold + awardedGold,
      dailyBonus: {
        lastClaimTimestamp: now,
        streakDays: nextStreak,
        totalClaimed: (playerStats.dailyBonus?.totalClaimed || 0) + 1,
      },
    };
    onUpdateStats(updatedStats);
  };

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-[#0c1015] text-slate-100">
      {/* Background with measured contrast scrim */}
      <div
        className="absolute inset-0 bg-cover bg-center pointer-events-none opacity-40 scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url(${hangarBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e13] via-[#0d131a]/85 to-[#0b1016]/90 pointer-events-none" />

      {/* Top Bar Navigation */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-amber-900/30 bg-black/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded border border-amber-500/40 overflow-hidden shadow-md shadow-amber-500/10">
            <img src={pilotWings} alt="Wings" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-['Teko'] text-2xl font-bold tracking-wider text-amber-400 uppercase leading-none">
              極限空戰 1944 · AIRATTACK
            </div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase font-['Chakra_Petch']">
              盟軍前線航空作戰基地 · 第 8 航空軍團司令部
            </div>
          </div>
        </div>

        {/* Currency & Audio */}
        <div className="flex items-center gap-3">
          {/* Daily Login Bonus Trigger Button */}
          <button
            onClick={() => {
              sound.init();
              sound.playTacticsChime();
              setIsDailyModalOpen(true);
            }}
            className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-950/80 to-amber-900/60 hover:from-amber-900/80 hover:to-amber-800/80 border border-amber-500/60 rounded text-amber-300 font-['Chakra_Petch'] text-xs font-bold transition-all shadow-md shadow-amber-500/10 cursor-pointer"
            title="前線每日戰略軍需補給"
          >
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">每日軍需 REQUISITION</span>
            <span className="sm:hidden">軍需</span>
            {canClaimDailyBonus(playerStats.dailyBonus?.lastClaimTimestamp) && (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 absolute -top-1 -right-1 animate-ping" />
                <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5" />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/40 border border-amber-600/30 rounded text-amber-300 font-['Chakra_Petch'] text-sm">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-bold tracking-wider">{playerStats.gold}</span>
            <span className="text-[11px] text-amber-500/80">軍餉 GOLD</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-2 text-slate-400 hover:text-amber-400 bg-slate-900/60 hover:bg-slate-800 border border-slate-700/50 rounded transition-colors cursor-pointer"
            title="音效開關"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 lg:p-6 overflow-y-auto">
        {/* Left Column: 3D Turntable Inspection & Aircraft Selection */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* 3D Canvas Box */}
          <div className="relative h-[250px] lg:h-[320px] rounded-lg border border-amber-900/40 bg-radial from-slate-800/40 to-slate-950/80 overflow-hidden shadow-2xl flex items-center justify-center">
            <div ref={previewCanvasRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            <div className="absolute top-3 left-4 pointer-events-none">
              <span className="text-[11px] tracking-widest text-amber-400/80 uppercase font-['Chakra_Petch']">
                3D 機體全向檢視 [360° TURNTABLE]
              </span>
              <div className="text-xl font-bold font-['Teko'] tracking-wider text-white">
                {currentPlaneInfo.name}
              </div>
            </div>

            <div className="absolute bottom-3 right-4 pointer-events-none text-right">
              <span className="text-[10px] tracking-wider text-slate-400 font-['Chakra_Petch']">
                戰術編號: {currentPlaneInfo.code}
              </span>
            </div>
          </div>

          {/* Plane Selector Strip */}
          <div className="grid grid-cols-3 gap-3">
            {PLANES.map(plane => {
              const isSelected = selectedPlane === plane.id;
              return (
                <button
                  key={plane.id}
                  onClick={() => handleSelectPlane(plane.id)}
                  className={`flex flex-col p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-xs font-bold font-['Chakra_Petch'] tracking-wide ${
                        isSelected ? 'text-amber-300' : 'text-slate-300'
                      }`}
                    >
                      {plane.nameZh}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 truncate line-clamp-1">{plane.code}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Plane Description & Stat Bars */}
          <div className="p-4 rounded-lg border border-slate-800/80 bg-slate-950/70 backdrop-blur-md flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-xs text-amber-500 font-['Chakra_Petch'] uppercase tracking-wider">
                  戰機戰術定位
                </span>
                <p className="text-sm font-medium text-slate-200">{currentPlaneInfo.historicalRole}</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400">{currentPlaneInfo.description}</p>

            {/* Performance Gauges */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 pt-1 font-['Chakra_Petch']">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> 機砲火力 FIREPOWER
                  </span>
                  <span className="text-slate-200 font-bold">{currentPlaneInfo.firepowerRating}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${currentPlaneInfo.firepowerRating}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> 機體裝甲 ARMOR
                  </span>
                  <span className="text-slate-200 font-bold">{currentPlaneInfo.armorRating}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${currentPlaneInfo.armorRating}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Crosshair className="w-3 h-3 text-sky-400" /> 機動速度 SPEED
                  </span>
                  <span className="text-slate-200 font-bold">{currentPlaneInfo.speedRating}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all duration-300"
                    style={{ width: `${currentPlaneInfo.speedRating}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Bomb className="w-3 h-3 text-rose-400" /> 戰術投彈 BOMBS
                  </span>
                  <span className="text-slate-200 font-bold">{currentPlaneInfo.bombRating}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-300"
                    style={{ width: `${currentPlaneInfo.bombRating}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Selection & Upgrades & Briefing Launcher */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            {/* 24-Hour Daily Login Bonus Visual Notification Banner */}
            {isDailyBonusReady && !dismissNotificationBanner && (
              <div className="relative p-3 rounded-lg border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/90 via-slate-900/95 to-amber-950/70 shadow-2xl shadow-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 text-amber-400 shadow-inner">
                    <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-['Chakra_Petch'] text-amber-300 uppercase tracking-wider">
                        🎖️ 司令部 24 小時出勤戰略軍需已送達！
                      </span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/40">
                        可領取
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      連續第 <strong className="text-amber-300">{currentClaimDay}</strong> 天配發：{todayReward.title}（+{todayReward.gold} G 作戰軍餉）
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => {
                      sound.init();
                      sound.playTacticsChime();
                      setIsDailyModalOpen(true);
                    }}
                    className="px-4 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 fill-current" /> 立即領取軍需 CLAIM
                  </button>
                  <button
                    onClick={() => setDismissNotificationBanner(true)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800/80 transition-colors cursor-pointer"
                    title="稍後提醒"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-lg gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab('campaign')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold font-['Chakra_Petch'] rounded tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'campaign'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>戰役關卡</span>
              </button>
              <button
                onClick={() => setActiveTab('techLab')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold font-['Chakra_Petch'] rounded tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'techLab'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>技術研發處</span>
              </button>
              <button
                onClick={() => setActiveTab('flightLog')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold font-['Chakra_Petch'] rounded tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'flightLog'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>飛行日誌</span>
              </button>
              <button
                onClick={() => setActiveTab('medals')}
                className={`relative flex-1 py-1.5 px-2 text-xs font-bold font-['Chakra_Petch'] rounded tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'medals'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>榮譽勳章</span>
                {claimableMedalsCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 absolute -top-0.5 -right-0.5 animate-ping" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('records')}
                className={`flex-1 py-1.5 px-2 text-xs font-bold font-['Chakra_Petch'] rounded tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1 shrink-0 ${
                  activeTab === 'records'
                    ? 'bg-amber-500 text-slate-950 shadow font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>功勳榮譽</span>
              </button>
            </div>

            {/* Campaign Missions Tab */}
            {activeTab === 'campaign' && (
              <div className="flex flex-col gap-2.5">
                <div className="text-[11px] font-['Chakra_Petch'] text-amber-400 font-bold uppercase tracking-wider">
                  選擇作戰行動與前線防區
                </div>

                {CAMPAIGN_MISSIONS.map((m, idx) => {
                  const isSelected = selectedMissionId === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectMission(m.id)}
                      className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 text-xs font-['Chakra_Petch'] flex items-center justify-center font-bold text-amber-400">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs font-['Chakra_Petch'] text-slate-100">
                            {m.nameZh}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-red-950/80 border border-red-500/40 text-[10px] text-red-300 font-['Chakra_Petch'] font-bold rounded">
                          {m.threatLevel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 pl-7 line-clamp-1">
                        目標: 擊落 {m.objectives.airKillsTarget} 敵機 · 炸毀 {m.objectives.groundDestroyedTarget} 要塞 · 首腦: {m.bossName.split(' ')[0]}
                      </div>
                    </button>
                  );
                })}

                {/* Wingman Quick Pick in Hangar */}
                <div className="mt-1 pt-2 border-t border-slate-800">
                  <div className="text-[11px] font-['Chakra_Petch'] text-amber-400 font-bold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>出擊隨伴僚機</span>
                    <span className="text-slate-400 text-[10px] font-normal">可於任務簡報調整</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {WINGMEN_CONFIGS.map(w => {
                      const isSel = selectedWingman === w.id;
                      return (
                        <button
                          key={w.id}
                          onClick={() => handleSelectWingman(w.id)}
                          className={`p-2 rounded border text-left cursor-pointer transition-all flex flex-col gap-0.5 ${
                            isSel
                              ? 'border-sky-400 bg-sky-950/40 text-sky-200'
                              : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="text-[11px] font-bold font-['Chakra_Petch'] flex items-center justify-between">
                            {w.nameZh.split('」')[0]}」
                            {isSel && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                          </span>
                          <span className="text-[9px] opacity-80 truncate">{w.role.split('·')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Tech Lab Panel Tab */}
            {activeTab === 'techLab' && (
              <TechLabPanel
                playerStats={playerStats}
                onUpdateStats={onUpdateStats}
              />
            )}

            {/* Flight Log Panel Tab */}
            {activeTab === 'flightLog' && (
              <FlightLogPanel playerStats={playerStats} />
            )}

            {/* Medals Tab */}
            {activeTab === 'medals' && (
              <MedalsPanel
                playerStats={playerStats}
                onUpdateStats={onUpdateStats}
              />
            )}

            {/* Records Tab */}
            {activeTab === 'records' && (
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex flex-col gap-2 font-['Chakra_Petch'] text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" /> 歷史最高戰果 HIGH SCORE
                  </span>
                  <span className="text-base font-bold text-amber-300">
                    {String(playerStats.highScore).padStart(6, '0')}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">擊落敵機架數 AIR KILLS</span>
                  <span className="font-bold text-slate-200">{playerStats.totalKills} 架</span>
                </div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">摧毀地面要塞 GROUND RAZED</span>
                  <span className="font-bold text-slate-200">{playerStats.totalGroundDestroyed} 座</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">執行突襲任務 MISSIONS</span>
                  <span className="font-bold text-slate-200">{playerStats.missionsPlayed} 次</span>
                </div>

                {/* Daily Requisition & Attendance Status Tracking */}
                <div className="mt-2 pt-2 border-t border-amber-900/40 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span className="flex items-center gap-1.5">
                      <CalendarCheck className="w-4 h-4 text-amber-400" /> 每日戰略軍需領取紀錄 (24H ATTENDANCE)
                    </span>
                    <button
                      onClick={() => {
                        sound.init();
                        sound.playTacticsChime();
                        setIsDailyModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded text-[10px] text-amber-300 font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Gift className="w-3 h-3 text-amber-400" />
                      開啟 7 天補給清冊
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">連續出勤天數 STREAK</span>
                      <span className="font-['Teko'] text-xl font-bold text-amber-300 leading-none">
                        {streakDays} 天
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">今日領取狀態 STATUS</span>
                      <span
                        className={`text-[11px] font-bold ${
                          isDailyBonusReady ? 'text-amber-400 animate-pulse' : 'text-emerald-400'
                        }`}
                      >
                        {isDailyBonusReady ? '● 補給已就緒 (可領取)' : '✓ 今日已完成領取'}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">下次軍需空投 NEXT DROP</span>
                      <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        {isDailyBonusReady ? '立即領取' : claimTimer.timeLeftFormatted}
                      </span>
                    </div>

                    <div className="p-2 bg-slate-900/60 rounded border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">累計簽到領取 TOTAL CLAIMS</span>
                      <span className="font-['Teko'] text-xl font-bold text-slate-200 leading-none">
                        {playerStats.dailyBonus?.totalClaimed || 0} 次
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Launch Briefing Card */}
          <div className="p-4 rounded-lg border-2 border-amber-500/80 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-amber-950/40 shadow-2xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-['Chakra_Petch'] text-amber-400 tracking-widest uppercase">
                  作戰行動簡報 · BRIEFING READY
                </span>
                <div className="font-['Teko'] text-2xl font-bold tracking-wider text-white">
                  {currentMission.nameZh}
                </div>
              </div>
              <div className="px-2 py-0.5 bg-red-950/70 border border-red-500/50 rounded text-red-300 font-['Chakra_Petch'] text-xs font-bold">
                {currentMission.threatLevel}
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              點擊出擊將開啟 <strong className="text-amber-400">作戰簡報與敵軍雷達情資</strong>，確認目標指示與僚機配置後立即突入戰場！
            </p>

            <button
              onClick={handleBriefingLaunch}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-slate-950 font-['Teko'] text-2xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Compass className="w-5 h-5" />
              查看作戰簡報 · 出擊任務 MISSION BRIEFING
            </button>
          </div>
        </div>
      </div>

      {/* Daily Login Bonus Modal */}
      {isDailyModalOpen && (
        <DailyLoginModal
          lastClaimTimestamp={playerStats.dailyBonus?.lastClaimTimestamp || 0}
          streakDays={playerStats.dailyBonus?.streakDays || 0}
          onClaim={handleClaimDailyReward}
          onClose={() => setIsDailyModalOpen(false)}
        />
      )}
    </div>
  );
};
