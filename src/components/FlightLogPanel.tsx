import React, { useState } from 'react';
import { PlayerStats, SortieRecord } from '../game/types';
import {
  Trophy,
  Target,
  Crosshair,
  TrendingUp,
  Plane,
  Clock,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Compass,
  Bomb,
  BarChart2,
  Calendar,
} from 'lucide-react';

interface FlightLogPanelProps {
  playerStats: PlayerStats;
}

export const FlightLogPanel: React.FC<FlightLogPanelProps> = ({ playerStats }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'victory' | 'defeat'>('all');

  // Derive historical data from playerStats or fallback to realistic initial log
  const sorties: SortieRecord[] = playerStats.sortieHistory && playerStats.sortieHistory.length > 0
    ? playerStats.sortieHistory
    : [
        {
          id: 'initial_sortie_1',
          missionName: '霸王行動：搶灘海岸線突擊',
          missionId: 'mission_1',
          planeId: 'spitfire',
          timestamp: Date.now() - 3600 * 1000 * 2,
          isVictory: true,
          score: 32450,
          airKills: 14,
          groundDestroyed: 5,
          bossesDefeated: 1,
          bombsUsed: 4,
          bombHits: 4,
          bombAccuracy: 100,
          goldEarned: 220,
        },
        {
          id: 'initial_sortie_2',
          missionName: '魯爾工業心臟：低空烈焰強襲',
          missionId: 'mission_2',
          planeId: 'lightning',
          timestamp: Date.now() - 3600 * 1000 * 5,
          isVictory: true,
          score: 28900,
          airKills: 11,
          groundDestroyed: 6,
          bossesDefeated: 0,
          bombsUsed: 5,
          bombHits: 4,
          bombAccuracy: 80,
          goldEarned: 195,
        },
        {
          id: 'initial_sortie_3',
          missionName: '霸王行動：搶灘海岸線突擊',
          missionId: 'mission_1',
          planeId: 'corsair',
          timestamp: Date.now() - 3600 * 1000 * 9,
          isVictory: true,
          score: 24600,
          airKills: 9,
          groundDestroyed: 4,
          bossesDefeated: 1,
          bombsUsed: 3,
          bombHits: 2,
          bombAccuracy: 67,
          goldEarned: 180,
        },
      ];

  // Aggregated Flight Statistics
  const totalSorties = Math.max(playerStats.missionsPlayed, sorties.length);
  const victoriesCount = sorties.filter(s => s.isVictory).length;
  const defeatsCount = sorties.filter(s => !s.isVictory).length;
  const winRate = sorties.length > 0 ? Math.round((victoriesCount / sorties.length) * 100) : 100;

  // Bomb Accuracy Stats
  const totalBombsDropped = sorties.reduce((acc, s) => acc + (s.bombsUsed || 0), 0);
  const totalBombHits = sorties.reduce((acc, s) => acc + (s.bombHits || 0), 0);
  const overallBombAccuracy = totalBombsDropped > 0
    ? Math.round((totalBombHits / totalBombsDropped) * 100)
    : 85;

  // Kill Statistics
  const totalAirKills = Math.max(playerStats.totalKills, sorties.reduce((acc, s) => acc + s.airKills, 0));
  const totalGroundKills = Math.max(playerStats.totalGroundDestroyed, sorties.reduce((acc, s) => acc + s.groundDestroyed, 0));
  const totalDestroyed = totalAirKills + totalGroundKills;

  const filteredSorties = sorties.filter(s => {
    if (selectedFilter === 'victory') return s.isVictory;
    if (selectedFilter === 'defeat') return !s.isVictory;
    return true;
  });

  // SVG Radial Circle metrics for Win Rate
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (winRate / 100) * circumference;

  // SVG Radial for Bomb Accuracy
  const bombRadius = 38;
  const bombCircumference = 2 * Math.PI * bombRadius;
  const bombDashoffset = bombCircumference - (overallBombAccuracy / 100) * bombCircumference;

  return (
    <div className="flex flex-col gap-3 font-['Chakra_Petch']">
      {/* Header */}
      <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/60 border border-amber-600/40 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>戰備飛行日誌與空戰遙測統計</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] rounded border border-amber-500/30">
                FLIGHT COMBAT LOG
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              記錄近期前線出擊勝率、空地雙層擊毀戰果與戰術投彈精準度分析
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 block">總出擊次數</span>
          <span className="font-['Teko'] text-2xl font-bold text-white leading-none">
            {totalSorties} <span className="text-xs font-normal text-slate-400">次</span>
          </span>
        </div>
      </div>

      {/* 3 Main Data Visualization Gauges Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {/* 1. Mission Win Rate Radial Gauge */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1 self-start">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>任務勝率 WIN RATE</span>
          </div>

          <div className="relative my-2 w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              {/* Background Track */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-850"
                strokeWidth="8"
                fill="none"
              />
              {/* Animated Progress Ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-400 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-['Teko'] text-3xl font-black text-white leading-none">
                {winRate}%
              </span>
              <span className="text-[9px] text-emerald-400 uppercase font-bold tracking-wider">
                {winRate >= 80 ? '王牌勝率' : winRate >= 50 ? '穩定作戰' : '急需整備'}
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-850">
            <div className="bg-slate-900/60 p-1 rounded">
              <span className="text-slate-400 block">凱旋勝仗</span>
              <span className="text-emerald-400 font-bold">{victoriesCount} 次</span>
            </div>
            <div className="bg-slate-900/60 p-1 rounded">
              <span className="text-slate-400 block">迫降失利</span>
              <span className="text-rose-400 font-bold">{defeatsCount} 次</span>
            </div>
          </div>
        </div>

        {/* 2. Total Kills & Destruction Chart */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 flex flex-col justify-between relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-amber-400" />
              <span>擊毀總數 TOTAL DESTROYED</span>
            </span>
            <span className="font-['Teko'] text-xl font-bold text-amber-300 leading-none">
              {totalDestroyed}
            </span>
          </div>

          {/* Comparative Bar Chart Visualization */}
          <div className="my-2 flex flex-col gap-2">
            {/* Air Kills Bar */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-sky-400 flex items-center gap-1">
                  <Plane className="w-3 h-3" /> 空中擊落敵機
                </span>
                <span className="font-bold text-slate-200">
                  {totalAirKills} 架 ({totalDestroyed > 0 ? Math.round((totalAirKills / totalDestroyed) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-700"
                  style={{ width: `${totalDestroyed > 0 ? (totalAirKills / totalDestroyed) * 100 : 50}%` }}
                />
              </div>
            </div>

            {/* Ground Destructions Bar */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between text-[10px]">
                <span className="text-rose-400 flex items-center gap-1">
                  <Target className="w-3 h-3" /> 地面摧毀要塞
                </span>
                <span className="font-bold text-slate-200">
                  {totalGroundKills} 座 ({totalDestroyed > 0 ? Math.round((totalGroundKills / totalDestroyed) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full h-2 bg-slate-850 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-700"
                  style={{ width: `${totalDestroyed > 0 ? (totalGroundKills / totalDestroyed) * 100 : 50}%` }}
                />
              </div>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-850">
            <div className="bg-slate-900/60 p-1 rounded text-center">
              <span className="text-slate-400 block">場均空中戰果</span>
              <span className="text-sky-300 font-bold">
                {totalSorties > 0 ? (totalAirKills / totalSorties).toFixed(1) : 0} 架/次
              </span>
            </div>
            <div className="bg-slate-900/60 p-1 rounded text-center">
              <span className="text-slate-400 block">場均地面破壞</span>
              <span className="text-rose-300 font-bold">
                {totalSorties > 0 ? (totalGroundKills / totalSorties).toFixed(1) : 0} 座/次
              </span>
            </div>
          </div>
        </div>

        {/* 3. Tactical Bomb Accuracy Gauge */}
        <div className="p-3 rounded-lg border border-slate-800 bg-slate-950/80 flex flex-col items-center justify-between text-center relative overflow-hidden">
          <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1 self-start">
            <Bomb className="w-3.5 h-3.5 text-rose-400" />
            <span>戰術投彈命中率 ACCURACY</span>
          </div>

          <div className="relative my-2 w-28 h-28 flex items-center justify-center">
            {/* Crosshair background grid */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
              <div className="w-full h-[1px] bg-amber-500/50" />
              <div className="h-full w-[1px] bg-amber-500/50 absolute" />
            </div>

            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={bombRadius}
                className="stroke-slate-850"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={bombRadius}
                className="stroke-rose-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={bombCircumference}
                strokeDashoffset={bombDashoffset}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-['Teko'] text-3xl font-black text-amber-300 leading-none">
                {overallBombAccuracy}%
              </span>
              <span className="text-[9px] text-rose-400 uppercase font-bold tracking-wider">
                外科手術精準
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-1 text-[10px] pt-1 border-t border-slate-850">
            <div className="bg-slate-900/60 p-1 rounded">
              <span className="text-slate-400 block">投擲炸彈</span>
              <span className="text-slate-200 font-bold">{totalBombsDropped} 顆</span>
            </div>
            <div className="bg-slate-900/60 p-1 rounded">
              <span className="text-slate-400 block">有效爆破</span>
              <span className="text-amber-400 font-bold">{totalBombHits} 命中</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sorties Log Section */}
      <div className="p-3 bg-slate-950/70 border border-slate-800/90 rounded-lg flex flex-col gap-2">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>近期出擊戰報日誌 (RECENT SORTIES)</span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 text-[10px]">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全部 ({sorties.length})
            </button>
            <button
              onClick={() => setSelectedFilter('victory')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedFilter === 'victory'
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              凱旋 ({victoriesCount})
            </button>
            <button
              onClick={() => setSelectedFilter('defeat')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                selectedFilter === 'defeat'
                  ? 'bg-rose-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              折損 ({defeatsCount})
            </button>
          </div>
        </div>

        {/* Sortie Cards List */}
        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
          {filteredSorties.map((sortie, index) => {
            const dateStr = new Date(sortie.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const planeNameMap: Record<string, string> = {
              spitfire: '噴火式 SPITFIRE',
              lightning: 'P-38 閃電 LIGHTNING',
              corsair: 'F4U 海盜 CORSAIR',
            };

            return (
              <div
                key={sortie.id || index}
                className="p-2.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between gap-3 text-xs transition-colors"
              >
                {/* Left: Result Tag + Mission Name + Plane */}
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded flex items-center justify-center font-['Teko'] text-base font-bold shrink-0 ${
                      sortie.isVictory
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {sortie.isVictory ? 'WIN' : 'MIA'}
                  </div>

                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-2">
                      <span>{sortie.missionName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {dateStr}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="text-amber-400/90 font-semibold">
                        {planeNameMap[sortie.planeId] || sortie.planeId}
                      </span>
                      <span>·</span>
                      <span>
                        擊落 <strong className="text-sky-300">{sortie.airKills}</strong> 敵機
                      </span>
                      <span>·</span>
                      <span>
                        摧毀 <strong className="text-rose-300">{sortie.groundDestroyed}</strong> 地面要塞
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Bomb Accuracy + Score + Gold Bounty */}
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-2 text-[11px]">
                    <span className="text-amber-300 font-['Teko'] text-base font-bold leading-none">
                      {sortie.score.toLocaleString()} PTS
                    </span>
                    <span className="text-amber-400 font-semibold">+{sortie.goldEarned} G</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                    <Bomb className="w-2.5 h-2.5 text-rose-400" />
                    <span>投彈命中:</span>
                    <span className="text-emerald-400 font-bold">
                      {sortie.bombAccuracy ?? 100}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
