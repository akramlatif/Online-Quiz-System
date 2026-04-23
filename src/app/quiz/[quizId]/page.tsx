import { notFound } from "next/navigation";
import db from "@/lib/prisma";
import QuizTaker from "./QuizTaker";

type Props = { params: Promise<{ quizId: string }> };

export async function generateMetadata({ params }: Props) {
  const { quizId } = await params;
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    select: { title: true, description: true },
  });
  return {
    title: quiz ? `${quiz.title} | Aetheria Quiz` : "Quiz Not Found | Aetheria Quiz",
    description: quiz?.description ?? "Take an interactive quiz on Aetheria Quiz.",
  };
}

export default async function QuizPage({ params }: Props) {
  const { quizId } = await params;
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { answers: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  if (!quiz || (!quiz.isPublished && quiz.questions.length === 0)) {
    notFound();
  }

  // Strip isCorrect from answers before sending to client
  // so the client cannot cheat by reading the response
  const safeQuiz = {
    ...quiz,
    questions: quiz.questions.map((q) => ({
      ...q,
      answers: q.answers.map((a) => ({
        id: a.id,
        text: a.text,
        // isCorrect intentionally omitted — revealed only after submission
        isCorrect: false as boolean,
      })),
    })),
  };

  return <QuizTaker quiz={safeQuiz} />;
}
