import { RegisterFormData, LoginFormData } from '@/lib/validators';
import { createClient } from '@/utils/supabase/client';

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    mfaEnabled: boolean;
  };
  requiresMFA?: boolean;
  requiresMFASetup?: boolean;
}

export async function register(data: RegisterFormData): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { success: false, message: authError.message || 'Erro ao registrar. Tente novamente.' };
    }

    if (!authData.user) {
      return { success: false, message: 'Erro ao criar usuário.' };
    }

    return {
      success: true,
      message: 'Registro bem-sucedido! Verifique seu email para obter o código de verificação.',
      user: { id: authData.user.id, email: authData.user.email || '', mfaEnabled: false },
    };
  } catch (error) {
    return { success: false, message: 'Erro ao registrar. Tente novamente.' };
  }
}

export async function verifyRegistrationOtp(email: string, token: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });

    if (error) {
      return { success: false, message: error.message || 'Código inválido ou expirado.' };
    }

    if (!data.user) {
      return { success: false, message: 'Erro ao verificar o código.' };
    }

    return {
      success: true,
      message: 'Email verificado com sucesso!',
      user: { id: data.user.id, email: data.user.email || '', mfaEnabled: false },
    };
  } catch (error) {
    return { success: false, message: 'Erro ao verificar o código. Tente novamente.' };
  }
}

export async function resendRegistrationOtp(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Código reenviado com sucesso!' };
  } catch (error) {
    return { success: false, message: 'Erro ao reenviar código. Tente novamente.' };
  }
}

export async function login(data: LoginFormData): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) {
      return { success: false, message: authError.message || 'Email ou senha incorretos.' };
    }

    if (!authData.user || !authData.session) {
      return { success: false, message: 'Erro ao fazer login.' };
    }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
    const hasMfaSetup = !factorError && factors?.totp && factors.totp.length > 0;
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const requiresMFA = hasMfaSetup && aalData?.currentLevel === 'aal1';
    const requiresMFASetup = !hasMfaSetup;

    return {
      success: true,
      message: 'Login efetuado.',
      token: authData.session.access_token,
      user: { id: authData.user.id, email: authData.user.email || '', mfaEnabled: hasMfaSetup },
      requiresMFA,
      requiresMFASetup,
    };
  } catch (error) {
    return { success: false, message: 'Erro ao fazer login. Tente novamente.' };
  }
}

export async function logout(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, message: 'Erro ao fazer logout.' };
    return { success: true, message: 'Logout realizado com sucesso.' };
  } catch (error) {
    return { success: false, message: 'Erro ao fazer logout.' };
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const redirectToUrl = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectToUrl });
    if (error) return { success: false, message: error.message || 'Erro ao enviar email de recuperação.' };
    return { success: true, message: 'Se o email existir, você receberá um link para redefinir sua senha.' };
  } catch (error) {
    return { success: false, message: 'Erro ao processar a solicitação de redefinição.' };
  }
}

export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, message: error.message || 'Erro ao atualizar senha.' };
    return {
      success: true,
      message: 'Senha atualizada com sucesso!',
      user: { id: data.user?.id || '', email: data.user?.email || '', mfaEnabled: false },
    };
  } catch (error) {
    return { success: false, message: 'Erro ao atualizar senha.' };
  }
}

export async function getCurrentUser() {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return { id: user.id, email: user.email, emailVerified: user.email_confirmed_at !== null };
  } catch (error) {
    return null;
  }
}
