import React, { useState } from 'react';
import { PlayerStats, AchievementConfig } from '../game/types';
import { ACHIEVEMENTS } from '../game/achievements';
import { sound } from '../game/audio';
import pilotWings from '../assets/images/ww2_pilot_wings_1791024133758.jpg';
import {
  Award,
  Trophy,
  Target,
  Crosshair,
  Shield,
  Zap,
  Bomb,
  Flame,
  CheckCircle2,
  Gift,
  Coins,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface MedalsPanelProps {
  playerStats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export const MedalsPanel: React.FC<MedalsPanelProps> = ({ playerStats, onUpdateStats }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'combat' | 'accuracy' | 'score' | 'career'>('all');

  const achievementsState = playerStats.achievements || {};

  // Compute unlock & claim states
  const evaluatedAchievements = ACHIEVEMENTS.map(ach => {
    const progress = ach.getProgress(playerStats);
    const savedState = achievementsState[ach.id];
    const isUnlocked = progress.isCompleted || !!savedState?.unlocked;
    const isClaimed = !!savedState?.claimed;

    return {
      ...ach,
      progress,
      isUnlocked,
      isClaimed,
      canClaim: isUnlocked && !isClaimed,
    };
  });

  const totalUnlocked = evaluatedAchievements.filter(a => a.isUnlocked).length;
  const totalClaimable = evaluatedAchievements.filter(a => a.canClaim).length;
  const totalClaimed = evaluatedAchievements.filter(a => a.isClaimed).length;

  const handleClaim = (ach: (typeof evaluatedAchievements)[0]) => {
    if (!ach.canClaim) return;

    sound.init();
    sound.playVictory();

    const newStats: PlayerStats = {
      ...playerStats,
      gold: playerStats.gold + ach.rewardGold,
      achievements: {
        ...(playerStats.achievements || {}),
        [ach.id]: {
          unlocked: true,
          claimed: true,
          unlockedAt: Date.now(),
        },
      },
    };

    onUpdateStats(newStats);
  };

  const filteredAchievements = evaluatedAchievements.filter(a => {
    if (activeCategory === 'all') return true;
    return a.category === activeCategory;
  });

  const getMedalIcon = (type: AchievementConfig['iconType']) => {
    switch (type) {
      case 'bunker':
        return <Bomb className="w-5 h-5 text-rose-400" />;
      case 'score':
        return <Trophy className="w-5 h-5 text-amber-300" />;
      case 'accuracy':
        return <Crosshair className="w-5 h-5 text-emerald-400" />;
      case 'ace':
        return <Award className="w-5 h-5 text-sky-400" />;
      case 'armor':
        return <Shield className="w-5 h-5 text-emerald-400" />;
      case 'tech':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'boss':
        return <Flame className="w-5 h-5 text-red-500" />;
      case 'streak':
        return <Calendar className="w-5 h-5 text-purple-400" />;
      default:
        return <Award className="w-5 h-5 text-amber-400" />;
    }
  };

  const getGradeBadge = (grade: AchievementConfig['badgeGrade']) => {
    switch (grade) {
      case 'PLATINUM':
        return {
          bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          ring: 'border-cyan-400/50 shadow-cyan-500/20',
          label: '白金特級 CITATION',
        };
      case 'GOLD':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          ring: 'border-amber-400/50 shadow-amber-500/20',
          label: '金質榮譽 GOLD MEDAL',
        };
      case 'SILVER':
        return {
          bg: 'bg-slate-400/20 text-slate-200 border-slate-400/40',
          ring: 'border-slate-400/40 shadow-slate-400/10',
          label: '銀質功勳 SILVER',
        };
      case 'BRONZE':
      default:
        return {
          bg: 'bg-amber-800/20 text-amber-400 border-amber-800/40',
          ring: 'border-amber-700/40 shadow-amber-800/10',
          label: '銅質獎章 BRONZE',
        };
    }
  };

  return (
    <div className="flex flex-col gap-3 font-['Chakra_Petch']">
      {/* Medals Showcase Header Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/60 border border-amber-600/40 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded border border-amber-500/50 overflow-hidden shadow shrink-0">
            <img src={pilotWings} alt="Wings" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>盟軍空軍司令部 戰功勳章與榮譽事蹟</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] rounded border border-amber-500/30">
                MEDALS OF HONOR
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              達成戰場里程碑，領取司令部頒發之榮譽勳章與高額戰略撫卹金
            </div>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">已授勳章</span>
            <span className="font-['Teko'] text-2xl font-bold text-amber-300 leading-none">
              {totalUnlocked} <span className="text-xs font-normal text-slate-400">/ {ACHIEVEMENTS.length}</span>
            </span>
          </div>

          {totalClaimable > 0 && (
            <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/50 rounded text-amber-300 text-xs font-bold animate-pulse flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{totalClaimable} 勳章待領取</span>
            </div>
          )}
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeCategory === 'all'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          全部勳章 ({ACHIEVEMENTS.length})
        </button>
        <button
          onClick={() => setActiveCategory('combat')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeCategory === 'combat'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          空地作戰 COMBAT
        </button>
        <button
          onClick={() => setActiveCategory('score')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeCategory === 'score'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          王牌戰果 SCORE
        </button>
        <button
          onClick={() => setActiveCategory('accuracy')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeCategory === 'accuracy'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          精準投彈 ACCURACY
        </button>
        <button
          onClick={() => setActiveCategory('career')}
          className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer shrink-0 ${
            activeCategory === 'career'
              ? 'bg-amber-500 text-slate-950 shadow'
              : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          戎馬生涯 CAREER
        </button>
      </div>

      {/* Medals Grid Cards */}
      <div className="grid grid-cols-1 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
        {filteredAchievements.map(ach => {
          const gradeInfo = getGradeBadge(ach.badgeGrade);
          const pct = Math.min(100, Math.round((ach.progress.current / ach.progress.max) * 100));

          return (
            <div
              key={ach.id}
              className={`p-3 rounded-lg border bg-slate-950/80 transition-all flex flex-col gap-2 relative overflow-hidden ${
                ach.canClaim
                  ? 'border-amber-400 bg-amber-950/30 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                  : ach.isClaimed
                  ? 'border-emerald-500/40 bg-slate-950/60'
                  : 'border-slate-800 opacity-90'
              }`}
            >
              {/* Card Header: Ribbon + Title + Action */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Medal Icon Badge with metallic frame */}
                  <div
                    className={`w-11 h-11 rounded-lg bg-slate-900 border ${gradeInfo.ring} flex flex-col items-center justify-center shrink-0 shadow-md relative`}
                  >
                    <div className="absolute -top-1 w-5 h-1.5 bg-gradient-to-r from-red-600 via-white to-blue-600 rounded-sm" />
                    {getMedalIcon(ach.iconType)}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 tracking-wide">
                        {ach.titleZh}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${gradeInfo.bg}`}
                      >
                        {gradeInfo.label}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                      {ach.title}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      {ach.description}
                    </div>
                  </div>
                </div>

                {/* Right Action / Status */}
                <div className="shrink-0 flex flex-col items-end gap-1">
                  {ach.canClaim ? (
                    <button
                      onClick={() => handleClaim(ach)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 animate-bounce"
                    >
                      <Sparkles className="w-4 h-4 fill-current" />
                      <span>領取撫卹 +{ach.rewardGold} G</span>
                    </button>
                  ) : ach.isClaimed ? (
                    <div className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>已頒授結案</span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-400">授勳獎金</div>
                      <span className="font-['Teko'] text-lg font-bold text-amber-400/90 leading-none">
                        +{ach.rewardGold} G
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar & Numerical Step */}
              <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-slate-850">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">
                    進度狀況: {ach.progress.current} / {ach.progress.max}
                  </span>
                  <span className={`font-bold ${ach.isUnlocked ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-850 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ach.isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-amber-500 to-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
