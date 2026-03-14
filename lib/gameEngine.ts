/**
 * gameEngine.ts
 * コアゲームロジック: 収支計算・乱数・状態遷移
 */
import type {
  GameState,
  Machine,
  Action,
  ActionResult,
  GameEvent,
  PlayerStats,
  Skill,
  ActiveEffect,
  DayLog,
  HistoryEntry,
} from "@/types/game";
import {
  DEFAULT_CONFIG,
  SKILL_TABLE,
  MACHINE_TEMPLATES,
  EVENT_POOL,
  getSkillConfig,
} from "./gameConfig";

// ============================================================
// RNG Utilities
// ============================================================

/** Box-Muller変換による正規分布乱数 (mean=0, std=1) */
function gaussianRandom(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** 期待値と分散から実際の収支を計算
 *
 * 実際のパチスロの収支分布を模倣:
 *   - 1日打っても設定6で期待値+数千円、σ±2〜3万円が現実
 *   - stdDev = volatility × 8000円 × sqrt(セッション時間/1h)
 *   - ハイエナ(2h,vol=2.5): σ≈¥28000, EV≈¥4000 → 約42%で負け
 *   - 設定6(4h,vol=1.5): σ≈¥24000, EV≈¥3000 → 約45%で負け
 *   - 低設定(4h,vol=1.3): σ≈¥21000, EV≈-¥2000 → 約54%で負け
 */
function simulateProfit(
  trueEV: number,
  volatility: number,
  estimatedMinutes: number
): number {
  const sessionEV = (trueEV * estimatedMinutes) / 60;
  const stdDev = volatility * 8000 * Math.sqrt(estimatedMinutes / 60);
  const profit = sessionEV + gaussianRandom() * stdDev;
  return Math.round(profit / 500) * 500;
}

// ============================================================
// Machine Generation
// ============================================================

function generateMachineId(): string {
  return Math.random().toString(36).slice(2, 9);
}

/** スキルレベルに応じて perceivedEV を算出 */
function calcPerceivedEV(
  trueEV: number,
  skill: Skill,
  type: Machine["type"]
): number {
  const cfg = getSkillConfig(skill);
  const accuracy = type === "setting_hunt" ? cfg.settingAccuracy : cfg.hyenaAccuracy;
  const noise = (1 - accuracy) * trueEV * (gaussianRandom() * 0.5);
  return Math.round((trueEV + noise) / 100) * 100;
}

export function generateMachines(skill: Skill, day: number): Machine[] {
  // 日が進むほど微妙に良台が出やすくなる演出（現実的なスケールに合わせて小さめ）
  const dayBonus = Math.min(day * 10, 100);
  const count = 4 + Math.floor(Math.random() * 3);
  const shuffled = [...MACHINE_TEMPLATES].sort(() => Math.random() - 0.5);

  return shuffled.slice(0, count).map((tmpl) => {
    const adjustedEV = tmpl.trueEV + dayBonus;
    return {
      ...tmpl,
      id: generateMachineId(),
      trueEV: adjustedEV,
      perceivedEV: calcPerceivedEV(adjustedEV, skill, tmpl.type),
      identificationProgress: tmpl.type === "setting_hunt" ? Math.random() * 0.3 : 0,
    };
  });
}

// ============================================================
// Action Generation
// ============================================================

export function generateActions(
  machines: Machine[],
  activeEffects: ActiveEffect[]
): Action[] {
  const evMultiplier = activeEffects.reduce(
    (acc, e) => acc * (e.event.effect.evMultiplier ?? 1),
    1
  );

  const actions: Action[] = machines.map((m) => {
    const isSettingHunt = m.type === "setting_hunt";
    const timeCost = isSettingHunt ? 4 : 2;
    return {
      type: isSettingHunt ? "setting_hunt" : "hyena",
      label: isSettingHunt ? `【設定狙い】${m.name}` : `【ハイエナ】${m.name}`,
      description: isSettingHunt
        ? `設定判別 ${Math.round(m.identificationProgress * 100)}% 完了。期待値 ¥${m.perceivedEV.toLocaleString()}/h`
        : `天井まで残り ${m.gamesUntilCeiling ?? "?"}G。期待値 ¥${m.perceivedEV.toLocaleString()}/h`,
      machine: m,
      riskLevel: m.volatility < 1.0 ? "low" : m.volatility < 1.5 ? "medium" : "high",
      expectedValue: Math.round(m.perceivedEV * evMultiplier * (m.estimatedMinutes / 60)),
      timeRequired: m.estimatedMinutes,
      timeCost,
    };
  });

  // 「店移動」: 台リストをリフレッシュ、1ユニット消費
  actions.push({
    type: "move",
    label: "【店移動】別のホールへ移動する",
    description: "期待値の低い店から脱出。新しい台リストに更新する。1ユニット消費。",
    riskLevel: "low",
    expectedValue: 0,
    timeRequired: 0,
    timeCost: 1,
  });

  // 「スキップ」: 残り時間をすべて消費して日を終了
  actions.push({
    type: "skip",
    label: "【終日スキップ】今日の稼働を終了する",
    description: "残り時間をすべて使い、今日の稼働を切り上げる。スキルEXP +10。",
    riskLevel: "low",
    expectedValue: 0,
    timeRequired: 0,
    timeCost: 0, // エンジン側で remainingTime 全消費
  });

  return actions;
}

// ============================================================
// Event System
// ============================================================

function rollRandomEvent(day: number): GameEvent | null {
  // 10%の確率でイベント発生 (日が進むほど少し増える)
  const threshold = 0.1 + day * 0.005;
  if (Math.random() > threshold) return null;

  const totalWeight = EVENT_POOL.reduce((acc, e) => acc + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const e of EVENT_POOL) {
    rand -= e.weight;
    if (rand <= 0) {
      const { weight: _w, ...event } = e;
      return event as GameEvent;
    }
  }
  return null;
}

// ============================================================
// Core: Execute Action
// ============================================================

export function executeAction(
  state: GameState,
  action: Action
): ActionResult {
  const skillCfg = getSkillConfig(state.player.skill);
  const evMultiplier = state.activeEffects.reduce(
    (acc, e) => acc * (e.event.effect.evMultiplier ?? 1),
    1
  );

  let actualProfit = 0;
  let eventBonus = 0;
  const events: GameEvent[] = [];
  const messages: string[] = [];

  if (action.type === "skip") {
    messages.push("今日の稼働を切り上げました。軍資金を守ることも立派な判断です。");
    return {
      action,
      actualProfit: 0,
      varianceBreakdown: { baseEV: 0, randomVariance: 0, eventBonus: 0 },
      events: [],
      messages,
      xpGained: 10,
    };
  }

  if (action.type === "move") {
    messages.push("🚶 別のホールへ移動しました。新しい台を確認しています…");
    return {
      action,
      actualProfit: 0,
      varianceBreakdown: { baseEV: 0, randomVariance: 0, eventBonus: 0 },
      events: [],
      messages,
      xpGained: 5,
    };
  }

  const machine = action.machine!;
  const adjustedEV = machine.trueEV * evMultiplier * skillCfg.evBonusMultiplier;

  // 収支シミュレーション
  const baseProfit = simulateProfit(adjustedEV, machine.volatility, machine.estimatedMinutes);
  const randomVariance = baseProfit - (adjustedEV * machine.estimatedMinutes) / 60;

  // イベント判定
  const event = rollRandomEvent(state.currentDay);
  if (event) {
    events.push(event);
    eventBonus = event.effect.moneyDelta ?? 0;
    if (event.effect.moneyDelta) {
      messages.push(`${event.iconEmoji} ${event.title}: ${event.description}`);
    }
  }

  actualProfit = baseProfit + eventBonus;

  // 結果メッセージ生成
  if (actualProfit > 0) {
    messages.push(
      `✅ ${machine.name} で +¥${actualProfit.toLocaleString()} の勝ち！`
    );
    if (actualProfit > action.expectedValue * 1.5) {
      messages.push("🎰 期待値を大きく上回る爆発！ラッキーセッションでした。");
    }
  } else if (actualProfit < 0) {
    messages.push(
      `❌ ${machine.name} で ¥${Math.abs(actualProfit).toLocaleString()} の負け…`
    );
    if (actualProfit < action.expectedValue * 2) {
      messages.push("😢 分散の洗礼。長期で見れば期待値通りに収束します。");
    }
  } else {
    messages.push(`➖ ${machine.name} は収支ゼロ。`);
  }

  const xpGained = calcXP(action, actualProfit, machine);

  return {
    action,
    actualProfit,
    varianceBreakdown: {
      baseEV: Math.round((adjustedEV * machine.estimatedMinutes) / 60),
      randomVariance: Math.round(randomVariance),
      eventBonus,
    },
    events,
    messages,
    xpGained,
  };
}

function calcXP(action: Action, profit: number, machine: Machine): number {
  let xp = 20;
  // 設定狙いはXP高め
  if (action.type === "setting_hunt") xp += 15;
  // 良い判断(EV高め)ほどXP加算
  xp += Math.floor(Math.abs(action.expectedValue) / 1000);
  // 結果に関わらず経験値は得られる（正しい判断を称える）
  return xp;
}

// ============================================================
// Skill Level Up Check
// ============================================================

export function checkSkillLevelUp(
  currentSkill: Skill,
  totalXP: number
): Skill {
  const levels: Skill[] = ["novice", "intermediate", "expert", "pro"];
  for (let i = levels.length - 1; i >= 0; i--) {
    const cfg = SKILL_TABLE[i];
    if (totalXP >= cfg.xpRequired) {
      return cfg.level;
    }
  }
  return "novice";
}

// ============================================================
// State Transitions
// ============================================================

export function initGameState(): GameState {
  const skill: Skill = "novice";
  const machines = generateMachines(skill, 1);
  return {
    phase: "title",
    player: {
      money: DEFAULT_CONFIG.initialMoney,
      totalWin: 0,
      totalLoss: 0,
      daysPassed: 0,
      totalDays: DEFAULT_CONFIG.totalDays,
      skill,
      gamesPlayed: 0,
      winStreak: 0,
      lossStreak: 0,
    },
    currentDay: 1,
    availableMachines: machines,
    availableActions: generateActions(machines, []),
    lastResult: null,
    activeEffects: [],
    dayLogs: [],
    currentDayLog: null,
    skillXP: 0,
    actionsToday: 0,
    maxActionsPerDay: DEFAULT_CONFIG.maxActionsPerDay,
    remainingTime: DEFAULT_CONFIG.timeUnitsPerDay,
    history: [],
  };
}

export function startDay(state: GameState): GameState {
  const machines = generateMachines(state.player.skill, state.currentDay);
  const actions = generateActions(machines, state.activeEffects);
  const dayLog: DayLog = {
    day: state.currentDay,
    date: `Day ${state.currentDay}`,
    actions: [],
    netProfit: 0,
    totalMoneyAfter: state.player.money,
    eventsOccurred: [],
  };
  return {
    ...state,
    phase: "action",
    availableMachines: machines,
    availableActions: actions,
    currentDayLog: dayLog,
    actionsToday: 0,
    remainingTime: DEFAULT_CONFIG.timeUnitsPerDay,
    lastResult: null,
  };
}

export function applyActionResult(
  state: GameState,
  result: ActionResult
): GameState {
  const newMoney = state.player.money + result.actualProfit;
  const newXP = state.skillXP + result.xpGained;
  const newSkill = checkSkillLevelUp(state.player.skill, newXP);

  const updatedPlayer: PlayerStats = {
    ...state.player,
    money: newMoney,
    totalWin:
      result.actualProfit > 0
        ? state.player.totalWin + result.actualProfit
        : state.player.totalWin,
    totalLoss:
      result.actualProfit < 0
        ? state.player.totalLoss + Math.abs(result.actualProfit)
        : state.player.totalLoss,
    gamesPlayed: state.player.gamesPlayed + 1,
    skill: newSkill,
    winStreak:
      result.actualProfit > 0 ? state.player.winStreak + 1 : 0,
    lossStreak:
      result.actualProfit < 0 ? state.player.lossStreak + 1 : 0,
  };

  // ActiveEffects に新イベントを追加
  const newEffects: ActiveEffect[] = [
    ...state.activeEffects,
    ...result.events
      .filter((e) => e.effect.daysAffected)
      .map((e) => ({
        event: e,
        remainingDays: e.effect.daysAffected!,
      })),
  ];

  const updatedDayLog: DayLog = state.currentDayLog
    ? {
        ...state.currentDayLog,
        actions: [...state.currentDayLog.actions, result],
        netProfit: state.currentDayLog.netProfit + result.actualProfit,
        totalMoneyAfter: newMoney,
        eventsOccurred: [
          ...state.currentDayLog.eventsOccurred,
          ...result.events,
        ],
      }
    : null!;

  const actionsToday = state.actionsToday + 1;

  // 時間消費: skip は残り時間を全部使い切る、それ以外は timeCost 分消費
  const consumed = result.action.type === "skip"
    ? state.remainingTime
    : result.action.timeCost;
  const remainingTime = Math.max(0, state.remainingTime - consumed);
  const dayDone = remainingTime <= 0;

  // 店移動の場合は台リストをリフレッシュ
  const newMachines = result.action.type === "move"
    ? generateMachines(updatedPlayer.skill, state.currentDay)
    : state.availableMachines;
  const newActions = result.action.type === "move"
    ? generateActions(newMachines, newEffects)
    : state.availableActions;

  // 日終了時にグラフ用履歴を追記
  let newHistory = state.history;
  if (dayDone) {
    const allActions = updatedDayLog?.actions ?? [];
    const dailyEV = allActions.reduce((sum, a) => sum + a.varianceBreakdown.baseEV, 0);
    const dailyProfit = updatedDayLog?.netProfit ?? 0;
    const prev = state.history[state.history.length - 1];
    const entry: HistoryEntry = {
      day: state.currentDay,
      dailyEV,
      dailyProfit,
      cumulativeEV: (prev?.cumulativeEV ?? 0) + dailyEV,
      cumulativeProfit: (prev?.cumulativeProfit ?? 0) + dailyProfit,
    };
    newHistory = [...state.history, entry];
  }

  return {
    ...state,
    player: updatedPlayer,
    lastResult: result,
    activeEffects: newEffects,
    skillXP: newXP,
    actionsToday,
    remainingTime,
    availableMachines: newMachines,
    availableActions: newActions,
    currentDayLog: updatedDayLog,
    history: newHistory,
    phase: dayDone ? "day_end" : "result",
  };
}

export function endDay(state: GameState): GameState {
  const updatedEffects = state.activeEffects
    .map((e) => ({ ...e, remainingDays: e.remainingDays - 1 }))
    .filter((e) => e.remainingDays > 0);

  const newDay = state.currentDay + 1;
  const logs = state.currentDayLog
    ? [...state.dayLogs, state.currentDayLog]
    : state.dayLogs;

  const updatedPlayer = { ...state.player, daysPassed: state.player.daysPassed + 1 };

  // ゲームオーバー / クリア判定
  if (state.player.money <= DEFAULT_CONFIG.gameOverThreshold) {
    return { ...state, phase: "game_over", activeEffects: updatedEffects, dayLogs: logs, currentDayLog: null };
  }
  if (newDay > DEFAULT_CONFIG.totalDays) {
    return { ...state, phase: "game_clear", activeEffects: updatedEffects, dayLogs: logs, currentDayLog: null };
  }

  // phase を day_start に戻す。currentDayLog をクリアしないと
  // DayEndPanel がそのまま残ってボタンが二重クリック可能になる
  return {
    ...state,
    phase: "day_start",
    currentDay: newDay,
    currentDayLog: null,
    activeEffects: updatedEffects,
    dayLogs: logs,
    player: updatedPlayer,
  };
}
