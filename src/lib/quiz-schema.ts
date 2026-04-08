export const quizJsonSchema = {
  name: "quiz",
  strict: true,
  schema: {
    type: "object" as const,
    properties: {
      questions: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            question: { type: "string" as const },
            choices: {
              type: "array" as const,
              items: { type: "string" as const },
            },
            correctIndex: { type: "integer" as const },
            explanation: { type: "string" as const },
          },
          required: ["question", "choices", "correctIndex", "explanation"] as const,
          additionalProperties: false,
        },
      },
    },
    required: ["questions"] as const,
    additionalProperties: false,
  },
};

export const SYSTEM_PROMPT = `あなたはクイズ作成の専門家です。指定されたテーマに基づいて、4択クイズを生成してください。

ルール:
- 各問題は日本語で作成
- 選択肢は必ず4つ
- correctIndexは0〜3の整数（正解の選択肢のインデックス）
- 正解の位置はランダムに分散させること
- 難易度は一般知識レベルで、楽しく学べる内容にすること
- 解説は簡潔に1〜2文で`;
