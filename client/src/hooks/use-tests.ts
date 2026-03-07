import { useQuery } from "@tanstack/react-query";
import { type PracticeTest, type Question } from "@shared/schema";

// Mock data fallback in case backend is empty
const MOCK_TESTS: PracticeTest[] = [
  {
    id: "1",
    title: "IELTS Academic Reading Test 1",
    category: "IELTS",
    type: "Reading",
    isPremium: false,
    durationMinutes: 60,
    createdAt: new Date(),
  },
  {
    id: "2",
    title: "SAT Math Practice - Advanced",
    category: "SAT",
    type: "Math",
    isPremium: true,
    durationMinutes: 45,
    createdAt: new Date(),
  },
  {
    id: "3",
    title: "THPTQG English Mock Exam",
    category: "THPTQG",
    type: "General",
    isPremium: false,
    durationMinutes: 90,
    createdAt: new Date(),
  }
];

const MOCK_QUESTIONS: Question[] = [
  {
    id: "q1",
    testId: "1",
    text: "What is the main idea of the passage regarding renewable energy?",
    options: ["It is too expensive", "It will replace fossil fuels entirely by 2050", "It is a crucial component of future sustainability", "It has negative environmental impacts"],
    correctAnswer: "It is a crucial component of future sustainability",
    explanation: "The passage emphasizes sustainability over cost or absolute replacement."
  },
  {
    id: "q2",
    testId: "1",
    text: "According to paragraph 2, which country leads in solar adoption?",
    options: ["USA", "Germany", "China", "India"],
    correctAnswer: "Germany",
    explanation: "Paragraph 2 explicitly mentions Germany's pioneering role."
  }
];

export function useTests(category?: string) {
  return useQuery({
    queryKey: ["/api/tests", category],
    queryFn: async () => {
      try {
        const url = category ? `/api/tests?category=${category}` : "/api/tests";
        const res = await fetch(url, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch tests");
        const data = await res.json();
        return data.length > 0 ? data : MOCK_TESTS;
      } catch (err) {
        console.warn("Using mock tests due to error:", err);
        return MOCK_TESTS;
      }
    },
  });
}

export type TestWithQuestions = PracticeTest & { questions: Question[] };

export function useTest(id: string) {
  return useQuery({
    queryKey: ["/api/tests", id],
    queryFn: async (): Promise<TestWithQuestions> => {
      try {
        const res = await fetch(`/api/tests/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch test");
        return await res.json();
      } catch (err) {
        console.warn("Using mock test due to error:", err);
        const test = MOCK_TESTS.find(t => t.id === id) || MOCK_TESTS[0];
        return { ...test, questions: MOCK_QUESTIONS };
      }
    },
    enabled: !!id,
  });
}
