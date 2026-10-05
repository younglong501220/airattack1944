export type PlaneModelType = 'spitfire' | 'lightning' | 'corsair';

export type WeatherType = 'Sunny' | 'Rainstorm' | 'Dense Fog';

export type WingmanType = 'hurricane' | 'mosquito' | 'tempest';
export type WingmanTactics = 'auto' | 'focus' | 'defense';

export type EnemyAircraftType = 'scout' | 'stuka' | 'torpedo' | 'jet' | 'heavy';

export interface WingmanConfig {
  id: WingmanType;
  name: string;
  nameZh: string;
  role: string;
  description: string;
  iconName: string;
  accentColor: string;
  perk: string;
}

export interface MissionObjective {
  id: string;
  label: string;
  current: number;
  target: number;
  completed: boolean;
}

export interface MissionConfig {
  id: string;
  name: string;
  nameZh: string;
  code: string;
  sector: string;
  threatLevel: 'NORMAL' | 'HIGH' | 'CRITICAL';
  weather: string;
  briefingText: string;
  intelList: {
    enemyName: string;
    threat: string;
    tactics: string;
  }[];
  objectives: {
    airKillsTarget: number;
    groundDestroyedTarget: number;
    bossTarget: boolean;
    escortFriendly?: boolean;
  };
  rewardGold: number;
  bossName: string;
}

export interface PlaneConfig {
  id: PlaneModelType;
  name: string;
  nameZh: string;
  historicalName: string;
  description: string;
  baseHp: number;
  speed: number;
  fireRate: number; // bullets per sec
  bulletDamage: number;
  bombCapacity: number;
  color: number;
  accentColor: number;
  unlocked: boolean;
  cost: number;
}

export interface DailyReward {
  day: number;
  gold: number;
  title: string;
  description: string;
  iconType: 'gold' | 'bombs' | 'armor' | 'ace';
}

export interface DamageNumberItem {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  isCrit?: boolean;
  isBomb?: boolean;
  opacity: number;
}

export interface SortieRecord {
  id: string;
  missionName: string;
  missionId: string;
  planeId: PlaneModelType;
  timestamp: number;
  isVictory: boolean;
  score: number;
  airKills: number;
  groundDestroyed: number;
  bossesDefeated: number;
  bombsUsed: number;
  bombHits: number;
  bombAccuracy: number; // percentage 0 - 100
  goldEarned: number;
}

export interface PlayerStats {
  gold: number;
  highScore: number;
  totalKills: number;
  totalGroundDestroyed: number;
  missionsPlayed: number;
  upgrades: {
    firepower: number; // 1 to 5 (機砲射速與火力)
    armor: number;     // 1 to 5 (裝甲強度)
    bombs: number;     // 1 to 5 (炸彈容量)
    wingmen: number;   // 0 to 2 (僚機護航隊)
  };
  selectedPlane: PlaneModelType;
  selectedWingman: WingmanType;
  unlockedMissions: string[];
  currentMissionId: string;
  dailyBonus?: {
    lastClaimTimestamp: number;
    streakDays: number;
    totalClaimed: number;
  };
  sortieHistory?: SortieRecord[];
  flightStats?: {
    totalVictories: number;
    totalDefeats: number;
    totalBombsDropped: number;
    totalBombHits: number;
  };
  achievements?: Record<
    string,
    {
      unlocked: boolean;
      claimed: boolean;
      unlockedAt?: number;
    }
  >;
}

export interface AchievementConfig {
  id: string;
  title: string;
  titleZh: string;
  category: 'combat' | 'accuracy' | 'score' | 'career';
  iconType: 'bunker' | 'score' | 'accuracy' | 'ace' | 'armor' | 'tech' | 'streak' | 'boss';
  description: string;
  badgeGrade: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  rewardGold: number;
  target: number;
  getProgress: (stats: PlayerStats) => { current: number; max: number; isCompleted: boolean };
}

export interface MissionStats {
  score: number;
  airKills: number;
  groundDestroyed: number;
  bossesDefeated: number;
  bombsUsed: number;
  bombHits?: number;
  bombAccuracy?: number;
  maxCombo: number;
  goldEarned: number;
  isVictory?: boolean;
}

export interface MissionProgressState {
  airKills: number;
  airKillsTarget: number;
  groundDestroyed: number;
  groundDestroyedTarget: number;
  bossDefeated: boolean;
  bossRequired: boolean;
  friendlyHp?: number; // 0 to 100 if escort
  isAllCompleted: boolean;
}
