import React, { useState, useEffect } from 'react';
import { DAILY_REWARDS, canClaimDailyBonus, getTimeUntilNextClaim } from '../game/dailyBonus';
import { sound } from '../game/audio';
import pilotWings from '../assets/images/ww2_pilot_wings_1791024133758.jpg';
import {
  Gift,
  Coins,
  Bomb,
  Shield,
  Trophy,
  CheckCircle2,
  Clock,
  X,
  Sparkles,
  Award,
} from 'lucide-react';

interface DailyLoginModalProps {
  lastClaimTimestamp: number;
  streakDays: number;
  onClaim: (awardedGold: number, nextStreak: number) => void;
  onClose: () => void;
}

export const DailyLoginModal: React.FC<DailyLoginModalProps> = ({
  lastClaimTimestamp,
  streakDays,
  onClaim,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState(getTimeUntilNextClaim(lastClaimTimestamp));
  const isAvailable = canClaimDailyBonus(lastClaimTimestamp);
  const currentClaimDay = isAvailable
    ? ((streakDays % 7) + 1)
    : Math.max(1, streakDays % 7 || 7);

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeUntilNextClaim(lastClaimTimestamp));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastClaimTimestamp]);

  const handleClaim = () => {
    if (!isAvailable) return;
    const targetReward = DAILY_REWARDS[currentClaimDay - 1];
    sound.init();
    sound.playVictory();

    const nextStreak = streakDays + 1;
    onClaim(targetReward.gold, nextStreak);
  };

  const getRewardIcon = (type: string, isCurrentOrClaimed: boolean) => {
    const color = isCurrentOrClaimed ? 'text-amber-400' : 'text-slate-500';
    switch (type) {
      case 'bombs':
        return <Bomb className={`w-6 h-6 ${color}`} />;
      case 'armor':
        return <Shield className={`w-6 h-6 ${color}`} />;
      case 'ace':
        return <Trophy className={`w-7 h-7 text-amber-300 animate-bounce`} />;
      case 'gold':
      default:
        return <Coins className={`w-6 h-6 ${color}`} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 select-none animate-fadeIn">
      <div className="w-full max-w-3xl bg-slate-950 border-2 border-amber-500/70 rounded-xl shadow-2xl shadow-amber-500/20 flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-900/40 bg-gradient-to-r from-amber-950/50 via-slate-950 to-amber-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded border border-amber-500/60 overflow-hidden shadow shrink-0">
              <img src={pilotWings} alt="Wings" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-['Chakra_Petch'] text-amber-400 font-bold tracking-widest uppercase flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-400" /> 前線每日戰略軍需補給 · 24H REQUISITION
                </span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-['Chakra_Petch'] font-bold rounded border border-emerald-500/40">
                  連續出勤: {streakDays} 天
                </span>
              </div>
              <h2 className="font-['Teko'] text-3xl font-bold tracking-wider text-white uppercase leading-none">
                司令部飛行員出勤空投補給
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 7-Days Calendar Grid */}
        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <div className="text-xs text-slate-300 font-['Chakra_Petch'] flex items-center justify-between">
            <span>每日準時駐守航空基地，領取豐厚軍餉、高爆炸彈與裝甲資助！</span>
            {!isAvailable && (
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 下次空投倒數: {timeLeft.timeLeftFormatted}
              </span>
            )}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
            {DAILY_REWARDS.map(reward => {
              const dayNum = reward.day;
              const isPastClaimed = !isAvailable
                ? dayNum <= (streakDays % 7 || 7)
                : dayNum < currentClaimDay;
              const isTodayActive = isAvailable && dayNum === currentClaimDay;
              const isFinalDay = dayNum === 7;

              return (
                <div
                  key={dayNum}
                  className={`relative p-3 rounded-lg border flex flex-col items-center justify-between min-h-[140px] text-center transition-all ${
                    isTodayActive
                      ? 'border-amber-400 bg-amber-950/50 shadow-xl shadow-amber-500/20 ring-2 ring-amber-400/60 scale-105'
                      : isPastClaimed
                      ? 'border-slate-800 bg-slate-900/40 opacity-75'
                      : 'border-slate-850 bg-slate-950/80 opacity-50'
                  } ${isFinalDay && !isPastClaimed ? 'border-amber-500/50 bg-amber-950/20' : ''}`}
                >
                  {/* Day Tag */}
                  <div className="text-[11px] font-['Chakra_Petch'] font-bold text-slate-400 uppercase">
                    第 {dayNum} 天
                  </div>

                  {/* Icon */}
                  <div className="my-2 flex items-center justify-center">
                    {getRewardIcon(reward.iconType, isTodayActive || isPastClaimed)}
                  </div>

                  {/* Reward Value */}
                  <div className="flex flex-col items-center">
                    <span className="font-['Teko'] text-2xl font-bold text-amber-300 leading-none">
                      +{reward.gold} G
                    </span>
                    <span className="text-[9px] text-slate-400 font-['Chakra_Petch'] mt-0.5 truncate max-w-[80px]">
                      {reward.iconType === 'bombs'
                        ? '炸彈箱'
                        : reward.iconType === 'armor'
                        ? '合金裝甲'
                        : reward.iconType === 'ace'
                        ? '王牌寶庫'
                        : '作戰軍餉'}
                    </span>
                  </div>

                  {/* Status Overlay Badge */}
                  {isPastClaimed && (
                    <div className="absolute inset-0 bg-slate-950/70 rounded-lg flex flex-col items-center justify-center text-emerald-400 font-['Chakra_Petch'] text-xs font-bold gap-1">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>已領取</span>
                    </div>
                  )}

                  {isTodayActive && (
                    <div className="absolute -top-2 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-['Chakra_Petch'] text-[9px] font-bold shadow animate-pulse">
                      可領取
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Day Incentive Info */}
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 font-['Chakra_Petch'] flex items-center gap-2">
                  {DAILY_REWARDS[currentClaimDay - 1].title}
                  <span className="text-amber-400">
                    +{DAILY_REWARDS[currentClaimDay - 1].gold} G
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {DAILY_REWARDS[currentClaimDay - 1].description}
                </div>
              </div>
            </div>

            {/* Claim or Countdown Button */}
            {isAvailable ? (
              <button
                onClick={handleClaim}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-['Teko'] text-2xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/25 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-5 h-5 fill-current" /> 立即領取 CLAIM
              </button>
            ) : (
              <div className="px-4 py-2 bg-slate-900 border border-slate-700 rounded text-slate-400 font-['Chakra_Petch'] text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400 animate-spin" />
                <span>下輪補給: {timeLeft.timeLeftFormatted}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
