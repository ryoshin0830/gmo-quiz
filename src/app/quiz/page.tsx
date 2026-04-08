"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QuizQuestion, QuizResult } from "@/types/quiz";

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
const CHOICE_KEYS = ["1", "2", "3", "4"] as const;

function QuizContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const theme = searchParams.get("theme") ?? "";

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult>({
    total: 0,
    correct: 0,
    answers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!theme) return;
    setLoading(true);
    fetch("/api/quiz/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [theme]);

  const currentQ = questions[currentIndex];
  const isAnswered = selectedIndex !== null;
  const isCorrect = selectedIndex === currentQ?.correctIndex;
  const isLast = currentIndex === questions.length - 1;

  const selectAnswer = useCallback(
    (index: number) => {
      if (isAnswered || !currentQ) return;
      setSelectedIndex(index);
      setResult((prev) => ({
        total: prev.total + 1,
        correct: prev.correct + (index === currentQ.correctIndex ? 1 : 0),
        answers: [
          ...prev.answers,
          {
            questionIndex: currentIndex,
            selectedIndex: index,
            isCorrect: index === currentQ.correctIndex,
          },
        ],
      }));
    },
    [isAnswered, currentQ, currentIndex]
  );

  const nextQuestion = useCallback(() => {
    if (!isAnswered) return;
    if (isLast) {
      sessionStorage.setItem("quizResult", JSON.stringify(result));
      sessionStorage.setItem("quizTheme", theme);
      sessionStorage.setItem("quizQuestions", JSON.stringify(questions));
      router.push("/results");
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
    }
  }, [isAnswered, isLast, result, theme, router, questions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        nextQuestion();
        return;
      }
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
  }, [selectAnswer, nextQuestion]);

  if (!theme) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">テーマが指定されていません</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-[#0046AC]/20 rounded-full" />
          <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-[#0046AC] rounded-full animate-spin" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-[#0046AC] font-bold text-xl">AIがクイズを作成中...</p>
          <p className="text-gray-400 text-sm">
            「{theme}」の20問を4並列で同時生成しています
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 bg-[#0046AC] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-red-500 text-lg">エラー: {error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 bg-[#0046AC] text-white rounded-lg cursor-pointer"
        >
          ホームに戻る
        </button>
      </div>
    );
  }

  if (!currentQ) return null;

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-5 animate-fade-in" key={currentIndex}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <span className="text-gray-400">
              テーマ: <span className="font-medium text-[#0046AC]">{theme}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">{result.correct}✓</span>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="w-full bg-white/50 rounded-full h-2 overflow-hidden">
          <div
            className="progress-shimmer h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 問題カード */}
        <div className="glass-card rounded-2xl shadow-lg shadow-blue-500/5 p-6 sm:p-8 space-y-6">
          <div className="flex items-start gap-3">
            <span className="shrink-0 w-10 h-10 bg-[#0046AC] text-white rounded-xl flex items-center justify-center font-bold text-sm">
              {currentIndex + 1}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed pt-1">
              {currentQ.question}
            </h2>
          </div>

          {/* 選択肢 */}
          <div className="grid gap-3">
            {currentQ.choices.map((choice, i) => {
              let btnClass =
                "w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer group ";
              if (!isAnswered) {
                btnClass +=
                  "border-gray-100 bg-white hover:border-[#0046AC] hover:bg-blue-50/50 hover:shadow-md hover:shadow-blue-500/5";
              } else if (i === currentQ.correctIndex) {
                btnClass += "border-green-400 bg-green-50 animate-correct";
              } else if (i === selectedIndex) {
                btnClass += "border-red-400 bg-red-50 animate-shake";
              } else {
                btnClass += "border-gray-100 opacity-40";
              }

              return (
                <button
                  key={i}
                  onClick={() => selectAnswer(i)}
                  disabled={isAnswered}
                  className={btnClass}
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                      isAnswered && i === currentQ.correctIndex
                        ? "bg-green-500 text-white shadow-md shadow-green-500/30"
                        : isAnswered && i === selectedIndex
                          ? "bg-red-500 text-white shadow-md shadow-red-500/30"
                          : "bg-[#0046AC]/8 text-[#0046AC] group-hover:bg-[#0046AC] group-hover:text-white"
                    }`}
                  >
                    {CHOICE_LABELS[i]}
                  </span>
                  <span className="flex-1 text-gray-700">{choice}</span>
                  <kbd className="text-xs text-gray-300 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                    {CHOICE_KEYS[i]}
                  </kbd>
                </button>
              );
            })}
          </div>

          {/* 解説 */}
          {isAnswered && (
            <div
              className={`p-4 rounded-xl animate-fade-in ${
                isCorrect
                  ? "bg-green-50 border border-green-200"
                  : "bg-red-50 border border-red-200"
              }`}
            >
              <p className="font-bold mb-1 text-lg">
                {isCorrect ? "⭕ 正解！" : "❌ 不正解..."}
              </p>
              <p className="text-gray-600 text-sm leading-relaxed">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* 次へ */}
        {isAnswered && (
          <button
            onClick={nextQuestion}
            className="w-full py-3.5 bg-[#0046AC] text-white rounded-xl font-medium hover:bg-[#003080] transition-all animate-fade-in cursor-pointer shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30"
          >
            {isLast ? "🎯 結果を見る" : "次の問題へ →"}
            <span className="text-blue-300 text-sm ml-2">(Enter)</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#0046AC]/30 border-t-[#0046AC] rounded-full animate-spin" />
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
