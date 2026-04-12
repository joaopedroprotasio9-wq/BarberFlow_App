import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Appointment, Sale } from '../types';
import { DollarSign, TrendingUp, ShoppingBag, Scissors, Calendar, ArrowUpRight, ArrowDownRight, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceProps {
  barbershop: Barbershop;
}

export function Finance({ barbershop }: FinanceProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const qApp = query(
      collection(db, `barbershops/${barbershop.id}/appointments`),
      where('status', '==', 'completed'),
      orderBy('startTime', 'desc')
    );
    const qSales = query(
      collection(db, `barbershops/${barbershop.id}/sales`),
      orderBy('date', 'desc')
    );

    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });
    const unsubSales = onSnapshot(qSales, (snap) => {
      setSales(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));
      setLoading(false);
    });

    return () => {
      unsubApp();
      unsubSales();
    };
  }, [barbershop.id]);

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  const monthApps = appointments.filter(a => isWithinInterval(new Date(a.startTime), { start: currentMonthStart, end: currentMonthEnd }));
  const monthSales = sales.filter(s => isWithinInterval(new Date(s.date), { start: currentMonthStart, end: currentMonthEnd }));

  const serviceRevenue = monthApps.reduce((acc, curr) => acc + curr.price, 0);
  const productRevenue = monthSales.reduce((acc, curr) => acc + curr.totalPrice, 0);
  const totalRevenue = serviceRevenue + productRevenue;

  const chartData = [
    { name: 'Serviços', value: serviceRevenue, color: '#3b82f6' },
    { name: 'Produtos', value: productRevenue, color: '#10b981' },
  ];

  const stats = [
    { label: 'Faturamento Mensal', value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Receita de Serviços', value: `R$ ${serviceRevenue.toFixed(2)}`, icon: Scissors, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Receita de Produtos', value: `R$ ${productRevenue.toFixed(2)}`, icon: ShoppingBag, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Ticket Médio', value: `R$ ${(totalRevenue / (monthApps.length + monthSales.length || 1)).toFixed(2)}`, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Financeiro</h2>
        <p className="text-zinc-500 text-sm">Acompanhe a saúde financeira da sua barbearia.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className={`${stat.bg} w-12 h-12 rounded-2xl flex items-center justify-center mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Distribution */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl">
          <h3 className="text-lg font-bold text-white mb-8">Distribuição de Receita</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#71717a" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Serviços</p>
              <p className="text-xl font-bold text-blue-500">{((serviceRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%</p>
            </div>
            <div className="p-4 rounded-2xl bg-zinc-800/50 border border-zinc-800">
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1">Produtos</p>
              <p className="text-xl font-bold text-emerald-500">{((productRevenue / (totalRevenue || 1)) * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl overflow-hidden flex flex-col">
          <h3 className="text-lg font-bold text-white mb-6">Transações Recentes</h3>
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[450px] pr-2 custom-scrollbar">
            {[...monthApps, ...monthSales]
              .sort((a, b) => new Date((a as any).startTime || (a as any).date).getTime() - new Date((b as any).startTime || (b as any).date).getTime())
              .reverse()
              .slice(0, 10)
              .map((item, i) => {
                const isApp = 'serviceName' in item;
                return (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-800/30 border border-zinc-800/50">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isApp ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {isApp ? <Scissors className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {isApp ? (item as Appointment).clientName : (item as Sale).productName}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                        {format(new Date((item as any).startTime || (item as any).date), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">R$ {((item as any).price || (item as any).totalPrice).toFixed(2)}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${isApp ? 'text-blue-500' : 'text-emerald-500'}`}>
                        {isApp ? 'Serviço' : 'Produto'}
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
