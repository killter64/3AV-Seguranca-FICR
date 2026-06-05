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

export async function enrollMFA(): Promise<MFAEnrollResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) return { success: false, message: error.message || 'Erro ao iniciar o cadastro do MFA.' };
    if (!data) return { success: false, message: 'Erro ao gerar o segredo de MFA.' };
    return {
      success: true,
      message: 'MFA iniciado com sucesso.',
      secret: data.totp?.secret,
      qrCode: data.totp?.qr_code,
      uri: data.totp?.uri,
      id: data.id,
    };
  } catch (error) {
    return { success: false, message: 'Erro ao configurar MFA.' };
  }
}

export async function createMFAChallenge(factorId: string): Promise<MFAChallengeResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.challenge({ factorId });
    if (error) return { success: false, message: error.message || 'Erro ao criar desafio MFA.' };
    return { success: true, message: 'Desafio criado com sucesso.', challengeId: data?.id };
  } catch (error) {
    return { success: false, message: 'Erro ao criar desafio MFA.' };
  }
}

export async function verifyMFACode(code: string, challengeId: string, factorId: string): Promise<MFAVerifyResponse> {
  try {
    const supabase = createClient();
    if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
      return { success: false, message: 'O código deve conter exatamente 6 números.' };
    }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    if (error) return { success: false, message: error.message || 'Código inválido ou expirado.' };
    return { success: true, message: 'Código verificado com sucesso!', aalLevel: 'aal2' };
  } catch (error) {
    return { success: false, message: 'Erro ao verificar o código.' };
  }
}

export async function getAuthenticationLevel() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) return null;
    return { currentLevel: data?.currentLevel, nextLevel: data?.nextLevel };
  } catch (error) {
    return null;
  }
}

export async function listMFAFactors() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) return { totp: [] };
    return { totp: data?.totp || [] };
  } catch (error) {
    return { totp: [] };
  }
}

export function calculateTOTPExpiration(): { expiresIn: number; percentageLeft: number } {
  const now = Date.now();
  const secondsInWindow = 30;
  const timeInWindow = (now / 1000) % secondsInWindow;
  const expiresIn = Math.ceil(secondsInWindow - timeInWindow);
  const percentageLeft = (expiresIn / secondsInWindow) * 100;
  return { expiresIn, percentageLeft };
}
