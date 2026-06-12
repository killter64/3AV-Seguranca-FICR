# Sistema de Login Seguro - ADS (Segurança da Informação)

## 📋 Visão Geral

Sistema completo de autenticação multifator (MFA) com defesa em profundidade, implementando os 3 fatores de autenticação e proteção contra as vulnerabilidades mais comuns da OWASP Top 10.

### ✅ Funcionalidades Implementadas

#### 1. **Autenticação Multifator (3 Fatores)**
- **Fator 1 (O que você sabe):** Senha com política rigorosa (12+, maiúscula, minúscula, número, símbolo)
- **Fator 2 (O que você tem):** TOTP (Google Authenticator) + Email OTP
- **Fator 3 (O que você é):** Biometria via WebAuthn (TouchID, Windows Hello, YubiKey)

#### 2. **Defesas Implementadas**

| Vulnerabilidade | Defesa | Localização |
|---|---|---|
| **Força Bruta** | 3 tentativas + cooldown 30s | `services/rate-limit.ts` |
| **XSS** | Sanitização + Zod validation | `services/sanitize.ts` |
| **SQL Injection** | Zod + Prepared Statements (backend) | `lib/validators.ts` |
| **CSRF** | SameSite=Strict em cookies | `services/session.service.ts` |
| **Bot Signup** | CAPTCHA comportamental | `services/captcha.service.ts` |
| **Senha em Claro** | Hash Argon2id + Salt | `services/crypto.service.ts` |
| **Sessão Insegura** | JWT com flags HttpOnly/Secure | `services/session.service.ts` |
| **Headers Ausentes** | CSP, HSTS, X-Frame-Options | `components/SecurityHeadersNote.tsx` |
| **User Enumeration** | Mensagens genéricas de erro | `services/auth.service.ts` |
| **Credencial Stuffing** | Política forte + MFA obrigatório | `lib/validators.ts` |

#### 3. **Fluxo de Uso**

```
Home (/) → Verifica autenticação
├─ Autenticado → Dashboard
└─ Não autenticado → Login

Registro (/register)
├─ Email + Senha (Fator 1)
├─ CAPTCHA (Bot Protection)
├─ Hashing Visual (Educacional)
└─ Verify Email (/verify-email) → Fator 2

Login (/login)
├─ Email + Senha
├─ Rate Limiting (3 tentativas)
└─ MFA (/mfa) → Fator 2/3

MFA (/mfa)
├─ TOTP (6 dígitos) OU
└─ Biometria (WebAuthn)
└─ Dashboard (protegido)

Esqueci Senha (/forgot-password → /reset-password)
├─ Email
├─ Código OTP
└─ Nova Senha
```

#### 4. **Como Usar o Sistema**

**Cadastro:**
1. Acesse a tela de registro (`/register`)
2. Preencha com seu email e uma senha forte (mínimo 12 caracteres, com maiúscula, minúscula, número e símbolo)
3. Complete o CAPTCHA de segurança
4. Clique em **"Criar Conta"**
5. Você receberá um **email de confirmação** com um link mágico (magic link)
6. Clique no link do email para confirmar seu cadastro
7. Pronto! Você será redirecionado automaticamente para o **Dashboard**

**Login:**
1. Acesse `/login`
2. Digite seu email e senha cadastrados
3. Se o **MFA** estiver ativado, você será redirecionado para `/mfa/verify`
4. Abra o **Google Authenticator** e digite o código de 6 dígitos
5. Clique em **"Verificar"** e você acessará o **Dashboard**

**Ativar MFA (Autenticação Multifator):**
1. Após logar, acesse `/mfa/setup`
2. Um **QR Code** será exibido na tela
3. Abra o **Google Authenticator** (ou app compatível) e escaneie o QR Code
4. Digite o código de 6 dígitos gerado pelo app para confirmar
5. O MFA estará ativo — nos próximos logins, o código será solicitado

**Esqueci Minha Senha:**
1. Na tela de login, clique em **"Esqueci minha senha"**
2. Digite seu email cadastrado
3. Você receberá um email com instruções para redefinir a senha
4. Crie uma nova senha forte e confirme

---

## 🚀 Como Rodar Localmente (Passo a Passo)

### Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js 18+** — [Download](https://nodejs.org/)
- **pnpm** (gerenciador de pacotes) — Instale com: `npm install -g pnpm`
- **Git** — [Download](https://git-scm.com/)

---

### Passo 1: Clonar o Repositório

```bash
git clone https://github.com/SEU_USUARIO/sistema-de-login-seguro.git
cd sistema-de-login-seguro
```

### Passo 2: Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:

```bash
cp .env.example .env.local
```

> As variáveis de ambiente já estão pré-configuradas no `.env.example`. Basta copiar o arquivo.

### Passo 3: Instalar Dependências

```bash
pnpm install
```

Se preferir usar npm:
```bash
npm install
```

### Passo 4: Rodar o Servidor de Desenvolvimento

```bash
pnpm dev
```

### Passo 5: Acessar a Aplicação

Abra o navegador e acesse:

```
http://localhost:3000
```

A aplicação redirecionará automaticamente para `/login`.

### Build para Produção

```bash
pnpm build
pnpm start
```

---

## 📁 Estrutura de Arquivos

```
├── services/                    # Lógica de segurança desacoplada
│   ├── auth.service.ts         # Login, registro, MFA
│   ├── captcha.service.ts      # CAPTCHA com análise comportamental
│   ├── rate-limit.ts           # Proteção contra força bruta
│   ├── totp.service.ts         # TOTP/Autenticador
│   ├── session.service.ts      # JWT + gerenciamento de sessão
│   └── sanitize.ts             # Proteção XSS
│
├── store/
│   └── auth.store.ts           # Zustand: estado global de auth
│
├── components/
│   ├── AuthLayout.tsx          # Layout das telas de auth
│   ├── PasswordStrengthMeter.tsx # Indicador de força de senha
│   ├── CaptchaCheckbox.tsx      # CAPTCHA comportamental
│   ├── BiometricButton.tsx      # Botão de autenticação biométrica
│   ├── OtpInput.tsx             # Input de código OTP
│   ├── BruteForceLock.tsx       # Bloqueio por força bruta
│   ├── SecurityHeadersNote.tsx  # Info sobre headers HTTP
│   ├── SecurityInfoCard.tsx     # Card de informações de segurança
│   └── ui/                      # Componentes shadcn/ui
│
├── app/
│   ├── page.tsx                # Home (redireciona)
│   ├── register/               # Cadastro
│   ├── login/                  # Login
│   ├── mfa/                    # MFA (TOTP + Biometria)
│   │   ├── setup/              # Setup MFA (QR Code)
│   │   └── verify/             # Verificação MFA
│   ├── forgot-password/        # Recuperação de senha
│   ├── reset-password/         # Redefinição de senha
│   ├── auth/callback/          # Callback do Supabase (magic link)
│   ├── (authenticated)/
│   │   ├── layout.tsx          # Guard de autenticação
│   │   └── dashboard/          # Dashboard protegido
│   └── layout.tsx              # Root layout (dark mode)
│
├── utils/supabase/             # Configuração do Supabase client
│   ├── client.ts
│   ├── middleware.ts
│   └── server.ts
│
└── lib/
    └── validators.ts           # Schemas Zod + análise de força
```

---

## 🎨 Design System

### Cores (Dark Cybersecurity)
- **Primary:** Azul-marinho `oklch(0.15 0.05 250)` 
- **Accent:** Verde-neon `oklch(0.75 0.18 155)` / `#10b981`
- **Surface:** Cinza-aço `slate-900`, `slate-800`

### Tipografia
- **Headings:** Inter (padrão)
- **Code/PIN/Hash:** JetBrains Mono

### Componentes
- Usa `shadcn/ui` com tema dark
- Animações com `tailwindcss-animate`

---

## 🔐 Checklist de Segurança (Produção)

### Frontend
- [ ] Habilitar CORS apenas para seu domínio
- [ ] Content-Security-Policy headers rigorosos
- [ ] Subresource Integrity (SRI) em scripts
- [ ] Desabilitar dangerouslySetInnerHTML
- [ ] Rate limiting no cliente

### Backend
- [ ] HTTPS obrigatório (Strict-Transport-Security)
- [ ] Bcrypt/Argon2 para hashing de senhas
- [ ] Rate limiting por IP
- [ ] Audit logging (logar todos os logins)
- [ ] Rotação de secrets periodicamente
- [ ] Backup de códigos de recuperação
- [ ] 2FA obrigatório para admins
- [ ] Monitoramento de atividades suspeitas

### Database
- [ ] Encrypt sensitive data at rest
- [ ] Backups diários/criptografados
- [ ] Row-level security (RLS)
- [ ] Anonymize logs antigos

### Infraestrutura
- [ ] WAF (Web Application Firewall)
- [ ] DDoS protection
- [ ] Monitoramento 24/7
- [ ] Incident response plan

---

## 📚 Recursos Educacionais

### Documentação Referenciada
- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [RFC 6238 - TOTP](https://datatracker.ietf.org/doc/html/rfc6238)
- [Web Authentication API](https://w3c.github.io/webauthn/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [JWT RFC 7519](https://datatracker.ietf.org/doc/html/rfc7519)

### Ferramentas Úteis
```bash
# Testar headers HTTP
curl -i https://seu-site.com

# Verificar força de senha
echo "SuaSenha@1234" | zxcvbn

# Gerar secrets aleatórios
openssl rand -base64 32

# Validar TOTP
speakeasy.totp.verify({ secret, token })
```

---

## ❓ Dúvidas?

Consulte os comentários inline em cada arquivo - estão bem documentados:
- `services/` - Padrões de segurança
- `components/` - UI/UX educacional
- `app/` - Fluxos de autenticação
- `lib/` - Validações e políticas

Projeto acadêmico de Segurança da Informação - Defesa em Profundidade 🎓🔐
