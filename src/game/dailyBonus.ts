import { DailyReward } from './types';

export const DAILY_REWARDS: DailyReward[] = [
  {
    day: 1,
    gold: 150,
    title: '第 1 天 · 前線飛行員基礎軍餉',
    description: '新晉飛行員到差報到，領取司令部標準出勤配發金。',
    iconType: 'gold',
  },
  {
    day: 2,
    gold: 250,
    title: '第 2 天 · 航空航砲整備專款',
    description: '後勤軍工廠撥款，強化機載機砲子彈裝填效率與保養。',
    iconType: 'gold',
  },
  {
    day: 3,
    gold: 350,
    title: '第 3 天 · 重型戰術炸彈空投箱',
    description: '前線空投軍需箱，充填重型炸彈庫存與戰術爆破經費。',
    iconType: 'bombs',
  },
  {
    day: 4,
    gold: 450,
    title: '第 4 天 · 航空高辛烷精煉燃油',
    description: '空軍航空總署配給特級高辛烷燃油，全面提升戰備巡航動力。',
    iconType: 'gold',
  },
  {
    day: 5,
    gold: 600,
    title: '第 5 天 · 重裝鉬合金防護鋼板',
    description: '維修棚廠配給高級抗彈合金，機體結構防護力全面躍升。',
    iconType: 'armor',
  },
  {
    day: 6,
    gold: 750,
    title: '第 6 天 · 僚機編隊協同津貼',
    description: '為隨伴僚機小隊配發高爆航砲彈藥與獨立索敵雷達元件。',
    iconType: 'gold',
  },
  {
    day: 7,
    gold: 1200,
    title: '第 7 天 · 傳奇王牌空戰大獎金',
    description: '連續 7 天駐守基地前線！榮獲第八航空軍團司令部王牌特別金質勳章！',
    iconType: 'ace',
  },
];

// Check if 24 hours have passed since last claim
export const CLAIM_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours
export const DAILY_LOGIN_STORAGE_KEY = 'airattack_daily_login_timestamp';
export const DAILY_STREAK_STORAGE_KEY = 'airattack_daily_streak_days';

export function getStoredLastLoginTimestamp(): number {
  try {
    const val = localStorage.getItem(DAILY_LOGIN_STORAGE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveDailyLoginClaim(timestamp: number, streak: number): void {
  try {
    localStorage.setItem(DAILY_LOGIN_STORAGE_KEY, timestamp.toString());
    localStorage.setItem(DAILY_STREAK_STORAGE_KEY, streak.toString());
  } catch {
    // ignore
  }
}

export function canClaimDailyBonus(lastClaimTimestamp: number = 0): boolean {
  // If timestamp is not supplied, check localStorage
  const timestamp = lastClaimTimestamp || getStoredLastLoginTimestamp();
  if (!timestamp) return true;
  return Date.now() - timestamp >= CLAIM_COOLDOWN_MS;
}

export function getTimeUntilNextClaim(lastClaimTimestamp: number = 0): {
  hours: number;
  minutes: number;
  seconds: number;
  isReady: boolean;
  timeLeftFormatted: string;
} {
  if (!lastClaimTimestamp) {
    return { hours: 0, minutes: 0, seconds: 0, isReady: true, timeLeftFormatted: '立即領取' };
  }

  const elapsed = Date.now() - lastClaimTimestamp;
  const remaining = CLAIM_COOLDOWN_MS - elapsed;

  if (remaining <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isReady: true, timeLeftFormatted: '立即領取' };
  }

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  const timeLeftFormatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
    2,
    '0'
  )}:${String(seconds).padStart(2, '0')}`;

  return { hours, minutes, seconds, isReady: false, timeLeftFormatted };
}
