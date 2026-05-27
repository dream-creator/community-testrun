export const RATE_LIMIT_DEFAULTS = {
  WINDOW_MS: 60000,
  MAX_REQUESTS: 3,
} as const

export class InMemoryRateLimiter {
  private store = new Map<string, number[]>()
  private windowMs: number
  private maxRequests: number
  private pruneInterval?: NodeJS.Timeout

  constructor(
    windowMs: number = RATE_LIMIT_DEFAULTS.WINDOW_MS,
    maxRequests: number = RATE_LIMIT_DEFAULTS.MAX_REQUESTS
  ) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Set up periodic pruning to prevent memory leaks/unbounded growth
    this.pruneInterval = setInterval(() => this.prune(), this.windowMs)
    if (this.pruneInterval && typeof this.pruneInterval.unref === 'function') {
      this.pruneInterval.unref()
    }
  }

  public isRateLimited(ip: string): boolean {
    const now = Date.now()
    const timestamps = this.store.get(ip) || []

    // Filter out older timestamps outside sliding window
    const recentTimestamps = timestamps.filter(
      (time) => now - time < this.windowMs
    )

    if (recentTimestamps.length >= this.maxRequests) {
      return true
    }

    recentTimestamps.push(now)
    this.store.set(ip, recentTimestamps)
    return false
  }

  public prune(): void {
    const now = Date.now()
    for (const [ip, timestamps] of this.store.entries()) {
      const recentTimestamps = timestamps.filter(
        (time) => now - time < this.windowMs
      )
      if (recentTimestamps.length === 0) {
        this.store.delete(ip)
      } else if (recentTimestamps.length !== timestamps.length) {
        this.store.set(ip, recentTimestamps)
      }
    }
  }

  public destroy(): void {
    if (this.pruneInterval) {
      clearInterval(this.pruneInterval)
    }
  }
}

// Export default single instance config (1 minute window, max 3 requests)
export const rateLimiter = new InMemoryRateLimiter(
  RATE_LIMIT_DEFAULTS.WINDOW_MS,
  RATE_LIMIT_DEFAULTS.MAX_REQUESTS
)
