/**
 * SERVIÇO DE SESSÃO - SUPABASE
 * 
 * O Supabase gerencia automaticamente:
 * 1. Geração de tokens JWT (HS256 ou RS256)
 * 2. Hashing de senhas (bcrypt com salt)
 * 3. Storage seguro (cookies HttpOnly)
 * 4. Flags de segurança: HttpOnly, Secure, SameSite=Strict
 * 5. Refresh de token antes de expirar
 * 6. Invalidação na logout
 * 
 * ⚠️  IMPORTANTE:
 * - Supabase gerencia todo o gerenciamento de sessão
 * - O @supabase/ssr cuida dos cookies HttpOnly no backend
 * - O middleware.ts renova tokens automaticamente
 * - NUNCA armazenar token em localStorage
 * - Usar createClient() para acessar sessão
 * 
 * JWT (JSON Web Token) é um padrão (RFC 7519) com 3 partes:
 * 1. Header: { "alg": "HS256", "typ": "JWT" }
 * 2. Payload: { "sub": "user123", "email": "...", "exp": ... }
 * 3. Signature: HMAC-SHA256(header.payload, secret)
 * 
 * Cookies de segurança definidos pelo Supabase:
 * - HttpOnly: inacessível ao JavaScript (protege de XSS)
 * - Secure: enviado apenas via HTTPS
 * - SameSite=Strict: previne CSRF attacks
 */

import { createClient } from '@/utils/supabase/client';

/**
 * Obter sessão atual do Supabase
 */
export async function getCurrentSession() {
  try {
    const supabase = createClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return null;
    }

    return {
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      expiresAt: new Date((session.expires_at ?? 0) * 1000).getTime(),
      user: {
        id: session.user.id,
        email: session.user.email,
      },
    };
  } catch (error) {
    console.error('[Session] Erro ao obter sessão:', error);
    return null;
  }
}

/**
 * Renovar token via refresh token
 */
export async function refreshSession() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();

    if (error || !data.session) {
      return {
        success: false,
        message: 'Erro ao renovar sessão.',
      };
    }

    return {
      success: true,
      session: {
        accessToken: data.session.access_token,
        expiresAt: new Date((data.session.expires_at ?? 0) * 1000).getTime(),
      },
    };
  } catch (error) {
    console.error('[Session] Erro ao renovar:', error);
    return {
      success: false,
      message: 'Erro ao renovar sessão.',
    };
  }
}

/**
 * Interface do payload JWT (para referência educacional)
 */
export interface JwtPayload {
  sub: string; // Subject (user ID)
  email: string;
  iat: number; // Issued At
  exp: number; // Expiration Time
  iss: string; // Issuer
  aud: string; // Audience
}

/**
 * Interface da sessão
 */
export interface Session {
  token: string;
  payload: JwtPayload;
  expiresAt: number;
}

/**
 * Simula codificação Base64URL (usado em JWT real)
 */
function base64urlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Gera JWT simulado (válido por 15 minutos)
 * 
 * Estrutura real:
 * eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
 * .eyJzdWIiOiJ1c2VyMTIzIiwiZW1haWwiOiJ...", "exp": 1234567890}
 * .TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
 */
export function generateJwt(
  userId: string,
  email: string,
  mfaVerified: boolean = false
): { token: string; payload: JwtPayload; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 15 * 60; // 15 minutos
  const expiresAt = now + expiresIn;

  const payload: JwtPayload = {
    sub: userId,
    email,
    iat: now,
    exp: expiresAt,
    iss: 'sistema-login-seguro', // Issuer
    aud: 'frontend-app', // Audience
  };

  // Simular assinatura (em produção seria HMAC-SHA256 real)
  const header = base64urlEncode(
    JSON.stringify({
      alg: 'HS256',
      typ: 'JWT',
    })
  );

  const payloadEncoded = base64urlEncode(JSON.stringify(payload));

  // Assinatura simulada (não é válida, apenas para demo visual)
  const signature = base64urlEncode(
    `SIMULATED_SIGNATURE_${userId}_${now}`.substring(0, 43)
  );

  const token = `${header}.${payloadEncoded}.${signature}`;

  return {
    token,
    payload,
    expiresAt: expiresAt * 1000, // Converter para ms
  };
}

/**
 * Valida se JWT não expirou
 */
export function isTokenValid(expiresAt: number): boolean {
  return Date.now() < expiresAt;
}

/**
 * Extrai payload do JWT (para demo - sem validação de assinatura)
 * Em produção: usar biblioteca como jsonwebtoken
 */
export function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decodificar payload (parte 2)
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    return payload as JwtPayload;
  } catch (error) {
    console.error('[JWT] Erro ao decodificar:', error);
    return null;
  }
}

/**
 * Calcula tempo restante até expiração
 */
export function getTokenRemainingTime(expiresAt: number): {
  seconds: number;
  minutes: number;
  isExpired: boolean;
} {
  const remaining = Math.max(0, expiresAt - Date.now());
  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);

  return {
    seconds,
    minutes,
    isExpired: remaining <= 0,
  };
}

/**
 * Formata tempo restante para exibição
 */
export function formatRemainingTime(expiresAt: number): string {
  const { minutes, seconds, isExpired } = getTokenRemainingTime(expiresAt);

  if (isExpired) return 'Expirado';
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * SOBRE REFRESH TOKENS:
 * 
 * Em produção, usar padrão access token + refresh token:
 * 
 * Access Token:
 * - Duração curta: 15 minutos
 * - Enviado em cada requisição
 * - Se vazar, dano limitado
 * - Armazenado em memória ou sessão
 * 
 * Refresh Token:
 * - Duração longa: 7 dias
 * - Enviado apenas ao renovar access token
 * - Armazenado em cookie HttpOnly
 * - Pode ser revogado no backend
 * 
 * Fluxo:
 * 1. Login → gera access token + refresh token
 * 2. Requisições → usa access token
 * 3. Exp access token → usa refresh token para renovar
 * 4. Logout → revoga ambos no backend (acessar /api/logout)
 */

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

/**
 * Gera refresh token (válido por 7 dias)
 */
export function generateRefreshToken(userId: string): {
  token: string;
  expiresAt: number;
} {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 dias
  const expiresAt = now + expiresIn;

  const payload: RefreshTokenPayload = {
    sub: userId,
    type: 'refresh',
    iat: now,
    exp: expiresAt,
  };

  const header = base64urlEncode(
    JSON.stringify({ alg: 'HS256', typ: 'JWT' })
  );
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const signature = base64urlEncode(
    `REFRESH_SIG_${userId}_${now}`.substring(0, 43)
  );

  const token = `${header}.${payloadEncoded}.${signature}`;

  return {
    token,
    expiresAt: expiresAt * 1000, // ms
  };
}

/**
 * RECOMENDAÇÕES DE HEADERS DE SEGURANÇA:
 * 
 * Adicionar no servidor (middleware ou NextJS headers):
 * 
 * // Content Security Policy - previne XSS
 * Content-Security-Policy: 
 *   default-src 'self';
 *   script-src 'self' 'nonce-{random}';
 *   style-src 'self' 'unsafe-inline';
 *   img-src 'self' data: https:;
 *   font-src 'self' data:;
 *   connect-src 'self' https:;
 *   frame-ancestors 'none';
 *   base-uri 'self';
 *   form-action 'self';
 * 
 * // HSTS - força HTTPS
 * Strict-Transport-Security: max-age=31536000; includeSubDomains
 * 
 * // Previne MIME sniffing
 * X-Content-Type-Options: nosniff
 * 
 * // Previne clickjacking
 * X-Frame-Options: DENY
 * 
 * // Previne Referer leak
 * Referrer-Policy: strict-origin-when-cross-origin
 * 
 * // Desabilita features antigas
 * Permissions-Policy: geolocation=(), microphone=(), camera=()
 * 
 * // CSRF - já protegido por SameSite=Strict em cookies
 * // Adicionar token CSRF em formulários críticos:
 * <form>
 *   <input type='hidden' name='csrf_token' value='...' />
 * </form>
 */

export default {
  generateJwt,
  isTokenValid,
  decodeJwt,
  getTokenRemainingTime,
  formatRemainingTime,
  generateRefreshToken,
};
