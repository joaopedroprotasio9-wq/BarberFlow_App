import * as React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Users, 
  Calendar, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronRight, 
  Menu, 
  X,
  Star,
  Quote,
  Clock,
  ArrowRight
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [currentSlide, setCurrentSlide] = React.useState(0);

  const slides = [
    {
      title: "Agenda Inteligente",
      description: "Visualize todos os seus horários e barbeiros de forma clara e organizada.",
      image: "https://images.unsplash.com/photo-1506784919141-93504993e2b4?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Controle Financeiro",
      description: "Saiba exatamente quanto sua barbearia está faturando em tempo real.",
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"
    },
    {
      title: "Gestão de Clientes",
      description: "Histórico completo de cada cliente para um atendimento personalizado.",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
    }
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Calendar className="w-6 h-6 text-blue-500" />,
      title: "Agendamento Automático",
      description: "Seus clientes agendam sozinhos 24h por dia, sem você precisar parar o corte para atender o WhatsApp."
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Cadastro de Clientes",
      description: "Mantenha o histórico completo de cada cliente, preferências e frequência de visitas."
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-500" />,
      title: "Histórico de Cortes",
      description: "Saiba exatamente o que o cliente gosta e quando foi a última vez que ele esteve na poltrona."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      title: "Controle Financeiro",
      description: "Visualize seu lucro diário, semanal e mensal. Saiba para onde seu dinheiro está indo."
    }
  ];

  const benefits = [
    "Economize até 10 horas semanais de atendimento",
    "Evite horários vazios com lembretes automáticos",
    "Aumente seu faturamento em até 30% no primeiro mês",
    "Organização profissional que encanta os clientes"
  ];

  const testimonials = [
    {
      name: "Rodrigo Silva",
      role: "Dono da Barber Classic",
      content: "O BarberFlow mudou meu jogo. Meus clientes adoram o agendamento online e eu finalmente tenho paz para trabalhar."
    },
    {
      name: "Lucas Oliveira",
      role: "Barbeiro Autônomo",
      content: "O controle financeiro abriu meus olhos. Agora sei exatamente quanto ganho e consigo me planejar melhor."
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-barberflow.png" 
              alt="BarberFlow Logo" 
              className="w-12 h-12 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                // Fallback to old icon if image not found
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = document.createElement('div');
                  fallback.className = "w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]";
                  fallback.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-6 h-6 text-white"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
                  parent.appendChild(fallback);
                }
              }}
            />
            <span className="text-xl font-bold text-white tracking-tight">Barber<span className="text-blue-500">Flow</span></span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#preco" className="hover:text-white transition-colors">Preço</a>
            <button 
              onClick={onGetStarted}
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-lg hover:shadow-blue-500/20 active:scale-95"
            >
              Entrar
            </button>
          </nav>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-20 left-0 right-0 bg-zinc-900 border-b border-zinc-800 p-6 flex flex-col gap-4 text-center"
          >
            <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="py-2">Funcionalidades</a>
            <a href="#beneficios" onClick={() => setIsMenuOpen(false)} className="py-2">Benefícios</a>
            <a href="#preco" onClick={() => setIsMenuOpen(false)} className="py-2">Preço</a>
            <button 
              onClick={() => { onGetStarted(); setIsMenuOpen(false); }}
              className="bg-blue-600 text-white py-4 rounded-xl font-bold"
            >
              Entrar no Sistema
            </button>
          </motion.div>
        )}
      </header>

      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-16 pb-24 md:pt-32 md:pb-40 px-4">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8 mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold uppercase tracking-widest"
            >
              <img src="/logo-barberflow.png" alt="" className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
              O Sistema Nº1 para Barbearias Modernas
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-7xl font-extrabold text-white leading-tight tracking-tight px-4"
            >
              Ganhe mais dinheiro e <br className="hidden md:block" />
              <span className="text-blue-500">organize sua agenda</span> de vez.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto px-4"
            >
              O BarberFlow automatiza seus agendamentos, controla suas finanças e cuida dos seus clientes enquanto você foca no que realmente importa: o corte perfeito.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4"
            >
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Começar teste grátis
                <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-zinc-500 text-sm">3 dias grátis • Sem cartão de crédito</p>
            </motion.div>
          </div>

          {/* Hero Carousel Mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="relative max-w-6xl mx-auto px-4"
          >
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative z-10">
              <div className="bg-zinc-800/80 p-4 flex items-center gap-3 border-b border-zinc-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="bg-zinc-950 rounded-lg px-4 py-1.5 flex-1 max-w-md mx-auto text-[11px] text-zinc-500 font-mono text-center flex items-center justify-center gap-2">
                  <ShieldCheck className="w-3 h-3" />
                  app.barberflow.com/dashboard
                </div>
              </div>
              
              <div className="aspect-video relative overflow-hidden bg-zinc-950">
                {slides.map((slide, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: currentSlide === i ? 1 : 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                  >
                    <img 
                      src={slide.image} 
                      alt={slide.title}
                      className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                    
                    <div className="absolute inset-0 flex items-center justify-center p-8">
                      <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ 
                          y: currentSlide === i ? 0 : 20, 
                          opacity: currentSlide === i ? 1 : 0 
                        }}
                        className="bg-zinc-900/60 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl max-w-lg text-center"
                      >
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
                          {i === 0 && <Calendar className="w-8 h-8 text-white" />}
                          {i === 1 && <DollarSign className="w-8 h-8 text-white" />}
                          {i === 2 && <Users className="w-8 h-8 text-white" />}
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white mb-4 tracking-tight">{slide.title}</h3>
                        <p className="text-zinc-400 md:text-lg leading-relaxed">{slide.description}</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* Progress Indicators */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                  {slides.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 transition-all rounded-full ${
                        currentSlide === i ? "w-10 bg-blue-500" : "w-4 bg-zinc-700 hover:bg-zinc-600"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Background elements to add depth */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-600/20 blur-[80px] rounded-full -z-10" />
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-blue-500/10 blur-[100px] rounded-full -z-10" />
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="py-24 bg-zinc-950 relative">
          <div className="max-w-7xl mx-auto px-4 text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold text-white">Tudo o que você precisa</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">Desenvolvido pensando na rotina corrida do barbeiro que não tem tempo a perder.</p>
          </div>

          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl hover:border-blue-500/30 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  {React.cloneElement(feature.icon as React.ReactElement, { className: "w-6 h-6 text-blue-500 group-hover:text-white transition-colors" })}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section id="beneficios" className="py-24 bg-zinc-900/30">
          <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight">
                Barbeiro organizado, <br />
                <span className="text-blue-500">bolso cheio.</span>
              </h2>
              <p className="text-zinc-400 text-lg">
                Acabe com a confusão de papéis ou conversas perdidas no celular. Profissionalize sua barbearia hoje.
              </p>
              
              <ul className="space-y-4">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-medium">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <button 
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 text-blue-500 font-bold hover:gap-4 transition-all"
              >
                Começar agora <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-tr from-blue-600/20 to-transparent p-1 rounded-[3rem] shadow-2xl">
                <div className="bg-zinc-950 rounded-[2.9rem] p-8 space-y-6">
                  <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-bold">Faturamento Hoje</p>
                      <p className="text-2xl font-bold text-white">R$ 480,00</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 w-1/3 bg-zinc-900 rounded-full" />
                    <div className="h-4 w-full bg-zinc-900 rounded-full" />
                    <div className="h-4 w-2/3 bg-zinc-900 rounded-full" />
                  </div>
                  <div className="pt-4 flex justify-around">
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Cortes</p>
                      <p className="text-lg font-bold text-white">12</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Novos</p>
                      <p className="text-lg font-bold text-white">4</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Feedback</p>
                      <p className="text-lg font-bold text-white">4.9/5</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 blur-[60px] rounded-full -z-10" />
            </div>
          </div>
        </section>

        {/* Plan Section */}
        <section id="preco" className="py-24 px-4 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Um único plano. <span className="text-blue-500">Tudo incluso.</span></h2>
            <p className="text-zinc-500">Transparência total. Sem surpresas ou taxas escondidas.</p>
          </div>

          <div className="max-w-md mx-auto relative">
            <div className="absolute inset-0 bg-blue-600/5 blur-[100px] rounded-full" />
            
            <div className="bg-zinc-900 border-2 border-blue-600/50 p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 bg-blue-600 text-white px-6 py-2 rounded-bl-3xl font-bold text-xs uppercase tracking-widest">
                Recomendado
              </div>
              
              <div className="text-center mb-10">
                <span className="text-blue-500 font-bold uppercase tracking-widest text-xs">Assinatura Mensal</span>
                <div className="mt-4 flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-extrabold text-white">R$ 29</span>
                  <span className="text-zinc-500 font-medium">/mês</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10">
                {[
                  "Agenda Online Ilimitada",
                  "Sem comissão sobre cortes",
                  "Gestão Financeira",
                  "WhatsApp automático",
                  "Suporte 24h",
                  "Cancelamento Grátis"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <button 
                onClick={onGetStarted}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 rounded-2xl shadow-[0_0_30px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                Ativar BarberFlow Pro
              </button>

              <p className="text-zinc-500 text-center text-xs mt-6 flex items-center justify-center gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4" />
                Seguro via Stripe. Cancele quando quiser.
              </p>
            </div>
          </div>
        </section>

        {/* Free Trial / CTA */}
        <section className="py-24 px-4 bg-zinc-900/50">
          <div className="max-w-4xl mx-auto rounded-[3rem] bg-blue-600 p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -ml-32 -mt-32" />
            <div className="relative z-10 space-y-8">
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                Teste grátis por 3 dias. <br />
                Mude sua rotina hoje.
              </h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto">
                Use gratuitamente por 3 dias. Após esse período, será necessário assinar para continuar utilizando o sistema.
              </p>
              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={onGetStarted}
                  className="bg-white text-blue-600 hover:bg-zinc-100 px-12 py-5 rounded-2xl font-black text-xl shadow-2xl transition-all active:scale-95"
                >
                  Testar grátis agora
                </button>
                <div className="flex items-center gap-4 text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">
                  <span>Sem compromisso</span>
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  <span>Sem riscos</span>
                  <div className="w-1.5 h-1.5 bg-white/30 rounded-full" />
                  <span>Ativação instantânea</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-24 px-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12">
            {testimonials.map((t, i) => (
              <div key={i} className="flex-1 bg-zinc-900 border border-zinc-800 p-10 rounded-[2.5rem] space-y-6">
                <Quote className="w-12 h-12 text-blue-500 opacity-20" />
                <p className="text-white text-lg font-medium leading-relaxed italic">"{t.content}"</p>
                <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
                  <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center font-bold text-blue-500">
                    {t.name[0]}
                  </div>
                  <div>
                    <h4 className="text-white font-bold">{t.name}</h4>
                    <p className="text-zinc-500 text-sm italic">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img src="/logo-barberflow.png" alt="BarberFlow" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
            <span className="font-bold text-white">BarberFlow © 2026</span>
          </div>
          <div className="flex gap-8 text-sm text-zinc-500">
            <a href="#" className="hover:text-white">Termos</a>
            <a href="#" className="hover:text-white">Privacidade</a>
            <a href="#" className="hover:text-white">Suporte</a>
          </div>
          <p className="text-zinc-600 text-xs">Transformando barbearias comuns em negócios de sucesso.</p>
        </div>
      </footer>
    </div>
  );
}
