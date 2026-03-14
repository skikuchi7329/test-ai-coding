// ============================================================
// Core Game Types - パチスロ専業ローグライク
// ============================================================

// --- Player / Session State ---

export type Skill =
  | "novice"       // 初心者: ハイエナ精度低
  | "intermediate" // 中級者: ハイエナ安定、設定判別△
  | "expert"       // 上級者: 設定判別○、リスク管理○
  | "pro";         // プロ: 全能力最大

export interface PlayerStats {
  money: number;          // 現在の軍資金 (円)
  totalWin: number;       // 累計プラス収支
  totalLoss: number;      // 累計マイナス収支
  daysPassed: number;     // 経過日数 (0-indexed)
  totalDays: number;      // ゲームの総日数 (default: 30)
  skill: Skill;
  gamesPlayed: number;    // 総打席数
  winStreak: number;      // 連勝中日数
  lossStreak: number;     // 連敗中日数
}

// --- Machine (台) ---

export type MachineType =
  | "highEV_zone"     // ゾーン狙い (天井付近)
  | "highEV_ceiling"  // 天井狙い (ハマり台)
  | "setting_hunt"    // 設定狙い
  | "spot"            // お宝台 (特殊)

export interface Machine {
  id: string;
  name: string;
  type: MachineType;
  /** 期待値 (円/時) - プレイヤーには見えない真の値 */
  trueEV: number;
  /** プレイヤーが認知している期待値 (判別が進むほど trueEV に近づく) */
  perceivedEV: number;
  /** 判別進捗 0.0 ~ 1.0 (設定狙い専用) */
  identificationProgress: number;
  /** 台の設定 1~6 */
  setting: 1 | 2 | 3 | 4 | 5 | 6;
  /** ゲーム数 (ハマリ度合い) */
  gameCount: number;
  /** 天井までの残りG数 (ハイエナ用) */
  gamesUntilCeiling: number | null;
  /** 標準偏差係数 (低=安定, 高=荒波) */
  volatility: number;
  /** 1セッションの推定所要時間 (分) */
  estimatedMinutes: number;
}

// --- Action ---

export type ActionType = "hyena" | "setting_hunt" | "skip" | "move";

export interface Action {
  type: ActionType;
  label: string;
  description: string;
  machine?: Machine;
  riskLevel: "low" | "medium" | "high";
  /** 期待収支 (プレイヤーが判断に使う) */
  expectedValue: number;
  /** 所要時間 (分) - 表示用 */
  timeRequired: number;
  /** 消費タイムユニット数 (0=スキップで全消費) */
  timeCost: number;
}

// --- Action Result ---

export interface ActionResult {
  action: Action;
  /** 実際の収支 (円) */
  actualProfit: number;
  /** 分散要因の内訳 */
  varianceBreakdown: {
    baseEV: number;
    randomVariance: number;
    eventBonus: number;
  };
  /** 発生したイベント */
  events: GameEvent[];
  /** 結果メッセージ */
  messages: string[];
  /** セッション後のスキル経験値加算 */
  xpGained: number;
}

// --- Random Events ---

export type GameEventType =
  | "gundan_intervention"  // 軍団の介入: 良台を奪われる
  | "event_day"            // イベント日: 高設定多投
  | "treasure_machine"     // お宝台発見
  | "kicked_out"           // 出禁/マーク: EV低下
  | "lucky_bonus"          // ラッキーボーナス: 突発AT
  | "machine_breakdown"    // 台故障
  | "extra_info"           // 情報収集: 設定判別精度UP

export interface GameEvent {
  type: GameEventType;
  title: string;
  description: string;
  effect: EventEffect;
  iconEmoji: string;
}

export interface EventEffect {
  moneyDelta?: number;            // 即時収支変化
  evMultiplier?: number;          // EV倍率 (一時的)
  identificationBonus?: number;   // 判別精度ボーナス
  skillXP?: number;               // スキル経験値
  daysAffected?: number;          // 効果継続日数
  blockAction?: ActionType;       // 特定アクション不能
}

// --- Active Effects (バフ/デバフ) ---

export interface ActiveEffect {
  event: GameEvent;
  remainingDays: number;
}

// --- Day Log ---

export interface DayLog {
  day: number;
  date: string;             // 例: "Day 1"
  actions: ActionResult[];
  netProfit: number;        // その日の収支合計
  totalMoneyAfter: number;  // 日終了後の軍資金
  eventsOccurred: GameEvent[];
}

// --- Skill Progression ---

export interface SkillConfig {
  level: Skill;
  label: string;
  xpRequired: number;       // 次レベルまでの累計経験値
  hyenaAccuracy: number;    // ハイエナ精度 0.0~1.0 (EV認知精度)
  settingAccuracy: number;  // 設定判別精度 0.0~1.0
  evBonusMultiplier: number; // スキルによるEV補正
}

// --- Game State ---

export type GamePhase =
  | "title"      // タイトル画面
  | "day_start"  // 日の開始 (情報収集フェーズ)
  | "action"     // 行動選択フェーズ
  | "result"     // 結果表示
  | "day_end"    // 日終了サマリー
  | "game_over"  // 軍資金枯渇
  | "game_clear" // 30日クリア

export interface GameState {
  phase: GamePhase;
  player: PlayerStats;
  currentDay: number;
  availableMachines: Machine[];
  availableActions: Action[];
  lastResult: ActionResult | null;
  activeEffects: ActiveEffect[];
  dayLogs: DayLog[];
  currentDayLog: DayLog | null;
  skillXP: number;
  /** 当日すでに行動した回数 (表示用) */
  actionsToday: number;
  /** 1日の最大行動数 (レガシー互換) */
  maxActionsPerDay: number;
  /** 残りタイムユニット (1日12ユニット = 10:00〜22:00) */
  remainingTime: number;
}

// --- Config ---

export interface GameConfig {
  initialMoney: number;
  totalDays: number;
  maxActionsPerDay: number;
  gameOverThreshold: number;   // この金額以下でゲームオーバー
  timeUnitsPerDay: number;     // 1日のタイムユニット数
}
