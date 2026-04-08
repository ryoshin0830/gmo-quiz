import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { quizJsonSchema, SYSTEM_PROMPT } from "@/lib/quiz-schema";
import { QUESTIONS_PER_REQUEST } from "@/lib/constants";
import { QuizQuestion } from "@/types/quiz";

export async function POST(req: NextRequest) {
  const { theme, existingQuestions } = await req.json();

  if (!theme || typeof theme !== "string") {
    return NextResponse.json({ error: "theme is required" }, { status: 400 });
  }

  try {
    const existing: string[] = existingQuestions ?? [];

    let userMessage = `テーマ「${theme}」で${QUESTIONS_PER_REQUEST}問の4択クイズを作成してください。`;

    if (existing.length > 0) {
      userMessage += `\n\n【重要】以下の${existing.length}問はすでに出題済みです。これらと同じ問題・同じ切り口・類似した内容の問題は絶対に生成しないでください。全く新しい観点から出題してください：\n${existing.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
    }

    const result = await openai.chat.completions.create({
      model: "gpt-5.4",
      max_completion_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      response_format: {
        type: "json_schema",
        json_schema: quizJsonSchema,
      },
    });

    const content = result.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "Failed to generate quiz" },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(content);
    const questions: QuizQuestion[] = parsed.questions;

    return NextResponse.json({ theme, questions });
  } catch (error) {
    console.error("Quiz generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
