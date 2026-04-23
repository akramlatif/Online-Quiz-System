"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
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
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Sign in to continue your learning journey.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorMessage}>{error}</div>}
          
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
          
          <div className={styles.forgotPassword}>
            <Link href="/forgot-password" className={styles.link}>Forgot password?</Link>
          </div>

          <Button type="submit" fullWidth disabled={isLoading} className={styles.submitBtn}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className={styles.divider}>
          <span>or sign in with</span>
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
          Don't have an account? <Link href="/signup" className={styles.link}>Sign up</Link>
        </div>
      </Card>
    </div>
  );
}
