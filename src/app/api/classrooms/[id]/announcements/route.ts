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

    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classroomId = id;

    // Verify teacher owns the classroom
    const classroom = await db.classroom.findUnique({
      where: { id: classroomId },
    });

    if (!classroom || classroom.teacherId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { content } = await req.json();

    if (!content || String(content).trim() === "") {
      return NextResponse.json(
        { error: "Announcement content is required" },
        { status: 400 }
      );
    }

    // Basic length guard
    if (String(content).length > 2000) {
      return NextResponse.json(
        { error: "Announcement is too long (max 2000 characters)" },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        content: String(content).trim(),
        classroomId,
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Error creating announcement:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
