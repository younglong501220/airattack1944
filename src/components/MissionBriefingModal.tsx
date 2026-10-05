import React, { useState } from 'react';
import { MissionConfig, PlaneModelType, WingmanType } from '../game/types';
import { WINGMEN_CONFIGS } from '../game/missions';
import { sound } from '../game/audio';
import pilotWings from '../assets/images/ww2_pilot_wings_1791024133758.jpg';
import {
  Compass,
  Crosshair,
  Shield,
  Zap,
  Bomb,
  AlertTriangle,
  Play,
  ArrowLeft,
  Target,
  Wind,
  Coins,
  CheckCircle2,
} from 'lucide-react';

interface MissionBriefingModalProps {
  mission: MissionConfig;
  selectedPlane: PlaneModelType;
  selectedWingman: WingmanType;
  onSelectWingman: (w: WingmanType) => void;
  onConfirmLaunch: () => void;
  onBackToHangar: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  mission,
  selectedPlane,
  selectedWingman,
  onSelectWingman,
  onConfirmLaunch,
  onBackToHangar,
}) => {
  const [activeTab, setActiveTab] = useState<'map' | 'intel' | 'wingman'>('map');

  const currentWingmanConfig =
    WINGMEN_CONFIGS.find(w => w.id === selectedWingman) || WINGMEN_CONFIGS[0];

  const handleLaunch = () => {
    sound.init();
    sound.playShoot(true);
    onConfirmLaunch();
  };

  const handleWingmanClick = (wId: WingmanType) => {
    sound.init();
    sound.playTacticsChime();
    onSelectWingman(wId);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950 border-2 border-amber-600/70 rounded-xl shadow-2xl shadow-amber-500/10 flex flex-col overflow-hidden max-h-[95vh]">
        {/* Top Briefing Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/40 bg-gradient-to-r from-amber-950/50 via-slate-950 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-amber-500/60 overflow-hidden shadow-md shrink-0">
              <img src={pilotWings} alt="Insignia" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-['Chakra_Petch'] text-amber-400 font-bold tracking-widest uppercase">
                  作戰任務簡報 · TOP SECRET
                </span>
                <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-['Chakra_Petch'] font-bold rounded border border-amber-500/40">
                  {mission.code}
                </span>
              </div>
              <h2 className="font-['Teko'] text-3xl font-bold tracking-wider text-white uppercase leading-none">
                {mission.nameZh}
              </h2>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end text-right font-['Chakra_Petch']">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">防區區域</span>
            <span className="text-xs text-amber-200 font-bold">{mission.sector}</span>
            <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
              <Wind className="w-3 h-3 text-sky-400" /> {mission.weather}
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2">
          <button
            onClick={() => setActiveTab('map')}
            className={`py-2 px-4 text-xs font-['Chakra_Petch'] font-bold tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'map'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" /> 戰術雷達地圖 TACTICAL MAP
          </button>
          <button
            onClick={() => setActiveTab('intel')}
            className={`py-2 px-4 text-xs font-['Chakra_Petch'] font-bold tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'intel'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" /> 敵軍偵察情資 ENEMY INTEL
          </button>
          <button
            onClick={() => setActiveTab('wingman')}
            className={`py-2 px-4 text-xs font-['Chakra_Petch'] font-bold tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'wingman'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> 僚機支援配置 WINGMAN SUPPORT
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-5 overflow-y-auto">
          {activeTab === 'map' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Tactical Radar Display Canvas Simulation */}
              <div className="md:col-span-6 relative aspect-square max-h-[320px] rounded-lg border-2 border-emerald-900/60 bg-[#06140f] overflow-hidden shadow-inner flex items-center justify-center">
                {/* Radar Grid Circles */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[85%] h-[85%] rounded-full border border-emerald-500/20" />
                  <div className="w-[60%] h-[60%] rounded-full border border-emerald-500/30" />
                  <div className="w-[35%] h-[35%] rounded-full border border-emerald-500/40" />
                  <div className="w-full h-[1px] bg-emerald-500/25 absolute" />
                  <div className="h-full w-[1px] bg-emerald-500/25 absolute" />
                </div>

                {/* Radar Sweep Line */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent origin-center animate-[spin_4s_linear_infinite] pointer-events-none" />

                {/* Tactical Waypoints / Target Icons */}
                <div className="absolute top-[22%] left-[48%] flex flex-col items-center">
                  <span className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute" />
                  <span className="w-3 h-3 rounded-full bg-red-600 border border-white" />
                  <span className="text-[9px] font-['Chakra_Petch'] text-red-400 font-bold mt-1 bg-black/80 px-1 rounded">
                    ALPHA: 岸防重砲群
                  </span>
                </div>

                <div className="absolute top-[50%] left-[28%] flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                  <span className="text-[9px] font-['Chakra_Petch'] text-amber-300 font-bold mt-1 bg-black/80 px-1 rounded">
                    BRAVO: 工業煉油廠
                  </span>
                </div>

                <div className="absolute top-[68%] left-[65%] flex flex-col items-center">
                  <span className="w-3.5 h-3.5 rounded bg-rose-600 border border-white rotate-45 animate-pulse" />
                  <span className="text-[9px] font-['Chakra_Petch'] text-rose-300 font-bold mt-1 bg-black/80 px-1 rounded">
                    BOSS: {mission.bossName.split(' ')[0]}
                  </span>
                </div>

                {/* Ingress Vector Arrow */}
                <div className="absolute bottom-4 left-6 flex items-center gap-1.5 bg-black/80 border border-emerald-500/40 px-2 py-1 rounded text-emerald-400 font-['Chakra_Petch'] text-[10px]">
                  <Target className="w-3 h-3" />
                  <span>突入航線 INGRESS: 340° N</span>
                </div>
              </div>

              {/* Mission Objectives & Briefing Text */}
              <div className="md:col-span-6 flex flex-col justify-between gap-3">
                <div className="flex flex-col gap-2">
                  <div className="text-xs font-['Chakra_Petch'] text-amber-400 font-bold uppercase tracking-wider">
                    作戰目標指令 OBJECTIVES
                  </div>

                  {/* Objective 1 */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs text-slate-200">
                        擊落敵軍空戰截擊編隊
                      </span>
                    </div>
                    <span className="text-xs font-['Chakra_Petch'] font-bold text-amber-300">
                      0 / {mission.objectives.airKillsTarget} 架
                    </span>
                  </div>

                  {/* Objective 2 */}
                  <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bomb className="w-4 h-4 text-rose-400" />
                      <span className="text-xs text-slate-200">
                        戰術投彈炸毀地面兵工廠與碉堡
                      </span>
                    </div>
                    <span className="text-xs font-['Chakra_Petch'] font-bold text-rose-300">
                      0 / {mission.objectives.groundDestroyedTarget} 座
                    </span>
                  </div>

                  {/* Objective 3: Boss */}
                  {mission.objectives.bossTarget && (
                    <div className="p-2.5 bg-red-950/40 border border-red-800/60 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                        <span className="text-xs text-red-200 font-semibold">
                          消滅敵軍核心戰略戰力: {mission.bossName}
                        </span>
                      </div>
                      <span className="text-xs font-['Chakra_Petch'] font-bold text-red-400">
                        斬首目標
                      </span>
                    </div>
                  )}

                  {/* Escort Objective (if applicable) */}
                  {mission.objectives.escortFriendly && (
                    <div className="p-2.5 bg-sky-950/40 border border-sky-800/60 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-sky-400" />
                        <span className="text-xs text-sky-200">
                          護衛 B-17 友軍轟炸機隊裝甲存活
                        </span>
                      </div>
                      <span className="text-xs font-['Chakra_Petch'] font-bold text-sky-400">
                        維持 &gt; 20%
                      </span>
                    </div>
                  )}
                </div>

                {/* Briefing Narrative */}
                <div className="p-3 bg-slate-900/50 border border-slate-800 rounded text-xs text-slate-300 leading-relaxed">
                  {mission.briefingText}
                </div>

                {/* Reward Banner */}
                <div className="flex items-center justify-between p-2.5 bg-amber-950/30 border border-amber-600/30 rounded font-['Chakra_Petch']">
                  <span className="text-xs text-amber-400 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-300" /> 作戰成功軍餉賞金
                  </span>
                  <span className="text-sm font-bold text-amber-300">
                    +{mission.rewardGold} G
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'intel' && (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-['Chakra_Petch'] text-amber-400 font-bold uppercase tracking-wider mb-1">
                敵軍空中主力戰機與戰術情資
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mission.intelList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100 font-['Chakra_Petch']">
                        {item.enemyName}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-950 border border-red-500/40 text-red-300">
                        {item.threat}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.tactics}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'wingman' && (
            <div className="flex flex-col gap-4">
              <div className="text-xs font-['Chakra_Petch'] text-amber-400 font-bold uppercase tracking-wider">
                選擇本次突襲出擊的僚機支援 (隨部長機編隊)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {WINGMEN_CONFIGS.map(w => {
                  const isSelected = selectedWingman === w.id;
                  return (
                    <button
                      key={w.id}
                      onClick={() => handleWingmanClick(w.id)}
                      className={`p-3.5 rounded-lg border text-left transition-all flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 bg-amber-950/40 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/60'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-100 font-['Chakra_Petch']">
                            {w.nameZh}
                          </span>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-400" />
                          ) : (
                            <span className="text-[10px] text-slate-500">可配置</span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-400 font-semibold mb-2">
                          {w.role}
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {w.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 text-[11px] font-['Chakra_Petch'] text-emerald-400 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> {w.perk}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Wingman Summary */}
              <div className="p-3 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs font-['Chakra_Petch'] flex items-center justify-between">
                <span className="text-slate-300">
                  當前配置僚機：<strong className="text-amber-400">{currentWingmanConfig.nameZh}</strong>
                </span>
                <span className="text-emerald-400 font-semibold">已裝載準備就緒 READY</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onBackToHangar}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 font-['Chakra_Petch'] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> 返回機庫整備 BACK
          </button>

          <button
            onClick={handleLaunch}
            className="px-8 py-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-slate-950 font-['Teko'] text-2xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" /> 確認作戰方針 · 立即升空出擊 EXECUTE MISSION
          </button>
        </div>
      </div>
    </div>
  );
};
