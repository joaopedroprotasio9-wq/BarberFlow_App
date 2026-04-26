import React, { useState } from 'react';
import { Barbershop } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Check, Loader2, CreditCard, ShieldCheck, Zap, LogOut, AlertTriangle, Clock } from 'lucide-react';

interface SubscriptionPageProps {
  barbershop: Barbershop;
  autoStart?: boolean;
}

export function SubscriptionPage({ barbershop, autoStart }: SubscriptionPageProps) {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(autoStart || false);

  const isOverdue = ['past_due', 'unpaid'].includes(barbershop.subscriptionStatus || '');
  const isCanceled = barbershop.subscriptionStatus === 'canceled';
  const isExpired = barbershop.subscriptionEndDate ? new Date(barbershop.subscriptionEndDate) < new Date() : false;
  
  const trialDuration = 3 * 24 * 60 * 60 * 1000;
  const createdAt = new Date(barbershop.createdAt).getTime();
  const now = new Date().getTime();
  const isTrialActive = (now - createdAt) < trialDuration;
  const isTrialExpired = !isTrialActive && barbershop.subscriptionStatus === 'inactive';

  React.useEffect(() => {
    if (autoStart) {
      handleSubscribe();
    }
  }, [autoStart]);

  const handleLogout = async () => {
    await signOut(auth);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    setRedirecting(true);
    try {
      if (barbershop.stripeCustomerId && (isOverdue || isCanceled || isExpired)) {
        // Redireciona para o Portal do Cliente para regularizar
        const response = await fetch('/api/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: barbershop.stripeCustomerId }),
        });
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }

      // Novo checkout
      const stripeUrl = `https://buy.stripe.com/bJedR9eLq8q2ebF3VcaIM01?client_reference_id=${barbershop.id}`;
      window.location.href = stripeUrl;
    } catch (err) {
      console.error('Erro ao redirecionar:', err);
      setRedirecting(false);
      alert('Erro ao iniciar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            <CreditCard className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Redirecionando para o Checkout</h2>
            <p className="text-zinc-500">Estamos preparando seu ambiente de pagamento seguro...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl flex justify-end mb-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sair da Conta
        </button>
      </div>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="space-y-8">
          <div>
            {isOverdue || isExpired || isTrialExpired ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-widest mb-4">
                <AlertTriangle className="w-3 h-3" />
                {isTrialExpired ? 'Período de Teste Encerrado' : 'Pagamento Atrasado'}
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">
                <Zap className="w-3 h-3" />
                BarberFlow Pro
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              {isOverdue || isExpired || isTrialExpired ? (
                <>{isTrialExpired ? 'Seu período de teste ' : 'Assinatura '} <span className="text-red-500">{isTrialExpired ? 'terminou.' : 'Bloqueada.'}</span></>
              ) : (
                <>Ative sua conta para <span className="text-blue-500">começar.</span></>
              )}
            </h1>
            
            <p className="text-zinc-400 text-lg mt-4">
              {isTrialExpired 
                ? 'Seus 3 dias de experimentação gratuita acabaram. Assine agora para continuar acessando sua agenda e ferramentas.'
                : isOverdue || isExpired 
                ? 'Identificamos uma pendência no seu pagamento. Regularize agora para recuperar o acesso às suas ferramentas.'
                : 'O BarberFlow é um sistema exclusivo para assinantes. Ative sua assinatura agora para acessar todas as ferramentas.'}
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Acesso a todos os agendamentos',
              'Controle completo de caixa',
              'Gestão de estoque e barbeiros',
              'Página de agendamento online',
              'Suporte prioritário',
              'Relatórios de desempenho'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", (isOverdue || isExpired) ? "bg-red-500/10" : "bg-emerald-500/10")}>
                  <Check className={cn("w-3 h-3", (isOverdue || isExpired) ? "text-red-500" : "text-emerald-500")} />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className={cn("absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16", (isOverdue || isExpired) ? "bg-red-500/10" : "bg-blue-500/10")}></div>
          
          <div className="relative">
            {isOverdue || isExpired || isTrialExpired ? (
              <div className="flex flex-col gap-2 mb-8">
                <span className="text-zinc-500 text-sm font-medium">Status da conta</span>
                <div className="flex items-center gap-2 text-red-500 font-bold text-xl">
                  <Clock className="w-5 h-5" />
                  {isTrialExpired ? 'Teste Finalizado' : 'Acesso Restrito'}
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl font-bold text-white">R$ 29,90</span>
                <span className="text-zinc-500 font-medium">/mês</span>
              </div>
            )}

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className={cn(
                "w-full text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-lg shadow-xl",
                (isOverdue || isExpired || isTrialExpired) 
                  ? "bg-red-600 hover:bg-red-500 shadow-red-600/20" 
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
              )}
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  {isTrialExpired ? 'Assinar BarberFlow Agora' : isOverdue || isExpired ? 'Regularizar Pagamento' : 'Assinar Agora'}
                </>
              )}
            </button>

            <p className="text-center text-zinc-500 text-sm mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Segurança garantida pelo Stripe
            </p>

            <div className="mt-12 pt-8 border-t border-zinc-800">
              <p className="text-zinc-400 text-xs leading-relaxed text-center">
                {isOverdue || isExpired 
                  ? 'Ao clicar, você será levado ao painel financeiro para atualizar seus dados de cobrança ou concluir faturas pendentes.'
                  : 'Sua assinatura será renovada automaticamente a cada mês. Cancele quando quiser.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
