"use client";
import type { GameState } from "@/types/game";
import { DEFAULT_CONFIG } from "@/lib/gameConfig";

interface Props {
  state: GameState;
  onRestart: () => void;
}

export default function GameOverScreen({ state, onRestart }: Props) {
  const { player, currentDay, dayLogs } = state;
  const isGameClear = state.phase === "game_clear";
  const netProfit = player.money - DEFAULT_CONFIG.initialMoney;
  const bestDay = dayLogs.reduce(
    (best, log) => (log.netProfit > best.netProfit ? log : best),
    dayLogs[0] ?? { day: 0, netProfit: 0 }
  );

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl p-8 border border-gray-700 text-center">
        <div className="text-6xl mb-4">{isGameClear ? "🏆" : "💸"}</div>
        <h1 className={`text-3xl font-bold mb-2 ${isGameClear ? "text-yellow-400" : "text-red-400"}`}>
          {isGameClear ? "ゲームクリア！" : "ゲームオーバー"}
        </h1>
        <p className="text-gray-400 mb-6">
          {isGameClear
            ? `${DEFAULT_CONFIG.totalDays}日間の専業生活を完走しました！`
            : `Day ${currentDay}で軍資金が底をつきました…`}
        </p>

        <div className="bg-gray-800 rounded-xl p-5 mb-6 space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-gray-400">最終軍資金</span>
            <span className="text-white font-mono font-bold">¥{player.money.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">最終収支</span>
            <span className={`font-mono font-bold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
              {netProfit >= 0 ? "+" : ""}¥{netProfit.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">総勝ち額</span>
            <span className="text-green-400 font-mono">¥{player.totalWin.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">総負け額</span>
            <span className="text-red-400 font-mono">¥{player.totalLoss.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">総打席数</span>
            <span className="text-white">{player.gamesPlayed}回</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">最終スキル</span>
            <span className="text-purple-400">{player.skill}</span>
          </div>
          {bestDay && (
            <div className="flex justify-between">
              <span className="text-gray-400">最高収支日</span>
              <span className="text-yellow-400">Day {bestDay.day} (+¥{bestDay.netProfit.toLocaleString()})</span>
            </div>
          )}
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors text-lg"
        >
          もう一度プレイ 🎰
        </button>
      </div>
    </div>
  );
}
