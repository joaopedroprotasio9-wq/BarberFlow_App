import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Appointment, Client, Service } from '../types';
import { Plus, Calendar as CalendarIcon, Clock, User, Scissors, Check, X, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { format, addMinutes, isSameDay, startOfDay, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AgendaProps {
  barbershop: Barbershop;
}

export function Agenda({ barbershop }: AgendaProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState('09:00');

  useEffect(() => {
    const qApp = query(
      collection(db, `barbershops/${barbershop.id}/appointments`),
      orderBy('startTime', 'asc')
    );
    const qClients = query(collection(db, `barbershops/${barbershop.id}/clients`));
    const qServices = query(collection(db, `barbershops/${barbershop.id}/services`));

    const unsubApp = onSnapshot(qApp, (snap) => {
      setAppointments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      setLoading(false);
    });
    const unsubClients = onSnapshot(qClients, (snap) => {
      setClients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client)));
    });
    const unsubServices = onSnapshot(qServices, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
    });

    return () => {
      unsubApp();
      unsubClients();
      unsubServices();
    };
  }, [barbershop.id]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === selectedClient);
    const service = services.find(s => s.id === selectedService);
    if (!client || !service) return;

    const start = new Date(`${date}T${time}`);
    const end = addMinutes(start, service.duration);

    try {
      await addDoc(collection(db, `barbershops/${barbershop.id}/appointments`), {
        clientId: selectedClient,
        clientName: client.name,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'scheduled',
        barbershopId: barbershop.id
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setSelectedClient('');
    setSelectedService('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setTime('09:00');
  };

  const updateStatus = async (id: string, status: 'completed' | 'cancelled') => {
    try {
      await updateDoc(doc(db, `barbershops/${barbershop.id}/appointments`, id), { status });
      setIsCancelling(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, `barbershops/${barbershop.id}/appointments`, id));
      setIsDeleting(null);
    } catch (err) {
      console.error(err);
    }
  };

  const goToToday = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const filteredAppointments = appointments.filter(a => isSameDay(new Date(a.startTime), new Date(date)));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Agenda</h2>
          <p className="text-zinc-500 text-sm">Gerencie seus horários e atendimentos.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Date Selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Data</h3>
              <button 
                onClick={goToToday}
                className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-all"
              >
                Hoje
              </button>
            </div>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
            />
          </div>
          
          <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-3xl">
            <div className="flex items-center gap-3 text-blue-500 mb-2">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">Dica Pro</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Mantenha sua agenda sempre atualizada para evitar conflitos e aumentar a confiança dos seus clientes.
            </p>
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredAppointments.length > 0 ? (
            <div className="space-y-3">
              {filteredAppointments.map((app) => (
                <div 
                  key={app.id} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-3xl border transition-all ${
                    app.status === 'completed' 
                      ? 'bg-emerald-500/5 border-emerald-500/20 opacity-75' 
                      : app.status === 'cancelled'
                      ? 'bg-red-500/5 border-red-500/20 opacity-50'
                      : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-4 sm:w-32">
                    <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-bold ${
                      app.status === 'scheduled' ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      <span className="text-xs leading-none opacity-70">INÍCIO</span>
                      <span className="text-sm">{format(new Date(app.startTime), 'HH:mm')}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3 text-zinc-500" />
                      <h4 className="font-bold text-white truncate">{app.clientName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3 h-3 text-zinc-500" />
                      <p className="text-xs text-zinc-400 truncate">{app.serviceName}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <div className="text-right">
                      <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Valor</p>
                      <p className="text-sm font-bold text-white">R$ {app.price.toFixed(2)}</p>
                    </div>

                    {app.status === 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateStatus(app.id, 'completed')}
                          className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                          title="Concluir"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setIsCancelling(app.id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                          title="Cancelar"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setIsDeleting(app.id)}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {app.status !== 'scheduled' && (
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                          app.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                        <button 
                          onClick={() => setIsDeleting(app.id)}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-500 hover:bg-red-500/10 hover:text-red-500 transition-all"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-zinc-500">
              <CalendarIcon className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-lg font-medium">Nenhum agendamento para este dia</p>
              <p className="text-sm">Clique em "Novo Agendamento" para começar.</p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {isCancelling && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Cancelar Agendamento?</h3>
            <p className="text-zinc-500 text-sm mb-8">O status será alterado para cancelado. Você ainda poderá ver este registro na agenda.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsCancelling(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={() => updateStatus(isCancelling, 'cancelled')}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Permanentemente?</h3>
            <p className="text-zinc-500 text-sm mb-8">Esta ação removerá o agendamento por completo do banco de dados.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeleteAppointment(isDeleting)}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-all"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">Novo Agendamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                <X />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cliente</label>
                <select 
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Serviço</label>
                <select 
                  required
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price.toFixed(2)}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Data</label>
                  <input 
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Horário</label>
                  <select 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    {Array.from({ length: 24 * 2 }).map((_, i) => {
                      const hour = Math.floor(i / 2);
                      const minute = i % 2 === 0 ? '00' : '30';
                      const timeStr = `${hour.toString().padStart(2, '0')}:${minute}`;
                      return (
                        <option key={timeStr} value={timeStr}>{timeStr}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
              >
                Confirmar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
