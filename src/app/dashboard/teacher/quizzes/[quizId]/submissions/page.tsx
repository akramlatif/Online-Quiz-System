import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import GradingForm from "./GradingForm";

export default async function SubmissionsPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: {
      attempts: {
        include: {
          user: { select: { name: true, email: true } },
          attemptAnswers: {
            include: { question: true }
          }
        },
        orderBy: { startedAt: "desc" }
      },
      questions: { select: { points: true } }
    },
  });

  if (!quiz || quiz.creatorId !== session.user.id) {
    redirect("/dashboard/teacher");
  }

  const totalPossiblePoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <main className="container mx-auto p-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href={quiz.classroomId ? `/dashboard/teacher/classrooms/${quiz.classroomId}` : "/dashboard/teacher"} className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
          <span>←</span> Back
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Submissions</h1>
        <p className="text-gray-300 text-lg">Review and grade attempts for <strong className="text-white">{quiz.title}</strong>.</p>
      </div>

      {quiz.attempts.length === 0 ? (
        <div className="glass p-12 text-center rounded-2xl border border-white/10">
          <p className="text-gray-400">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {quiz.attempts.map((attempt) => {
            const hasSubjective = attempt.attemptAnswers.some(a => a.question.type === "SUBJECTIVE");
            const isGraded = attempt.attemptAnswers.every(a => a.question.type !== "SUBJECTIVE" || a.score !== null);

            return (
              <div key={attempt.id} className="glass p-8 rounded-3xl border border-white/10 overflow-hidden relative">
                {attempt.tabSwitches >= 3 && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl shadow-md">
                    CHEATING FLAG: {attempt.tabSwitches} Tab Switches
                  </div>
                )}
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-6 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{attempt.user.name || attempt.user.email}</h3>
                    <div className="text-sm text-gray-400">
                      Submitted: {new Date(attempt.endedAt || attempt.startedAt).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex gap-6 text-right">
                    {hasSubjective && (
                      <div>
                        <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Grading Status</div>
                        <div className={`font-bold ${isGraded ? "text-green-400" : "text-yellow-400 animate-pulse"}`}>
                          {isGraded ? "Fully Graded" : "Needs Review"}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-1">Total Score</div>
                      <div className="text-3xl font-extrabold text-cyan-400">{attempt.score} <span className="text-lg text-gray-500 font-normal">/ {totalPossiblePoints}</span></div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
                  <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-pink-400">✍️</span> Manual Grading (Subjective)
                  </h4>
                  <GradingForm 
                    attemptId={attempt.id} 
                    attemptAnswers={attempt.attemptAnswers} 
                    initialTotalScore={attempt.score}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
