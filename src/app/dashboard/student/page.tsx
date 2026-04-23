import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Student Dashboard | Aetheria Quiz",
  description: "View and take your quizzes.",
};

export default async function StudentDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch quizzes that are published
  const quizzes = await db.quiz.findMany({
    where: { isPublished: true },
    include: {
      creator: { select: { name: true } },
      _count: { select: { questions: true } },
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
            <Link href="/dashboard/student" className="text-white font-bold border-b-2 border-cyan-400 pb-1">Quizzes</Link>
            <Link href="/dashboard/student/classrooms" className="text-gray-400 hover:text-white transition-colors">Classrooms</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span>Student: <span className="font-semibold text-cyan-200">{session.user.name ?? session.user.email}</span></span>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">Sign Out</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto p-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Student Dashboard</h1>
          <p className="text-gray-300">Join classrooms and complete your assignments.</p>
        </div>

        <h2 className="text-2xl font-bold mb-4">Available Quizzes</h2>
        {quizzes.length === 0 ? (
          <div className="glass p-8 text-center rounded-xl border border-white/10">
            <span className="text-4xl mb-4 block">📚</span>
            <h3 className="text-xl font-bold mb-2">No quizzes available</h3>
            <p className="text-gray-400">Check back later for new assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="glass p-6 rounded-xl hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 border border-white/10 flex flex-col">
                <h3 className="text-xl font-bold mb-2">{quiz.title}</h3>
                {quiz.description && <p className="text-gray-400 mb-4 flex-grow">{quiz.description}</p>}
                
                <div className="flex gap-4 text-sm text-gray-300 mb-6">
                  <div>Questions: <span className="text-white font-semibold">{quiz._count.questions}</span></div>
                  {quiz.timeLimit && <div>Time: <span className="text-white font-semibold">{Math.round(quiz.timeLimit / 60)}m</span></div>}
                </div>
                
                <Link href={`/quiz/${quiz.id}`} className="mt-auto">
                  <Button variant="primary" size="sm" fullWidth disabled={quiz._count.questions === 0}>
                    {quiz._count.questions === 0 ? "No Questions" : "Start Quiz"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
