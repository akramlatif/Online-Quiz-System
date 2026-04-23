import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Classrooms | Teacher Dashboard",
};

export default async function ClassroomsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch classrooms created by this teacher
  const classrooms = await db.classroom.findMany({
    where: { teacherId: session.user.id },
    include: {
      _count: { select: { members: true, quizzes: true, materials: true } },
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
            <Link href="/dashboard/teacher" className="text-gray-400 hover:text-white transition-colors">Quizzes</Link>
            <Link href="/dashboard/teacher/classrooms" className="text-white font-bold border-b-2 border-cyan-400 pb-1">Classrooms</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Welcome back, <span className="font-semibold text-cyan-200">{session.user.name ?? session.user.email}</span></span>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">Sign Out</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto p-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Your Classrooms</h1>
            <p className="text-gray-300">Manage your students, materials, and assignments.</p>
          </div>
          <Link href="/dashboard/teacher/classrooms/create">
            <Button variant="primary" size="lg" className="shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-shadow">
              + New Classroom
            </Button>
          </Link>
        </div>

        {classrooms.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl border border-white/10 animate-fade-in">
            <span className="text-6xl mb-4 block">🏫</span>
            <h3 className="text-2xl font-bold mb-2">No classrooms yet</h3>
            <p className="text-gray-400 mb-6">Create your first virtual classroom to start engaging with students.</p>
            <Link href="/dashboard/teacher/classrooms/create">
              <Button variant="primary">Create Classroom</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms.map((cls) => (
              <div key={cls.id} className="glass p-6 rounded-2xl border border-white/10 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/20 transition-all duration-300 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-white">{cls.name}</h3>
                </div>
                
                {cls.description && <p className="text-gray-400 text-sm mb-6 flex-grow">{cls.description}</p>}
                
                <div className="grid grid-cols-3 gap-2 text-center mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Students</div>
                    <div className="font-bold text-cyan-300">{cls._count.members}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Quizzes</div>
                    <div className="font-bold text-pink-400">{cls._count.quizzes}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Materials</div>
                    <div className="font-bold text-yellow-400">{cls._count.materials}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Link href={`/dashboard/teacher/classrooms/${cls.id}`} className="flex-1">
                    <Button variant="primary" size="sm" fullWidth>Manage</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
