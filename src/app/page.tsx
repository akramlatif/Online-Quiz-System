import Link from "next/link";
import "./page.css"; // We will add bespoke styles for the page

export default function Home() {
  return (
    <div className="home-container">
      {/* Decorative Background Elements */}
      <div className="glow glow-1"></div>
      <div className="glow glow-2"></div>

      {/* Header/Nav */}
      <header className="home-header">
        <div className="logo cursor-pointer hover-lift">
          <span className="logo-icon">⚡</span> Aetheria
        </div>
        <nav className="home-nav">
          <Link href="/login" className="nav-link">Log In</Link>
          <Link href="/signup" className="btn-secondary hover-lift">Sign Up</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="hero animate-fade-in">
        <div className="hero-content">
          <div className="badge">New v2.0 Platform</div>
          <h1 className="hero-title">
            Master Any Topic,<br/>
            <span className="text-gradient">Faster Than Ever.</span>
          </h1>
          <p className="hero-subtitle">
            Create, share, and conquer quizzes with our advanced real-time tracking platform.
            Experience the next generation of interactive learning.
          </p>
          
          <div className="hero-actions">
            <Link href="/signup" className="btn-primary hover-lift">
              Get Started Free
            </Link>
            <Link href="/login" className="btn-outline hover-lift">
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero Visual Display */}
        <div className="hero-visual glass hover-lift">
          <div className="visual-header">
            <span className="dot dot-close"></span>
            <span className="dot dot-min"></span>
            <span className="dot dot-max"></span>
          </div>
          <div className="visual-body">
            <div className="mock-question">
              <h3>What does "DOM" stand for in web development?</h3>
              <div className="mock-options">
                <div className="mock-option">Document Oriented Model</div>
                <div className="mock-option correct">Document Object Model</div>
                <div className="mock-option">Data Object Mapping</div>
                <div className="mock-option">Dynamic Ordered Matrix</div>
              </div>
            </div>
            <div className="mock-stats">
              <div className="stat-pill text-success">Time: 12.5s</div>
              <div className="stat-pill">Score: 95%</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
