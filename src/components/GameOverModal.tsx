import React, { useEffect } from 'react';
import { MissionStats } from '../game/types';
import pilotWings from '../assets/images/ww2_pilot_wings_1791024133758.jpg';
import { RotateCcw, Home, Trophy, Crosshair, ShieldAlert, Award } from 'lucide-react';
import { sound } from '../game/audio';

interface GameOverModalProps {
  stats: MissionStats;
  highScore: number;
  isNewRecord: boolean;
  onRestart: () => void;
  onReturnHangar: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  highScore,
  isNewRecord,
  onRestart,
  onReturnHangar,
}) => {
  useEffect(() => {
    sound.init();
    if (stats.isVictory || stats.score > 2000) {
      sound.playVictory();
    }
  }, [stats.isVictory, stats.score]);

  // Performance Evaluation Rank
  let rank = 'C';
  let rankColor = 'text-slate-300';
  let rankTitle = '三等飛行員 · PILOT 3RD CLASS';
  if (stats.isVictory || stats.score >= 10000) {
    rank = 'S';
    rankColor = 'text-amber-400';
    rankTitle = '王牌空戰傳奇 · ACE OF ACES';
  } else if (stats.score >= 5000) {
    rank = 'A';
    rankColor = 'text-sky-400';
    rankTitle = '資深空戰上尉 · FLIGHT CAPTAIN';
  } else if (stats.score >= 2500) {
    rank = 'B';
    rankColor = 'text-emerald-400';
    rankTitle = '前線作戰中尉 · FIRST LIEUTENANT';
  }

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-950 border-2 border-amber-600/70 rounded-xl p-6 shadow-2xl shadow-amber-500/10 flex flex-col gap-5">
        {/* Header with Pilot Wings Badge */}
        <div className="flex items-center gap-4 border-b border-amber-900/40 pb-4">
          <div className="w-16 h-16 rounded-lg border border-amber-500/60 overflow-hidden shadow-lg shadow-amber-500/20 shrink-0">
            <img src={pilotWings} alt="Wings" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-['Chakra_Petch'] text-amber-500 uppercase tracking-widest">
                作戰戰果審定報告 DEBRIEFING
              </span>
              {isNewRecord && (
                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-400 rounded text-amber-300 font-['Chakra_Petch'] text-[10px] font-bold animate-pulse">
                  新紀錄 NEW RECORD!
                </span>
              )}
            </div>
            <div className="font-['Teko'] text-3xl font-bold tracking-wider text-white uppercase flex items-center gap-2">
              {stats.isVictory ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Award className="w-6 h-6 text-emerald-400" /> 作戰大獲全勝 MISSION VICTORY
                </span>
              ) : (
                <span>戰事審定 MISSION CONCLUDED</span>
              )}
            </div>
            <div className={`text-xs font-['Chakra_Petch'] font-semibold ${rankColor}`}>
              {rankTitle}
            </div>
          </div>
          <div className="text-right">
            <div className={`font-['Teko'] text-5xl font-bold leading-none ${rankColor}`}>{rank}</div>
            <span className="text-[10px] text-slate-400 uppercase font-['Chakra_Petch']">評級 RANK</span>
          </div>
        </div>

        {/* Score & Highlights */}
        <div className="flex flex-col items-center bg-amber-950/20 border border-amber-900/30 rounded-lg py-3">
          <span className="text-xs text-amber-400 font-['Chakra_Petch'] tracking-widest">
            最終戰果得分 TOTAL SCORE
          </span>
          <div className="font-['Teko'] text-5xl font-bold text-white tracking-widest leading-tight">
            {String(stats.score).padStart(6, '0')}
          </div>
          <div className="text-xs text-slate-400 font-['Chakra_Petch']">
            歷史最高記錄: {String(highScore).padStart(6, '0')}
          </div>
        </div>

        {/* Combat Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs font-['Chakra_Petch']">
          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-amber-400" /> 空戰截擊擊落
            </span>
            <span className="font-bold text-slate-100">{stats.airKills} 架</span>
          </div>

          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-400" /> 地面轟炸摧毀
            </span>
            <span className="font-bold text-slate-100">{stats.groundDestroyed} 座</span>
          </div>

          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-emerald-400" /> 最高連擊倍率
            </span>
            <span className="font-bold text-slate-100">x{stats.maxCombo} ACE</span>
          </div>

          <div className="p-2.5 bg-slate-900/70 border border-slate-800 rounded flex items-center justify-between">
            <span className="text-slate-400">繳獲軍餉賞金 GOLD</span>
            <span className="font-bold text-amber-300">+{stats.goldEarned} G</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onRestart}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-[0.98]"
          >
            <RotateCcw className="w-5 h-5" /> 重新出擊 RE-ENGAGE
          </button>

          <button
            onClick={onReturnHangar}
            className="py-3 px-5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-['Teko'] text-xl font-bold tracking-widest uppercase rounded shadow flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Home className="w-5 h-5 text-amber-400" /> 返回機庫 HANGAR
          </button>
        </div>
      </div>
    </div>
  );
};
