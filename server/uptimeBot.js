const http = require('http')
const https = require('https')

/**
 * Robust Uptime Bot for keeping the Next.js and Express/Socket.io servers active,
 * especially on platforms with cold-start / free-tier sleep policies like Render.
 */

// Simple helper to ping a URL using native http/https module to be independent of fetch/dependencies
function pingUrl(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(url)
      const client = parsedUrl.protocol === 'https:' ? https : http
      
      // Set a 15-second timeout
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'UptimeBot/1.0 (KeepAlive; +https://render.com)',
        },
        timeout: 15000,
      }

      const req = client.request(url, options, (res) => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
        })
      })

      req.on('error', (err) => {
        reject(err)
      })

      req.on('timeout', () => {
        req.destroy()
        reject(new Error('Request timeout (15s)'))
      })

      req.end()
    } catch (error) {
      reject(error)
    }
  })
}

function startUptimeBot() {
  console.log('[Uptime Bot] Initializing...')

  // Gather target URLs
  const urlsToPing = new Set()

  // 1. Gather from Environment Variables
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL
  const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || process.env.SOCKET_URL
  const customUrls = process.env.UPTIME_PING_URLS

  if (appUrl) urlsToPing.add(appUrl.trim())
  if (socketUrl) urlsToPing.add(socketUrl.trim())

  if (customUrls) {
    customUrls.split(',').forEach((url) => {
      if (url.trim()) {
        urlsToPing.add(url.trim())
      }
    })
  }

  // Filter to valid HTTP/HTTPS URLs
  const validUrls = Array.from(urlsToPing).filter((url) => {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch (e) {
      console.warn(`[Uptime Bot] Skipping invalid URL: "${url}"`)
      return false
    }
  })

  if (validUrls.length === 0) {
    console.warn('[Uptime Bot] No valid URLs configured for pinging. Uptime bot will not run.')
    console.warn('[Uptime Bot] To configure, set NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SOCKET_URL, or UPTIME_PING_URLS environment variables.')
    return
  }

  console.log(`[Uptime Bot] Targets configured:`, validUrls)

  // Interval configuration (default to 10 minutes)
  const intervalMins = Number(process.env.UPTIME_PING_INTERVAL_MINS) || 10
  const intervalMs = intervalMins * 60 * 1000

  const runPing = async () => {
    console.log(`[Uptime Bot] Starting ping cycle for ${validUrls.length} targets...`)
    for (const url of validUrls) {
      try {
        const start = Date.now()
        const result = await pingUrl(url)
        const duration = Date.now() - start
        console.log(`[Uptime Bot] Pinged: ${url} - Status: ${result.statusCode} (${result.statusMessage}) - ${duration}ms`)
      } catch (error) {
        console.error(`[Uptime Bot] Failed to ping: ${url} - Error: ${error.message}`)
      }
    }
    console.log(`[Uptime Bot] Ping cycle finished. Next cycle in ${intervalMins} minutes.`)
  }

  // Run first ping after 30 seconds to allow server to bind ports and start completely
  const initialDelayMs = 30 * 1000
  console.log(`[Uptime Bot] Scheduling initial ping in ${initialDelayMs / 1000} seconds...`)
  setTimeout(runPing, initialDelayMs)

  // Schedule periodic pings
  const intervalId = setInterval(runPing, intervalMs)
  
  // Return control object in case we need to stop it (e.g., during tests/reload)
  return {
    stop: () => {
      clearInterval(intervalId)
      console.log('[Uptime Bot] Stopped.')
    },
    targets: validUrls,
    intervalMins,
  }
}

module.exports = { startUptimeBot }
