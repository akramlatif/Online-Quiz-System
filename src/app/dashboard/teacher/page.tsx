import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { DeleteQuizButton } from "@/components/ui/DeleteQuizButton";
import styles from "./page.module.css";

export const metadata = {
  title: "Dashboard | Aetheria Quiz",
  description: "View available quizzes, track your progress, and create new quizzes.",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch quizzes: all published + user's own drafts
  const quizzes = await db.quiz.findMany({
    where: {
      OR: [
        { isPublished: true },
        { creatorId: session.user.id },
      ],
    },
    include: {
      creator: { select: { name: true } },
      _count: { select: { questions: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch user's attempt stats
  const userAttempts = await db.attempt.count({
    where: { userId: session.user.id },
  });

  const myQuizzes = quizzes.filter((q) => q.creatorId === session!.user!.id);
  const publishedQuizzes = quizzes.filter((q) => q.isPublished);

  return (
    <>
      {/* ── Sticky Navbar ── */}
      <nav className={styles.navbar}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/" className={styles.navBrand}>
            Aetheria Quiz
          </Link>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link href="/dashboard/teacher" style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 'bold' }}>Quizzes</Link>
            <Link href="/dashboard/teacher/classrooms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Classrooms</Link>
          </div>
        </div>
        <div className={styles.navUser}>
          <span>Welcome back,</span>
          <span className={styles.navUserName}>
            {session.user.name ?? session.user.email}
          </span>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">
              Sign Out
            </Button>
          </Link>
        </div>
      </nav>

      <main className={`container ${styles.dashboard}`}>
        {/* ── Top Bar ── */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1>Quiz Dashboard</h1>
            <p>Browse quizzes, track performance, and build your own.</p>
          </div>
          <Link href="/dashboard/create">
            <Button variant="primary" size="lg">
              + Create New Quiz
            </Button>
          </Link>
        </div>

        {/* ── Stats Strip ── */}
        <div className={styles.statsStrip}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Available Quizzes</div>
            <div className={styles.statValue}>{publishedQuizzes.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>My Quizzes</div>
            <div className={styles.statValue}>{myQuizzes.length}</div>
          </div>
          <Link href="/dashboard/attempts" className={styles.statCard} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={styles.statLabel}>My Attempts</div>
            <div className={styles.statValue}>{userAttempts}</div>
          </Link>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Total Questions</div>
            <div className={styles.statValue}>
              {quizzes.reduce((s, q) => s + q._count.questions, 0)}
            </div>
          </div>
        </div>

        {/* ── All Quizzes Grid ── */}
        <h2 className={styles.sectionTitle}>All Quizzes</h2>

        {quizzes.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📝</span>
            <h3>No quizzes yet</h3>
            <p>Be the first to create one!</p>
          </div>
        ) : (
          <div className={styles.quizGrid}>
            {quizzes.map((quiz) => {
              const isOwner = quiz.creatorId === session!.user!.id;
              const timeLimitMins = quiz.timeLimit
                ? Math.round(quiz.timeLimit / 60)
                : null;

              return (
                <div key={quiz.id} className={styles.quizCard}>
                  <div className={styles.quizCardTop}>
                    <h3 className={styles.quizTitle}>{quiz.title}</h3>
                    <span
                      className={`${styles.badge} ${
                        quiz.isPublished ? styles.badgePublished : styles.badgeDraft
                      }`}
                    >
                      {quiz.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className={styles.quizDesc}>{quiz.description}</p>
                  )}

                  <div className={styles.quizMeta}>
                    <div className={styles.metaItem}>
                      Questions: <span>{quiz._count.questions}</span>
                    </div>
                    <div className={styles.metaItem}>
                      Attempts: <span>{quiz._count.attempts}</span>
                    </div>
                    {timeLimitMins && (
                      <div className={styles.metaItem}>
                        Time: <span>{timeLimitMins}m</span>
                      </div>
                    )}
                    <div className={styles.metaItem}>
                      By: <span>{quiz.creator.name ?? "Unknown"}</span>
                    </div>
                  </div>

                  <div className={styles.quizCardActions}>
                    <Link href={`/quiz/${quiz.id}`} style={{ flex: 1 }}>
                      <Button
                        variant="primary"
                        size="sm"
                        fullWidth
                        disabled={quiz._count.questions === 0}
                      >
                        {quiz._count.questions === 0 ? "No Questions" : "Start Quiz →"}
                      </Button>
                    </Link>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <Link href={`/dashboard/edit/${quiz.id}`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <DeleteQuizButton quizId={quiz.id} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
