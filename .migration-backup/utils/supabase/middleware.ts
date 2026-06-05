import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do NOT remove getUser() - it is required to refresh session cookies.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Se o usuário tentar acessar o dashboard
  if (path.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    // Verificar o nível de autenticação (AAL)
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    
    const hasMfaSetup = factorsData && factorsData.totp && factorsData.totp.length > 0;

    if (hasMfaSetup) {
      if (aalData?.currentLevel === 'aal1') {
        // Logado apenas com senha, mas tem MFA ativo. Redirecionar para verificação.
        const url = request.nextUrl.clone();
        url.pathname = '/mfa/verify';
        return NextResponse.redirect(url);
      }
    } else {
      // 2FA é obrigatório neste projeto, então redirecionar para a tela de setup
      const url = request.nextUrl.clone();
      url.pathname = '/mfa/setup';
      return NextResponse.redirect(url);
    }
  }

  // Se tentar acessar o setup ou verificação de MFA e não estiver logado
  if (path.startsWith('/mfa/setup') || path.startsWith('/mfa/verify')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Evitar que usuário logado (aal2 ou sem MFA ativo) fique em telas de auth públicas
  if (user && (path === '/login' || path === '/register' || path === '/verify-email')) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const { data: factorsData } = await supabase.auth.mfa.listFactors();
    const hasMfaSetup = factorsData && factorsData.totp && factorsData.totp.length > 0;

    if (hasMfaSetup) {
      if (aalData?.currentLevel === 'aal2') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
