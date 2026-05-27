export class InMemoryRateLimiter {
  private store = new Map<string, number[]>()
  private windowMs: number
  private maxRequests: number

  constructor(windowMs: number = 60000, maxRequests: number = 3) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests
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
}

// Export default single instance config (1 minute window, max 3 requests)
export const rateLimiter = new InMemoryRateLimiter(60000, 3)
