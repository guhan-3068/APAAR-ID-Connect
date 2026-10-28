import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAuthRequest } from '../server/authBackend.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // 1. Recover the true original request path from Vercel edge headers
  let url = req.url || '/'

  const headers = req.headers || {}
  const forwardedUri =
    (headers['x-forwarded-uri'] as string) ||
    (headers['x-matched-path'] as string) ||
    (headers['x-original-url'] as string)

  if (forwardedUri && forwardedUri.startsWith('/api')) {
    url = forwardedUri
  } else if ((req as any).query?.path) {
    const subpath = Array.isArray((req as any).query.path)
      ? (req as any).query.path.join('/')
      : String((req as any).query.path)
    try {
      const parsedUrl = new URL(url, 'http://localhost')
      parsedUrl.searchParams.delete('path')
      const remainingSearch = parsedUrl.searchParams.toString()
      url = `/api/${subpath}${remainingSearch ? '?' + remainingSearch : ''}`
    } catch {
      url = `/api/${subpath}`
    }
  }

  // 2. Guarantee /api prefix
  if (!url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? url : '/' + url}`
  }
  req.url = url

  // 3. Set standard CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  try {
    const handled = await handleAuthRequest(req, res)
    if (!handled) {
      res.statusCode = 404
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: `API route not found: ${req.url}` }))
    }
  } catch (error: any) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: error?.message || 'Internal server error in API handler' }))
  }
}
