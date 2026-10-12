import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const topMenu = ['Overview', 'Students', 'Courses', 'Payments', 'Support', 'Settings']

const metrics = [
  { label: 'Students', value: '1,248' },
  { label: 'Enrollments', value: '3,412' },
  { label: 'Pending review', value: '29' },
  { label: 'Revenue', value: '$87.4k' },
]

export function AdminApp() {
  const { adminCode } = useParams()
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [activeSection, setActiveSection] = useState('Overview')

  if (!isSignedIn) {
    return (
      <div className="admin-shell auth-shell">
        <div className="panel-card admin-login-card">
          <p className="eyebrow">Admin portal</p>
          <h2>Secure access</h2>
          <p className="muted">Route: /ADMIN{adminCode}</p>

          <form className="stack-form">
            <label>
              <span>Admin email</span>
              <input type="email" defaultValue="super@tamp.demo" />
            </label>
            <label>
              <span>Password</span>
              <input type="password" defaultValue="••••••••" />
            </label>
            <button type="button" className="primary-btn full-width" onClick={() => setIsSignedIn(true)}>
              Enter admin portal
            </button>
          </form>

          <div className="inline-links">
            <Link to="/">Back to public site</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand small">
          <span className="mark">T</span>
          TAMP Admin
        </div>

        <nav className="admin-nav">
          {topMenu.map((item) => (
            <button
              key={item}
              type="button"
              className={activeSection === item ? 'admin-link active' : 'admin-link'}
              onClick={() => setActiveSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>

        <button type="button" className="secondary-btn full-width" onClick={() => setIsSignedIn(false)}>
          Log out
        </button>
      </aside>

      <main className="admin-main">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Admin overview</p>
            <h2>{activeSection}</h2>
          </div>
          <Link to="/" className="secondary-btn">Public site</Link>
        </header>

        <div className="stat-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="stat-card">
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </article>
          ))}
        </div>

        <div className="content-grid admin-grid">
          <article className="panel-card">
            <p className="eyebrow">Needs attention</p>
            <h3>12 submissions require review</h3>
            <ul className="list-lines">
              <li>Final project approvals pending</li>
              <li>3 late assignment submissions</li>
              <li>2 payment disputes waiting for finance</li>
            </ul>
          </article>

          <article className="panel-card">
            <p className="eyebrow">Quick actions</p>
            <h3>Current focus</h3>
            <div className="chip-row">
              <span>Approve certificates</span>
              <span>Send announcement</span>
              <span>Issue refund review</span>
            </div>
          </article>
        </div>
      </main>
    </div>
  )
}
