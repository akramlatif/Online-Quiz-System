"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "../login/page.module.css"; // Reuse the layout styles

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Registration failed");
      }

      // Automatically sign them in
      const signInResult = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInResult?.error) {
        router.push("/login?registered=true");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.backgroundGlows}>
        <div className={`${styles.glow} ${styles.glowLeft}`}></div>
        <div className={`${styles.glow} ${styles.glowRight}`}></div>
      </div>

      <Card glass className={styles.authCard}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Link href="/">
              <span className={styles.logoIcon}>⚡</span> Aetheria
            </Link>
          </div>
          <h1 className={styles.title}>Create Account</h1>
          <p className={styles.subtitle}>Join us and create interactive quizzes.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <Input
            label="Full Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
            disabled={isLoading}
          />

          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            disabled={isLoading}
          />
          
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={isLoading}
          />

          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="••••••••"
            disabled={isLoading}
          />

          {/* Role Selector */}
          <div style={{ marginBottom: "var(--spacing-4)" }}>
            <label style={{ display: "block", fontSize: "var(--font-size-sm)", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "var(--spacing-2)" }}>
              I am a
            </label>
            <div style={{ display: "flex", gap: "var(--spacing-3)" }}>
              <button
                type="button"
                onClick={() => setRole("STUDENT")}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "var(--spacing-3) var(--spacing-4)",
                  borderRadius: "var(--radius-lg)",
                  border: role === "STUDENT" ? "2px solid var(--accent-primary)" : "2px solid var(--border-color)",
                  background: role === "STUDENT" ? "rgba(102, 252, 241, 0.1)" : "transparent",
                  color: role === "STUDENT" ? "var(--accent-primary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
                  transition: "all var(--transition-fast)",
                }}
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => setRole("TEACHER")}
                disabled={isLoading}
                style={{
                  flex: 1,
                  padding: "var(--spacing-3) var(--spacing-4)",
                  borderRadius: "var(--radius-lg)",
                  border: role === "TEACHER" ? "2px solid var(--accent-secondary)" : "2px solid var(--border-color)",
                  background: role === "TEACHER" ? "rgba(255, 42, 113, 0.1)" : "transparent",
                  color: role === "TEACHER" ? "var(--accent-secondary)" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: "var(--font-size-sm)",
                  transition: "all var(--transition-fast)",
                }}
              >
                📚 Teacher
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>or sign up with</span>
        </div>

        <div className={styles.socialProviders}>
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          >
            GitHub
          </Button>
        </div>

        <div className={styles.footer}>
          Already have an account? <Link href="/login" className={styles.link}>Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
