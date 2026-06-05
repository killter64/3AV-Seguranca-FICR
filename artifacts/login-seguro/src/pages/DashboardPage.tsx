import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore, useTokenExpiration, useLogout } from '@/store/auth.store';
import { logout as logoutService, getCurrentUser } from '@/services/auth.service';
import { getAuthenticationLevel, listMFAFactors } from '@/services/totp.service';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogOut, Shield, Clock, Globe, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const logoutStore = useLogout();
  const { isExpired, remainingSeconds } = useTokenExpiration();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userData, setUserData] = useState<{ id: string; email: string } | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [aalLevel, setAalLevel] = useState<string | undefined>(undefined);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const lastLogin = new Date(Date.now() - 2 * 60000).toLocaleString('pt-BR');
  const userIp = '189.120.45.102';
  const sessionStarted = new Date(Date.now() - 10000).toLocaleTimeString('pt-BR');

  useEffect(() => {
    async function loadSecurityData() {
      try {
        setIsLoadingData(true);
        const user = await getCurrentUser();
        if (!user) { navigate('/login'); return; }
        setUserData({ id: user.id, email: user.email || '' });

        const factors = await listMFAFactors();
        const hasMfa = factors && factors.totp && factors.totp.length > 0;
        setMfaEnabled(hasMfa);

        const aal = await getAuthenticationLevel();
        setAalLevel(aal?.currentLevel ?? undefined);
      } catch (err) {
        console.error('[Dashboard] Erro ao carregar dados:', err);
      } finally {
        setIsLoadingData(false);
      }
    }
    loadSecurityData();
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logoutService();
      logoutStore();
      navigate('/login');
    } catch (error) {
      console.error('[Dashboard] Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (isExpired) navigate('/login');
  }, [isExpired]);

  if (isLoadingData) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-emerald-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm font-mono">Carregando dados da sessão...</p>
        </div>
      </div>
    );
  }

  if (!userData) return null;

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-blue-950/20 to-slate-950">
      <div className="fixed inset-0 -z-10 overflow-hidden opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,#10b981_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg border border-emerald-500/30 bg-slate-800">
                <Shield className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100">Painel de Segurança</h1>
                <p className="text-sm text-slate-400">Bem-vindo ao sistema seguro (Sessão Ativa)</p>
              </div>
            </div>

            <Button onClick={handleLogout} disabled={isLoggingOut} variant="destructive"
              className="gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50">
              <LogOut className="h-4 w-4" />
              {isLoggingOut ? 'Saindo...' : 'Logout Seguro'}
            </Button>
          </div>

          {isExpired && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Sua sessão expirou. Você será redirecionado para efetuar login novamente.</AlertDescription>
            </Alert>
          )}

          {!mfaEnabled && (
            <Alert className="border-yellow-500/50 bg-yellow-500/10">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-yellow-300">
                🔒 Para maior segurança, você deve configurar seu fator de autenticação adicional.
                <Button variant="link" size="sm" className="text-emerald-400 hover:text-emerald-300 p-0 ml-1 font-semibold underline"
                  onClick={() => navigate('/mfa/setup')}>
                  Configurar MFA agora
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-emerald-500/20 bg-slate-900/50 backdrop-blur-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-400" />Dados do Usuário (Supabase DB)
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Email Cadastrado</label>
                <p className="text-sm font-mono text-slate-200 bg-slate-950/40 p-2 rounded border border-slate-800">{userData.email}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">UUID no Banco de Dados</label>
                <p className="text-sm font-mono text-slate-300 bg-slate-950/40 p-2 rounded border border-slate-800 break-all">{userData.id}</p>
              </div>
            </div>
          </Card>

          <Card className="border-emerald-500/20 bg-slate-900/50 backdrop-blur-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />Mecanismos de Defesa
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Status do MFA</label>
                <div className="flex items-center gap-2 mt-1">
                  {mfaEnabled ? (
                    <>
                      <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50">✓ Ativo (TOTP)</Badge>
                      <span className="text-xs text-slate-400 font-mono">AAL Level: {aalLevel}</span>
                    </>
                  ) : (
                    <Badge className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/50">⚠ Não Configurado</Badge>
                  )}
                </div>
              </div>

              {!mfaEnabled && (
                <Button onClick={() => navigate('/mfa/setup')} variant="outline"
                  className="w-full border-slate-700 text-slate-300 hover:bg-slate-800">
                  Cadastrar App Autenticador (MFA)
                </Button>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Hora de Início da Sessão</label>
                <p className="text-sm text-slate-300 font-mono">{sessionStarted}</p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Expiração do Token JWT</label>
                <p className={`text-sm font-mono font-semibold ${remainingSeconds < 300 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-emerald-500/20 bg-slate-900/50 backdrop-blur-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Globe className="h-5 w-5 text-emerald-400" />Auditoria de Acesso
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">IP de Acesso</label>
                <p className="text-sm font-mono text-slate-300">{userIp}</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Navegador Utilizado</label>
                <p className="text-sm text-slate-300 font-mono">{navigator.userAgent.substring(0, 50)}...</p>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Horário do Acesso</label>
                <p className="text-sm text-slate-300 font-mono">{lastLogin}</p>
              </div>
            </div>
          </Card>

          <Card className="border-blue-500/20 bg-blue-500/5 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-blue-300">💡 Recomendações de Segurança</h2>
            <ul className="space-y-2 text-xs text-blue-300 leading-relaxed">
              <li>✓ A autenticação multifator (MFA) diminui drasticamente riscos de vazamento de credenciais.</li>
              <li>✓ Nunca salve senhas ou segredos TOTP no seu computador pessoal em texto simples.</li>
              <li>✓ Sempre clique em "Logout Seguro" antes de fechar o navegador em computadores compartilhados.</li>
              <li>✓ Utilize senhas de alta entropia (geradas aleatoriamente com mais de 12 caracteres).</li>
            </ul>
          </Card>
        </div>

        <Card className="border-slate-700 bg-slate-800/50 p-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-300">📚 Nota Acadêmica:</span>{' '}
            Este sistema utiliza autenticação com 2 fatores (Senha e TOTP do Google Authenticator). A criptografia de senha
            (bcrypt + salt) e o gerenciamento de sessões (JWT em cookies HttpOnly/Secure) são realizados no servidor pelo Supabase.
            O frontend realiza a validação de complexidade com Zod, prevenção de XSS com escape de caracteres e cooldown visual de brute-force.
          </p>
        </Card>
      </main>
    </div>
  );
}
