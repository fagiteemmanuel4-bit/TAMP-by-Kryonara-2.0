import { Link, useNavigate } from 'react-router-dom'

const features = [
  {
    title: 'Structured learning path',
    body: 'Guided daily lessons, reading checkpoints, and timed assignments keep learners moving in the right order.',
  },
  {
    title: 'Assessment and certification',
    body: 'Assignments, quizzes, final projects, and verifiable certificates are all managed in one flow.',
  },
  {
    title: 'Operations visibility',
    body: 'The admin portal tracks submissions, payments, tickets, and course updates without disturbing the student journey.',
  },
]

const stats = [
  { value: '63', label: 'Daily learning topics' },
  { value: '7', label: 'Core learning levels' },
  { value: '100%', label: 'Certificate-ready workflows' },
]

export function PublicApp({ initialView = 'home' }) {
  const navigate = useNavigate()

  const renderContent = () => {
    if (initialView === 'login') {
      return (
        <section className="auth-panel">
          <div className="panel-card form-card">
            <p className="eyebrow">Student portal</p>
            <h2>Welcome back</h2>
            <form className="stack-form">
              <label>
                <span>Email address</span>
                <input type="email" defaultValue="student@tamp.demo" />
              </label>
              <label>
                <span>Password</span>
                <input type="password" defaultValue="••••••••" />
              </label>
              <button type="button" className="primary-btn full-width" onClick={() => navigate('/dashboard')}>
                Sign in
              </button>
            </form>
            <div className="inline-links">
              <Link to="/">Back to site</Link>
              <a href="#">Forgot password</a>
            </div>
          </div>
        </section>
      )
    }

    if (initialView === 'dashboard') {
      return (
        <section className="dashboard-shell">
          <aside className="dashboard-sidebar">
            <div className="brand small">
              <span className="mark">T</span>
              TAMP
            </div>
            <nav>
              <a href="#">Overview</a>
              <a href="#">Courses</a>
              <a href="#">Assignments</a>
              <a href="#">Exam</a>
              <a href="#">Certificates</a>
              <a href="#">Settings</a>
            </nav>
          </aside>

          <div className="dashboard-main">
            <header className="dashboard-header">
              <div>
                <p className="eyebrow">Student dashboard</p>
                <h2>Welcome, Ada</h2>
              </div>
              <button className="primary-btn" onClick={() => navigate('/')}>
                Exit preview
              </button>
            </header>

            <div className="stat-grid">
              {stats.map((item) => (
                <article key={item.label} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>

            <div className="content-grid">
              <article className="panel-card">
                <p className="eyebrow">Current streak</p>
                <h3>12 learning days</h3>
                <p>Keep your momentum and complete today’s reading lesson before the next checkpoint unlocks.</p>
              </article>
              <article className="panel-card">
                <p className="eyebrow">Next milestone</p>
                <h3>Final project review</h3>
                <p>Upload your completed capstone and await approval from the course reviewers.</p>
              </article>
            </div>
          </div>
        </section>
      )
    }

    return (
      <>
        <section className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow">Learning platform</p>
            <h1>Build practical digital skills with a guided learning flow.</h1>
            <p className="lead">
              TAMP is designed to move learners from enrollment to assessment, certification, and long-term progress tracking in one structured system.
            </p>
            <div className="cta-row">
              <button className="primary-btn" onClick={() => navigate('/login')}>Student login</button>
              <Link to="/ADMIN19841812" className="secondary-btn">Open admin portal</Link>
            </div>
          </div>
          <div className="hero-visual panel-card">
            <div className="mini-graph">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className="floating-card">
              <strong>Course status</strong>
              <em>On track · Level 4</em>
            </div>
          </div>
        </section>

        <section className="stats-strip">
          {stats.map((item) => (
            <div key={item.label} className="stat-pill">
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </section>

        <section className="feature-grid">
          {features.map((feature) => (
            <article key={feature.title} className="panel-card feature-card">
              <p className="eyebrow">Core feature</p>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>
      </>
    )
  }

  return (
    <div className="site-shell">
      <header className="topbar">
        <div className="brand">
          <span className="mark">T</span>
          TAMP
        </div>

        <nav className="nav-links" aria-label="Main navigation">
          <a href="#">About</a>
          <a href="#">Courses</a>
          <a href="#">How it works</a>
          <a href="#">Pricing</a>
        </nav>

        <div className="header-actions">
          <Link to="/ADMIN19841812" className="secondary-btn">Admin</Link>
          <button className="primary-btn" onClick={() => navigate('/login')}>Log in</button>
        </div>
      </header>

      <main className="page-body">{renderContent()}</main>
    </div>
  )
}
