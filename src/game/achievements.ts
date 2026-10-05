import { AchievementConfig, PlayerStats } from './types';

export const ACHIEVEMENTS: AchievementConfig[] = [
  {
    id: 'ground_100',
    title: 'Destroy 100 Ground Targets',
    titleZh: '焦土打擊 · 破壞 100 座地面設施',
    category: 'combat',
    iconType: 'bunker',
    description: '深入敵境防區，以重型戰術炸彈或穿甲機砲摧毀累計超過 100 座敵方地面兵工廠、防空砲堡壘或燃料庫。',
    badgeGrade: 'GOLD',
    rewardGold: 600,
    target: 100,
    getProgress: (stats: PlayerStats) => {
      const current = stats.totalGroundDestroyed || 0;
      return {
        current: Math.min(100, current),
        max: 100,
        isCompleted: current >= 100,
      };
    },
  },
  {
    id: 'score_50k',
    title: 'Score 50k in one run',
    titleZh: '傳奇王牌 · 單場戰果突破 50,000 分',
    category: 'score',
    iconType: 'score',
    description: '在單次突擊出擊任務中維持連擊倍率、摧毀首腦並獲得 50,000 分以上的輝煌戰果記錄。',
    badgeGrade: 'PLATINUM',
    rewardGold: 850,
    target: 50000,
    getProgress: (stats: PlayerStats) => {
      const current = stats.highScore || 0;
      return {
        current: Math.min(50000, current),
        max: 50000,
        isCompleted: current >= 50000,
      };
    },
  },
  {
    id: 'perfect_bomb_acc',
    title: 'Perfect Bomb Accuracy',
    titleZh: '百發百中 · 戰術投彈 100% 命中率',
    category: 'accuracy',
    iconType: 'accuracy',
    description: '在任一場突擊出擊中投擲至少 3 顆以上重型炸彈，且戰術投彈命中率保持 100% 完美外科手術打擊。',
    badgeGrade: 'GOLD',
    rewardGold: 500,
    target: 1,
    getProgress: (stats: PlayerStats) => {
      const sorties = stats.sortieHistory || [];
      const hasPerfect = sorties.some(s => (s.bombsUsed || 0) >= 3 && (s.bombAccuracy || 0) >= 100);
      return {
        current: hasPerfect ? 1 : 0,
        max: 1,
        isCompleted: hasPerfect,
      };
    },
  },
  {
    id: 'air_kills_50',
    title: 'Ace of the Skies (50 Kills)',
    titleZh: '天空獵手 · 擊落 50 架空中敵機',
    category: 'combat',
    iconType: 'ace',
    description: '駕駛戰機在狗鬥空戰中擊墜累計 50 架以上斯圖卡俯衝轟炸機、魚雷轟炸機或噴射攔截機。',
    badgeGrade: 'SILVER',
    rewardGold: 450,
    target: 50,
    getProgress: (stats: PlayerStats) => {
      const current = stats.totalKills || 0;
      return {
        current: Math.min(50, current),
        max: 50,
        isCompleted: current >= 50,
      };
    },
  },
  {
    id: 'ironclad_armor',
    title: 'Ironclad Fortress (Max Armor)',
    titleZh: '鋼鐵之軀 · 重裝機身防護達到滿階',
    category: 'career',
    iconType: 'armor',
    description: '於軍械研發處將戰機裝甲強度研發至 LV.5 頂級要塞抗彈結構（200 HP 最大裝甲值）。',
    badgeGrade: 'GOLD',
    rewardGold: 400,
    target: 5,
    getProgress: (stats: PlayerStats) => {
      const current = stats.upgrades?.armor || 1;
      return {
        current,
        max: 5,
        isCompleted: current >= 5,
      };
    },
  },
  {
    id: 'max_tech',
    title: 'Apex Engineering (Max Firepower)',
    titleZh: '火力全開 · 機載航砲研發至滿級',
    category: 'career',
    iconType: 'tech',
    description: '在技術研發處將機載航空機砲升級至 LV.5，解鎖六聯裝極速暴擊風暴彈幕。',
    badgeGrade: 'GOLD',
    rewardGold: 450,
    target: 5,
    getProgress: (stats: PlayerStats) => {
      const current = stats.upgrades?.firepower || 1;
      return {
        current,
        max: 5,
        isCompleted: current >= 5,
      };
    },
  },
  {
    id: 'boss_slayer_3',
    title: 'Titan Slayer (3 Bosses Defeated)',
    titleZh: '首腦獵殺者 · 摧毀 3 艘陸空旗艦首腦',
    category: 'combat',
    iconType: 'boss',
    description: '在殘酷戰役中擊沉或摧毀累計 3 艘包括陸上泰坦要塞或齊柏林重裝飛艇在內之敵軍巨型首腦。',
    badgeGrade: 'GOLD',
    rewardGold: 550,
    target: 3,
    getProgress: (stats: PlayerStats) => {
      const sorties = stats.sortieHistory || [];
      const totalBosses = sorties.reduce((acc, s) => acc + (s.bossesDefeated || 0), 0);
      return {
        current: Math.min(3, totalBosses),
        max: 3,
        isCompleted: totalBosses >= 3,
      };
    },
  },
  {
    id: 'streak_7',
    title: '7-Day Sentinel (Frontline Veteran)',
    titleZh: '前線長青 · 連續駐守基地 7 天',
    category: 'career',
    iconType: 'streak',
    description: '連續 7 天駐守航空作戰基地領取每日空投戰略軍需，展現無畏王牌飛行員之堅毅紀律。',
    badgeGrade: 'PLATINUM',
    rewardGold: 700,
    target: 7,
    getProgress: (stats: PlayerStats) => {
      const current = stats.dailyBonus?.streakDays || 0;
      return {
        current: Math.min(7, current),
        max: 7,
        isCompleted: current >= 7,
      };
    },
  },
];
