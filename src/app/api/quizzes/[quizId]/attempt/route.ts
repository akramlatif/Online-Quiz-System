import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

type Params = { params: Promise<{ quizId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { quizId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { answers, tabSwitches = 0 } = body as { answers: Record<string, string>, tabSwitches: number };

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: { answers: true },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    let score = 0;
    let totalPoints = 0;
    const attemptAnswersData = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const response = answers[question.id];
      
      if (question.type === "MCQ") {
        if (response) {
          const selectedAnswer = question.answers.find((a) => a.id === response);
          if (selectedAnswer?.isCorrect) {
            score += question.points;
          }
          attemptAnswersData.push({
            questionId: question.id,
            answerId: response,
          });
        }
      } else {
        // SUBJECTIVE
        if (response) {
          attemptAnswersData.push({
            questionId: question.id,
            textResponse: response,
          });
        }
      }
    }

    const attempt = await db.attempt.create({
      data: {
        userId: session.user.id,
        quizId: quizId,
        score,
        endedAt: new Date(),
        tabSwitches,
        attemptAnswers: {
          create: attemptAnswersData
        }
      },
    });

    return NextResponse.json({
      attemptId: attempt.id,
      score,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0,
      tabSwitches
    });
  } catch (error) {
    console.error("[POST /api/quizzes/[quizId]/attempt]", error);
    return NextResponse.json({ error: "Failed to submit attempt" }, { status: 500 });
  }
}
