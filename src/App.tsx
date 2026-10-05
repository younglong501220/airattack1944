import { useState, useEffect, useRef } from 'react';
import { GameEngine, BossStatus } from './game/engine';
import {
  PlaneModelType,
  PlayerStats,
  MissionStats,
  WingmanType,
  WingmanTactics,
  MissionConfig,
  MissionProgressState,
  DamageNumberItem,
  SortieRecord,
  WeatherType,
} from './game/types';
import { CAMPAIGN_MISSIONS } from './game/missions';
import { HangarView } from './components/HangarView';
import { HUDView } from './components/HUDView';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';

const STATS_STORAGE_KEY = 'airattack_1944_stats_v2';

const DEFAULT_PLAYER_STATS: PlayerStats = {
  gold: 450,
  highScore: 0,
  totalKills: 0,
  totalGroundDestroyed: 0,
  missionsPlayed: 0,
  upgrades: {
    firepower: 1,
    armor: 1,
    bombs: 1,
    wingmen: 1,
  },
  selectedPlane: 'spitfire',
  selectedWingman: 'hurricane',
  unlockedMissions: ['mission_1', 'mission_2', 'mission_3'],
  currentMissionId: 'mission_1',
  dailyBonus: {
    lastClaimTimestamp: 0,
    streakDays: 0,
    totalClaimed: 0,
  },
  sortieHistory: [
    {
      id: 'sortie_rec_1',
      missionName: '霸王行動：搶灘海岸線突擊',
      missionId: 'mission_1',
      planeId: 'spitfire',
      timestamp: Date.now() - 3600 * 1000 * 3,
      isVictory: true,
      score: 34200,
      airKills: 14,
      groundDestroyed: 5,
      bossesDefeated: 1,
      bombsUsed: 4,
      bombHits: 4,
      bombAccuracy: 100,
      goldEarned: 240,
    },
    {
      id: 'sortie_rec_2',
      missionName: '魯爾工業心臟：低空烈焰強襲',
      missionId: 'mission_2',
      planeId: 'lightning',
      timestamp: Date.now() - 3600 * 1000 * 6,
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
      id: 'sortie_rec_3',
      missionName: '霸王行動：搶灘海岸線突擊',
      missionId: 'mission_1',
      planeId: 'corsair',
      timestamp: Date.now() - 3600 * 1000 * 10,
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
  ],
  flightStats: {
    totalVictories: 3,
    totalDefeats: 0,
    totalBombsDropped: 12,
    totalBombHits: 10,
  },
};

export default function App() {
  const [gameState, setGameState] = useState<'hangar' | 'briefing' | 'battle'>('hangar');
  const [playerStats, setPlayerStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_PLAYER_STATS,
          ...parsed,
          dailyBonus: {
            ...DEFAULT_PLAYER_STATS.dailyBonus,
            ...(parsed.dailyBonus || {}),
          },
          upgrades: {
            ...DEFAULT_PLAYER_STATS.upgrades,
            ...(parsed.upgrades || {}),
          },
          sortieHistory:
            parsed.sortieHistory && parsed.sortieHistory.length > 0
              ? parsed.sortieHistory
              : DEFAULT_PLAYER_STATS.sortieHistory,
          flightStats: parsed.flightStats || DEFAULT_PLAYER_STATS.flightStats,
        };
      }
    } catch {
      // ignore JSON parse error
    }
    return DEFAULT_PLAYER_STATS;
  });

  // Active Mission & Configuration State
  const [activePlane, setActivePlane] = useState<PlaneModelType>(playerStats.selectedPlane);
  const [activeMission, setActiveMission] = useState<MissionConfig>(() => {
    return (
      CAMPAIGN_MISSIONS.find(m => m.id === playerStats.currentMissionId) || CAMPAIGN_MISSIONS[0]
    );
  });
  const [activeWingman, setActiveWingman] = useState<WingmanType>(
    playerStats.selectedWingman || 'hurricane'
  );

  // Battle HUD State
  const [hudStats, setHudStats] = useState({
    score: 0,
    hp: 100,
    maxHp: 100,
    bombs: 3,
    maxBombs: 3,
    combo: 1,
    comboTimer: 0,
    boss: null as BossStatus | null,
    gold: 0,
    furyTimer: 0,
    wingmanType: 'hurricane' as WingmanType,
    wingmanTactics: 'auto' as WingmanTactics,
    wingmanActive: true,
    damageNumbers: [] as DamageNumberItem[],
    weather: 'Sunny' as WeatherType,
    missionProgress: {
      airKills: 0,
      airKillsTarget: 12,
      groundDestroyed: 0,
      groundDestroyedTarget: 4,
      bossDefeated: false,
      bossRequired: true,
      friendlyHp: 100,
      isAllCompleted: false,
    } as MissionProgressState,
  });

  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [gameOverStats, setGameOverStats] = useState<{
    stats: MissionStats;
    isNewRecord: boolean;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Sync playerStats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(playerStats));
    } catch {
      // storage error
    }
  }, [playerStats]);

  // Clean up engine on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
      }
    };
  }, []);

  // Open Briefing Modal from Hangar
  const handleOpenBriefing = (
    plane: PlaneModelType,
    mission: MissionConfig,
    wingman: WingmanType
  ) => {
    setActivePlane(plane);
    setActiveMission(mission);
    setActiveWingman(wingman);
    setGameState('briefing');
  };

  // Launch battle after confirming in MissionBriefingModal
  const handleConfirmExecuteMission = () => {
    setGameState('battle');
    setGameOverStats(null);
    setIsPaused(false);

    setTimeout(() => {
      if (!canvasContainerRef.current) return;
      if (engineRef.current) {
        engineRef.current.dispose();
      }

      const engine = new GameEngine(canvasContainerRef.current, playerStats, {
        onStatsUpdate: stats => {
          setHudStats(stats);
        },
        onGameOver: missionStats => {
          handleMissionEnd(missionStats);
        },
        onMissionVictory: missionStats => {
          handleMissionEnd(missionStats);
        },
      });

      engineRef.current = engine;
      engine.start(activePlane, activeMission, activeWingman);
    }, 50);
  };

  const handleMissionEnd = (missionStats: MissionStats) => {
    const isNew = missionStats.score > playerStats.highScore;
    const newHighScore = Math.max(playerStats.highScore, missionStats.score);

    const calculatedAccuracy =
      missionStats.bombAccuracy ??
      (missionStats.bombsUsed > 0
        ? Math.min(
            100,
            Math.round(((missionStats.bombHits || 0) / missionStats.bombsUsed) * 100)
          )
        : 100);

    const newRecord: SortieRecord = {
      id: 'sortie_' + Date.now(),
      missionName: activeMission.nameZh,
      missionId: activeMission.id,
      planeId: activePlane,
      timestamp: Date.now(),
      isVictory: !!missionStats.isVictory,
      score: missionStats.score,
      airKills: missionStats.airKills,
      groundDestroyed: missionStats.groundDestroyed,
      bossesDefeated: missionStats.bossesDefeated,
      bombsUsed: missionStats.bombsUsed,
      bombHits: missionStats.bombHits || 0,
      bombAccuracy: calculatedAccuracy,
      goldEarned: missionStats.goldEarned,
    };

    setPlayerStats(prev => {
      const prevSorties = prev.sortieHistory || [];
      const updatedSorties = [newRecord, ...prevSorties].slice(0, 25);
      const prevFlight = prev.flightStats || {
        totalVictories: 0,
        totalDefeats: 0,
        totalBombsDropped: 0,
        totalBombHits: 0,
      };

      return {
        ...prev,
        gold: prev.gold + missionStats.goldEarned,
        highScore: newHighScore,
        totalKills: prev.totalKills + missionStats.airKills,
        totalGroundDestroyed: prev.totalGroundDestroyed + missionStats.groundDestroyed,
        missionsPlayed: prev.missionsPlayed + 1,
        sortieHistory: updatedSorties,
        flightStats: {
          totalVictories: prevFlight.totalVictories + (missionStats.isVictory ? 1 : 0),
          totalDefeats: prevFlight.totalDefeats + (missionStats.isVictory ? 0 : 1),
          totalBombsDropped: prevFlight.totalBombsDropped + missionStats.bombsUsed,
          totalBombHits: prevFlight.totalBombHits + (missionStats.bombHits || 0),
        },
      };
    });

    setGameOverStats({
      stats: missionStats,
      isNewRecord: isNew,
    });
  };

  const handleRestart = () => {
    setGameOverStats(null);
    setIsPaused(false);
    if (engineRef.current) {
      engineRef.current.start(activePlane, activeMission, activeWingman);
    }
  };

  const handleReturnHangar = () => {
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }
    setGameOverStats(null);
    setIsPaused(false);
    setGameState('hangar');
  };

  const handleDropBomb = () => {
    if (engineRef.current) {
      engineRef.current.dropBomb();
    }
  };

  const handleTogglePause = () => {
    if (engineRef.current) {
      const paused = engineRef.current.togglePause();
      setIsPaused(paused);
    }
  };

  const handleToggleTactics = () => {
    if (engineRef.current) {
      engineRef.current.toggleWingmanTactics();
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0f14] font-sans">
      {/* 1. HANGAR STATE */}
      {gameState === 'hangar' && (
        <HangarView
          playerStats={playerStats}
          onUpdateStats={setPlayerStats}
          onOpenBriefing={handleOpenBriefing}
        />
      )}

      {/* 2. MISSION BRIEFING MODAL (BEFORE BATTLE) */}
      {gameState === 'briefing' && (
        <MissionBriefingModal
          mission={activeMission}
          selectedPlane={activePlane}
          selectedWingman={activeWingman}
          onSelectWingman={setActiveWingman}
          onConfirmLaunch={handleConfirmExecuteMission}
          onBackToHangar={() => setGameState('hangar')}
        />
      )}

      {/* 3. BATTLE STATE */}
      {gameState === 'battle' && (
        <div className="relative w-full h-full">
          {/* 3D Game Canvas Mount Point */}
          <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full" />

          {/* Vignette Shadow Overlay */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.85)] z-10" />

          {/* Tactical In-Game HUD */}
          <HUDView
            score={hudStats.score}
            highScore={playerStats.highScore}
            hp={hudStats.hp}
            maxHp={hudStats.maxHp}
            bombs={hudStats.bombs}
            maxBombs={hudStats.maxBombs}
            combo={hudStats.combo}
            comboTimer={hudStats.comboTimer}
            boss={hudStats.boss}
            gold={hudStats.gold}
            furyTimer={hudStats.furyTimer}
            missionProgress={hudStats.missionProgress}
            wingmanType={hudStats.wingmanType}
            wingmanTactics={hudStats.wingmanTactics}
            wingmanActive={hudStats.wingmanActive}
            damageNumbers={hudStats.damageNumbers || []}
            weather={hudStats.weather}
            onDropBomb={handleDropBomb}
            onPause={handleTogglePause}
            onToggleTactics={handleToggleTactics}
          />

          {/* Pause Modal */}
          {isPaused && (
            <PauseModal
              onResume={handleTogglePause}
              onRestart={handleRestart}
              onReturnHangar={handleReturnHangar}
            />
          )}

          {/* Game Over / Victory Debriefing */}
          {gameOverStats && (
            <GameOverModal
              stats={gameOverStats.stats}
              highScore={playerStats.highScore}
              isNewRecord={gameOverStats.isNewRecord}
              onRestart={handleRestart}
              onReturnHangar={handleReturnHangar}
            />
          )}
        </div>
      )}
    </div>
  );
}
