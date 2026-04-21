import React, { useState } from 'react';
import { Barbershop } from '../types';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { Check, Loader2, CreditCard, ShieldCheck, Zap, LogOut } from 'lucide-react';

interface SubscriptionPageProps {
  barbershop: Barbershop;
  autoStart?: boolean;
}

export function SubscriptionPage({ barbershop, autoStart }: SubscriptionPageProps) {
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(autoStart || false);

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
      console.log('Redirecionando para o Link de Pagamento Stripe');
      // Passamos o ID da barbearia para o Stripe como client_reference_id
      // Isso permite que o sistema saiba QUEM pagou quando o webhook for ativado
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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-widest mb-4">
              <Zap className="w-3 h-3" />
              BarberFlow Pro
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight">
              Ative sua conta para <span className="text-blue-500">começar.</span>
            </h1>
            <p className="text-zinc-400 text-lg mt-4">
              O BarberFlow é um sistema exclusivo para assinantes. Ative sua assinatura agora para acessar todas as ferramentas.
            </p>
          </div>

          <ul className="space-y-4">
            {[
              'Agenda Online 24/7 para clientes',
              'Controle de Estoque Inteligente',
              'Relatórios Financeiros Detalhados',
              'Gestão Completa de Clientes',
              'Suporte Prioritário',
              'Sem taxas por agendamento'
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-zinc-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16"></div>
          
          <div className="relative">
            <div className="flex items-baseline gap-2 mb-8">
              <span className="text-5xl font-bold text-white">R$ 29,90</span>
              <span className="text-zinc-500 font-medium">/mês</span>
            </div>

            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-6 h-6" />
                  Assinar Agora
                </>
              )}
            </button>

            <p className="text-center text-zinc-500 text-sm mt-6 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Pagamento seguro via Stripe
            </p>

            <div className="mt-12 pt-8 border-t border-zinc-800">
              <p className="text-zinc-400 text-xs leading-relaxed text-center">
                Ao assinar, você concorda com nossos termos de serviço. A assinatura pode ser cancelada a qualquer momento diretamente no seu painel.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
