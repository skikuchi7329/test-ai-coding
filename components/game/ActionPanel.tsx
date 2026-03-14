"use client";
import type { Action } from "@/types/game";

interface Props {
  actions: Action[];
  actionsToday: number;
  maxActions: number;
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

export default function ActionPanel({ actions, actionsToday, maxActions, onSelect, disabled }: Props) {
  const remaining = maxActions - actionsToday;

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-bold text-lg">🎰 行動選択</h2>
        <div className="flex gap-1">
          {Array.from({ length: maxActions }).map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${i < actionsToday ? "bg-gray-600" : "bg-blue-400"}`}
            />
          ))}
          <span className="text-gray-400 text-sm ml-2">残り {remaining} アクション</span>
        </div>
      </div>

      <div className="space-y-2">
        {actions.map((action, idx) => {
          const risk = RISK_STYLE[action.riskLevel];
          const typeStyle = ACTION_TYPE_STYLE[action.type] ?? "";
          const isPositiveEV = action.expectedValue > 0;

          return (
            <button
              key={idx}
              onClick={() => onSelect(action)}
              disabled={disabled}
              className={`
                w-full text-left bg-gray-800 hover:bg-gray-700 active:bg-gray-600
                rounded-lg p-4 transition-all duration-150
                ${typeStyle}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:shadow-lg hover:shadow-blue-900/20"}
              `}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm truncate">{action.label}</div>
                  <div className="text-gray-400 text-xs mt-0.5 leading-relaxed">{action.description}</div>
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
                  {action.timeRequired > 0 && (
                    <span className="text-xs text-gray-500">⏱ {action.timeRequired}分</span>
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
