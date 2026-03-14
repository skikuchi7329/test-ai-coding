import type { GameConfig, SkillConfig, Machine, GameEvent, GameEventType } from "@/types/game";

export const DEFAULT_CONFIG: GameConfig = {
  initialMoney: 100_000,
  totalDays: 30,
  maxActionsPerDay: 3,
  gameOverThreshold: 10_000,
  timeUnitsPerDay: 12, // 10:00〜22:00 の12ユニット
};

/** タイムユニットを時刻文字列に変換 (例: 0→"10:00", 6→"16:00") */
export function timeUnitToLabel(remainingUnits: number): string {
  const elapsed = DEFAULT_CONFIG.timeUnitsPerDay - remainingUnits;
  const hour = 10 + elapsed;
  return `${hour}:00`;
}

// ============================================================
// Skill Progression Table
// ============================================================
export const SKILL_TABLE: SkillConfig[] = [
  {
    level: "novice",
    label: "初心者",
    xpRequired: 0,
    hyenaAccuracy: 0.5,
    settingAccuracy: 0.3,
    evBonusMultiplier: 0.85,
  },
  {
    level: "intermediate",
    label: "中級者",
    xpRequired: 500,
    hyenaAccuracy: 0.75,
    settingAccuracy: 0.55,
    evBonusMultiplier: 1.0,
  },
  {
    level: "expert",
    label: "上級者",
    xpRequired: 1500,
    hyenaAccuracy: 0.9,
    settingAccuracy: 0.75,
    evBonusMultiplier: 1.1,
  },
  {
    level: "pro",
    label: "プロ",
    xpRequired: 3000,
    hyenaAccuracy: 0.98,
    settingAccuracy: 0.92,
    evBonusMultiplier: 1.2,
  },
];

export function getSkillConfig(skill: SkillConfig["level"]): SkillConfig {
  return SKILL_TABLE.find((s) => s.level === skill) ?? SKILL_TABLE[0];
}

// ============================================================
// Machine Templates
// ============================================================
// trueEV: 円/時 (時給期待値)。実際のパチスロに近い値に設定。
//   - 良質なハイエナ: +1500〜+3000/h, セッション2h → +3000〜+6000期待値
//   - 設定6:          +500〜+900/h,  セッション4h → +2000〜+3600期待値
//   - 設定4〜5:       +100〜+400/h,  微妙なプラス or ほぼ±0
//   - 低設定/ハズレ台: −400〜−800/h, 負けが基本
// volatility: 高いほど荒波（実際のAT機は2.0〜3.0が現実的）
// estimatedMinutes: timeCost に合わせて ハイエナ=120, 設定狙い=240
export const MACHINE_TEMPLATES: Omit<Machine, "id" | "perceivedEV" | "identificationProgress">[] = [
  {
    name: "バジリスク絆2 (天井残り90G)",
    type: "highEV_ceiling",
    trueEV: 2500,   // +¥5000/session期待値 (2h)
    setting: 1,
    gameCount: 890,
    gamesUntilCeiling: 90,
    volatility: 2.5, // σ≈¥28000 → 約42%で負けるリアルな荒波
    estimatedMinutes: 120,
  },
  {
    name: "スマスロ北斗 (ゾーン残り30G)",
    type: "highEV_zone",
    trueEV: 1500,   // +¥3000/session期待値 (2h)
    setting: 1,
    gameCount: 380,
    gamesUntilCeiling: null,
    volatility: 2.2, // σ≈¥24000
    estimatedMinutes: 120,
  },
  {
    name: "ハナハナ (設定6確定)",
    type: "setting_hunt",
    trueEV: 800,    // +¥3200/session期待値 (4h)
    setting: 6,
    gameCount: 200,
    gamesUntilCeiling: null,
    volatility: 1.5, // σ≈¥24000 → 約45%で負け（設定6でも半分近く負ける）
    estimatedMinutes: 240,
  },
  {
    name: "ジャグラー (設定5狙い)",
    type: "setting_hunt",
    trueEV: 400,    // +¥1600/session期待値 (4h)
    setting: 5,
    gameCount: 500,
    gamesUntilCeiling: null,
    volatility: 1.3, // σ≈¥21000 → 約47%で負け
    estimatedMinutes: 240,
  },
  {
    name: "マイジャグ (設定不明)",
    type: "setting_hunt",
    trueEV: -400,   // 実は低設定: -¥1600/session期待値 (4h)
    setting: 3,
    gameCount: 300,
    gamesUntilCeiling: null,
    volatility: 1.3, // σ≈¥21000 → 約53%で負け（マイナスEV）
    estimatedMinutes: 240,
  },
  {
    name: "Lエヴァ (天井残り40G)",
    type: "highEV_ceiling",
    trueEV: 3000,   // +¥6000/session期待値 (2h), 近天井で高EV
    setting: 1,
    gameCount: 950,
    gamesUntilCeiling: 40,
    volatility: 3.0, // σ≈¥34000 → 約43%で負け、当たると大きい
    estimatedMinutes: 120,
  },
  {
    name: "凱旋 (天井残り200G)",
    type: "highEV_ceiling",
    trueEV: 800,    // +¥1600/session期待値 (2h), 遠い天井でEV低め
    setting: 1,
    gameCount: 750,
    gamesUntilCeiling: 200,
    volatility: 2.8, // 荒波: 当たれば大勝ち、外れれば轟沈
    estimatedMinutes: 120,
  },
  {
    name: "適当打ち台 (低設定疑惑)",
    type: "setting_hunt",
    trueEV: -700,   // 低設定: -¥2800/session期待値 (4h)
    setting: 2,
    gameCount: 400,
    gamesUntilCeiling: null,
    volatility: 1.4, // σ≈¥22000 → 約55%で負け
    estimatedMinutes: 240,
  },
  {
    name: "お宝台 (朝から高設定確定)",
    type: "spot",
    trueEV: 4000,   // +¥16000/session期待値 (4h), 超優良台
    setting: 6,
    gameCount: 700,
    gamesUntilCeiling: null,
    volatility: 2.0, // σ≈¥32000 → 約31%で負けるがEV高い
    estimatedMinutes: 240,
  },
];

// ============================================================
// Random Events Pool
// ============================================================
export const EVENT_POOL: (GameEvent & { weight: number })[] = [
  {
    type: "gundan_intervention",
    title: "軍団の介入！",
    description: "プロ軍団が良台を先に取ってしまった。今日の稼ぎ場が少ない。",
    iconEmoji: "👥",
    effect: { evMultiplier: 0.6, daysAffected: 1 },
    weight: 15,
  },
  {
    type: "event_day",
    title: "イベント日！",
    description: "ホール全体がイベント日。高設定の投入率が上がっている。",
    iconEmoji: "🎉",
    effect: { evMultiplier: 1.5, daysAffected: 1 },
    weight: 10,
  },
  {
    type: "treasure_machine",
    title: "お宝台発見！",
    description: "誰も気づいていない高期待値台を発見した！",
    iconEmoji: "💎",
    effect: { moneyDelta: 0, identificationBonus: 1.0, skillXP: 50 },
    weight: 8,
  },
  {
    type: "kicked_out",
    title: "マークされた！",
    description: "ホールスタッフに目を付けられた。しばらくEVが下がる。",
    iconEmoji: "👁️",
    effect: { evMultiplier: 0.75, daysAffected: 2 },
    weight: 10,
  },
  {
    type: "lucky_bonus",
    title: "突発AT！",
    description: "設定判別中に突発でATが来た。棚ぼた収支！",
    iconEmoji: "⚡",
    effect: { moneyDelta: 15000 },
    weight: 12,
  },
  {
    type: "machine_breakdown",
    title: "台が故障！",
    description: "打っていた台が途中で故障。投資だけ回収できず。",
    iconEmoji: "🔧",
    effect: { moneyDelta: -5000 },
    weight: 8,
  },
  {
    type: "extra_info",
    title: "情報収集成功！",
    description: "ホールの設定傾向を掴んだ。設定判別精度が上がる。",
    iconEmoji: "📊",
    effect: { identificationBonus: 0.3, skillXP: 30 },
    weight: 15,
  },
];
