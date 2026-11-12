import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import AddMaterialForm from "./AddMaterialForm";
import ShareClassroomLink from "./ShareClassroomLink";
import AnnouncementForm from "./AnnouncementForm";

export default async function ClassroomDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "TEACHER") {
    redirect("/login");
  }

  const classroom = await db.classroom.findUnique({
    where: { id },
    include: {
      members: { include: { user: { select: { name: true, email: true } } } },
      materials: { orderBy: { createdAt: "desc" } },
      announcements: { orderBy: { createdAt: "desc" } },
      quizzes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!classroom || classroom.teacherId !== session.user.id) {
    redirect("/dashboard/teacher/classrooms");
  }

  return (
    <main className="container mx-auto p-4 py-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/dashboard/teacher/classrooms" className="text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-2">
          <span>←</span> Back to Classrooms
        </Link>
      </div>

      <div className="glass p-8 rounded-2xl border border-white/10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <h1 className="text-4xl font-bold mb-2 text-white relative z-10">{classroom.name}</h1>
        {classroom.description && <p className="text-gray-300 text-lg relative z-10">{classroom.description}</p>}
      </div>

      {/* Share Link Section */}
      <ShareClassroomLink classroomId={classroom.id} />

      {/* Announcements Section */}
      <section className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">📢 Announcements</h2>
          <AnnouncementForm classroomId={classroom.id} />
        </div>

        {classroom.announcements.length === 0 ? (
          <div className="glass p-6 text-center rounded-xl border border-white/5">
            <p className="text-gray-400">No announcements yet. Post one to keep your students informed!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {classroom.announcements.map((announcement) => (
              <div key={announcement.id} className="glass p-5 rounded-xl border border-white/5">
                <p className="text-white whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-xs text-gray-500 mt-2">
                  🗓️ {new Date(announcement.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Materials & Slides</h2>
              <AddMaterialForm classroomId={classroom.id} />
            </div>

            {classroom.materials.length === 0 ? (
              <div className="glass p-6 text-center rounded-xl border border-white/5">
                <p className="text-gray-400">No materials uploaded yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classroom.materials.map((mat) => {
                  const isFile = mat.url.startsWith("/uploads/");
                  const fileName = isFile ? mat.url.split("/").pop() || "" : "";
                  // Extract a clean display name (remove timestamp prefix)
                  const displayName = fileName.replace(/^\d+-/, "").replace(/_/g, " ");

                  return (
                    <div key={mat.id} className="glass p-4 rounded-xl border border-white/5 hover:border-cyan-500/50 hover:bg-white/5 transition-all flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-bold text-cyan-300 mb-1">{mat.title}</h4>
                        {mat.description && <p className="text-sm text-gray-400">{mat.description}</p>}
                        {isFile && (
                          <p className="text-xs text-gray-500 mt-1 truncate">📄 {displayName}</p>
                        )}
                      </div>
                      <a
                        href={mat.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={isFile ? displayName : undefined}
                        className="ml-4 shrink-0 bg-cyan-500/20 text-cyan-300 px-4 py-2 rounded-lg hover:bg-cyan-500/40 transition-colors text-sm font-semibold"
                      >
                        {isFile ? "⬇ Download" : "🔗 Open Link"}
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Assigned Quizzes</h2>
              <Link href={`/dashboard/create?classroomId=${classroom.id}`} className="text-sm text-cyan-400 hover:underline">+ Assign Quiz</Link>
            </div>
            
            {classroom.quizzes.length === 0 ? (
              <div className="glass p-6 text-center rounded-xl border border-white/5">
                <p className="text-gray-400">No quizzes assigned to this class yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {classroom.quizzes.map((quiz) => (
                  <div key={quiz.id} className="glass p-4 rounded-xl border border-white/5 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold">{quiz.title}</h4>
                      <div className="text-sm text-gray-400 mt-1">Status: {quiz.isPublished ? "Published" : "Draft"}</div>
                    </div>
                    <Link href={`/dashboard/teacher/quizzes/${quiz.id}/submissions`}>
                      <span className="text-sm bg-purple-600/20 text-purple-300 px-4 py-2 rounded-lg hover:bg-purple-600/40 transition-colors font-semibold">Submissions & Grading →</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <section className="glass p-6 rounded-xl border border-white/10">
            <h3 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Students ({classroom.members.length})</h3>
            {classroom.members.length === 0 ? (
              <p className="text-gray-400 text-sm">No students have joined yet. Share the link above!</p>
            ) : (
              <ul className="space-y-3">
                {classroom.members.map((member) => (
                  <li key={member.id} className="flex flex-col">
                    <span className="font-semibold text-white">{member.user.name ?? "Anonymous"}</span>
                    <span className="text-xs text-gray-400">{member.user.email}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
