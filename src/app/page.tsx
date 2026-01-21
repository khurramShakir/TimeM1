import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import styles from "./Landing.module.css";

export default async function LandingPage() {
  const { userId } = await auth();

  // If user is already logged in, send them to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.container}>
      <nav className={styles.nav}>
        <div className={styles.logo}>Time Budget</div>
        <div className={styles.navLinks}>
          <Link href="/sign-in" className={styles.link}>Sign In</Link>
          <Link href="/sign-up" className={styles.btnPrimary}>Register</Link>
        </div>
      </nav>

      <main className={styles.hero}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            Master Your Week, <br />
            <span className={styles.accent}>One Hour at a Time.</span>
          </h1>
          <p className={styles.description}>
            The ultimate time budgeting tool designed for clarity and focus.
            Allocate your 168 hours, track your progress, and take control of your schedule.
          </p>
          <div className={styles.ctaGroup}>
            <Link href="/sign-up" className={styles.mainBtn}>Start Your Budget Free</Link>
            <Link href="/sign-in" className={styles.secondaryBtn}>Sign In to Your Account</Link>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <div className={styles.dot} style={{ background: '#ff5f56' }} />
              <div className={styles.dot} style={{ background: '#ffbd2e' }} />
              <div className={styles.dot} style={{ background: '#27c93f' }} />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.skeletonRow} style={{ width: '80%' }} />
              <div className={styles.skeletonRow} style={{ width: '60%' }} />
              <div className={styles.skeletonChart}>
                <div className={styles.bar} style={{ height: '40%', background: '#3b82f6' }} />
                <div className={styles.bar} style={{ height: '70%', background: '#10b981' }} />
                <div className={styles.bar} style={{ height: '50%', background: '#f59e0b' }} />
                <div className={styles.bar} style={{ height: '90%', background: '#ef4444' }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <section className={styles.features}>
        <div className={styles.feature}>
          <div className={styles.icon}>🕒</div>
          <h3>168 Hour Logic</h3>
          <p>Every week has exactly 168 hours. We help you account for every single one of them.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.icon}>📁</div>
          <h3>Envelope System</h3>
          <p>Allocate time to "Envelopes" like Work, Sleep, or Leisure. Budget once, track often.</p>
        </div>
        <div className={styles.feature}>
          <div className={styles.icon}>📊</div>
          <h3>Visual Insights</h3>
          <p>Beautiful charts show you exactly where your time is going in real-time.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Time Budget. All rights reserved.</p>
      </footer>
    </div>
  );
}
