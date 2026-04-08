"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_THEMES } from "@/lib/constants";

export default function Home() {
  const [customTheme, setCustomTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(60);
  const [savedThemes, setSavedThemes] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("savedThemes") || "[]");
    setSavedThemes(stored);
  }, []);

  const startQuiz = (theme: string) => {
    if (!theme.trim() || loading) return;
    setLoading(true);

    const existing = JSON.parse(localStorage.getItem("savedThemes") || "[]");
    const defaultLabels: string[] = DEFAULT_THEMES.map((t) => t.label);
    if (!defaultLabels.includes(theme.trim()) && !existing.includes(theme.trim())) {
      const updated = [theme.trim(), ...existing].slice(0, 10);
      localStorage.setItem("savedThemes", JSON.stringify(updated));
    }

    router.push(
      `/time-attack?theme=${encodeURIComponent(theme.trim())}&duration=${duration}`
    );
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6 animate-slide-up">
        {/* タイトル */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#0046AC]/10 rounded-full text-xs text-[#0046AC] font-medium">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            AI搭載クイズエンジン
          </div>
          <h1 className="text-5xl font-bold">
            <span className="bg-gradient-to-r from-[#003080] to-[#0046AC] bg-clip-text text-transparent">
              クイズラッシュ
            </span>
          </h1>
          <p className="text-gray-500 text-sm">
            テーマを選ぶだけ。AIがクイズをリアルタイム生成。
          </p>
        </div>

        {/* 制限時間設定 */}
        <div className="flex gap-2 justify-center">
          {[60, 90].map((sec) => (
            <button
              key={sec}
              onClick={() => setDuration(sec)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                duration === sec
                  ? "bg-[#0046AC] text-white shadow-md shadow-blue-500/25"
                  : "glass-card text-gray-600 hover:border-[#0046AC]"
              }`}
            >
              ⏱️ {sec}秒
            </button>
          ))}
        </div>

        {/* デフォルトテーマ */}
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 text-center uppercase tracking-wider">
            おすすめテーマ
          </p>
          <div className="grid grid-cols-3 gap-3">
            {DEFAULT_THEMES.map((t) => (
              <button
                key={t.label}
                onClick={() => startQuiz(t.label)}
                disabled={loading}
                className="group flex flex-col items-center gap-2 p-5 glass-card rounded-2xl hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span className="text-4xl group-hover:animate-float">
                  {t.emoji}
                </span>
                <span className="text-sm font-medium text-[#0046AC]">
                  {t.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 保存されたテーマ */}
        {savedThemes.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs font-medium text-gray-400 text-center uppercase tracking-wider">
              みんなが作ったテーマ
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {savedThemes.map((t) => (
                <button
                  key={t}
                  onClick={() => startQuiz(t)}
                  disabled={loading}
                  className="px-4 py-1.5 glass-card rounded-full text-sm text-[#0046AC] hover:bg-[#0046AC] hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* カスタムテーマ */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 text-center uppercase tracking-wider">
            自分でテーマを入力
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startQuiz(customTheme);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={customTheme}
              onChange={(e) => setCustomTheme(e.target.value)}
              placeholder="例: 宇宙、日本の歴史、プログラミング..."
              className="flex-1 px-4 py-3 rounded-xl border-2 border-white/60 focus:border-[#0046AC] focus:outline-none transition-colors glass-card"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!customTheme.trim() || loading}
              className="px-6 py-3 bg-[#0046AC] text-white rounded-xl font-medium hover:bg-[#003080] transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30"
            >
              開始
            </button>
          </form>
        </div>

        {loading && (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 glass-card rounded-full text-[#0046AC] text-sm">
              <div className="w-4 h-4 border-2 border-[#0046AC]/30 border-t-[#0046AC] rounded-full animate-spin" />
              AIが準備中...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
