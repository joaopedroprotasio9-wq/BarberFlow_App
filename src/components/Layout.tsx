import React, { useState } from 'react';
import { LayoutDashboard, Calendar, Users, Package, DollarSign, LogOut, Menu, X, Scissors, CreditCard, Loader2 } from 'lucide-react';
import { auth } from '../firebase';
import { Barbershop } from '../types';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  barbershop: Barbershop;
}

export function Layout({ children, currentTab, setCurrentTab, barbershop }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    if (!barbershop.stripeCustomerId) {
      alert('Informações de pagamento não encontradas.');
      return;
    }

    setLoadingPortal(true);
    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: barbershop.stripeCustomerId }),
      });
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error opening portal:', err);
      alert('Erro ao abrir portal de gerenciamento.');
    } finally {
      setLoadingPortal(false);
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'barbers', label: 'Barbeiros', icon: Users }, // Using Users icon temporarily, or can use Scissors
    { id: 'services', label: 'Serviços', icon: Scissors },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-blue-500/30">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <span className="font-bold text-white">BF</span>
          </div>
          <span className="font-bold text-lg tracking-tight">BarberFlow</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-zinc-400 hover:text-white transition-colors">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full p-6">
            <div className="hidden lg:flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]">
                <span className="font-bold text-xl text-white">BF</span>
              </div>
              <div>
                <h1 className="font-bold text-xl tracking-tight">BarberFlow</h1>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Management System</p>
              </div>
            </div>

            <nav className="flex-1 space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    currentTab === item.id 
                      ? "bg-blue-600/10 text-blue-500 border border-blue-500/20" 
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", currentTab === item.id ? "text-blue-500" : "text-zinc-400 group-hover:text-zinc-200")} />
                  <span className="font-medium">{item.label}</span>
                  {currentTab === item.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-zinc-800">
              <button 
                onClick={handleManageSubscription}
                disabled={loadingPortal}
                className="w-full flex items-center gap-3 px-4 py-3 mb-2 rounded-xl text-zinc-400 hover:bg-blue-500/10 hover:text-blue-500 transition-all duration-200"
              >
                {loadingPortal ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                <span className="font-medium">Assinatura</span>
              </button>
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                  {barbershop.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{barbershop.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{barbershop.email}</p>
                </div>
              </div>
              <button 
                onClick={() => auth.signOut()}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen p-4 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}
