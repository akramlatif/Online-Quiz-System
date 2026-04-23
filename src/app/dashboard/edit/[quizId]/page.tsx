import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import QuizEditor from "./QuizEditor";

type Props = { params: Promise<{ quizId: string }> };

export const metadata = {
  title: "Edit Quiz | Aetheria Quiz",
  description: "Modify your quiz content and settings.",
};

export default async function EditQuizPage({ params }: Props) {
  const { quizId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { answers: true },
      },
    },
  });

  if (!quiz) {
    notFound();
  }

  // Ensure only the creator can edit
  if (quiz.creatorId !== session.user.id) {
    redirect("/dashboard");
  }

  return <QuizEditor quiz={quiz} />;
}
