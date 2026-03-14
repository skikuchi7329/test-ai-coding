"use client";
import type { GameState } from "@/types/game";
import { getSkillConfig } from "@/lib/gameConfig";
import { DEFAULT_CONFIG } from "@/lib/gameConfig";

interface Props {
  state: GameState;
}

export default function StatusBar({ state }: Props) {
  const { player, currentDay, skillXP, activeEffects } = state;
  const skillCfg = getSkillConfig(player.skill);
  const nextSkill = ["novice", "intermediate", "expert", "pro"];
  const nextIdx = nextSkill.indexOf(player.skill) + 1;
  const nextCfg = nextIdx < nextSkill.length
    ? getSkillConfig(nextSkill[nextIdx] as typeof player.skill)
    : null;
  const xpProgress = nextCfg
    ? ((skillXP - skillCfg.xpRequired) / (nextCfg.xpRequired - skillCfg.xpRequired)) * 100
    : 100;

  const moneyRatio = player.money / DEFAULT_CONFIG.initialMoney;
  const moneyColor =
    moneyRatio > 1.2 ? "text-green-400" :
    moneyRatio > 0.8 ? "text-yellow-300" :
    moneyRatio > 0.5 ? "text-orange-400" : "text-red-400";

  const netProfit = player.money - DEFAULT_CONFIG.initialMoney;

  return (
    <div className="bg-gray-900 border-b border-gray-700 px-4 py-3">
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">

        {/* 軍資金 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">💰 軍資金</div>
          <div className={`text-xl font-bold font-mono ${moneyColor}`}>
            ¥{player.money.toLocaleString()}
          </div>
          <div className={`text-xs font-mono ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
            {netProfit >= 0 ? "+" : ""}¥{netProfit.toLocaleString()}
          </div>
        </div>

        {/* 日数 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">📅 経過日数</div>
          <div className="text-xl font-bold text-white">
            Day <span className="text-blue-400">{currentDay}</span>
            <span className="text-gray-500 text-sm"> / {DEFAULT_CONFIG.totalDays}</span>
          </div>
          <div className="mt-1 bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(currentDay / DEFAULT_CONFIG.totalDays) * 100}%` }}
            />
          </div>
        </div>

        {/* スキル */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">⚡ スキル</div>
          <div className="text-lg font-bold text-purple-400">{skillCfg.label}</div>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
              <div
                className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400">{skillXP}xp</span>
          </div>
        </div>

        {/* 統計 */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">📊 通算成績</div>
          <div className="flex gap-3 text-sm">
            <div>
              <span className="text-gray-400">勝: </span>
              <span className="text-green-400 font-mono">¥{player.totalWin.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-400">負: </span>
              <span className="text-red-400 font-mono">¥{player.totalLoss.toLocaleString()}</span>
            </div>
          </div>
          {activeEffects.length > 0 && (
            <div className="mt-1 flex gap-1 flex-wrap">
              {activeEffects.map((e, i) => (
                <span key={i} className="text-xs bg-yellow-900 text-yellow-300 px-1 rounded">
                  {e.event.iconEmoji} {e.remainingDays}日
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
