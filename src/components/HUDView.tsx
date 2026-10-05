import React from 'react';
import { BossStatus } from '../game/engine';
import {
  Volume2,
  VolumeX,
  Pause,
  Shield,
  Zap,
  Bomb,
  AlertTriangle,
  Target,
  CheckCircle2,
  Circle,
  Radio,
  Sun,
  CloudRain,
  CloudFog,
} from 'lucide-react';
import { sound } from '../game/audio';
import {
  MissionProgressState,
  WingmanType,
  WingmanTactics,
  DamageNumberItem,
  WeatherType,
} from '../game/types';
import { WINGMEN_CONFIGS } from '../game/missions';

interface HUDViewProps {
  score: number;
  highScore: number;
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
  weather?: WeatherType;
  onDropBomb: () => void;
  onPause: () => void;
  onToggleTactics: () => void;
}

export const HUDView: React.FC<HUDViewProps> = ({
  score,
  highScore,
  hp,
  maxHp,
  bombs,
  maxBombs,
  combo,
  comboTimer,
  boss,
  gold,
  furyTimer,
  missionProgress,
  wingmanType,
  wingmanTactics,
  wingmanActive,
  damageNumbers,
  weather,
  onDropBomb,
  onPause,
  onToggleTactics,
}) => {
  const [isMuted, setIsMuted] = React.useState(sound.getIsMuted());

  const toggleSound = () => {
    sound.init();
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const hpRatio = Math.max(0, Math.min(1, hp / maxHp));
  const isHpCritical = hpRatio <= 0.3;

  const currentWingman =
    WINGMEN_CONFIGS.find(w => w.id === wingmanType) || WINGMEN_CONFIGS[0];

  const tacticsLabel = {
    auto: '自由作戰 AUTO',
    focus: '集火強攻 FOCUS',
    defense: '近身護盾 SHIELD',
  }[wingmanTactics];

  const tacticsBadgeColor = {
    auto: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    focus: 'bg-red-500/20 text-red-300 border-red-500/40',
    defense: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  }[wingmanTactics];

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-3 md:p-6 overflow-hidden select-none">
      {/* Floating Combat Damage Numbers */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {damageNumbers.map(item => (
          <div
            key={item.id}
            className={`absolute font-['Teko'] font-bold select-none pointer-events-none transition-transform ${
              item.isBomb
                ? 'text-2xl md:text-3xl font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] scale-110'
                : item.isCrit
                ? 'text-xl md:text-2xl font-black drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)] scale-105'
                : 'text-lg md:text-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
            }`}
            style={{
              left: `${item.x}px`,
              top: `${item.y}px`,
              color: item.color,
              opacity: item.opacity,
              transform: 'translate(-50%, -50%)',
              textShadow: '0 0 4px #000, 1px 1px 2px #000',
            }}
          >
            {item.text}
          </div>
        ))}
      </div>

      {/* Critical Damage Screen Vignette Pulse */}
      {isHpCritical && (
        <div className="absolute inset-0 bg-red-600/15 pointer-events-none animate-pulse" />
      )}

      {/* TOP BAR */}
      <div className="flex items-start justify-between gap-4">
        {/* Top Left: Score & Combo & Objectives */}
        <div className="flex flex-col gap-2 max-w-xs md:max-w-sm">
          {/* Score Box */}
          <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-amber-500/40 rounded px-4 py-2 shadow-2xl flex flex-col min-w-[160px] md:min-w-[200px]">
            <div className="flex items-center justify-between text-[11px] font-['Chakra_Petch'] text-amber-400 font-semibold tracking-wider">
              <span>戰果 SCORE</span>
              <span className="text-slate-400">BEST: {String(highScore).padStart(6, '0')}</span>
            </div>
            <div className="font-['Teko'] text-3xl md:text-4xl text-white tracking-widest leading-none">
              {String(score).padStart(6, '0')}
            </div>

            <div className="flex items-center justify-between mt-1 text-[11px] font-['Chakra_Petch'] text-amber-300">
              <span>軍餉: +{gold} G</span>
              {furyTimer > 0 && (
                <span className="text-red-400 font-bold animate-pulse flex items-center gap-1">
                  <Zap className="w-3 h-3" /> 疾速狂暴 BLITZ!
                </span>
              )}
            </div>
          </div>

          {/* Combo Multiplier Meter */}
          {combo > 1 && (
            <div className="bg-amber-950/90 border border-amber-400/80 rounded px-3 py-1.5 shadow-lg flex items-center gap-2 self-start animate-bounce">
              <span className="font-['Teko'] text-2xl font-bold text-amber-300 leading-none">
                x{combo} COMBO!
              </span>
              <div className="w-16 h-2 bg-slate-900 rounded overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${Math.round(comboTimer * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tactical Objectives Progression Card */}
          <div className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-xl flex flex-col gap-1.5 font-['Chakra_Petch'] text-[11px]">
            <div className="flex items-center justify-between text-amber-400 font-bold border-b border-slate-800 pb-1">
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" /> 作戰關卡進度 OBJECTIVES
              </span>
              <span className={missionProgress.isAllCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                {missionProgress.isAllCompleted ? '全部達成 COMPLETE' : '執行中 ACTIVE'}
              </span>
            </div>

            {/* Objective 1: Air Kills */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300">
                {missionProgress.airKills >= missionProgress.airKillsTarget ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span>空戰截擊敵機</span>
              </div>
              <span
                className={`font-bold ${
                  missionProgress.airKills >= missionProgress.airKillsTarget
                    ? 'text-emerald-400'
                    : 'text-amber-300'
                }`}
              >
                {missionProgress.airKills} / {missionProgress.airKillsTarget}
              </span>
            </div>

            {/* Objective 2: Ground Bombing */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300">
                {missionProgress.groundDestroyed >= missionProgress.groundDestroyedTarget ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                )}
                <span>地面要塞轟炸</span>
              </div>
              <span
                className={`font-bold ${
                  missionProgress.groundDestroyed >= missionProgress.groundDestroyedTarget
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {missionProgress.groundDestroyed} / {missionProgress.groundDestroyedTarget}
              </span>
            </div>

            {/* Objective 3: Boss */}
            {missionProgress.bossRequired && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-300">
                  {missionProgress.bossDefeated ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  <span>戰略首腦斬首</span>
                </div>
                <span
                  className={`font-bold ${
                    missionProgress.bossDefeated ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {missionProgress.bossDefeated ? '已擊破' : '作戰中'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Center: Boss Health Bar (if active) */}
        {boss && boss.active && (
          <div className="flex-1 max-w-md mx-2 bg-red-950/90 backdrop-blur-md border-2 border-red-500/80 rounded-lg p-2.5 shadow-2xl shadow-red-500/20 flex flex-col items-center gap-1 animate-pulse">
            <div className="flex items-center justify-between w-full text-xs font-['Chakra_Petch'] font-bold text-red-200">
              <span className="flex items-center gap-1 text-red-400">
                <AlertTriangle className="w-4 h-4 text-red-500" /> {boss.name}
              </span>
              <span>{Math.round((boss.hp / boss.maxHp) * 100)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded border border-red-500/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-red-600 transition-all duration-150"
                style={{ width: `${Math.max(0, Math.min(100, (boss.hp / boss.maxHp) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Top Right: Armor & Bomb Gauges & Wingman Status */}
        <div className="flex flex-col items-end gap-2">
          {/* Controls toggle bar & Weather Indicator */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {weather && (
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-['Chakra_Petch'] font-bold backdrop-blur-md shadow-md transition-all ${
                  weather === 'Rainstorm'
                    ? 'bg-slate-950/85 border-cyan-500/60 text-cyan-300 animate-pulse'
                    : weather === 'Dense Fog'
                    ? 'bg-slate-950/85 border-amber-600/40 text-amber-200'
                    : 'bg-slate-950/85 border-amber-500/40 text-amber-300'
                }`}
              >
                {weather === 'Rainstorm' ? (
                  <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
                ) : weather === 'Dense Fog' ? (
                  <CloudFog className="w-3.5 h-3.5 text-slate-300" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {weather === 'Rainstorm'
                    ? '暴風雨 RAINSTORM'
                    : weather === 'Dense Fog'
                    ? '濃霧 DENSE FOG'
                    : '晴朗 SUNNY'}
                </span>
                <span className="sm:hidden">
                  {weather === 'Rainstorm' ? '暴雨' : weather === 'Dense Fog' ? '濃霧' : '晴天'}
                </span>
              </div>
            )}

            <button
              onClick={toggleSound}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors shadow-lg cursor-pointer"
              title="音效開關"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <button
              onClick={onPause}
              className="p-2 bg-slate-950/80 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors shadow-lg cursor-pointer"
              title="暫停"
            >
              <Pause className="w-4 h-4 text-amber-400" />
            </button>
          </div>

          {/* Armor Hull Integrity */}
          <div className="bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded px-4 py-2 shadow-2xl flex flex-col items-end min-w-[170px] md:min-w-[210px]">
            <div className="flex items-center justify-between w-full text-[11px] font-['Chakra_Petch'] text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" /> 裝甲 ARMOR
              </span>
              <span className={isHpCritical ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                {Math.round(hpRatio * 100)}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 border border-slate-700 rounded overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  isHpCritical
                    ? 'bg-red-500 animate-pulse'
                    : hpRatio < 0.6
                    ? 'bg-amber-400'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.round(hpRatio * 100)}%` }}
              />
            </div>

            {/* Heavy Bomb Counter */}
            <div className="flex items-center justify-between w-full mt-2.5 pt-1.5 border-t border-slate-800">
              <span className="text-[10px] font-['Chakra_Petch'] text-amber-400 tracking-wider">
                重爆炸彈 BOMBS
              </span>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxBombs }).map((_, idx) => {
                  const hasBomb = idx < bombs;
                  return (
                    <div
                      key={idx}
                      className={`w-3 h-5 rounded-t-sm rounded-b-md border transition-all ${
                        hasBomb
                          ? 'bg-amber-400 border-amber-300 shadow-sm shadow-amber-400'
                          : 'bg-slate-800 border-slate-700 opacity-30'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Wingman Auxiliary Control Widget */}
          {wingmanActive && (
            <div className="pointer-events-auto bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl flex flex-col gap-1 min-w-[170px] md:min-w-[210px] font-['Chakra_Petch'] text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1 text-[11px] text-sky-400 font-bold">
                  <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  {currentWingman.nameZh}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold">隨伴中</span>
              </div>

              {/* Tactical Stance Toggle Button */}
              <button
                onClick={onToggleTactics}
                className={`w-full py-1 px-2 rounded border text-[10px] font-bold flex items-center justify-between cursor-pointer transition-colors mt-1 ${tacticsBadgeColor}`}
                title="按 T 切換僚機戰術方針"
              >
                <span>戰術: {tacticsLabel}</span>
                <span className="text-[9px] opacity-75">[切換 T]</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM BAR: Controls Guide & Mobile Bomb Launch Button */}
      <div className="flex items-end justify-between">
        {/* Controls Hint */}
        <div className="hidden sm:flex flex-col gap-0.5 bg-slate-950/85 backdrop-blur-md border-l-4 border-amber-500 px-3 py-2 rounded-r text-[11px] font-['Chakra_Petch'] text-slate-300 max-w-md shadow-2xl">
          <div className="text-amber-400 font-bold tracking-wide">空地雙層作戰指引</div>
          <div>• [滑鼠 / 觸控拖曳 / WASD] 自由機動傾斜飛行</div>
          <div>• [機載航空航砲] 自動高頻連射迎擊空中截擊編隊</div>
          <div>• [空白鍵 / 滑鼠右鍵 / 投彈鍵] 投擲重爆炸彈轟炸地面設施</div>
          <div>• [按 T 鍵] 切換僚機支援戰術 (自由 / 集火 / 防衛)</div>
        </div>

        {/* Mobile / Direct Touch Bomb Button */}
        <div className="pointer-events-auto flex items-center justify-end w-full sm:w-auto">
          <button
            onClick={onDropBomb}
            disabled={bombs <= 0}
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-b from-red-600 via-rose-700 to-red-950 border-4 border-amber-400/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none shadow-2xl shadow-red-600/60 flex flex-col items-center justify-center cursor-pointer transition-transform"
          >
            <span className="font-['Teko'] text-2xl md:text-3xl text-white font-bold leading-none tracking-widest drop-shadow">
              投彈
            </span>
            <span className="font-['Chakra_Petch'] text-[10px] md:text-xs text-amber-300 font-bold uppercase tracking-wider">
              BOMB ({bombs})
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
