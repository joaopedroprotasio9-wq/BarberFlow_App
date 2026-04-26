import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Scissors, Mail, Lock, Chrome, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export function Auth({ onBack }: { onBack?: () => void }) {
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error('Erro detalhado login Google:', err);
      
      if (err.code === 'auth/operation-not-allowed') {
        setError('O login com Google não está ativado no Firebase Console. Vá em Authentication > Sign-in method e ative o Google.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('A janela de login foi fechada antes de completar.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('Aguarde, já existe uma janela de login aberta.');
      } else {
        setError(`Erro ao entrar com Google: ${err.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />

      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-zinc-500 hover:text-white flex items-center gap-2 transition-colors font-medium z-20"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Voltar para Home
        </button>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-zinc-900/50 backdrop-blur-2xl border border-zinc-800 p-8 rounded-3xl shadow-2xl relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-barberflow.png" alt="" className="w-16 h-16 object-contain mb-4" referrerPolicy="no-referrer" />
          <h1 className="text-3xl font-bold tracking-tight text-white">BarberFlow</h1>
          <p className="text-zinc-400 text-sm mt-2 text-center">
            {isLogin ? 'Bem-vindo de volta ao futuro da sua barbearia' : 'Comece seu teste grátis de 3 dias hoje'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Entrar' : 'Criar Conta'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500">Ou continue com</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium py-3 rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-5 h-5" />
          Google
        </button>

        <p className="text-center text-zinc-500 text-sm mt-8">
          {isLogin ? 'Não tem uma conta?' : 'Já possui uma conta?'}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-500 font-bold ml-1 hover:underline"
          >
            {isLogin ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
