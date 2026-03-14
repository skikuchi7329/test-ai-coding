"use client";
import type { DayLog } from "@/types/game";

interface Props {
  dayLog: DayLog;
  money: number;
  onNextDay: () => void;
}

export default function DayEndPanel({ dayLog, money, onNextDay }: Props) {
  const { day, actions, netProfit, eventsOccurred } = dayLog;
  const isProfit = netProfit > 0;

  return (
    <div className="p-4">
      <div className="bg-gray-800 rounded-xl p-5 mb-4 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4 text-center">
          📋 Day {day} 終了サマリー
        </h3>

        {/* 日収支 */}
        <div className={`rounded-lg p-4 text-center mb-4 ${
          isProfit ? "bg-green-950 border border-green-700" : "bg-red-950 border border-red-700"
        }`}>
          <div className="text-sm text-gray-400">本日の収支</div>
          <div className={`text-3xl font-bold font-mono ${isProfit ? "text-green-400" : "text-red-400"}`}>
            {netProfit >= 0 ? "+" : ""}¥{netProfit.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            残軍資金: <span className="text-white font-mono">¥{money.toLocaleString()}</span>
          </div>
        </div>

        {/* アクション履歴 */}
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-400 mb-2">本日のアクション</div>
          {actions.map((r, i) => (
            <div key={i} className="flex justify-between items-center text-sm bg-gray-700/50 rounded px-3 py-2">
              <span className="text-gray-300 truncate flex-1">{r.action.label}</span>
              <span className={`font-mono font-bold ml-2 ${
                r.actualProfit > 0 ? "text-green-400" :
                r.actualProfit < 0 ? "text-red-400" : "text-gray-400"
              }`}>
                {r.actualProfit >= 0 ? "+" : ""}¥{r.actualProfit.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* 発生イベント */}
        {eventsOccurred.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-2">発生イベント</div>
            {eventsOccurred.map((e, i) => (
              <div key={i} className="text-xs text-yellow-300">
                {e.iconEmoji} {e.title}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onNextDay}
        className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors"
      >
        Day {day + 1} へ進む 🌅
      </button>
    </div>
  );
}
