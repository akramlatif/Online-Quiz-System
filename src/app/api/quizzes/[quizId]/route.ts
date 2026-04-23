import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

// GET /api/quizzes/[quizId] - Fetch a single quiz with all questions and answers
export async function GET(_req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: { select: { name: true, email: true } },
        questions: {
          orderBy: { order: "asc" },
          include: { answers: true },
        },
        _count: { select: { attempts: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error("[GET /api/quizzes/[quizId]]", error);
    return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
  }
}

// DELETE /api/quizzes/[quizId] - Delete a quiz (creator only)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await db.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.quiz.delete({ where: { id: quizId } });
    return NextResponse.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("[DELETE /api/quizzes/[quizId]]", error);
    return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
  }
}

// PUT /api/quizzes/[quizId] - Update a quiz (creator only)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ quizId: string }> }) {
  try {
    const { quizId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await db.quiz.findUnique({ where: { id: quizId } });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    if (quiz.creatorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { title, description, timeLimit, isPublished, questions } = await req.json();

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Quiz title is required" }, { status: 400 });
    }

    const updatedQuiz = await db.$transaction(async (tx) => {
      // Update core quiz settings
      const qz = await tx.quiz.update({
        where: { id: quizId },
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          timeLimit: timeLimit ? Number(timeLimit) : null,
          isPublished: Boolean(isPublished),
        },
      });

      // To simplify updating questions/answers, we delete existing and recreate
      await tx.question.deleteMany({
        where: { quizId },
      });

      if (questions && Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const newQuestion = await tx.question.create({
            data: {
              quizId: qz.id,
              text: q.text,
              points: q.points ?? 1,
              order: i,
            },
          });

          if (q.answers && Array.isArray(q.answers)) {
            await tx.answer.createMany({
              data: q.answers.map((a: { text: string; isCorrect: boolean }) => ({
                questionId: newQuestion.id,
                text: a.text,
                isCorrect: Boolean(a.isCorrect),
              })),
            });
          }
        }
      }

      return qz;
    });

    return NextResponse.json({ message: "Quiz updated successfully", quiz: updatedQuiz });
  } catch (error) {
    console.error("[PUT /api/quizzes/[quizId]]", error);
    return NextResponse.json({ error: "Failed to update quiz" }, { status: 500 });
  }
}
