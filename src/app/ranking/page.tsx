"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface RankingEntry {
  playerName: string;
  theme: string;
  correctCount: number;
  totalAnswered: number;
  duration: number;
  date: string;
}

export default function RankingPage() {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("timeAttackRankings") || "[]");
    setRankings(stored);
  }, []);

  const getMedal = (index: number) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}`;
  };

  return (
    <div className="flex-1 flex flex-col items-center p-4 pt-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-[#0046AC]">🏆 ランキング</h1>
          <p className="text-gray-500 text-sm">タイムアタック正解数ランキング</p>
        </div>

        {rankings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-8 text-center text-gray-400">
            まだ記録がありません。タイムアタックに挑戦しよう！
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0046AC] text-white text-sm">
                  <th className="py-3 px-3 text-center w-12">#</th>
                  <th className="py-3 px-3 text-left">名前</th>
                  <th className="py-3 px-3 text-left">テーマ</th>
                  <th className="py-3 px-3 text-center">正解</th>
                  <th className="py-3 px-3 text-center">時間</th>
                </tr>
              </thead>
              <tbody>
                {rankings.map((entry, i) => (
                  <tr
                    key={i}
                    className={`border-b last:border-0 ${
                      i < 3 ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="py-3 px-3 text-center font-bold">
                      {getMedal(i)}
                    </td>
                    <td className="py-3 px-3 font-medium">{entry.playerName}</td>
                    <td className="py-3 px-3 text-sm text-gray-500">
                      {entry.theme}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#0046AC]">
                      {entry.correctCount}
                      <span className="text-xs text-gray-400">
                        /{entry.totalAnswered}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-sm text-gray-500">
                      {entry.duration}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <button
          onClick={() => router.push("/")}
          className="w-full py-3 border-2 border-[#0046AC] text-[#0046AC] rounded-xl font-medium hover:bg-blue-50 cursor-pointer"
        >
          ホームに戻る
        </button>
      </div>
    </div>
  );
}
