import app from '../backend/server.js'

// One serverless entrypoint handles all API paths. The Vercel Hobby plan
// limits each deployment to 12 functions, so nested endpoints are routed by
// vercel.json to this existing function instead of one function per endpoint.
function restoreRewrittenPath(req) {
  const marker = req.query?.__tamp_path
  if (typeof marker !== 'string' || !marker) return

  let path = decodeURIComponent(marker).replace(/^\/+/, '')
  if (path.startsWith('api/')) path = path.slice(4)
  if (!path) path = 'health'

  const incomingQuery = String(req.url || '').split('?')[1] || ''
  const params = new URLSearchParams(incomingQuery)
  params.delete('__tamp_path')
  const query = params.toString()

  req.url = `/api/${path}${query ? `?${query}` : ''}`
}

export default function handler(req, res) {
  restoreRewrittenPath(req)
  return app(req, res)
}
