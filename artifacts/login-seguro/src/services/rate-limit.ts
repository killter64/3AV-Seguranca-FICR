interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

const attemptStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000;

export function isRateLimited(identifier: string): {
  blocked: boolean;
  remainingTime: number;
} {
  const entry = attemptStore.get(identifier);

  if (!entry) {
    return { blocked: false, remainingTime: 0 };
  }

  const now = Date.now();

  if (entry.blockedUntil && now >= entry.blockedUntil) {
    attemptStore.delete(identifier);
    return { blocked: false, remainingTime: 0 };
  }

  if (entry.blockedUntil) {
    const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000);
    return { blocked: true, remainingTime };
  }

  return { blocked: false, remainingTime: 0 };
}

export function recordFailedAttempt(identifier: string): {
  success: boolean;
  blocked: boolean;
  attempts: number;
  remainingTime: number;
} {
  const now = Date.now();
  let entry = attemptStore.get(identifier);

  if (!entry) {
    entry = { attempts: 1, lastAttempt: now };
    attemptStore.set(identifier, entry);
    return { success: true, blocked: false, attempts: 1, remainingTime: 0 };
  }

  entry.attempts++;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + LOCKOUT_DURATION_MS;
    return {
      success: true,
      blocked: true,
      attempts: entry.attempts,
      remainingTime: LOCKOUT_DURATION_MS / 1000,
    };
  }

  return { success: true, blocked: false, attempts: entry.attempts, remainingTime: 0 };
}

export function clearAttempts(identifier: string): void {
  attemptStore.delete(identifier);
}
