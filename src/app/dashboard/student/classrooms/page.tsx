import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import JoinClassroomButton from "./JoinClassroomButton";
import AutoJoinHandler from "./AutoJoinHandler";

export const metadata = {
  title: "Classrooms | Student Dashboard",
};

export default async function StudentClassroomsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch classrooms the student is already in
  const memberships = await db.classroomMember.findMany({
    where: { userId: session.user.id },
    include: {
      classroom: {
        include: {
          teacher: { select: { name: true } },
          _count: { select: { quizzes: true, materials: true } },
        },
      },
    },
  });

  const myClassrooms = memberships.map(m => m.classroom);
  const myClassroomIds = myClassrooms.map(c => c.id);

  // Fetch available classrooms to join
  const availableClassrooms = await db.classroom.findMany({
    where: {
      id: { notIn: myClassroomIds },
    },
    include: {
      teacher: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <nav className="flex justify-between items-center p-4 glass sticky top-0 z-10 text-white border-b border-white/10 shadow-md">
        <div className="flex gap-8 items-center">
          <Link href="/" className="font-bold text-xl text-cyan-400 hover:text-cyan-300 transition-colors">
            Aetheria Quiz
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard/student" className="text-gray-400 hover:text-white transition-colors">Quizzes</Link>
            <Link href="/dashboard/student/classrooms" className="text-white font-bold border-b-2 border-cyan-400 pb-1">Classrooms</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Student: <span className="font-semibold text-cyan-200">{session.user.name ?? session.user.email}</span></span>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">Sign Out</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto p-4 py-8 max-w-6xl">
        <AutoJoinHandler />
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">My Classrooms</h1>
          <p className="text-gray-300 mb-6">Classrooms you are currently enrolled in.</p>
          
          {myClassrooms.length === 0 ? (
            <div className="glass p-8 text-center rounded-2xl border border-white/10">
              <span className="text-4xl mb-4 block">🎓</span>
              <p className="text-gray-400">You haven't joined any classrooms yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myClassrooms.map((cls) => (
                <div key={cls.id} className="glass p-6 rounded-2xl border border-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-2">{cls.name}</h3>
                  <p className="text-cyan-300 text-sm mb-4">Instructor: {cls.teacher.name}</p>
                  <div className="flex gap-4 text-sm text-gray-400 mb-6">
                    <div>Materials: <span className="text-white">{cls._count.materials}</span></div>
                    <div>Quizzes: <span className="text-white">{cls._count.quizzes}</span></div>
                  </div>
                  <Link href={`/dashboard/student/classrooms/${cls.id}`}>
                    <Button variant="primary" size="sm" fullWidth>Enter Classroom</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Available Classrooms to Join</h2>
          {availableClassrooms.length === 0 ? (
            <p className="text-gray-400">No new classrooms available to join.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableClassrooms.map((cls) => (
                <div key={cls.id} className="glass p-6 rounded-2xl border border-white/10 opacity-80 hover:opacity-100 transition-opacity">
                  <h3 className="text-lg font-bold text-white mb-1">{cls.name}</h3>
                  {cls.description && <p className="text-gray-400 text-sm mb-3 line-clamp-2">{cls.description}</p>}
                  <div className="text-sm text-gray-500 mb-4">
                    Instructor: {cls.teacher.name} • {cls._count.members} Students
                  </div>
                  <JoinClassroomButton classroomId={cls.id} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
