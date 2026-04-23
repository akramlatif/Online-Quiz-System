import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroomId = id;

    // Check if classroom exists
    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }

    // Join classroom
    const membership = await db.classroomMember.create({
      data: {
        classroomId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(membership, { status: 201 });
  } catch (error: any) {
    console.error("Error joining classroom:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Already joined this classroom" }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
