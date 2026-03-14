import type { GameConfig, SkillConfig, Machine, GameEvent, GameEventType } from "@/types/game";

export const DEFAULT_CONFIG: GameConfig = {
  initialMoney: 100_000,
  totalDays: 30,
  maxActionsPerDay: 3,
  gameOverThreshold: 10_000,
};

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
export const MACHINE_TEMPLATES: Omit<Machine, "id" | "perceivedEV" | "identificationProgress">[] = [
  {
    name: "バジリスク絆2 (天井狙い)",
    type: "highEV_ceiling",
    trueEV: 4800,
    setting: 1,
    gameCount: 890,
    gamesUntilCeiling: 90,
    volatility: 1.4,
    estimatedMinutes: 120,
  },
  {
    name: "スマスロ北斗 (ゾーン狙い)",
    type: "highEV_zone",
    trueEV: 3200,
    setting: 1,
    gameCount: 380,
    gamesUntilCeiling: null,
    volatility: 1.2,
    estimatedMinutes: 90,
  },
  {
    name: "ハナハナ (設定6狙い)",
    type: "setting_hunt",
    trueEV: 6500,
    setting: 6,
    gameCount: 200,
    gamesUntilCeiling: null,
    volatility: 0.9,
    estimatedMinutes: 180,
  },
  {
    name: "ジャグラー (設定5狙い)",
    type: "setting_hunt",
    trueEV: 3800,
    setting: 5,
    gameCount: 500,
    gamesUntilCeiling: null,
    volatility: 0.8,
    estimatedMinutes: 150,
  },
  {
    name: "マイジャグ (設定判別中)",
    type: "setting_hunt",
    trueEV: 1200,
    setting: 3,
    gameCount: 300,
    gamesUntilCeiling: null,
    volatility: 0.85,
    estimatedMinutes: 120,
  },
  {
    name: "Lエヴァ (天井ハイエナ)",
    type: "highEV_ceiling",
    trueEV: 5500,
    setting: 1,
    gameCount: 950,
    gamesUntilCeiling: 40,
    volatility: 1.6,
    estimatedMinutes: 60,
  },
  {
    name: "お宝台 (謎の高期待値台)",
    type: "spot",
    trueEV: 9000,
    setting: 6,
    gameCount: 700,
    gamesUntilCeiling: null,
    volatility: 2.0,
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
