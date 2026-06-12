import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SessionProvider from "@/components/SessionProvider";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import MfaSetupPage from "@/pages/MfaSetupPage";
import MfaVerifyPage from "@/pages/MfaVerifyPage";
import DashboardPage from "@/pages/DashboardPage";
import AuthCallbackPage from "@/pages/AuthCallbackPage";
// Contábil+ — Plataforma SaaS de gestão financeira e contábil para MEIs e pequenas empresas

const queryClient = new QueryClient();

function Router() {
  return (
    <SessionProvider>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/verify-email" component={VerifyEmailPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route path="/mfa/setup" component={MfaSetupPage} />
        <Route path="/mfa/verify" component={MfaVerifyPage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/auth/callback" component={AuthCallbackPage} />
        <Route component={NotFound} />
      </Switch>
    </SessionProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
