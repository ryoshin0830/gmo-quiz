"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuizQuestion } from "@/types/quiz";
import { PREFETCH_THRESHOLD } from "@/lib/constants";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
const CHOICE_KEYS = ["1", "2", "3", "4"] as const;
const TIME_OPTIONS = [30, 60] as const;
const PENALTY_SECONDS = 5;

function TimeAttackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = searchParams.get("theme") ?? "";
  const duration = Number(searchParams.get("duration") ?? "60");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [penaltyFlash, setPenaltyFlash] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [saved, setSaved] = useState(false);
  const [answeredHistory, setAnsweredHistory] = useState<
    { question: QuizQuestion; selectedIndex: number; isCorrect: boolean }[]
  >([]);
  const [showReview, setShowReview] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const questionsRef = useRef<QuizQuestion[]>([]);
  const isFetchingRef = useRef(false);

  // questionsRefを同期
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // クイズ生成
  const fetchQuestions = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const existingQuestions = questionsRef.current.map((q) => q.question);
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, existingQuestions }),
      });
      const data = await res.json();
      if (data.questions) {
        setQuestions((prev) => [...prev, ...data.questions]);
        setLoading(false);
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [theme]);

  // 初回ロード
  useEffect(() => {
    if (!theme) return;
    fetchQuestions();
  }, [theme, fetchQuestions]);

  // プリフェッチ: 残り10問になったら追加生成
  useEffect(() => {
    if (questions.length - currentIndex <= PREFETCH_THRESHOLD && !gameOver && !loading) {
      fetchQuestions();
    }
  }, [currentIndex, questions.length, gameOver, loading, fetchQuestions]);

  // タイマー
  useEffect(() => {
    if (loading || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, gameOver]);

  const currentQ = questions[currentIndex];

  const selectAnswer = useCallback(
    (index: number) => {
      if (selectedIndex !== null || !currentQ || gameOver) return;
      setSelectedIndex(index);
      setShowFeedback(true);
      setTotalAnswered((p) => p + 1);

      const isCorrect = index === currentQ.correctIndex;
      setAnsweredHistory((prev) => [
        ...prev,
        { question: currentQ, selectedIndex: index, isCorrect },
      ]);
      if (isCorrect) {
        setCorrectCount((p) => p + 1);
      } else {
        // ペナルティ
        setPenaltyFlash(true);
        setTimeLeft((prev) => {
          const next = prev - PENALTY_SECONDS;
          if (next <= 0) {
            setGameOver(true);
            return 0;
          }
          return next;
        });
        setTimeout(() => setPenaltyFlash(false), 500);
      }

      // 0.8秒後に次の問題へ自動遷移
      feedbackTimeoutRef.current = setTimeout(() => {
        setSelectedIndex(null);
        setShowFeedback(false);
        setCurrentIndex((i) => i + 1);
      }, 800);
    },
    [selectedIndex, currentQ, gameOver]
  );

  // キーボードショートカット
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (gameOver) return;
      const keyIndex = CHOICE_KEYS.indexOf(e.key as (typeof CHOICE_KEYS)[number]);
      if (keyIndex !== -1) {
        selectAnswer(keyIndex);
        return;
      }
      const letterMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3 };
      if (e.key.toLowerCase() in letterMap) {
        selectAnswer(letterMap[e.key.toLowerCase()]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectAnswer, gameOver]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  // ランキング保存
  const saveRanking = () => {
    if (!playerName.trim()) return;
    const rankings = JSON.parse(localStorage.getItem("timeAttackRankings") || "[]");
    rankings.push({
      playerName: playerName.trim(),
      theme,
      correctCount,
      totalAnswered,
      duration,
      date: new Date().toISOString(),
    });
    rankings.sort((a: { correctCount: number }, b: { correctCount: number }) => b.correctCount - a.correctCount);
    localStorage.setItem("timeAttackRankings", JSON.stringify(rankings.slice(0, 100)));
    setSaved(true);
  };

  if (!theme) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">テーマが指定されていません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-8 p-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-400 font-medium">テーマ</p>
          <p className="text-2xl font-bold text-[#0046AC]">{theme}</p>
        </div>

        <div className="flex gap-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-[#0046AC] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <div className="text-center space-y-1">
          <p className="text-gray-600 font-medium">
            AIがクイズを準備中...
          </p>
          <p className="text-xs text-gray-400">
            制限時間 {duration}秒のタイムアタック
          </p>
        </div>
      </div>
    );
  }

  // ゲームオーバー画面
  if (gameOver) {
    const accuracy = totalAnswered === 0 ? 0 : Math.round((correctCount / totalAnswered) * 100);
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full ${showReview ? "max-w-2xl" : "max-w-md"} space-y-6 text-center animate-fade-in transition-all`}>
          <h2 className="text-2xl font-bold text-[#0046AC]">⏰ タイムアップ！</h2>
          <div className="bg-white rounded-2xl shadow-lg p-8 space-y-4">
            <p className="text-5xl font-bold text-[#0046AC]">{correctCount}</p>
            <p className="text-gray-500">正解数（{totalAnswered}問中）</p>
            <p className="text-sm text-gray-400">正答率: {accuracy}%</p>

            {!saved ? (
              <div className="space-y-3 pt-4 border-t">
                <p className="text-sm font-medium text-gray-600">ランキングに登録</p>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="名前を入力"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-[#0046AC] focus:outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRanking();
                  }}
                />
                <button
                  onClick={saveRanking}
                  disabled={!playerName.trim()}
                  className="w-full py-2 bg-[#0046AC] text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer"
                >
                  登録
                </button>
              </div>
            ) : (
              <p className="text-green-600 font-medium pt-4">✅ ランキングに登録しました！</p>
            )}
          </div>

          {/* 振り返りトグル */}
          {answeredHistory.length > 0 && (
            <button
              onClick={() => setShowReview((v) => !v)}
              className="w-full py-3 glass-card rounded-xl text-[#0046AC] font-medium hover:bg-white/80 transition-all cursor-pointer text-sm"
            >
              {showReview ? "▲ 振り返りを閉じる" : "▼ 振り返りを見る"}
            </button>
          )}

          {/* 振り返りセクション */}
          {showReview && answeredHistory.length > 0 && (
            <div className="space-y-3 text-left animate-fade-in">
              {answeredHistory.map((h, qi) => (
                <div key={qi} className="glass-card rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        h.isCorrect ? "bg-green-500" : "bg-red-400"
                      }`}
                    >
                      {h.isCorrect ? "○" : "×"}
                    </span>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                      Q{qi + 1}. {h.question.question}
                    </p>
                  </div>
                  <div className="grid gap-1.5 pl-9">
                    {h.question.choices.map((choice, ci) => {
                      const isCorrectChoice = ci === h.question.correctIndex;
                      const isUserChoice = ci === h.selectedIndex;
                      let cls = "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ";
                      if (isCorrectChoice) {
                        cls += "bg-green-50 border border-green-300 text-green-800 font-medium";
                      } else if (isUserChoice && !h.isCorrect) {
                        cls += "bg-red-50 border border-red-300 text-red-700 line-through";
                      } else {
                        cls += "text-gray-400";
                      }
                      return (
                        <div key={ci} className={cls}>
                          <span className="font-bold w-4">{CHOICE_LABELS[ci]}</span>
                          <span>{choice}</span>
                          {isCorrectChoice && <span className="ml-auto text-green-600">✓ 正解</span>}
                          {isUserChoice && !h.isCorrect && <span className="ml-auto text-red-400">あなたの回答</span>}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-500 pl-9 leading-relaxed">
                    💡 {h.question.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex-1 py-3 border-2 border-[#0046AC] text-[#0046AC] rounded-xl font-medium hover:bg-blue-50 cursor-pointer"
            >
              ホーム
            </button>
            <button
              onClick={() => router.push(`/ranking`)}
              className="flex-1 py-3 bg-[#0046AC]/80 text-white rounded-xl font-medium hover:bg-[#0046AC] cursor-pointer"
            >
              ランキング
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#0046AC]/30 border-t-[#0046AC] rounded-full animate-spin" />
      </div>
    );
  }

  const timePercent = (timeLeft / duration) * 100;
  const timeColor =
    timeLeft <= 10 ? "bg-red-500" : timeLeft <= 20 ? "bg-yellow-500" : "bg-[#0046AC]";

  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center p-4 transition-colors duration-200 ${
        penaltyFlash ? "bg-red-100" : ""
      }`}
    >
      <div className="w-full max-w-2xl space-y-4">
        {/* ヘッダー情報 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              テーマ: <span className="font-medium text-[#0046AC]">{theme}</span>
            </span>
            <span className="bg-[#0046AC] text-white px-3 py-1 rounded-full text-sm font-bold">
              ✅ {correctCount}
            </span>
          </div>
          <span
            className={`text-2xl font-bold tabular-nums ${
              timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-[#0046AC]"
            }`}
          >
            {timeLeft}s
          </span>
        </div>

        {/* タイマーバー */}
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`${timeColor} h-3 rounded-full transition-all duration-1000 ease-linear`}
            style={{ width: `${timePercent}%` }}
          />
        </div>

        {/* ペナルティ表示 */}
        {penaltyFlash && (
          <div className="text-center text-red-500 font-bold text-lg animate-fade-in">
            -{PENALTY_SECONDS}秒
          </div>
        )}

        {/* 問題カード */}
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-4" key={currentIndex}>
          <h2 className="text-lg font-bold text-gray-800 leading-relaxed animate-fade-in">
            Q{currentIndex + 1}. {currentQ.question}
          </h2>

          <div className="grid grid-cols-2 gap-3">
            {currentQ.choices.map((choice, i) => {
              let btnClass =
                "text-left p-3 rounded-xl border-2 transition-all flex items-center gap-2 cursor-pointer text-sm ";
              if (!showFeedback) {
                btnClass +=
                  "border-gray-200 hover:border-[#0046AC] hover:bg-blue-50";
              } else if (i === currentQ.correctIndex) {
                btnClass += "border-green-500 bg-green-50";
              } else if (i === selectedIndex) {
                btnClass += "border-red-500 bg-red-50";
              } else {
                btnClass += "border-gray-200 opacity-50";
              }

              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={showFeedback}
                  className={btnClass}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      showFeedback && i === currentQ.correctIndex
                        ? "bg-green-500 text-white"
                        : showFeedback && i === selectedIndex
                          ? "bg-red-500 text-white"
                          : "bg-[#0046AC]/10 text-[#0046AC]"
                    }`}
                  >
                    {CHOICE_LABELS[i]}
                  </span>
                  <span className="flex-1">{choice}</span>
                  <span className="text-xs text-gray-400">{CHOICE_KEYS[i]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimeAttackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#0046AC]/30 border-t-[#0046AC] rounded-full animate-spin" />
        </div>
      }
    >
      <TimeAttackContent />
    </Suspense>
  );
}
