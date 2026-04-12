/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
import { Auth } from './components/Auth';
import { PublicBooking } from './components/PublicBooking';
import { SubscriptionPage } from './components/SubscriptionPage';
import { Barbershop } from './types';
import { Loader2 } from 'lucide-react';

function AdminApp({ user, barbershop }: { user: User, barbershop: Barbershop }) {
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Subscription Guard
  const isSubscribed = barbershop.subscriptionStatus === 'active' || barbershop.subscriptionStatus === 'trial';

  if (!isSubscribed) {
    return <SubscriptionPage barbershop={barbershop} />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard': return <Dashboard barbershop={barbershop} />;
      case 'agenda': return <Agenda barbershop={barbershop} />;
      case 'clients': return <Clients barbershop={barbershop} />;
      case 'inventory': return <Inventory barbershop={barbershop} />;
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
      setUser(user);
      if (user) {
        const path = `barbershops/${user.uid}`;
        try {
          const docRef = doc(db, 'barbershops', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setBarbershop({ id: docSnap.id, ...docSnap.data() } as Barbershop);
          } else {
            // New user, create barbershop profile
            const slug = (user.displayName || 'barbearia').toLowerCase().replace(/\s+/g, '-');
            const newBarbershop: Partial<Barbershop> = {
              name: user.displayName || 'Minha Barbearia',
              slug: `${slug}-${Math.random().toString(36).substring(2, 5)}`,
              ownerUid: user.uid,
              email: user.email || '',
              subscriptionStatus: 'trial',
              createdAt: new Date().toISOString(),
              businessHours: { start: '09:00', end: '18:00' }
            };
            await setDoc(docRef, newBarbershop);
            setBarbershop({ id: user.uid, ...newBarbershop } as Barbershop);
          }
        } catch (err) {
          console.error('Error fetching barbershop:', err);
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

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/agendar/:slug" element={<PublicBooking />} />
        <Route path="/" element={user && barbershop ? <AdminApp user={user} barbershop={barbershop} /> : <Auth />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
