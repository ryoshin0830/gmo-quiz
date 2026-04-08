import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { quizJsonSchema, SYSTEM_PROMPT } from "@/lib/quiz-schema";
import { QUESTIONS_PER_REQUEST, PARALLEL_REQUESTS } from "@/lib/constants";
import { QuizQuestion } from "@/types/quiz";

export async function POST(req: NextRequest) {
  const { theme } = await req.json();

  if (!theme || typeof theme !== "string") {
    return NextResponse.json({ error: "theme is required" }, { status: 400 });
  }

  try {
    // 4並列 x 5問 = 20問を同時生成
    const promises = Array.from({ length: PARALLEL_REQUESTS }, (_, i) =>
      openai.chat.completions.create({
        model: "gpt-5.4",
        max_completion_tokens: 4096,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `テーマ「${theme}」で${QUESTIONS_PER_REQUEST}問の4択クイズを作成してください。バッチ${i + 1}/${PARALLEL_REQUESTS}なので、他のバッチと重複しない問題を作ってください。`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: quizJsonSchema,
        },
      })
    );

    const results = await Promise.all(promises);

    const allQuestions: QuizQuestion[] = results.flatMap((r) => {
      const content = r.choices[0]?.message?.content;
      if (!content) return [];
      const parsed = JSON.parse(content);
      return parsed.questions as QuizQuestion[];
    });

    return NextResponse.json({ theme, questions: allQuestions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
