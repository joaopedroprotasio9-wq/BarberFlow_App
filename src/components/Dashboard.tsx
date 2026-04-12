import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Appointment, Sale, Client } from '../types';
import { TrendingUp, Users, ShoppingBag, Calendar, ArrowUpRight, ArrowDownRight, Activity, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, startOfDay, endOfDay, subDays, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

interface DashboardProps {
  barbershop: Barbershop;
}

export function Dashboard({ barbershop }: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const qApp = query(
      collection(db, `barbershops/${barbershop.id}/appointments`),
      orderBy('startTime', 'desc')
    );
    const qSales = query(
      collection(db, `barbershops/${barbershop.id}/sales`),
      orderBy('date', 'desc')
    );
    const qClients = query(
      collection(db, `barbershops/${barbershop.id}/clients`),
      orderBy('visitCount', 'desc')
    );

    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
    });
    const unsubClients = onSnapshot(qClients, (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
      setLoading(false);
    });

    return () => {
      unsubApp();
      unsubSales();
      unsubClients();
    };
  }, [barbershop.id]);

  const today = new Date();
  const todayApps = appointments.filter(a => isSameDay(new Date(a.startTime), today));
  const todaySales = sales.filter(s => isSameDay(new Date(s.date), today));
  
  const todayRevenue = todayApps.reduce((acc, curr) => acc + (curr.status === 'completed' ? curr.price : 0), 0) +
                       todaySales.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayApps = appointments.filter(a => isSameDay(new Date(a.startTime), date) && a.status === 'completed');
    const daySales = sales.filter(s => isSameDay(new Date(s.date), date));
    return {
      name: format(date, 'EEE', { locale: ptBR }),
      faturamento: dayApps.reduce((acc, curr) => acc + curr.price, 0) + daySales.reduce((acc, curr) => acc + curr.totalPrice, 0)
    };
  });

  const stats = [
    { 
      label: 'Atendimentos Hoje', 
      value: todayApps.length, 
      icon: Calendar, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10',
      trend: calculateTrend(todayApps.length, appointments.filter(a => isSameDay(new Date(a.startTime), subDays(today, 1))).length)
    },
    { 
      label: 'Faturamento Hoje', 
      value: `R$ ${todayRevenue.toFixed(2)}`, 
      icon: TrendingUp, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10',
      trend: calculateTrend(todayRevenue, appointments.filter(a => isSameDay(new Date(a.startTime), subDays(today, 1)) && a.status === 'completed').reduce((acc, curr) => acc + curr.price, 0) + sales.filter(s => isSameDay(new Date(s.date), subDays(today, 1))).reduce((acc, curr) => acc + curr.totalPrice, 0))
    },
    { 
      label: 'Vendas Hoje', 
      value: todaySales.length, 
      icon: ShoppingBag, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10',
      trend: calculateTrend(todaySales.length, sales.filter(s => isSameDay(new Date(s.date), subDays(today, 1))).length)
    },
    { 
      label: 'Total Clientes', 
      value: clients.length, 
      icon: Users, 
      color: 'text-orange-500', 
      bg: 'bg-orange-500/10',
      trend: calculateTrend(clients.length, clients.filter(c => new Date(c.createdAt || 0) < startOfDay(today)).length)
    },
  ];

  function calculateTrend(current: number, previous: number) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-zinc-500 text-sm">Bem-vindo ao seu centro de comando, {barbershop.name}.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl shadow-sm">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Sistema Online</span>
          </div>
          <button 
            onClick={() => {
              const slug = barbershop.slug || barbershop.id;
              const url = `${window.location.origin}/agendar/${slug}`;
              navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className={cn(
              "px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border",
              copied 
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                : "bg-blue-600/10 hover:bg-blue-600/20 text-blue-500 border-blue-500/20"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Link Copiado!
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                Link de Agendamento
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-2xl`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
                stat.trend >= 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-500 bg-red-500/10"
              )}>
                {stat.trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {Math.abs(stat.trend)}%
              </div>
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-white">Faturamento Semanal</h3>
              <p className="text-zinc-500 text-xs">Desempenho dos últimos 7 dias</p>
            </div>
            <select className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/50">
              <option>Últimos 7 dias</option>
              <option>Últimos 30 dias</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `R$${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                  itemStyle={{ color: '#3b82f6' }}
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Faturamento']}
                />
                <Area 
                  type="monotone" 
                  dataKey="faturamento" 
                  name="Faturamento"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Next Appointments */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Próximos Clientes</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
            {appointments.filter(a => a.status === 'scheduled').slice(0, 5).map((app, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-zinc-800/30 border border-zinc-800/50 hover:border-zinc-700 transition-all">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500 font-bold text-sm">
                  {format(new Date(app.startTime), 'HH:mm')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{app.clientName}</p>
                  <p className="text-xs text-zinc-500 truncate">{app.serviceName}</p>
                </div>
                <div className="text-xs font-bold text-emerald-500">
                  R$ {app.price}
                </div>
              </div>
            ))}
            {appointments.filter(a => a.status === 'scheduled').length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-10">
                <Calendar className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">Nenhum agendamento pendente</p>
              </div>
            )}
          </div>
          <button className="mt-6 w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all">
            Ver Agenda Completa
          </button>
        </div>
      </div>
    </div>
  );
}
