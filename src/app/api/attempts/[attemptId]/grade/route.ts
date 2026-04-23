import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const { attemptId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { grades } = await req.json(); // Record<attemptAnswerId, number>
    
    if (!grades || typeof grades !== "object") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Process each grade
    let addedScore = 0;
    for (const [attemptAnswerId, score] of Object.entries(grades)) {
      const numScore = Number(score);
      
      const answer = await db.attemptAnswer.findUnique({
        where: { id: attemptAnswerId },
        include: { question: true }
      });
      
      if (!answer) continue;

      // Update the individual answer score
      await db.attemptAnswer.update({
        where: { id: attemptAnswerId },
        data: { score: numScore }
      });

      // We need to calculate how much we are ADDING to the total score.
      // If it previously had a score, subtract it first.
      const previousScore = answer.score || 0;
      addedScore += (numScore - previousScore);
    }

    // Update total attempt score
    const attempt = await db.attempt.update({
      where: { id: attemptId },
      data: { score: { increment: addedScore } },
    });

    return NextResponse.json({ success: true, newTotalScore: attempt.score }, { status: 200 });
  } catch (error) {
    console.error("Error grading attempt:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
