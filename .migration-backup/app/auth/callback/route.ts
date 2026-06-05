import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sessão de email confirmada com sucesso. Redirecionar para o destino especificado.
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error('[Auth Callback] Erro ao trocar código por sessão:', error.message);
    }
  }

  // Se código inválido ou ausente, redirecionar para login com erro
  return NextResponse.redirect(
    `${origin}/login?error=invalid_verification_code`
  );
}
