"use client";
import type { Action } from "@/types/game";

interface Props {
  actions: Action[];
  actionsToday: number;
  maxActions: number;
  remainingTime: number;
  onSelect: (action: Action) => void;
  disabled?: boolean;
}

const RISK_STYLE = {
  low:    { label: "低リスク", cls: "bg-green-900 text-green-300 border-green-700" },
  medium: { label: "中リスク", cls: "bg-yellow-900 text-yellow-300 border-yellow-700" },
  high:   { label: "高リスク", cls: "bg-red-900 text-red-300 border-red-700" },
};

const ACTION_TYPE_STYLE: Record<string, string> = {
  hyena:         "border-l-4 border-l-blue-500",
  setting_hunt:  "border-l-4 border-l-purple-500",
  skip:          "border-l-4 border-l-gray-500",
  move:          "border-l-4 border-l-teal-500",
};

export default function ActionPanel({ actions, actionsToday, remainingTime, onSelect, disabled }: Props) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg">🎰 行動選択</h2>
        <span className="text-gray-400 text-sm">
          本日 {actionsToday} 回行動済み
        </span>
      </div>

      <div className="space-y-2">
        {actions.map((action, idx) => {
          const risk = RISK_STYLE[action.riskLevel];
          const typeStyle = ACTION_TYPE_STYLE[action.type] ?? "";
          const isPositiveEV = action.expectedValue > 0;
          // skip は timeCost=0 だが残り時間を全消費するので常に有効
          const isSkip = action.type === "skip";
          const notEnoughTime = !isSkip && action.timeCost > remainingTime;
          const isDisabled = disabled || notEnoughTime;

          return (
            <button
              key={idx}
              onClick={() => onSelect(action)}
              disabled={isDisabled}
              className={`
                w-full text-left bg-gray-800
                rounded-lg p-4 transition-all duration-150
                ${typeStyle}
                ${isDisabled
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-gray-700 active:bg-gray-600 cursor-pointer hover:shadow-lg hover:shadow-blue-900/20"}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{action.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5 leading-relaxed">{action.description}</div>
                  {notEnoughTime && (
                    <div className="text-red-400 text-xs mt-1">⚠ 時間が足りません</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded border ${risk.cls}`}>
                    {risk.label}
                  </span>
                  <span className={`font-mono font-bold text-sm ${
                    action.expectedValue === 0 ? "text-gray-400" :
                    isPositiveEV ? "text-green-400" : "text-red-400"
                  }`}>
                    {action.expectedValue === 0 ? "±¥0" :
                      (isPositiveEV ? "+" : "") + `¥${action.expectedValue.toLocaleString()}`}
                  </span>
                  {/* タイムコストバッジ */}
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                    isSkip
                      ? "bg-gray-700 text-gray-400"
                      : notEnoughTime
                        ? "bg-red-900 text-red-300"
                        : "bg-teal-900 text-teal-300"
                  }`}>
                    {isSkip ? "全消費" : `⏱ ${action.timeCost}U`}
                  </span>
                  {action.timeRequired > 0 && (
                    <span className="text-xs text-gray-600">{action.timeRequired}分</span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
