import React from 'react';
import { PlayerStats } from '../game/types';
import { sound } from '../game/audio';
import {
  Zap,
  Shield,
  Bomb,
  Users,
  Coins,
  Wrench,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Layers,
} from 'lucide-react';

interface TechLabPanelProps {
  playerStats: PlayerStats;
  onUpdateStats: (newStats: PlayerStats) => void;
}

interface TechUpgradeDef {
  key: 'firepower' | 'armor' | 'bombs' | 'wingmen';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  getParamCurrent: (level: number) => string;
  getParamNext: (level: number) => string;
  description: string;
  levelsDetails: {
    name: string;
    effect: string;
  }[];
}

const UPGRADE_DEFINITIONS: TechUpgradeDef[] = [
  {
    key: 'firepower',
    title: '機砲射速與火力研發',
    subtitle: 'CANNON FIRE RATE & BALLISTICS',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    accentColor: 'text-amber-400',
    badgeBg: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    maxLevel: 5,
    baseCost: 140,
    costMultiplier: 1.6,
    getParamCurrent: lvl => {
      const rates = ['8.5 發/秒 · 雙聯裝', '11.0 發/秒 · 四聯裝', '13.5 發/秒 · 側向散射', '16.0 發/秒 · 六聯裝彈幕', '18.5 發/秒 · 極速狂熱風暴'];
      return rates[Math.min(lvl - 1, 4)];
    },
    getParamNext: lvl => {
      const rates = ['11.0 發/秒 · 四聯裝', '13.5 發/秒 · 側向散射', '16.0 發/秒 · 六聯裝彈幕', '18.5 發/秒 · 極速狂熱風暴', '已達極限頂峰'];
      return rates[Math.min(lvl - 1, 4)];
    },
    description: '改進航空機載機砲冷卻結構、供彈滑軌與高爆航砲口徑，大幅提升每秒射速與多重散射彈幕覆蓋面。',
    levelsDetails: [
      { name: 'LV.1 基礎白朗寧機槍', effect: '單發 16 傷害 · 標準直線彈道' },
      { name: 'LV.2 雙聯裝散佈擴展', effect: '單發 22 傷害 · 射速 +25% · 兩翼側向副砲' },
      { name: 'LV.3 西斯帕諾 20mm 航砲', effect: '單發 28 傷害 · 射速 +50% · 強化地面穿甲' },
      { name: 'LV.4 六聯裝高爆彈幕', effect: '單發 34 傷害 · 射速 +75% · 廣角密集火網' },
      { name: 'LV.5 王牌極限風暴航砲', effect: '單發 40+ 傷害 · 射速翻倍 · 狂暴暴擊率提升' },
    ],
  },
  {
    key: 'armor',
    title: '裝甲強度與機身抗彈結構',
    subtitle: 'ARMOR PLATING & AIRFRAME DURABILITY',
    icon: <Shield className="w-5 h-5 text-emerald-400" />,
    accentColor: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    maxLevel: 5,
    baseCost: 120,
    costMultiplier: 1.5,
    getParamCurrent: lvl => `${100 + (lvl - 1) * 25} HP 最大耐久度`,
    getParamNext: lvl => lvl < 5 ? `${100 + lvl * 25} HP (+25 HP)` : '已達最高耐久',
    description: '換裝高抗拉鉬鉻合金鋼板、座艙多層防彈強化玻璃及自封式防燃油箱，在密集防空火網中大幅提高存活率。',
    levelsDetails: [
      { name: 'LV.1 杜拉鋁標準蒙皮', effect: '最大裝甲值 100 HP · 基礎防護' },
      { name: 'LV.2 飛行員座艙防彈護板', effect: '最大裝甲值 125 HP · 受擊晃動微減' },
      { name: 'LV.3 翼樑自封防燃油箱', effect: '最大裝甲值 150 HP · 破片抗性強化' },
      { name: 'LV.4 鉬合金重裝護板', effect: '最大裝甲值 175 HP · 地面防空減傷 10%' },
      { name: 'LV.5 空中飛行要塞結構', effect: '最大裝甲值 200 HP · 僚機防護連鎖加成' },
    ],
  },
  {
    key: 'bombs',
    title: '戰術炸彈容量與掛載彈艙',
    subtitle: 'BOMB BAY CAPACITY & PAYLOAD',
    icon: <Bomb className="w-5 h-5 text-rose-400" />,
    accentColor: 'text-rose-400',
    badgeBg: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    maxLevel: 5,
    baseCost: 130,
    costMultiplier: 1.55,
    getParamCurrent: lvl => `初始載彈 ${3 + (lvl - 1)} 顆 · 回充加快`,
    getParamNext: lvl => lvl < 5 ? `初始載彈 ${4 + (lvl - 1)} 顆 (+1 炸彈)` : '彈艙容量已達最大',
    description: '擴充機腹內部主彈艙及機翼輔助外掛架，增加單次出擊攜帶的重型高爆戰術炸彈總量，強化對地打擊覆蓋。',
    levelsDetails: [
      { name: 'LV.1 標準掛彈架', effect: '攜帶 3 顆重型航彈 · 爆破半徑 9.5m' },
      { name: 'LV.2 機腹擴充彈艙', effect: '攜帶 4 顆重型航彈 · 投彈回充間隔 -10%' },
      { name: 'LV.3 雙排雙聯投彈軌', effect: '攜帶 5 顆重型航彈 · 對 Boss 傷害提升' },
      { name: 'LV.4 大滿貫高爆導向彈架', effect: '攜帶 6 顆重型航彈 · 爆破衝擊波強化' },
      { name: 'LV.5 戰略戰術重型轟炸艙', effect: '攜帶 7 顆重型航彈 · 僚機同步雙投彈威力翻倍' },
    ],
  },
  {
    key: 'wingmen',
    title: '僚機協同航電與空中編隊',
    subtitle: 'WINGMAN ESCORT SQUADRON',
    icon: <Users className="w-5 h-5 text-sky-400" />,
    accentColor: 'text-sky-400',
    badgeBg: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    maxLevel: 2,
    baseCost: 240,
    costMultiplier: 1.8,
    getParamCurrent: lvl => lvl === 0 ? '無僚機支援' : lvl === 1 ? '1 架戰術僚機協同作戰' : '2 架重型雙僚機編隊',
    getParamNext: lvl => lvl < 2 ? `解鎖至 ${lvl + 1} 架僚機編隊` : '護航編隊已滿額',
    description: '配署無線電導航與自動索敵射控航電，使隨伴僚機能在長機指揮下同步集火、攔截防空砲彈或投擲輔助炸彈。',
    levelsDetails: [
      { name: '單機出擊', effect: '無護航僚機火力' },
      { name: 'LV.1 護航僚機小隊', effect: '部署 1 架僚機 · 支援自由攻擊/集火/防禦戰術' },
      { name: 'LV.2 雙僚機突擊梯隊', effect: '部署雙僚機交叉火網 · 護盾防禦減免 35% 傷害' },
    ],
  },
];

export const TechLabPanel: React.FC<TechLabPanelProps> = ({ playerStats, onUpdateStats }) => {
  const getCost = (def: TechUpgradeDef, currentLevel: number): number => {
    return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel - 1));
  };

  const handleUpgrade = (def: TechUpgradeDef) => {
    const currentLevel = playerStats.upgrades[def.key];
    if (currentLevel >= def.maxLevel) return;

    const cost = getCost(def, currentLevel);
    if (playerStats.gold < cost) return;

    sound.init();
    sound.playPickup();

    const newStats: PlayerStats = {
      ...playerStats,
      gold: playerStats.gold - cost,
      upgrades: {
        ...playerStats.upgrades,
        [def.key]: currentLevel + 1,
      },
    };

    onUpdateStats(newStats);
  };

  return (
    <div className="flex flex-col gap-3 font-['Chakra_Petch']">
      {/* Tech Division Header Banner */}
      <div className="p-3 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/60 border border-amber-600/40 rounded-lg flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-300 uppercase tracking-widest flex items-center gap-1.5">
              <span>盟軍空軍技術研發處</span>
              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 text-[9px] rounded border border-amber-500/30">
                TECH R&D DIVISION
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              消耗繳獲作戰軍餉，研發尖端航空武器與抗彈合金，數值立即同步實戰
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-950/60 border border-amber-500/40 rounded text-amber-300 text-xs font-bold">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          <span>{playerStats.gold} G</span>
        </div>
      </div>

      {/* Upgrades Cards Grid */}
      <div className="grid grid-cols-1 gap-2.5">
        {UPGRADE_DEFINITIONS.map(def => {
          const currentLevel = playerStats.upgrades[def.key];
          const isMax = currentLevel >= def.maxLevel;
          const cost = isMax ? 0 : getCost(def, currentLevel);
          const canAfford = playerStats.gold >= cost;

          return (
            <div
              key={def.key}
              className={`p-3 rounded-lg border bg-slate-950/80 transition-all flex flex-col gap-2.5 ${
                isMax
                  ? 'border-emerald-500/40 bg-slate-950/60'
                  : canAfford
                  ? 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/60'
                  : 'border-slate-850 opacity-80'
              }`}
            >
              {/* Card Top: Icon + Title + Level Indicator */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg ${def.badgeBg} border ${def.borderColor} flex items-center justify-center shrink-0 shadow-inner`}
                  >
                    {def.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 tracking-wide">
                        {def.title}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                          isMax
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {isMax ? 'MAX 頂級' : `LV.${currentLevel}/${def.maxLevel}`}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono tracking-wider">
                      {def.subtitle}
                    </div>
                  </div>
                </div>

                {/* Upgrade Button or Max Badge */}
                {isMax ? (
                  <div className="px-3 py-1.5 rounded bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    已研發至上限
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(def)}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      canAfford
                        ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-amber-500/20 active:scale-95'
                        : 'bg-slate-900 border border-slate-750 text-slate-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>研發升級</span>
                    <span className="font-['Teko'] text-base font-bold leading-none ml-1">
                      {cost} G
                    </span>
                  </button>
                )}
              </div>

              {/* Progress Bar Segments */}
              <div className="flex items-center gap-1.5 w-full">
                {Array.from({ length: def.maxLevel }).map((_, idx) => {
                  const filled = idx < currentLevel;
                  return (
                    <div
                      key={idx}
                      className={`h-2 flex-1 rounded-sm transition-all duration-300 ${
                        filled
                          ? isMax
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                            : 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm shadow-amber-500/50'
                          : 'bg-slate-850 border border-slate-800'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Metrics Transition Specs */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-400 block text-[10px]">目前配置 CURRENT</span>
                  <span className="text-slate-200 font-semibold">{def.getParamCurrent(currentLevel)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">次階強化 NEXT SPEC</span>
                  <span className={isMax ? 'text-slate-500' : 'text-amber-400 font-semibold'}>
                    {def.getParamNext(currentLevel)}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="text-[11px] text-slate-400 leading-relaxed">
                {def.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
