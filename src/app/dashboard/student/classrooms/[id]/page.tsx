import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export default async function StudentClassroomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "STUDENT") {
    redirect("/login");
  }

  const classroomId = id;

  // Verify membership
  const membership = await db.classroomMember.findUnique({
    where: {
      classroomId_userId: {
        classroomId,
        userId: session.user.id,
      },
    },
    include: {
      classroom: {
        include: {
          teacher: { select: { name: true, email: true } },
          materials: { orderBy: { createdAt: "desc" } },
          announcements: { orderBy: { createdAt: "desc" } },
          quizzes: { 
            where: { isPublished: true },
            orderBy: { createdAt: "desc" },
            include: { 
              _count: { select: { questions: true } },
              attempts: {
                include: { user: { select: { name: true, email: true } } }
              }
            }
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard/student/classrooms");
  }

  const { classroom } = membership;

  return (
    <main className="container mx-auto p-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard/student/classrooms" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
          <span>←</span> Back to My Classrooms
        </Link>
      </div>

      <div className="glass p-8 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <h1 className="text-4xl font-bold mb-2 text-white relative z-10">{classroom.name}</h1>
        {classroom.description && <p className="text-gray-300 text-lg relative z-10 mb-4">{classroom.description}</p>}
        <p className="text-cyan-300 text-sm font-semibold relative z-10">Instructor: {classroom.teacher.name}</p>
      </div>

      {/* Announcements Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-cyan-400">📢</span> Announcements</h2>
        
        {classroom.announcements.length === 0 ? (
          <div className="glass p-6 text-center rounded-xl border border-white/5">
            <p className="text-gray-400">No announcements from your instructor yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classroom.announcements.map((announcement) => (
              <div key={announcement.id} className="glass p-5 rounded-xl border border-cyan-500/20">
                <p className="text-white whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  🗓️ {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-yellow-400">📚</span> Study Materials</h2>
          
          {classroom.materials.length === 0 ? (
            <div className="glass p-6 text-center rounded-xl border border-white/5">
              <p className="text-gray-400">No materials available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classroom.materials.map((mat) => (
                <a href={mat.url} target="_blank" rel="noopener noreferrer" key={mat.id} className="block glass p-5 rounded-xl border border-white/5 hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10 hover:border-cyan-500/50 transition-all duration-300">
                  <h4 className="text-lg font-bold text-cyan-300 mb-1">{mat.title}</h4>
                  {mat.description && <p className="text-sm text-gray-400">{mat.description}</p>}
                </a>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span className="text-pink-400">📝</span> Assigned Quizzes</h2>
          
          {classroom.quizzes.length === 0 ? (
            <div className="glass p-6 text-center rounded-xl border border-white/5">
              <p className="text-gray-400">No quizzes assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classroom.quizzes.map((quiz) => (
                <div key={quiz.id} className="glass p-5 rounded-xl border border-white/5 flex flex-col hover:-translate-y-1 hover:shadow-lg hover:shadow-pink-500/10 transition-all duration-300">
                  <h4 className="text-xl font-bold text-white mb-2">{quiz.title}</h4>
                  <div className="flex gap-4 text-sm text-gray-400 mb-4">
                    <div>Questions: <span className="text-white">{quiz._count.questions}</span></div>
                    {quiz.timeLimit && <div>Time Limit: <span className="text-white">{Math.round(quiz.timeLimit / 60)}m</span></div>}
                  </div>
                  <Link href={`/quiz/${quiz.id}`} className="mt-auto">
                    <Button variant="primary" size="sm" fullWidth disabled={quiz._count.questions === 0}>
                      {quiz._count.questions === 0 ? "No Questions Available" : "Start Quiz"}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="lg:col-span-2 mt-8">
          <div className="glass p-8 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 relative z-10"><span className="text-yellow-400">🏆</span> Classroom Leaderboard</h2>
            
            <div className="space-y-4 relative z-10">
              {(() => {
                // Calculate leaderboard: sum of all attempt scores per user
                const userScores: Record<string, { name: string, score: number }> = {};
                classroom.quizzes.forEach(quiz => {
                  if ((quiz as any).attempts) {
                    (quiz as any).attempts.forEach((attempt: any) => {
                      const uid = attempt.userId;
                      if (!userScores[uid]) userScores[uid] = { name: attempt.user?.name || attempt.user?.email || "Unknown", score: 0 };
                      userScores[uid].score += attempt.score;
                    });
                  }
                });
                
                const leaderboard = Object.values(userScores).sort((a, b) => b.score - a.score);

                if (leaderboard.length === 0) {
                  return <p className="text-gray-400">No scores available yet.</p>;
                }

                return leaderboard.map((l, idx) => (
                  <div key={idx} className={`flex justify-between items-center p-4 rounded-xl border transition-colors ${idx === 0 ? "bg-yellow-500/20 border-yellow-500/50" : idx === 1 ? "bg-gray-400/20 border-gray-400/50" : idx === 2 ? "bg-amber-700/20 border-amber-700/50" : "bg-black/20 border-white/5"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${idx === 0 ? "bg-yellow-500 text-black" : idx === 1 ? "bg-gray-400 text-black" : idx === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-gray-400"}`}>
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-white">{l.name}</span>
                    </div>
                    <div className="font-bold text-cyan-300">{l.score} pts</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
