import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'

function LegacyFrame({ src }) {
  return (
    <div className="legacy-shell">
      <iframe className="legacy-frame" title="TAMP legacy app" src={src} />
    </div>
  )
}

function LegacyRoute() {
  const location = useLocation()
  const pathname = location.pathname

  if (pathname === '/' || pathname === '/index.html') {
    return <LegacyFrame src="/site/index.html" />
  }

  if (pathname === '/login' || pathname === '/site/login.html') {
    return <LegacyFrame src="/site/login.html" />
  }

  if (pathname === '/dashboard' || pathname === '/site/dashboard.html') {
    return <LegacyFrame src="/site/dashboard.html" />
  }

  // Make the intended admin URL work directly. The previous version only
  // routed /ADMIN followed by digits, so /admin silently redirected home.
  if (pathname.toLowerCase() === '/admin' || pathname.toLowerCase() === '/admin/') {
    return <LegacyFrame src="/admin/index.html" />
  }

  if (/^\/ADMIN\d+$/i.test(pathname)) {
    return <LegacyFrame src="/admin/index.html" />
  }

  if (pathname.startsWith('/site/')) {
    return <LegacyFrame src={pathname} />
  }

  if (pathname.startsWith('/admin/')) {
    return <LegacyFrame src={pathname} />
  }

  return <Navigate to="/" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<LegacyRoute />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
