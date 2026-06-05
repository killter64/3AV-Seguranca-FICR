/**
 * SERVIÇO DE MFA/TOTP - SUPABASE (REAL)
 * 
 * Integração real com o Supabase MFA (Time-based One-Time Password).
 * 
 * O Supabase gerencia:
 * - Geração de segredo TOTP
 * - URI do QR Code para Google Authenticator
 * - Validação baseada no tempo dos códigos de 6 dígitos
 * - Nível de autenticação: Elevando AAL1 (Senha) para AAL2 (MFA verificado)
 */

import { createClient } from '@/utils/supabase/client';

export interface MFAEnrollResponse {
  success: boolean;
  message: string;
  secret?: string;
  qrCode?: string;
  uri?: string;
  id?: string;
}

export interface MFAVerifyResponse {
  success: boolean;
  message: string;
  aalLevel?: string;
}

export interface MFAChallengeResponse {
  success: boolean;
  message: string;
  challengeId?: string;
}

/**
 * Inicia o cadastro de MFA TOTP
 */
export async function enrollMFA(): Promise<MFAEnrollResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });

    if (error) {
      console.error('[MFA] Erro no enroll:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao iniciar o cadastro do MFA.',
      };
    }

    if (!data) {
      return {
        success: false,
        message: 'Erro ao gerar o segredo de MFA.',
      };
    }

    return {
      success: true,
      message: 'MFA iniciado com sucesso. Escaneie o QR Code no seu aplicativo.',
      secret: data.totp?.secret,
      qrCode: data.totp?.qr_code,
      uri: data.totp?.uri,
      id: data.id,
    };
  } catch (error) {
    console.error('[MFA] Erro no enrollMFA:', error);
    return {
      success: false,
      message: 'Erro ao configurar MFA.',
    };
  }
}

/**
 * Cria um desafio MFA para a verificação de código
 */
export async function createMFAChallenge(
  factorId: string
): Promise<MFAChallengeResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (error) {
      console.error('[MFA] Erro ao criar desafio:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao criar desafio MFA.',
      };
    }

    return {
      success: true,
      message: 'Desafio criado com sucesso.',
      challengeId: data?.id,
    };
  } catch (error) {
    console.error('[MFA] Erro no createMFAChallenge:', error);
    return {
      success: false,
      message: 'Erro ao criar desafio MFA.',
    };
  }
}

/**
 * Valida o código TOTP de 6 dígitos inserido pelo usuário
 */
export async function verifyMFACode(
  code: string,
  challengeId: string,
  factorId: string
): Promise<MFAVerifyResponse> {
  try {
    const supabase = createClient();

    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return {
        success: false,
        message: 'O código deve conter exatamente 6 números.',
      };
    }

    const { data, error } = await supabase.auth.mfa.verify({
      factorId,
      challengeId,
      code,
    });

    if (error) {
      console.error('[MFA] Erro ao verificar código:', error.message);
      return {
        success: false,
        message: error.message || 'Código inválido ou expirado.',
      };
    }

    return {
      success: true,
      message: 'Código verificado com sucesso!',
      aalLevel: 'aal2', // Eleva para autenticação multifator
    };
  } catch (error) {
    console.error('[MFA] Erro no verifyMFACode:', error);
    return {
      success: false,
      message: 'Erro ao verificar o código.',
    };
  }
}

/**
 * Obtém o nível atual de segurança do usuário (AAL)
 */
export async function getAuthenticationLevel() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (error) {
      console.error('[MFA] Erro ao obter AAL:', error.message);
      return null;
    }

    return {
      currentLevel: data?.currentLevel, // 'aal1' ou 'aal2'
      nextLevel: data?.nextLevel,
    };
  } catch (error) {
    console.error('[MFA] Erro no getAuthenticationLevel:', error);
    return null;
  }
}

/**
 * Lista todos os fatores cadastrados pelo usuário
 */
export async function listMFAFactors() {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      console.error('[MFA] Erro ao listar fatores:', error.message);
      return { totp: [] };
    }

    return {
      totp: data?.totp || [],
    };
  } catch (error) {
    console.error('[MFA] Erro no listMFAFactors:', error);
    return { totp: [] };
  }
}

/**
 * Remove/Desabilita o fator de MFA do usuário
 */
export async function disableMFA(factorId: string) {
  try {
    const supabase = createClient();

    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (error) {
      console.error('[MFA] Erro ao desabilitar MFA:', error.message);
      return {
        success: false,
        message: error.message || 'Erro ao desabilitar MFA.',
      };
    }

    return {
      success: true,
      message: 'MFA desabilitado com sucesso.',
    };
  } catch (error) {
    console.error('[MFA] Erro no disableMFA:', error);
    return {
      success: false,
      message: 'Erro ao desabilitar MFA.',
    };
  }
}

/**
 * Retorna o progresso atual do tempo limite de 30 segundos do TOTP
 */
export function calculateTOTPExpiration(): {
  expiresIn: number;
  percentageLeft: number;
} {
  const now = Date.now();
  const secondsInWindow = 30;
  const timeInWindow = (now / 1000) % secondsInWindow;
  const expiresIn = Math.ceil(secondsInWindow - timeInWindow);
  const percentageLeft = (expiresIn / secondsInWindow) * 100;

  return { expiresIn, percentageLeft };
}
