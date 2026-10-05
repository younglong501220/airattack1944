import { MissionConfig, WingmanConfig } from './types';

export const WINGMEN_CONFIGS: WingmanConfig[] = [
  {
    id: 'hurricane',
    name: 'Hawker Hurricane Mk.II',
    nameZh: '「颶風」機砲火力型',
    role: '空中截擊 · 火力壓制',
    description: '裝備 4 門 20mm 西斯帕諾航砲，具備獨立雷達索敵系統，主動追擊並射擊空戰敵機編隊。',
    iconName: 'Zap',
    accentColor: '#f59e0b',
    perk: '空戰連射航砲 + 優先鎖定快速敵機',
  },
  {
    id: 'mosquito',
    name: 'de Havilland Mosquito B.IV',
    nameZh: '「蚊式」戰術轟炸型',
    role: '地面轟炸 · 要塞爆破',
    description: '配備輕量化機腹彈艙，每隔 4 秒自動向地面軍工廠、防空砲投擲小型戰術炸彈，並在玩家投彈時實施同步雙重轟炸。',
    iconName: 'Bomb',
    accentColor: '#ef4444',
    perk: '自動地面微型投彈 + 玩家投彈同步連鎖',
  },
  {
    id: 'tempest',
    name: 'Hawker Tempest Mk.V',
    nameZh: '「暴風」護衛防禦型',
    role: '近身護航 · 彈幕攔截',
    description: '環繞長機高速巡弋，裝備高速近防機槍，能主動擊落敵方射向玩家的子彈與防空砲破片，構築防禦力場。',
    iconName: 'Shield',
    accentColor: '#38bdf8',
    perk: '攔截並摧毀敵方子彈 + 替長機抵擋致命傷害',
  },
];

export const CAMPAIGN_MISSIONS: MissionConfig[] = [
  {
    id: 'mission_1',
    name: 'Operation Overlord: Coastal Assault',
    nameZh: '霸王怒濤：搶灘海岸防線',
    code: 'OP-OVERLORD-44',
    sector: '諾曼第海岸第 4 防區 · 奧馬哈扇區',
    threatLevel: 'NORMAL',
    weather: '東北風 12 節 · 晨曦微霧 · 能見度良好',
    briefingText:
      '盟軍主力艦隊已抵達諾曼第外海。你將率領先鋒機隊超低空突破德軍岸防警戒線，摧毀沿岸防空砲碉堡、雷達偵測站，清除敵軍 Bf-109 巡邏編隊，為登陸部隊撕開登陸走廊！',
    intelList: [
      {
        enemyName: 'Bf-109 快速截擊機 (Bf-109 Interceptor)',
        threat: '中度威脅',
        tactics: '採用左右雙向快速交叉盤旋掠襲，發射雙聯 7.92mm 機砲穿透射擊。',
      },
      {
        enemyName: 'Ju-87 斯圖卡俯衝轟炸機 (Ju-87 Stuka)',
        threat: '重度威脅',
        tactics: '在高空盤旋後發出淒厲警笛，實施 80 度垂直極速俯衝，釋放破片集束彈。',
      },
      {
        enemyName: '岸防 88mm 重高射砲碉堡 (Coastal Flak 88)',
        threat: '地面核心',
        tactics: '配備重裝混凝土保護傘，砲塔主動瞄準長機飛行高度進行爆震射擊，需用重爆炸彈拔除。',
      },
    ],
    objectives: {
      airKillsTarget: 12,
      groundDestroyedTarget: 4,
      bossTarget: true,
      escortFriendly: false,
    },
    rewardGold: 350,
    bossName: '岸防重裝巡洋艦「提爾比茨號分隊」',
  },
  {
    id: 'mission_2',
    name: 'Operation Chastise: Ruhr Industrial Blitz',
    nameZh: '黑林重工：魯爾工業大突襲',
    code: 'OP-CHASTISE-RUHR',
    sector: '埃森重工業走廊 · 兵工廠核心聚落',
    threatLevel: 'HIGH',
    weather: '陰天高積雲 · 工業濃煙覆蓋 · 氣流紊亂',
    briefingText:
      '深入魯爾工業核心區，精準轟炸敵軍合成燃油精煉廠與重砲總裝車間。敵軍已在此部署了 Ju-88 魚雷攻擊機與 Me-262 噴射機原型機，並啟動了超重型地面戰列載具「陸上移動要塞：歌利亞」！',
    intelList: [
      {
        enemyName: 'Ju-88 魚雷/火箭重裝突擊機 (Ju-88 Torpedo)',
        threat: '高密度突防',
        tactics: '低空直撲長機航線，發射雙聯前進式高爆火箭彈，衝擊半徑廣大。',
      },
      {
        enemyName: 'Me-262 噴射截擊機 (Me-262 Schwalbe)',
        threat: '極速威脅',
        tactics: '配備兩具軸流式噴射發動機，以 2 倍音速劃過空域進行撕裂式機砲點射。',
      },
      {
        enemyName: '陸上移動要塞「歌利亞」(Goliath Titan)',
        threat: '戰略 Boss',
        tactics: '超重型履帶移動要塞，外裝 4 座獨立防空砲塔，中央具備易爆的高熱能反應爐。',
      },
    ],
    objectives: {
      airKillsTarget: 16,
      groundDestroyedTarget: 6,
      bossTarget: true,
      escortFriendly: false,
    },
    rewardGold: 550,
    bossName: '鋼鐵霸權：陸上移動要塞 (GOLIATH TITAN)',
  },
  {
    id: 'mission_3',
    name: 'Operation Valkyrie: Sky Leviathan',
    nameZh: '鐵幕天際：齊柏林之災',
    code: 'OP-VALKYRIE-SKY',
    sector: '英吉利海峽平流層 · 8,000 米巡弋高空',
    threatLevel: 'CRITICAL',
    weather: '高空雷暴積雨雲 · 強烈高空氣流',
    briefingText:
      '德軍秘密建造的超重型空中戰列艦「齊柏林天罰號 (Zeppelin Leviathan)」正沿平流層逼近倫敦防區！我軍 B-17 轟炸機隊正前往聯合夾擊，你必須全權負責護送友軍編隊並全力轟炸齊柏林氣囊與武器掛架！',
    intelList: [
      {
        enemyName: '空中戰列艦「齊柏林天罰號」(Zeppelin Leviathan)',
        threat: '天空霸主',
        tactics: '配備多具旋轉防禦機槍吊艙、高空地雷投擲器與機腹集束燃燒彈艙。',
      },
      {
        enemyName: 'Me-262 護航狼群 (Jet Escorts)',
        threat: '極度致命',
        tactics: '專門針對我方護航轟炸機發起快速俯衝圍攻，必須優先截擊。',
      },
      {
        enemyName: 'Ju-87 斯圖卡突擊群 (Stuka Swarm)',
        threat: '連續空爆',
        tactics: '成雙成對發動連續俯衝投彈，迫使我方戰機脫離護航隊列。',
      },
    ],
    objectives: {
      airKillsTarget: 20,
      groundDestroyedTarget: 3,
      bossTarget: true,
      escortFriendly: true,
    },
    rewardGold: 800,
    bossName: '超重裝空中戰列艦「齊柏林天罰號」',
  },
];
