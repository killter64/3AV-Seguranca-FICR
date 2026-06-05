/**
 * PROTEÇÃO BRUTE-FORCE
 * 
 * Implementa defesa contra ataques de força bruta no login.
 * 
 * POLÍTICA:
 * - Máximo 3 tentativas falhadas
 * - Bloqueio de 30 segundos após limite
 * - Contador reseta após sucesso ou expiração do bloqueio
 * 
 * Em produção:
 * - Usar Redis para compartilhar estado entre servidores
 * - Considerar rate-limit por IP (não apenas email)
 * - Implementar logs de segurança (alertar admin de padrões)
 * - Usar CAPTCHA após 2 tentativas (não apenas 3)
 */

interface RateLimitEntry {
  attempts: number;
  lastAttempt: number;
  blockedUntil?: number;
}

// Armazenamento em memória (apenas para demo)
// Em produção: usar Redis com chave "login:attempt:{email}:{ip}"
const attemptStore = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 segundos

/**
 * Verifica se um email está bloqueado por rate limit
 */
export function isRateLimited(identifier: string): {
  blocked: boolean;
  remainingTime: number;
} {
  const entry = attemptStore.get(identifier);
  
  if (!entry) {
    return { blocked: false, remainingTime: 0 };
  }

  const now = Date.now();
  
  // Se bloqueio expirou, limpar entry
  if (entry.blockedUntil && now >= entry.blockedUntil) {
    attemptStore.delete(identifier);
    return { blocked: false, remainingTime: 0 };
  }

  // Se está bloqueado
  if (entry.blockedUntil) {
    const remainingTime = Math.ceil((entry.blockedUntil - now) / 1000);
    return { blocked: true, remainingTime };
  }

  return { blocked: false, remainingTime: 0 };
}

/**
 * Registra uma tentativa falhada
 * Retorna: { success: boolean, blocked: boolean, attempts: number, remainingTime: number }
 */
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
    
    return {
      success: true,
      blocked: false,
      attempts: 1,
      remainingTime: 0,
    };
  }

  entry.attempts++;
  entry.lastAttempt = now;

  // Bloquear após MAX_ATTEMPTS
  if (entry.attempts >= MAX_ATTEMPTS) {
    entry.blockedUntil = now + LOCKOUT_DURATION_MS;
    
    return {
      success: true,
      blocked: true,
      attempts: entry.attempts,
      remainingTime: LOCKOUT_DURATION_MS / 1000,
    };
  }

  return {
    success: true,
    blocked: false,
    attempts: entry.attempts,
    remainingTime: 0,
  };
}

/**
 * Limpa as tentativas após login bem-sucedido
 */
export function clearAttempts(identifier: string): void {
  attemptStore.delete(identifier);
}

/**
 * Hook para limpar tentativas expiradas (limpeza periódica)
 * Pode ser chamado por um worker/cron job
 */
export function cleanupExpiredAttempts(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of attemptStore.entries()) {
    if (
      entry.blockedUntil &&
      now >= entry.blockedUntil + 60000 // Manter 1 min extra antes de limpar
    ) {
      attemptStore.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

/**
 * Retorna estado atual para debug/admin
 */
export function getAttemptStats(identifier: string): RateLimitEntry | null {
  return attemptStore.get(identifier) || null;
}

/**
 * Formato de uso no login:
 * 
 * const { blocked, remainingTime } = isRateLimited(email);
 * if (blocked) {
 *   return error(`Muitas tentativas. Aguarde ${remainingTime}s`);
 * }
 * 
 * const result = await verifyPassword(email, password);
 * if (!result.success) {
 *   recordFailedAttempt(email);
 *   if (result.blocked) {
 *     return error(`Conta bloqueada por ${result.remainingTime}s`);
 *   }
 *   return error('Credenciais inválidas');
 * }
 * 
 * clearAttempts(email); // Sucesso!
 */

export default {
  isRateLimited,
  recordFailedAttempt,
  clearAttempts,
  cleanupExpiredAttempts,
  getAttemptStats,
};
