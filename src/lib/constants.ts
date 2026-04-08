import { Level } from "@/types/quiz";

export const DEFAULT_THEMES = [
  { label: "世界遺産", emoji: "🏛️" },
  { label: "郷土料理", emoji: "🍜" },
  { label: "国の首都", emoji: "🌍" },
] as const;

export const QUESTIONS_PER_REQUEST = 5;
export const PARALLEL_REQUESTS = 4;
export const TOTAL_QUESTIONS = QUESTIONS_PER_REQUEST * PARALLEL_REQUESTS; // 20

export const LEVELS: Level[] = [
  { name: "神", minPercent: 100, color: "from-yellow-400 to-amber-500" },
  { name: "天才", minPercent: 80, color: "from-purple-500 to-indigo-600" },
  { name: "博士", minPercent: 60, color: "from-blue-500 to-cyan-500" },
  { name: "物知り", minPercent: 40, color: "from-green-500 to-emerald-500" },
  { name: "勉強中", minPercent: 20, color: "from-orange-400 to-yellow-500" },
  { name: "凡才", minPercent: 0, color: "from-gray-400 to-gray-500" },
];

export function getLevel(correctCount: number, total: number): Level {
  const percent = total === 0 ? 0 : (correctCount / total) * 100;
  return LEVELS.find((l) => percent >= l.minPercent) ?? LEVELS[LEVELS.length - 1];
}
