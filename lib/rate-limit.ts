/**
 * Simple in-memory rate limiter
 * In production, you would use a Redis-based solution for distributed rate limiting
 */

// Store for IP-based rate limiting
interface RateLimitStore {
  [ip: string]: {
    count: number;
    resetAt: number;
  };
}

// Configure limits - adjust as needed
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // 5 login attempts

// In-memory store
const store: RateLimitStore = {};

/**
 * Clean up expired entries
 */
const cleanup = () => {
  const now = Date.now();
  Object.keys(store).forEach((ip) => {
    if (store[ip].resetAt <= now) {
      delete store[ip];
    }
  });
};

/**
 * Check if a request is rate limited
 * @param ip The IP address to check
 * @returns Object containing limit info
 */
export function rateLimit(ip: string) {
  // Run cleanup occasionally
  if (Math.random() < 0.1) {
    cleanup();
  }

  const now = Date.now();
  
  // Initialize or reset if window expired
  if (!store[ip] || store[ip].resetAt <= now) {
    store[ip] = {
      count: 0,
      resetAt: now + WINDOW_MS,
    };
  }
  
  // Increment count
  store[ip].count += 1;
  
  // Check if over limit
  const isRateLimited = store[ip].count > MAX_REQUESTS;
  const resetIn = Math.ceil((store[ip].resetAt - now) / 1000);
  
  return {
    isRateLimited,
    current: store[ip].count,
    limit: MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - store[ip].count),
    resetIn, // Seconds until reset
  };
} 