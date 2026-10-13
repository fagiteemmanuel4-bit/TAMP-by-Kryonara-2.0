import { useEffect, useState } from 'react'
import { BrowserRouter, Link, useLocation } from 'react-router-dom'
import './App.css'

const TITLES = {
  '/': 'Career skills, built one day at a time',
  '/courses': 'Courses',
  '/courses/data-analysis': 'Data Analysis course',
  '/how-it-works': 'How TAMP works',
  '/pricing': 'Pricing',
  '/about': 'About TAMP',
  '/contact': 'Contact',
  '/faq': 'Frequently asked questions',
  '/terms': 'Terms of study',
  '/privacy': 'Privacy',
  '/refunds': 'Refund policy',
  '/cookies': 'Cookie policy',
  '/certificate-policy': 'Certificate policy',
  '/verify-certificate': 'Certificate verification',
  '/signup': 'Enrollment is being prepared',
  '/login': 'Student sign-in',
  '/dashboard': 'Student dashboard',
  '/admin': 'Administration',
}

function pathFrom(location) {
  let path = location.pathname.replace(/\/+$/, '') || '/'
  if (path.endsWith('.html')) path = path.slice(0, -5) || '/'
  if (path === '/index') return '/'
  if (path === '/site') return '/'
  const aliases = {
    '/course': '/courses/data-analysis',
    '/how-it-works.html': '/how-it-works',
    '/verify': '/verify-certificate',
    '/verify-certificate.html': '/verify-certificate',
    '/signup.html': '/signup',
    '/login.html': '/login',
    '/dashboard.html': '/dashboard',
  }
  return aliases[path] || path
}

function Brand({ light = false }) {
  return (
    <Link className={'brand' + (light ? ' brand-light' : '')} to="/" aria-label="TAMP by Kryonara home">
      <svg viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
        <rect width="40" height="40" rx="12" fill="currentColor" />
        <path d="M9 13h22M20 13v17" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className="brand-word">TAMP<span className="brand-by">by Kryonara</span></span>
    </Link>
  )
}

function ButtonLink({ to, variant = 'primary', children, ...props }) {
  return <Link className={'button button-' + variant} to={to} {...props}>{children}</Link>
}

function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  useEffect(() => setOpen(false), [location.pathname])
  const items = [['Courses', '/courses'], ['How it works', '/how-it-works'], ['Pricing', '/pricing'], ['About', '/about']]
  return (
    <header className="site-header">
      <div className="wrap nav-wrap">
        <Brand />
        <button type="button" className="menu-toggle" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span /><span /><span />
        </button>
        <nav className={'nav-links' + (open ? ' nav-open' : '')} aria-label="Main navigation">
          {items.map(([label, to]) => <Link key={to} to={to} className={pathFrom(location) === to ? 'nav-active' : ''}>{label}</Link>)}
          <Link className="nav-login" to="/login">Sign in</Link>
          <ButtonLink to="/signup" variant="small">Explore enrollment <span aria-hidden="true">↗</span></ButtonLink>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div className="footer-intro"><Brand light /><p>Structured online training for people building job-ready skills from the beginning.</p><span className="footer-note">A Kryonara product</span></div>
        <div><h3>Learn</h3><Link to="/courses">Courses</Link><Link to="/courses/data-analysis">Data Analysis</Link><Link to="/how-it-works">How it works</Link><Link to="/pricing">Pricing</Link></div>
        <div><h3>Company</h3><Link to="/about">About TAMP</Link><Link to="/contact">Contact</Link><Link to="/faq">FAQs</Link></div>
        <div><h3>Policies</h3><Link to="/terms">Terms of study</Link><Link to="/privacy">Privacy</Link><Link to="/refunds">Refund policy</Link><Link to="/cookies">Cookies</Link><Link to="/certificate-policy">Certificate policy</Link></div>
      </div>
      <div className="wrap footer-bottom"><span>© {new Date().getFullYear()} Kryonara. All rights reserved.</span><span>Learn with intention. Build with proof.</span></div>
    </footer>
  )
}

function PageShell({ eyebrow, title, intro, children }) {
  return <main className="page-main"><section className="page-hero"><div className="wrap narrow"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-intro">{intro}</p></div></section><section className="wrap page-content">{children}</section></main>
}

function LaunchNotice({ title = 'Enrollment is being prepared', detail = 'We are preparing secure account creation and online payment before opening enrollment. No payment or sensitive personal information should be submitted through this preview.' }) {
  return (
    <div className="launch-notice">
      <span className="notice-icon" aria-hidden="true">i</span>
      <div><h2>{title}</h2><p>{detail}</p><ButtonLink to="/courses" variant="outline">View the course</ButtonLink></div>
    </div>
  )
}

function CourseCard() {
  return (
    <article className="course-card">
      <div className="course-visual"><div className="visual-top"><span className="visual-dot" /><span className="visual-line" /><span className="visual-menu">•••</span></div><div className="visual-label">DATA / INSIGHTS</div><div className="chart-bars"><i /><i /><i /><i /><i /><i /><i /></div><div className="chart-axis"><span>01</span><span>02</span><span>03</span><span>04</span></div></div>
      <div className="course-body"><div className="course-meta"><span className="tag">Featured course</span><span className="text-muted">Beginner friendly</span></div><h3>Data Analysis</h3><p>Learn to organise data, ask better questions, and communicate useful findings with practical tools and guided exercises.</p><div className="course-stats"><span><b>3</b> learning levels planned</span><span><b>~50 min</b> daily study target</span></div><div className="course-bottom"><strong>₦2,000 <small>planned course registration</small></strong><ButtonLink to="/courses/data-analysis" variant="dark">View course <span aria-hidden="true">→</span></ButtonLink></div></div>
    </article>
  )
}

function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy"><p className="eyebrow eyebrow-light"><span className="eyebrow-dot" /> TAMP BY KRYONARA</p><h1>Build a skill.<br /><span>Build your next move.</span></h1><p className="hero-intro">Practical, cohort-based training for people who are ready to grow their skills and create new career opportunities — even when they are starting from zero.</p><div className="hero-actions"><ButtonLink to="/courses" variant="light">Explore the course <span aria-hidden="true">↗</span></ButtonLink><ButtonLink to="/how-it-works" variant="ghost-light">See how it works</ButtonLink></div><div className="hero-proof"><span className="proof-icon">✓</span><span>Clear learning steps</span><span className="proof-separator">·</span><span>Practical assignments</span><span className="proof-separator">·</span><span>Progress you can track</span></div></div>
          <div className="hero-art" aria-label="Illustration of a learning dashboard" role="img"><div className="art-glow" /><div className="art-card art-card-back"><div className="art-mini-label">YOUR LEARNING PATH</div><div className="mini-progress"><span style={{ width: '72%' }} /></div><div className="mini-rows"><i /><i /><i /></div></div><div className="art-card art-card-main"><div className="art-card-head"><span className="art-card-icon">T</span><div><b>Data Analysis</b><small>Learning journey</small></div><span className="art-pill">COURSE</span></div><div className="art-chart-head"><span>Skill progress</span><b>Build steadily</b></div><div className="art-chart"><span /><span /><span /><span /><span /><span /><span /><span /></div><div className="art-rule" /><div className="art-next"><span className="check-ring">✓</span><div><b>One step at a time</b><small>Learn · practise · improve</small></div><span className="arrow-circle">↗</span></div></div><div className="art-float"><span className="float-check">✓</span><div><b>Progress with purpose</b><small>Small steps add up.</small></div></div><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /></div>
        </div>
        <div className="hero-wave" aria-hidden="true" />
      </section>
      <section className="value-strip"><div className="wrap value-grid"><div><span className="value-icon">01</span><div><b>Structured learning</b><span>A clear path, not random tutorials.</span></div></div><div><span className="value-icon">02</span><div><b>Practice as you learn</b><span>Turn concepts into useful work.</span></div></div><div><span className="value-icon">03</span><div><b>Built around a cohort</b><span>Move through the journey with a plan.</span></div></div></div></section>
      <section className="section" id="courses"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">START HERE</p><h2>One focused course.<br /><span>A practical place to begin.</span></h2></div><Link className="text-link" to="/courses">Explore courses <span aria-hidden="true">→</span></Link></div><CourseCard /></div></section>
      <section className="section section-soft"><div className="wrap split-section"><div><p className="eyebrow">THE TAMP APPROACH</p><h2>Make progress you<br />can actually <span>explain.</span></h2><p className="section-lead">TAMP is designed to make learning feel manageable. Work through clear topics, practise what you learn, and understand what comes next.</p><ul className="check-list"><li><span>✓</span> Step-by-step lessons instead of information overload</li><li><span>✓</span> Assignments that connect learning to practice</li><li><span>✓</span> A visible path through your learning journey</li></ul><ButtonLink to="/how-it-works" variant="dark">How TAMP works <span aria-hidden="true">→</span></ButtonLink></div><div className="steps-preview"><div className="step-preview-header"><div><small>YOUR LEARNING JOURNEY</small><h3>From first lesson to new capability</h3></div><span className="step-number">03 STEPS</span></div><div className="journey-step"><span className="journey-index">01</span><div><b>Learn the concept</b><p>Clear explanations and guided examples.</p></div><span className="journey-mark">↗</span></div><div className="journey-step"><span className="journey-index">02</span><div><b>Put it into practice</b><p>Use short exercises to strengthen your understanding.</p></div><span className="journey-mark">↗</span></div><div className="journey-step"><span className="journey-index">03</span><div><b>Review your progress</b><p>See what you have covered and what comes next.</p></div><span className="journey-mark">↗</span></div><div className="journey-foot"><span className="journey-check">✓</span><span>Designed for steady, intentional learning.</span></div></div></div></section>
      <section className="section"><div className="wrap"><div className="section-heading"><div><p className="eyebrow">SIMPLE BY DESIGN</p><h2>Know the next step.</h2><p className="section-lead">The learning experience is built around four useful parts.</p></div></div><div className="feature-grid"><article className="feature"><span className="feature-icon">↗</span><h3>Guided lessons</h3><p>Follow topics in a structured order, with space to practise and revisit concepts.</p></article><article className="feature"><span className="feature-icon">⌁</span><h3>Practical assignments</h3><p>Use small tasks to turn ideas into tangible work and build confidence through practice.</p></article><article className="feature"><span className="feature-icon">◷</span><h3>Progress tracking</h3><p>Keep the learning path visible so you know what you have completed and what remains.</p></article><article className="feature"><span className="feature-icon">✓</span><h3>Certificate pathway</h3><p>Certificate and verification services will be available once the assessment workflow is operational.</p></article></div></div></section>
      <section className="cta-section"><div className="wrap cta-panel"><div><p className="eyebrow eyebrow-light">YOUR NEXT CHAPTER STARTS HERE</p><h2>Start with one skill.<br /><span>Build from there.</span></h2><p>Explore the Data Analysis course and learn how the TAMP journey is planned.</p></div><div className="cta-actions"><ButtonLink to="/courses/data-analysis" variant="light">Explore Data Analysis <span aria-hidden="true">↗</span></ButtonLink><span>Online enrollment and payment are being prepared.</span></div><div className="cta-orb" aria-hidden="true" /></div></section>
    </main>
  )
}

function CoursesPage() {
  return <PageShell eyebrow="COURSES" title="Start with a skill that opens up new possibilities." intro="Explore the current TAMP course focus. Course availability, cohort dates, and secure enrollment will be published here when registration is ready."><CourseCard /><LaunchNotice title="Enrollment is not open yet" detail="The public course information is available to explore. Account creation and online payment will be enabled after the learning and payment systems are ready." /></PageShell>
}

function DataAnalysisPage() {
  return <PageShell eyebrow="FEATURED COURSE" title="Data Analysis" intro="Learn how to organise data, find useful patterns, and present insights clearly. The course is planned for beginners and is being prepared for cohort-based delivery."><div className="detail-grid"><div className="detail-main"><h2>What you will work towards</h2><p>Build foundational data skills through guided explanations, examples, and practice. The planned learning journey covers getting comfortable with data, using common analysis tools, asking clear questions, and communicating findings.</p><h3>Planned learning areas</h3><ul className="check-list"><li><span>✓</span> Understanding data, rows, columns, and data quality</li><li><span>✓</span> Working with spreadsheets and structured tables</li><li><span>✓</span> Core analysis concepts and clear reporting</li><li><span>✓</span> Practice assignments to apply each topic</li></ul><h3>Who this course is for</h3><p>Beginners who want a structured starting point and are willing to practise consistently. No prior professional data-analysis experience is assumed.</p><h3>Study commitment</h3><p>The plan targets about 50 minutes a day. The curriculum, timeline, tools, assessment rules, and final certificate requirements will be confirmed before enrollment opens.</p></div><aside className="detail-aside"><span className="tag">Course overview</span><h3>Data Analysis</h3><div className="detail-metric"><span>Level</span><b>Beginner entry point</b></div><div className="detail-metric"><span>Format</span><b>Cohort-based online</b></div><div className="detail-metric"><span>Daily target</span><b>About 50 minutes</b></div><div className="detail-metric"><span>Planned registration</span><b>₦2,000</b></div><LaunchNotice title="Not accepting enrollment yet" detail="No payments or student information are being collected on this page." /></aside></div></PageShell>
}

function HowPage() {
  const steps = [['01', 'Explore the course', 'Review the learning goals, expectations, schedule, and course requirements before joining.'], ['02', 'Enroll when registration opens', 'Complete the student enrollment process through the official, secure TAMP website.'], ['03', 'Learn and practise', 'Follow the lesson sequence, use the examples, and work through practical assignments.'], ['04', 'Complete the assessment path', 'Assessment, project review, and certificate requirements will be explained before a cohort begins.']]
  return <PageShell eyebrow="HOW IT WORKS" title="A clearer path from learning to practice." intro="TAMP is being built around small, structured steps, so learners know what to study, how to practise, and what completing a course is expected to involve."><div className="process-list">{steps.map(([n, t, d]) => <article key={n} className="process-item"><span>{n}</span><div><h2>{t}</h2><p>{d}</p></div></article>)}</div><div className="callout"><b>Before you enroll</b><p>Final schedules, lesson content, assessments, refund terms, and certificate eligibility will be clearly published before paid enrollment begins.</p></div></PageShell>
}

function PricingPage() {
  return <PageShell eyebrow="PRICING" title="Clear pricing, before you commit." intro="The planned course registration price is ₦2,000. Secure online checkout is not active yet, so this page does not accept payments."><div className="pricing-card"><div><span className="tag">Planned course registration</span><h2>₦2,000 <small>/ course</small></h2><p>For one course cohort. The confirmed schedule, full inclusions, and terms will be shown before checkout is enabled.</p><ul className="check-list"><li><span>✓</span> Course information and learning expectations</li><li><span>✓</span> Cohort schedule published before enrollment</li><li><span>✓</span> Clear assessment and refund terms</li></ul><ButtonLink to="/signup" variant="dark">Enrollment status <span aria-hidden="true">→</span></ButtonLink></div><div className="pricing-aside"><h3>No payment is due here</h3><p>Do not send money based on this information page. TAMP will announce the official online payment flow when it is ready.</p></div></div><p className="text-muted policy-under">Read the <Link to="/refunds">refund policy overview</Link> before committing to a future cohort.</p></PageShell>
}

function AboutPage() {
  return <PageShell eyebrow="ABOUT TAMP" title="Training designed around steady progress." intro="TAMP by Kryonara is a learning platform in development, focused on helping people build practical skills through structured online cohorts."><div className="prose"><h2>What we are building</h2><p>We want learners to have a clearer way to start: know what to study, understand how to practise, and see the steps in their learning journey. The platform is being designed around guided learning, useful assignments, and transparent course expectations.</p><h2>Our approach</h2><p>We value clarity over hype, practice over passive watching, and honest explanations of what a course can and cannot promise. We do not guarantee employment or a particular income after completing training.</p><h2>Where things stand</h2><p>The public site is being prepared first. Secure student accounts, payments, assessments, and certificate verification will be announced only after each service is connected and tested.</p></div></PageShell>
}

function ContactPage() {
  return <PageShell eyebrow="CONTACT" title="We want to hear from you." intro="TAMP's official support channels are being finalized. We will publish verified email and WhatsApp contact details here before opening enrollment."><div className="contact-card"><div className="contact-symbol">✉</div><div><h2>Support details coming with launch</h2><p>For now, please do not send passwords, bank details, NIN, or other sensitive information through unofficial channels. Course and enrollment updates will be published on this website.</p><ButtonLink to="/courses" variant="dark">Explore the course</ButtonLink></div></div></PageShell>
}

function FAQPage() {
  const rows = [
    ['Who is TAMP for?', 'TAMP is being designed for people who want a structured starting point for learning practical career skills. The current course focus is Data Analysis.'],
    ['Do I need prior experience?', 'The planned Data Analysis course begins at a beginner level. Final prerequisites will be published before registration opens.'],
    ['How much does a course cost?', 'The planned registration price is ₦2,000 per course. Payment is not currently enabled on this website.'],
    ['When does the next cohort start?', 'A confirmed start date has not been published yet. We will announce the schedule after course delivery and enrollment are ready.'],
    ['Will I receive a certificate?', 'Certificate eligibility, assessment requirements, issuance, and public verification are still being finalized. We will publish the requirements before enrollment opens.'],
    ['Does TAMP guarantee a job?', 'No. Training can help you build skills and evidence of practice, but it cannot guarantee a job, income, or interview.'],
    ['Can I pay now?', 'No. Please do not send money yet. Online checkout will be announced when the official payment service is active.'],
  ]
  return <PageShell eyebrow="HELP CENTRE" title="Questions, answered clearly." intro="Here are the current answers about TAMP's course plans and launch status."><div className="faq-list">{rows.map(([q, a]) => <details key={q}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></PageShell>
}

const POLICY = {
  '/terms': {
    eyebrow: 'POLICIES', title: 'Terms of study', intro: 'A plain-language outline for the upcoming TAMP learning service.',
    sections: [['Current site', 'This site currently provides informational content about TAMP. Enrollment, payments, student accounts, and graded learning are not available through this launch version.'], ['Course information', 'Course descriptions and prices are plans and may change before registration opens. Final learning outcomes, schedules, requirements, assessment rules, and fees will be shown before a learner commits.'], ['Learner conduct', 'When learning services open, learners will be expected to respect other participants, submit their own work, and follow the published academic integrity and assessment policies.'], ['Certificates', 'Completion alone should not be understood as an automatic guarantee of a certificate. Eligibility rules and the verification process will be published before enrollment.'], ['Updates', 'These terms will be updated before paid enrollment begins. Contact information and the effective date will be added to the final version.']],
  },
  '/privacy': {
    eyebrow: 'POLICIES', title: 'Privacy notice', intro: 'How to understand this informational launch site and what to expect before enrollment.',
    sections: [['Information collected through forms', 'This launch version does not provide working registration, NIN verification, payment, or student-support forms. Do not submit sensitive personal data through this informational website.'], ['Technical logs', 'The hosting provider may process standard connection and security information to deliver and protect the site. Applicable provider privacy terms also apply.'], ['Future student services', 'Before accounts or payments are enabled, TAMP will publish a fuller privacy notice describing the data collected, purposes, legal basis where applicable, retention, service providers, security measures, and how to exercise applicable rights.'], ['Contact and complaints', 'Verified privacy contact information will be added before enrollment opens. Do not send identity documents or payment details to unofficial contacts.']],
  },
  '/refunds': {
    eyebrow: 'POLICIES', title: 'Refund policy', intro: 'The final refund terms will be visible before any payment is accepted.',
    sections: [['No payment on this site', 'This launch version does not accept payment. The ₦2,000 amount shown elsewhere is a planned course-registration price, not a request to transfer money.'], ['Before a cohort opens', 'The draft plan has been to provide a refund if TAMP cancels a cohort and to define how a learner may request a refund before the cohort starts. Exact eligibility, timelines, and processing methods still need to be finalized.'], ['Before checkout', 'A final policy with effective date, exceptions, the request process, and official support contact will be published before online payment goes live.']],
  },
  '/cookies': {
    eyebrow: 'POLICIES', title: 'Cookie policy', intro: 'This public launch version is intended to provide informational pages only.',
    sections: [['Current site', 'This version does not use browser storage for student login or verification and does not ask you to accept a demo login cookie. The hosting provider may still process standard access logs.'], ['Future services', 'If cookies or similar technologies are added for sessions, security, preferences, or analytics, the policy will be updated to describe them and provide appropriate choices.']],
  },
  '/certificate-policy': {
    eyebrow: 'POLICIES', title: 'Certificate policy', intro: 'TAMP plans to publish clear rules for assessment, issuance, and certificate verification before learners enroll.',
    sections: [['Eligibility', 'Certificate requirements will specify the learning and assessment steps a learner must complete. The final rules will be published before a cohort begins.'], ['Verification', 'A public certificate-checking service is not active in this launch version. No sample or demo verification result should be treated as proof of a real qualification.'], ['Accuracy and revocation', 'The final policy will explain how corrections, identity disputes, fraud reports, and any certificate revocation are handled.']],
  },
}

function PolicyPage({ path }) {
  const p = POLICY[path] || POLICY['/terms']
  return <PageShell eyebrow={p.eyebrow} title={p.title} intro={p.intro}><div className="prose policy-prose">{p.sections.map(([h, t]) => <section key={h}><h2>{h}</h2><p>{t}</p></section>)}<p className="policy-disclaimer">This is a launch-stage policy overview, not the final policy for the complete learning service. A dated, complete version and verified contact details will be published before paid enrollment.</p></div></PageShell>
}

function VerifyPage() {
  return <PageShell eyebrow="CERTIFICATE SERVICES" title="Certificate verification is not live yet." intro="A public verification page will be available after TAMP begins issuing certificates and the verification service is connected to its source of truth."><div className="contact-card"><div className="contact-symbol">✓</div><div><h2>Protect the value of a certificate</h2><p>This page does not return demo results. A certificate number should only be treated as verified when the official TAMP service can confirm its status.</p><ButtonLink to="/certificate-policy" variant="dark">Read certificate policy</ButtonLink></div></div></PageShell>
}

function GatePage({ kind }) {
  const data = {
    signup: ['Enrollment is being prepared', 'We are setting up secure student accounts and official online payments. Registration is not open in this version of TAMP.'],
    login: ['Student sign-in is not available yet', 'Student accounts will be enabled after authentication, email verification, and account recovery are connected and tested.'],
    dashboard: ['The learning dashboard is not live yet', 'The student learning experience will open after real accounts, course progress, assessments, and secure data storage are connected.'],
    admin: ['The admin portal is being prepared', 'Administrative access will only be enabled through a separate, protected portal when its server-side permissions and workflows are ready.'],
  }
  const [title, detail] = data[kind] || data.signup
  return <PageShell eyebrow="TAMP LAUNCH" title={title} intro={detail}><LaunchNotice title="No action is required right now" detail="Please do not enter passwords, identity details, verification codes, or payment information on a demo page. Course updates will be published on this website." /></PageShell>
}

function GenericPage({ path }) {
  const labels = {
    '/stories': ['Student stories', 'Learner stories will be published after the first cohort has completed and participants have agreed to share their experience.'],
    '/employers': ['For employers', 'Information for employers will be available after learner portfolios and certificate verification are operational.'],
    '/vendors': ['Vendor programme', 'The enrollment-key vendor programme is not accepting applications in this launch version.'],
  }
  const [title, intro] = labels[path] || ['Page not found', 'We could not find that page.']
  return <PageShell eyebrow="TAMP BY KRYONARA" title={title} intro={intro}><ButtonLink to="/" variant="dark">Back to home</ButtonLink></PageShell>
}

function AppContent() {
  const location = useLocation()
  const path = pathFrom(location)
  useEffect(() => {
    document.title = (TITLES[path] || 'TAMP by Kryonara') + ' | TAMP by Kryonara'
    const description = document.querySelector('meta[name="description"]')
    if (description) description.setAttribute('content', 'TAMP by Kryonara is preparing structured, cohort-based online training focused on practical skills and clear learning steps.')
  }, [path])
  let page
  if (path === '/') page = <HomePage />
  else if (path === '/courses') page = <CoursesPage />
  else if (path === '/courses/data-analysis') page = <DataAnalysisPage />
  else if (path === '/how-it-works') page = <HowPage />
  else if (path === '/pricing') page = <PricingPage />
  else if (path === '/about') page = <AboutPage />
  else if (path === '/contact') page = <ContactPage />
  else if (path === '/faq') page = <FAQPage />
  else if (POLICY[path]) page = <PolicyPage path={path} />
  else if (path === '/verify-certificate') page = <VerifyPage />
  else if (path === '/signup' || path === '/login' || path === '/dashboard' || path === '/admin') page = <GatePage kind={path.slice(1)} />
  else page = <GenericPage path={path} />
  return <><Header />{page}<Footer /></>
}

function App() {
  return <BrowserRouter><AppContent /></BrowserRouter>
}

export default App
