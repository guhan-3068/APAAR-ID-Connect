import type { IncomingMessage, ServerResponse } from 'node:http'
import { handleAuthRequest } from '../server/authBackend.ts'

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Normalize req.url to guarantee /api prefix in Vercel serverless environment
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? req.url : '/' + req.url}`
  }

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
