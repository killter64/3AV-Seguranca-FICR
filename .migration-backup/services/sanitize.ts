/**
 * PROTEÇÃO XSS - Sanitização Básica
 * 
 * Este módulo implementa defesa contra Cross-Site Scripting (XSS).
 * 
 * SOBRE SEGURANÇA XSS:
 * - Nunca usar dangerouslySetInnerHTML com dados de usuário
 * - Sempre escapar caracteres especiais: < > & " '
 * - Validar + sanitizar na entrada (frontend) e saída (frontend)
 * - No backend: usar bibliotecas como DOMPurify ou similares
 * 
 * Em produção com backend Node.js, usar:
 * - npm install dompurify
 * - Sanitizar no backend antes de armazenar
 */

/**
 * Escapa caracteres HTML perigosos
 * Protege contra: <script>, <img onerror>, <svg onload>, etc.
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Remove scripts e tags perigosas (versão simplificada)
 * Para uso em textos do usuário não-HTML
 */
export function sanitizeInput(input: string): string {
  // Remove tags HTML
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove eventos inline comuns
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  // Limpa espaços em branco extras
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Valida se uma string parece ser uma tentativa de SQL injection
 * Nota: Isto é apenas uma verificação básica no frontend.
 * A verdadeira proteção vem de:
 * 1. Parametrized Queries no backend
 * 2. Prepared Statements
 * 3. ORM com escape automático (Sequelize, Prisma, Drizzle)
 */
export function detectSqlInjection(input: string): boolean {
  // Padrões comuns de SQL injection
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|EXEC|OR|AND)\b)/i,
    /['";]/,
    /--|\*\/|\/\*/,
    /xp_|sp_/i,
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Sanitiza email para evitar header injection
 */
export function sanitizeEmail(email: string): string {
  return email
    .trim()
    .toLowerCase()
    .replace(/[\r\n]/g, ''); // Remove line breaks que poderiam injetar headers
}

/**
 * Exemplo de uso seguro:
 * 
 * // ❌ NÃO FAZER ISTO:
 * <div dangerouslySetInnerHTML={{ __html: userInput }} />
 * 
 * // ✅ FAZER ISTO:
 * <div>{escapeHtml(userInput)}</div>
 * 
 * // ✅ OU COM ZOD:
 * const schema = z.string().trim();
 * const cleaned = schema.parse(userInput);
 * <div>{cleaned}</div>
 */

export default {
  escapeHtml,
  sanitizeInput,
  detectSqlInjection,
  sanitizeEmail,
};
