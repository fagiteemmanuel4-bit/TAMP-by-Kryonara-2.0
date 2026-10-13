import app from './server.js'

// Vercel's catch-all file route was only receiving single-segment API paths.
// Explicit route files use this adapter to restore the exact Express URL,
// regardless of how Vercel supplies req.url to the function.
export function createRouteHandler(routePath) {
  return function routeHandler(req, res) {
    const incoming = String(req.url || '')
    const queryAt = incoming.indexOf('?')
    const query = queryAt >= 0 ? incoming.slice(queryAt) : ''
    req.url = `${routePath}${query}`
    return app(req, res)
  }
}
