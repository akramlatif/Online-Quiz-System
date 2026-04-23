import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

// GET /api/quizzes - Fetch all published quizzes (+ user's own drafts)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    const quizzes = await db.quiz.findMany({
      where: session?.user?.id
        ? {
            OR: [
              { isPublished: true },
              { creatorId: session.user.id },
            ],
          }
        : { isPublished: true },
      include: {
        creator: { select: { name: true, email: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error("[GET /api/quizzes]", error);
    return NextResponse.json(
      { error: "Failed to fetch quizzes" },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Create a new quiz (with questions & answers atomically)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, timeLimit, startTime, endTime, difficulty, isPublished, classroomId, questions } = body;

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Quiz title is required" }, { status: 400 });
    }

    const quiz = await db.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title: title.trim(),
          description: description?.trim() || null,
          timeLimit: timeLimit ? Number(timeLimit) : null,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
          difficulty: difficulty || "BEGINNER",
          isPublished: Boolean(isPublished),
          creatorId: session.user.id,
          classroomId: classroomId || null,
        },
      });

      if (questions && Array.isArray(questions) && questions.length > 0) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const newQuestion = await tx.question.create({
            data: {
              quizId: newQuiz.id,
              text: q.text,
              points: q.points ?? 1,
              order: i,
              type: q.type || "MCQ",
            },
          });

          if (q.type !== "SUBJECTIVE" && q.answers && Array.isArray(q.answers)) {
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

      return newQuiz;
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error("[POST /api/quizzes]", error);
    return NextResponse.json(
      { error: "Failed to create quiz" },
      { status: 500 }
    );
  }
}
