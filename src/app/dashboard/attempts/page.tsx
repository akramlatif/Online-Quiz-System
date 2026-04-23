import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import db from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import styles from "../page.module.css";

export const metadata = {
  title: "My Attempts | Aetheria Quiz",
  description: "View your past quiz attempts and scores.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AttemptsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch attempts for the user, including quiz title and question points to calculate total
  const attempts = await db.attempt.findMany({
    where: { userId: session.user.id },
    include: {
      quiz: {
        include: {
          questions: { select: { points: true } }
        }
      }
    },
    orderBy: { startedAt: "desc" },
  });

  return (
    <>
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navBrand}>
          Aetheria Quiz
        </Link>
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
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <Link href="/dashboard" style={{ color: "var(--text-secondary)", display: "inline-block", marginBottom: "var(--spacing-2)", textDecoration: "none" }}>
              ← Back to Dashboard
            </Link>
            <h1>My Attempts History</h1>
            <p>Review your performance across all quizzes.</p>
          </div>
        </div>

        {attempts.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📊</span>
            <h3>No attempts yet</h3>
            <p>Go take some quizzes to see your history!</p>
            <Link href="/dashboard" style={{ marginTop: "var(--spacing-4)", display: "inline-block" }}>
              <Button variant="primary">Browse Quizzes</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.quizGrid}>
            {attempts.map((attempt) => {
              const totalPoints = attempt.quiz.questions.reduce((sum, q) => sum + q.points, 0);
              const percentage = totalPoints > 0 ? Math.round((attempt.score / totalPoints) * 100) : 0;
              
              let pctClass = styles.badgeDraft; // default yellow/orange
              if (percentage >= 80) pctClass = styles.badgePublished; // green
              else if (percentage < 50) pctClass = ""; // We can just let it default or add a danger class. 
              
              const dangerStyle = percentage < 50 ? { background: "rgba(255, 82, 82, 0.15)", color: "var(--error)", border: "1px solid rgba(255, 82, 82, 0.3)" } : {};

              return (
                <div key={attempt.id} className={styles.quizCard}>
                  <div className={styles.quizCardTop}>
                    <h3 className={styles.quizTitle}>{attempt.quiz.title}</h3>
                    <span 
                      className={`${styles.badge} ${pctClass}`}
                      style={dangerStyle}
                    >
                      {percentage}%
                    </span>
                  </div>

                  <div className={styles.quizMeta} style={{ flexDirection: "column", gap: "var(--spacing-2)", marginTop: "var(--spacing-4)" }}>
                    <div className={styles.metaItem}>
                      Score: <span>{attempt.score} / {totalPoints} Points</span>
                    </div>
                    <div className={styles.metaItem}>
                      Date: <span>{formatDate(attempt.startedAt)}</span>
                    </div>
                  </div>

                  <div className={styles.quizCardActions}>
                    <Link href={`/quiz/${attempt.quizId}`} style={{ flex: 1 }}>
                      <Button variant="outline" size="sm" fullWidth>
                        Retake Quiz
                      </Button>
                    </Link>
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
