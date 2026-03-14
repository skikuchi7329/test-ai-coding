"use client";
import type { ActionResult } from "@/types/game";

interface Props {
  result: ActionResult;
  onContinue: () => void;
  isDayEnd?: boolean;
}

export default function ResultPanel({ result, onContinue, isDayEnd }: Props) {
  const { actualProfit, varianceBreakdown, events, messages, xpGained } = result;
  const isWin = actualProfit > 0;
  const isLoss = actualProfit < 0;

  return (
    <div className="p-4">
      <div className={`rounded-xl p-5 mb-4 border ${
        isWin ? "bg-green-950 border-green-700" :
        isLoss ? "bg-red-950 border-red-700" :
        "bg-gray-800 border-gray-600"
      }`}>
        {/* 収支メイン */}
        <div className="text-center mb-4">
          <div className="text-sm text-gray-400 mb-1">セッション収支</div>
          <div className={`text-4xl font-bold font-mono ${
            isWin ? "text-green-400" : isLoss ? "text-red-400" : "text-gray-300"
          }`}>
            {actualProfit >= 0 ? "+" : ""}¥{actualProfit.toLocaleString()}
          </div>
        </div>

        {/* 内訳 */}
        <div className="bg-black/30 rounded-lg p-3 text-xs font-mono space-y-1 mb-4">
          <div className="text-gray-400 mb-1">📐 収支内訳</div>
          <div className="flex justify-between">
            <span className="text-gray-400">期待値ベース</span>
            <span className={varianceBreakdown.baseEV >= 0 ? "text-green-400" : "text-red-400"}>
              {varianceBreakdown.baseEV >= 0 ? "+" : ""}¥{varianceBreakdown.baseEV.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">分散（ランダム）</span>
            <span className={varianceBreakdown.randomVariance >= 0 ? "text-blue-400" : "text-orange-400"}>
              {varianceBreakdown.randomVariance >= 0 ? "+" : ""}¥{varianceBreakdown.randomVariance.toLocaleString()}
            </span>
          </div>
          {varianceBreakdown.eventBonus !== 0 && (
            <div className="flex justify-between">
              <span className="text-gray-400">イベントボーナス</span>
              <span className="text-yellow-400">
                {varianceBreakdown.eventBonus >= 0 ? "+" : ""}¥{varianceBreakdown.eventBonus.toLocaleString()}
              </span>
            </div>
          )}
          <div className="border-t border-gray-600 pt-1 flex justify-between font-bold">
            <span className="text-gray-300">合計</span>
            <span className={isWin ? "text-green-400" : isLoss ? "text-red-400" : "text-gray-300"}>
              {actualProfit >= 0 ? "+" : ""}¥{actualProfit.toLocaleString()}
            </span>
          </div>
        </div>

        {/* メッセージ */}
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm text-gray-200">{msg}</div>
          ))}
        </div>

        {/* イベント詳細 */}
        {events.length > 0 && (
          <div className="mt-3 space-y-2">
            {events.map((e, i) => (
              <div key={i} className="bg-yellow-950 border border-yellow-700 rounded p-2 text-sm">
                <span className="font-bold text-yellow-300">{e.iconEmoji} {e.title}</span>
                <div className="text-yellow-200 text-xs mt-0.5">{e.description}</div>
              </div>
            ))}
          </div>
        )}

        {/* XP獲得 */}
        <div className="mt-3 text-right">
          <span className="text-xs text-purple-400">+{xpGained} XP 獲得</span>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
      >
        {isDayEnd ? "📋 今日のまとめへ" : "次のアクションへ →"}
      </button>
    </div>
  );
}
