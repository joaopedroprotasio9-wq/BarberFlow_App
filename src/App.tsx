/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Agenda } from './components/Agenda';
import { Clients } from './components/Clients';
import { Inventory } from './components/Inventory';
import { Finance } from './components/Finance';
import { Services } from './components/Services';
import { Barbers } from './components/Barbers';
import { Auth } from './components/Auth';
import { PublicBooking } from './components/PublicBooking';
import { SubscriptionPage } from './components/SubscriptionPage';
import { LandingPage } from './components/LandingPage';
import { Barbershop } from './types';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

function AdminApp({ user, barbershop }: { user: User, barbershop: Barbershop }) {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard barbershop={barbershop} />;
      case 'agenda': return <Agenda barbershop={barbershop} />;
      case 'clients': return <Clients barbershop={barbershop} />;
      case 'inventory': return <Inventory barbershop={barbershop} />;
      case 'barbers': return <Barbers barbershop={barbershop} />;
      case 'services': return <Services barbershop={barbershop} />;
      case 'finance': return <Finance barbershop={barbershop} />;
      default: return <Dashboard barbershop={barbershop} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab} barbershop={barbershop}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      setVerifyingPayment(true);
      // In a real app, we'd wait for the webhook or poll the server
      setTimeout(() => {
        setVerifyingPayment(false);
        window.history.replaceState({}, document.title, "/");
      }, 3000);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'Logged in' : 'Logged out');
      setUser(user);
      if (user) {
        const path = `barbershops/${user.uid}`;
        try {
          console.log('Fetching barbershop data...');
          const docRef = doc(db, 'barbershops', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            console.log('Barbershop found:', docSnap.data());
            const data = docSnap.data() as Barbershop;
            setBarbershop({ id: docSnap.id, ...data } as Barbershop);

            // Verify subscription status in real-time on login
            if (data.stripeSubscriptionId) {
              try {
                const response = await fetch('/api/verify-subscription', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ barbershopId: user.uid }),
                });
                if (response.ok) {
                  const result = await response.json();
                  console.log('Subscription verified:', result.status);
                  setBarbershop(prev => prev ? { ...prev, subscriptionStatus: result.status } : null);
                }
              } catch (err) {
                console.error('Error auto-verifying subscription:', err);
              }
            }
          } else {
            console.log('Barbershop not found, creating new profile...');
            // New user, create barbershop profile
            const slug = (user.displayName || 'barbearia').toLowerCase().replace(/\s+/g, '-');
            const newBarbershop: Partial<Barbershop> = {
              name: user.displayName || 'Minha Barbearia',
              slug: `${slug}-${Math.random().toString(36).substring(2, 5)}`,
              ownerUid: user.uid,
              email: user.email || '',
              subscriptionStatus: 'inactive',
              createdAt: new Date().toISOString(),
              businessHours: { start: '09:00', end: '18:00' }
            };
            await setDoc(docRef, newBarbershop);
            console.log('New barbershop created successfully');
            setIsNewUser(true);
            setBarbershop({ id: user.uid, ...newBarbershop } as Barbershop);
          }
        } catch (err: any) {
          console.error('Error fetching/creating barbershop:', err);
          setError(`Erro no Firestore: ${err.message || 'Erro desconhecido'}. Verifique as Regras de Segurança.`);
          try {
            handleFirestoreError(err, OperationType.GET, path);
          } catch (e) {}
        }
      } else {
        setBarbershop(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading || verifyingPayment) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-zinc-500 text-sm animate-pulse">
            {verifyingPayment ? 'Verificando pagamento...' : 'Carregando BarberFlow...'}
          </p>
        </div>
      </div>
    );
  }

  if (user && barbershop) {
    const blockedStatuses = ['inactive', 'past_due', 'unpaid', 'canceled', 'incomplete_expired'];
    const isSubscribed = barbershop.subscriptionStatus === 'active';
    
    // Trial Logic: 3 days from createdAt
    const trialDuration = 3 * 24 * 60 * 60 * 1000;
    const createdAt = new Date(barbershop.createdAt).getTime();
    const now = new Date().getTime();
    const isTrialActive = (now - createdAt) < trialDuration;

    const isExpired = barbershop.subscriptionEndDate ? new Date(barbershop.subscriptionEndDate) < new Date() : false;

    // Allow access if subscribed OR trial is still active
    if (!isSubscribed && !isTrialActive) {
      return <SubscriptionPage barbershop={barbershop} />;
    }
    
    // Also block if sub was active but now expired (unless in trial, but usually sub happens after trial)
    if (isExpired && !isTrialActive) {
      return <SubscriptionPage barbershop={barbershop} />;
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Erro de Conexão</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Não conseguimos carregar os dados da sua barbearia. Verifique sua conexão ou as configurações do Firebase.
          </p>
          <div className="text-[10px] text-zinc-500 bg-black/30 p-3 rounded-lg mb-6 text-left break-all">
            {error}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recarregar App
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/agendar/:slug" element={<PublicBooking />} />
        <Route path="/" element={
          user && barbershop ? (
            <AdminApp user={user} barbershop={barbershop} />
          ) : showAuth ? (
            <Auth onBack={() => setShowAuth(false)} />
          ) : (
            <LandingPage onGetStarted={() => setShowAuth(true)} />
          )
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
