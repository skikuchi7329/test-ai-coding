"use client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { HistoryEntry } from "@/types/game";

interface Props {
  history: HistoryEntry[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const ev = payload.find((p) => p.name === "累計期待値");
  const profit = payload.find((p) => p.name === "累計実収支");
  const divergence =
    ev && profit ? profit.value - ev.value : null;

  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 text-xs shadow-xl">
      <p className="text-gray-400 font-bold mb-2">Day {label}</p>
      {ev && (
        <p style={{ color: ev.color }}>
          累計期待値:{" "}
          <span className="font-mono font-bold">
            {ev.value >= 0 ? "+" : ""}¥{ev.value.toLocaleString()}
          </span>
        </p>
      )}
      {profit && (
        <p style={{ color: profit.color }}>
          累計実収支:{" "}
          <span className="font-mono font-bold">
            {profit.value >= 0 ? "+" : ""}¥{profit.value.toLocaleString()}
          </span>
        </p>
      )}
      {divergence !== null && (
        <p className="mt-1 border-t border-gray-700 pt-1 text-gray-400">
          乖離:{" "}
          <span
            className={`font-mono font-bold ${
              Math.abs(divergence) < 10000
                ? "text-green-400"
                : divergence > 0
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {divergence >= 0 ? "+" : ""}¥{divergence.toLocaleString()}
          </span>
          <span className="ml-1 text-gray-500">
            {Math.abs(divergence) < 10000
              ? "（期待値通り）"
              : divergence > 0
              ? "（ツキあり）"
              : "（ツキなし）"}
          </span>
        </p>
      )}
    </div>
  );
}

function formatYAxis(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `¥${(value / 10000).toFixed(0)}万`;
  }
  return `¥${value.toLocaleString()}`;
}

export default function PerformanceChart({ history }: Props) {
  // Day 0 の原点を先頭に追加してグラフを0スタートに
  const chartData = [
    { day: 0, cumulativeEV: 0, cumulativeProfit: 0 },
    ...history.map((h) => ({
      day: h.day,
      cumulativeEV: h.cumulativeEV,
      cumulativeProfit: h.cumulativeProfit,
    })),
  ];

  const allValues = chartData.flatMap((d) => [d.cumulativeEV, d.cumulativeProfit]);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  // Y軸に10%の余白を持たせる
  const padding = Math.max(Math.abs(maxVal - minVal) * 0.1, 5000);
  const yMin = Math.floor((minVal - padding) / 5000) * 5000;
  const yMax = Math.ceil((maxVal + padding) / 5000) * 5000;

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-white">📈 累計収支グラフ</h4>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-0.5 bg-blue-400" style={{ borderTop: "2px dashed #60a5fa" }} />
            <span className="text-gray-400">累計期待値</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-5 h-0.5 bg-emerald-400" />
            <span className="text-gray-400">累計実収支</span>
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={(v) => (v === 0 ? "開始" : `D${v}`)}
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            axisLine={{ stroke: "#4b5563" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            domain={[yMin, yMax]}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="4 4" strokeWidth={1} />

          {/* 累計期待値: 青の点線 */}
          <Line
            type="monotone"
            dataKey="cumulativeEV"
            name="累計期待値"
            stroke="#60a5fa"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={false}
            activeDot={{ r: 4, fill: "#60a5fa", strokeWidth: 0 }}
          />

          {/* 累計実収支: 実線。プラスなら emerald、マイナスなら rose で色が変わるよう
              単一 Line では途中で色が変えられないので末端の値で決定 */}
          <Line
            type="monotone"
            dataKey="cumulativeProfit"
            name="累計実収支"
            stroke={
              (chartData[chartData.length - 1]?.cumulativeProfit ?? 0) >= 0
                ? "#34d399"
                : "#f87171"
            }
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 乖離サマリー */}
      {history.length > 0 && (() => {
        const last = history[history.length - 1];
        const divergence = last.cumulativeProfit - last.cumulativeEV;
        const isLucky = divergence > 5000;
        const isUnlucky = divergence < -5000;
        return (
          <div className="mt-3 flex justify-between items-center text-xs bg-gray-800 rounded-lg px-3 py-2">
            <span className="text-gray-400">
              期待値との乖離:{" "}
              <span className={`font-mono font-bold ${isLucky ? "text-yellow-400" : isUnlucky ? "text-red-400" : "text-green-400"}`}>
                {divergence >= 0 ? "+" : ""}¥{divergence.toLocaleString()}
              </span>
            </span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              isLucky ? "bg-yellow-900 text-yellow-300" :
              isUnlucky ? "bg-red-900 text-red-300" :
              "bg-green-900 text-green-300"
            }`}>
              {isLucky ? "🍀 ツキあり" : isUnlucky ? "😢 ツキなし" : "✅ 期待値通り"}
            </span>
          </div>
        );
      })()}
    </div>
  );
}
