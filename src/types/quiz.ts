export interface QuizQuestion {
  question: string;
  choices: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  theme: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  total: number;
  correct: number;
  answers: { questionIndex: number; selectedIndex: number; isCorrect: boolean }[];
}

export type Level = {
  name: string;
  minPercent: number;
  color: string;
};
