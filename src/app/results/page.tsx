"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { QuizQuestion, QuizResult } from "@/types/quiz";
import { getLevel } from "@/lib/constants";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

function ResultsContent() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [theme, setTheme] = useState("");
  const [showLevel, setShowLevel] = useState(false);
  const [countUp, setCountUp] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("quizResult");
    const storedTheme = sessionStorage.getItem("quizTheme");
    const storedQuestions = sessionStorage.getItem("quizQuestions");
    if (!stored) {
      router.push("/");
      return;
    }
    setResult(JSON.parse(stored));
    setTheme(storedTheme ?? "");
    if (storedQuestions) setQuestions(JSON.parse(storedQuestions));
  }, [router]);

  useEffect(() => {
    if (!result) return;
    const target = result.correct;
    if (target === 0) {
      setShowLevel(true);
      return;
    }
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setCountUp(current);
      if (current >= target) {
        clearInterval(interval);
        setTimeout(() => {
          setShowLevel(true);
          if (current === result.total) {
            setShowConfetti(true);
          }
        }, 400);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [result]);

  if (!result) return null;

  const level = getLevel(result.correct, result.total);
  const percent =
    result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);

  const getMessage = () => {
    if (percent === 100) return "完璧です！あなたは真の知識王！👑";
    if (percent >= 80) return "素晴らしい！かなりの知識をお持ちです！";
    if (percent >= 60) return "なかなかの実力！さらに上を目指しましょう！";
    if (percent >= 40) return "もう少し！次はもっといけるはず！";
    if (percent >= 20) return "まだまだこれから！挑戦あるのみ！";
    return "ドンマイ！知識は学べば増える！";
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className={`w-full ${showReview ? "max-w-2xl" : "max-w-md"} space-y-6 text-center animate-slide-up transition-all`}>
        {/* テーマ */}
        <div className="inline-flex items-center gap-2 px-3 py-1 glass-card rounded-full text-xs text-gray-500">
          テーマ: <span className="font-medium text-[#0046AC]">{theme}</span>
        </div>

        {/* スコアカード */}
        <div className="glass-card rounded-3xl shadow-xl shadow-blue-500/10 p-8 space-y-6 relative overflow-hidden">
          {/* 背景グラデーション */}
          {showLevel && (
            <div
              className={`absolute inset-0 bg-gradient-to-br ${level.color} opacity-[0.07] transition-opacity duration-1000`}
            />
          )}

          <div className="relative space-y-3">
            <p className="text-8xl font-bold text-[#0046AC] tabular-nums leading-none">
              {countUp}
              <span className="text-3xl text-gray-300 font-normal">
                {" "}
                / {result.total}
              </span>
            </p>

            {/* 正誤ドット */}
            <div className="flex justify-center gap-1 py-2">
              {result.answers.map((a, i) => (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    a.isCorrect
                      ? "bg-green-400 shadow-sm shadow-green-400/50"
                      : "bg-red-300"
                  }`}
                  style={{ animationDelay: `${i * 30}ms` }}
                />
              ))}
            </div>

            <p className="text-gray-400 text-lg">{percent}% 正解</p>
          </div>

          {/* レベルバッジ */}
          {showLevel && (
            <div className="relative space-y-4 animate-scale-in">
              <div
                className={`inline-block px-12 py-6 rounded-2xl bg-gradient-to-r ${level.color} text-white shadow-2xl transform hover:scale-105 transition-transform`}
              >
                <p className="text-5xl font-black tracking-tight">{level.name}</p>
              </div>
              <p className="text-gray-500 text-sm">{getMessage()}</p>

              {showConfetti && (
                <div className="flex justify-center gap-2 text-3xl">
                  {["🎉", "🎊", "✨", "👑", "✨", "🎊", "🎉"].map((e, i) => (
                    <span
                      key={i}
                      className="animate-bounce"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      {e}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 振り返りトグル */}
        {questions.length > 0 && (
          <button
            onClick={() => setShowReview((v) => !v)}
            className="w-full py-3 glass-card rounded-xl text-[#0046AC] font-medium hover:bg-white/80 transition-all cursor-pointer text-sm"
          >
            {showReview ? "▲ 振り返りを閉じる" : "▼ 振り返りを見る"}
          </button>
        )}

        {/* 振り返りセクション */}
        {showReview && questions.length > 0 && (
          <div className="space-y-3 text-left animate-fade-in">
            {questions.map((q, qi) => {
              const answer = result.answers[qi];
              if (!answer) return null;
              const isCorrect = answer.isCorrect;

              return (
                <div
                  key={qi}
                  className="glass-card rounded-xl p-4 space-y-3"
                >
                  {/* 問題ヘッダー */}
                  <div className="flex items-start gap-2">
                    <span
                      className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                        isCorrect ? "bg-green-500" : "bg-red-400"
                      }`}
                    >
                      {isCorrect ? "○" : "×"}
                    </span>
                    <p className="text-sm font-bold text-gray-800 leading-relaxed">
                      Q{qi + 1}. {q.question}
                    </p>
                  </div>

                  {/* 選択肢 */}
                  <div className="grid gap-1.5 pl-9">
                    {q.choices.map((choice, ci) => {
                      const isCorrectChoice = ci === q.correctIndex;
                      const isUserChoice = ci === answer.selectedIndex;
                      let cls =
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ";
                      if (isCorrectChoice) {
                        cls += "bg-green-50 border border-green-300 text-green-800 font-medium";
                      } else if (isUserChoice && !isCorrect) {
                        cls += "bg-red-50 border border-red-300 text-red-700 line-through";
                      } else {
                        cls += "text-gray-400";
                      }

                      return (
                        <div key={ci} className={cls}>
                          <span className="font-bold w-4">{CHOICE_LABELS[ci]}</span>
                          <span>{choice}</span>
                          {isCorrectChoice && (
                            <span className="ml-auto text-green-600">✓ 正解</span>
                          )}
                          {isUserChoice && !isCorrect && (
                            <span className="ml-auto text-red-400">あなたの回答</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 解説 */}
                  <p className="text-xs text-gray-500 pl-9 leading-relaxed">
                    💡 {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* アクション */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              sessionStorage.removeItem("quizResult");
              sessionStorage.removeItem("quizTheme");
              sessionStorage.removeItem("quizQuestions");
              router.push("/");
            }}
            className="flex-1 py-3.5 border-2 border-[#0046AC]/20 text-[#0046AC] rounded-xl font-medium hover:bg-white/80 transition-all cursor-pointer"
          >
            ホームに戻る
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem("quizResult");
              sessionStorage.removeItem("quizQuestions");
              router.push(`/quiz?theme=${encodeURIComponent(theme)}`);
            }}
            className="flex-1 py-3.5 bg-[#0046AC] text-white rounded-xl font-medium hover:bg-[#003080] transition-all cursor-pointer shadow-lg shadow-blue-500/20"
          >
            もう一度挑戦
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsContent />
    </Suspense>
  );
}
