import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAuthRequest } from '../server/authBackend.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Normalize req.url to guarantee valid /api/... path in Vercel serverless environment
  let url = req.url || '/'

  // 1. Check for x-matched-path or x-forwarded-uri from Vercel edge router
  const matchedPath = (req.headers['x-matched-path'] as string) || (req.headers['x-forwarded-uri'] as string)
  if (matchedPath && matchedPath.startsWith('/api')) {
    url = matchedPath
  } else if (url.includes('[[...path]]') || url.startsWith('/api/[[...path]]')) {
    // If Vercel passed query parameters for catch-all path
    const query = (req as any).query
    if (query?.path) {
      const subpath = Array.isArray(query.path) ? query.path.join('/') : String(query.path)
      try {
        const parsedUrl = new URL(url, 'http://localhost')
        parsedUrl.searchParams.delete('path')
        const remainingSearch = parsedUrl.searchParams.toString()
        url = `/api/${subpath}${remainingSearch ? '?' + remainingSearch : ''}`
      } catch {
        url = `/api/${subpath}`
      }
    }
  }

  // 2. Guarantee /api prefix
  if (!url.startsWith('/api')) {
    url = `/api${url.startsWith('/') ? url : '/' + url}`
  }
  req.url = url

  // Set CORS headers for preflight and standard requests
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
