"use client";
import { useReducer, useCallback } from "react";
import type { GameState, Action } from "@/types/game";
import {
  initGameState,
  startDay,
  executeAction,
  applyActionResult,
  endDay,
} from "@/lib/gameEngine";
import StatusBar from "./StatusBar";
import ActionPanel from "./ActionPanel";
import ResultPanel from "./ResultPanel";
import DayEndPanel from "./DayEndPanel";
import GameOverScreen from "./GameOverScreen";

// ============================================================
// Reducer
// ============================================================

type GameAction =
  | { type: "START_GAME" }
  | { type: "START_DAY" }
  | { type: "SELECT_ACTION"; action: Action }
  | { type: "CONTINUE_AFTER_RESULT" }
  | { type: "NEXT_DAY" }
  | { type: "RESTART" };

function gameReducer(state: GameState, event: GameAction): GameState {
  switch (event.type) {
    case "START_GAME":
      return { ...state, phase: "day_start" };
    case "START_DAY":
      return startDay(state);
    case "SELECT_ACTION": {
      const result = executeAction(state, event.action);
      const next = applyActionResult(state, result);
      // 店移動は結果画面を挟まず即行動画面に戻す
      if (event.action.type === "move" && next.phase !== "day_end") {
        return { ...next, phase: "action", lastResult: null };
      }
      return next;
    }
    case "CONTINUE_AFTER_RESULT":
      return { ...state, phase: "action" };
    case "NEXT_DAY":
      return endDay(state);
    case "RESTART":
      return initGameState();
    default:
      return state;
  }
}

// ============================================================
// Main Dashboard
// ============================================================

export default function GameDashboard() {
  const [state, dispatch] = useReducer(gameReducer, undefined, initGameState);

  const handleSelectAction = useCallback((action: Action) => {
    dispatch({ type: "SELECT_ACTION", action });
  }, []);

  // --- Title Screen ---
  if (state.phase === "title") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center">
          <div className="text-6xl mb-4">🎰</div>
          <h1 className="text-4xl font-bold text-white mb-2">パチスロ専業</h1>
          <p className="text-xl text-yellow-400 font-bold mb-2">ローグライク</p>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed">
            軍資金 ¥100,000 を元手に、30日間で収支を最大化せよ。<br />
            ハイエナと設定狙いを駆使して、プロへの道を歩め。
          </p>
          <div className="bg-gray-800 rounded-xl p-4 mb-8 text-left text-sm text-gray-300 space-y-2">
            <div>⚡ <strong className="text-white">ハイエナ</strong>: 天井・ゾーン狙いで安定収益 <span className="text-teal-400">(-2U)</span></div>
            <div>🎯 <strong className="text-white">設定狙い</strong>: 高設定を見極めて大勝ち <span className="text-teal-400">(-4U)</span></div>
            <div>🚶 <strong className="text-white">店移動</strong>: 台リストをリフレッシュ <span className="text-teal-400">(-1U)</span></div>
            <div>🏁 <strong className="text-white">終日スキップ</strong>: 今日の稼働を終了する</div>
            <div className="text-gray-500 pt-1">1日12ユニット（10:00〜22:00）。0になったら強制終了。</div>
            <div>⚠️ 軍資金が ¥10,000 以下でゲームオーバー</div>
          </div>
          <button
            onClick={() => dispatch({ type: "START_GAME" })}
            className="bg-yellow-500 hover:bg-yellow-400 active:bg-yellow-600 text-black font-bold py-4 px-12 rounded-xl text-xl transition-colors shadow-lg shadow-yellow-900/40"
          >
            専業生活を始める 🚀
          </button>
        </div>
      </div>
    );
  }

  // --- Game Over / Clear ---
  if (state.phase === "game_over" || state.phase === "game_clear") {
    return (
      <GameOverScreen
        state={state}
        onRestart={() => dispatch({ type: "RESTART" })}
      />
    );
  }

  // --- Day Start (brief transition) ---
  if (state.phase === "day_start") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Day {state.currentDay} 開始</h2>
          <p className="text-gray-400 mb-6">今日の台を調査しました。行動を選択してください。</p>
          <button
            onClick={() => dispatch({ type: "START_DAY" })}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-10 rounded-lg transition-colors"
          >
            ホールへ向かう →
          </button>
        </div>
      </div>
    );
  }

  // --- Main Game Screen ---
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <StatusBar state={state} />

      <div className="flex-1 max-w-2xl mx-auto w-full">
        {state.phase === "action" && (
          <ActionPanel
            actions={state.availableActions}
            actionsToday={state.actionsToday}
            maxActions={state.maxActionsPerDay}
            remainingTime={state.remainingTime}
            onSelect={handleSelectAction}
          />
        )}

        {state.phase === "result" && state.lastResult && (
          <ResultPanel
            result={state.lastResult}
            onContinue={() => dispatch({ type: "CONTINUE_AFTER_RESULT" })}
            isDayEnd={false}
          />
        )}

        {state.phase === "day_end" && state.currentDayLog && (
          <DayEndPanel
            dayLog={state.currentDayLog}
            money={state.player.money}
            history={state.history}
            onNextDay={() => dispatch({ type: "NEXT_DAY" })}
          />
        )}
      </div>
    </div>
  );
}
