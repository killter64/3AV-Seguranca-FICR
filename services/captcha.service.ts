/**
 * SERVIÇO CAPTCHA (Bot Protection)
 * 
 * Implementa defesa contra bots no registro.
 * 
 * Tecnologias reais:
 * - Google reCAPTCHA v3: Análise comportamental (não intrusivo)
 * - Cloudflare Turnstile: Alternativa open-source (mais privado)
 * - hCaptcha: Focado em privacidade
 * 
 * ESTA IMPLEMENTAÇÃO SIMULA comportamento de reCAPTCHA v3:
 * - Analisa movimento do mouse, tempo de digitação, etc.
 * - Retorna score 0.0-1.0 (1.0 = humano, 0.0 = bot)
 * - Checkbox "Não sou um robô" como fallback
 * 
 * Em produção com Node.js:
 * - npm install axios (ou usar fetch)
 * - Frontend: <script src='https://www.google.com/recaptcha/api.js'></script>
 * - Backend valida token com Google API
 * 
 * Endpoints Google reCAPTCHA:
 * - https://www.google.com/recaptcha/api/siteverify
 * Requer: secret key (backend only, nunca expor)
 */

/**
 * Tipos para tracking comportamental
 */
interface BehaviorMetrics {
  mouseMovements: number;
  keyPresses: number;
  focusChanges: number;
  timeSpent: number; // ms
  speedScore: number; // 0-1 (lento = humano)
  inconsistency: number; // 0-1 (inconsistência = humano)
}

/**
 * Rastreia métricas comportamentais durante o registro
 * Simula análise do reCAPTCHA v3
 */
export class BehaviorTracker {
  private startTime: number;
  private metrics: BehaviorMetrics;
  private mousePositions: Array<{ x: number; y: number; t: number }> = [];

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      mouseMovements: 0,
      keyPresses: 0,
      focusChanges: 0,
      timeSpent: 0,
      speedScore: 0,
      inconsistency: 0,
    };
  }

  /**
   * Registra movimento do mouse
   */
  recordMouseMovement(x: number, y: number): void {
    const now = Date.now();
    this.mousePositions.push({ x, y, t: now });
    this.metrics.mouseMovements++;

    // Manter apenas últimos 100 movimentos
    if (this.mousePositions.length > 100) {
      this.mousePositions.shift();
    }
  }

  /**
   * Registra tecla pressionada
   */
  recordKeyPress(): void {
    this.metrics.keyPresses++;
  }

  /**
   * Registra mudança de foco
   */
  recordFocusChange(): void {
    this.metrics.focusChanges++;
  }

  /**
   * Calcula score comportamental (0-1)
   * 1.0 = definitivamente humano
   * 0.0 = definitivamente bot
   * ~0.5 = suspeito (pode pedir CAPTCHA)
   */
  calculateScore(): number {
    this.metrics.timeSpent = Date.now() - this.startTime;

    // Componentes do score - AJUSTADO PARA TESTE
    // Em produção: aumentar timeScore para 3000ms e mouseScore para 30+
    const timeScore = Math.min(this.metrics.timeSpent / 1500, 1); // 1.5s+ (dev: reduzido para testes)
    const mouseScore = Math.min(this.metrics.mouseMovements / 5, 1); // 5+ movimentos (dev: reduzido)
    const keyScore = Math.min(this.metrics.keyPresses / 3, 1); // 3+ teclas (dev: reduzido)
    const focusScore = Math.min(this.metrics.focusChanges / 2, 1); // 2+ mudanças (dev: reduzido)

    // Calcular velocidade e inconsistência
    this.calculateSpeedAndInconsistency();

    // Média ponderada
    let score =
      timeScore * 0.3 +
      mouseScore * 0.25 +
      keyScore * 0.2 +
      focusScore * 0.1 +
      this.metrics.speedScore * 0.1 +
      (1 - this.metrics.inconsistency) * 0.05;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calcula velocidade de digitação e inconsistência
   * Humanos têm padrão inconsistente, bots são muito rápidos
   */
  private calculateSpeedAndInconsistency(): void {
    if (this.metrics.keyPresses < 2) {
      this.metrics.speedScore = 0;
      this.metrics.inconsistency = 1;
      return;
    }

    // Velocidade estimada: ms por caractere
    const estimatedSpeed =
      this.metrics.timeSpent / this.metrics.keyPresses;

    // Humanos digitam 50-100ms por caractere (depois de pensar)
    // Bots: 5-20ms (muito rápido)
    this.metrics.speedScore = Math.min(
      Math.max(estimatedSpeed / 50, 0),
      1
    );

    // Inconsistência (variação nos movimentos do mouse)
    if (this.mousePositions.length > 1) {
      const distances: number[] = [];
      for (let i = 1; i < this.mousePositions.length; i++) {
        const prev = this.mousePositions[i - 1];
        const curr = this.mousePositions[i];
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) +
          Math.pow(curr.y - prev.y, 2)
        );
        distances.push(distance);
      }

      // Calcular desvio padrão das distâncias
      const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
      const variance =
        distances.reduce((a, d) => a + Math.pow(d - mean, 2), 0) /
        distances.length;
      const stdDev = Math.sqrt(variance);

      // Humanos têm movimento inconsistente
      this.metrics.inconsistency = Math.min(stdDev / 50, 1);
    }
  }

  /**
   * Obtém relatório completo
   */
  getReport(): {
    score: number;
    level: 'human' | 'suspicious' | 'bot';
    metrics: BehaviorMetrics;
  } {
    const score = this.calculateScore();

    let level: 'human' | 'suspicious' | 'bot' = 'human';
    if (score < 0.3) level = 'bot';
    else if (score < 0.5) level = 'suspicious'; // Reduzido de 0.6 para 0.5 (dev: mais permissivo)

    return {
      score,
      level,
      metrics: this.metrics,
    };
  }
}

/**
 * Simula verificação de CAPTCHA
 * Em produção: fazer chamada ao Google reCAPTCHA / Cloudflare Turnstile
 */
export async function verifyCaptcha(
  token: string,
  behaviorScore?: number
): Promise<{
  success: boolean;
  score: number;
  action: string;
  message: string;
}> {
  // Simular delay de rede
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Se não há token, usuário não completou checkbox
  if (!token) {
    return {
      success: false,
      score: 0,
      action: 'signup',
      message: 'Por favor, complete a verificação de CAPTCHA',
    };
  }

  // MODO DEV: Se comportamento score é muito baixo, aplicar boost para teste
  // Em produção: remover este bloco
  let finalScore = behaviorScore ?? Math.random() * 0.3 + 0.7; // 0.7-1.0 = humano
  
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Dev: se score é < 0.4, boost para 0.55 (passar facilmente)
    if (finalScore < 0.4) {
      console.log('[CAPTCHA-DEV] Score baixo detectado, aplicando boost para teste');
      finalScore = 0.55; // Permitir testes
    }
  }

  // Threshold padrão do reCAPTCHA: 0.5
  // Acima = provavelmente humano
  // Abaixo = provavelmente bot
  const threshold = 0.5;
  const isHuman = finalScore >= threshold;

  return {
    success: isHuman,
    score: finalScore,
    action: 'signup',
    message: isHuman
      ? 'CAPTCHA verificado com sucesso'
      : 'Falha na verificação CAPTCHA. Tente novamente.',
  };
}

/**
 * Gera token CAPTCHA simulado (para demo)
 * Em produção: Google gera token real
 */
export function generateMockCaptchaToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `mock_token_${timestamp}_${randomPart}`;
}

/**
 * Integração com backend Node.js:
 * 
 * // FRONTEND (este arquivo)
 * const tracker = new BehaviorTracker();
 * 
 * // Listener em todo formulário
 * form.addEventListener('mousemove', (e) => tracker.recordMouseMovement(e.x, e.y));
 * form.addEventListener('keypress', () => tracker.recordKeyPress());
 * inputs.forEach(input => {
 *   input.addEventListener('focus', () => tracker.recordFocusChange());
 *   input.addEventListener('blur', () => tracker.recordFocusChange());
 * });
 * 
 * // Ao submeter
 * const { score, level } = tracker.getReport();
 * const token = generateMockCaptchaToken();
 * 
 * POST /api/auth/register {
 *   email, password,
 *   captchaToken: token,
 *   behaviorScore: score
 * }
 * 
 * // BACKEND (Node.js)
 * import axios from 'axios';
 * 
 * async function verifyCaptcha(token) {
 *   const response = await axios.post(
 *     'https://www.google.com/recaptcha/api/siteverify',
 *     null,
 *     {
 *       params: {
 *         secret: process.env.RECAPTCHA_SECRET_KEY,
 *         response: token
 *       }
 *     }
 *   );
 * 
 *   const { success, score } = response.data;
 *   
 *   if (!success || score < 0.5) {
 *     return { error: 'CAPTCHA verification failed' };
 *   }
 * 
 *   // Prosseguir com registro
 *   return { success: true };
 * }
 */

export default {
  BehaviorTracker,
  verifyCaptcha,
  generateMockCaptchaToken,
};
