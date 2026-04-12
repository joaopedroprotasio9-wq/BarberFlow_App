import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, limit, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Service, Appointment, Client } from '../types';
import { Scissors, Calendar, Clock, User, Phone, CheckCircle2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { format, addMinutes, isSameDay, startOfDay, parse, isAfter, addDays, eachMinuteOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';

export function PublicBooking() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  // Selection state
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchBarbershop = async () => {
      if (!slug) return;
      
      try {
        // 1. Try lookup by slug
        const q = query(collection(db, 'barbershops'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        
        let bData: Barbershop | null = null;
        
        if (!snap.empty) {
          bData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Barbershop;
        } else {
          // 2. Fallback: Try lookup by ID (in case the slug is actually the ID)
          try {
            const docRef = doc(db, 'barbershops', slug);
            const docSnap = await getDocs(query(collection(db, 'barbershops'), where('__name__', '==', slug), limit(1)));
            if (!docSnap.empty) {
              bData = { id: docSnap.docs[0].id, ...docSnap.docs[0].data() } as Barbershop;
            }
          } catch (e) {
            console.error("ID lookup failed:", e);
          }
        }

        if (!bData) {
          setLoading(false);
          return;
        }

        setBarbershop(bData);

        // Fetch services
        const qServices = query(collection(db, `barbershops/${bData.id}/services`), orderBy('name', 'asc'));
        const snapServices = await getDocs(qServices);
        setServices(snapServices.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));

        // Listen to appointments for availability
        const qApps = query(collection(db, `barbershops/${bData.id}/appointments`), where('status', '==', 'scheduled'));
        const unsubApps = onSnapshot(qApps, (snapApps) => {
          setAppointments(snapApps.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
        });

        setLoading(false);
        return unsubApps;
      } catch (err) {
        console.error("Error fetching barbershop:", err);
        setLoading(false);
      }
    };

    fetchBarbershop();
  }, [slug]);

  const getAvailableSlots = () => {
    if (!barbershop || !selectedService) return [];

    // Fallback for business hours if missing
    const hours = barbershop.businessHours || { start: '09:00', end: '18:00' };
    
    try {
      const start = parse(hours.start, 'HH:mm', selectedDate);
      const end = parse(hours.end, 'HH:mm', selectedDate);
      
      // Generate slots every 30 minutes
      const slots = eachMinuteOfInterval({ start, end }, { step: 30 });
      const now = new Date();

      return slots.filter(slot => {
        // Don't show past slots for today
        if (isSameDay(slot, now) && !isAfter(slot, now)) return false;
        
        const slotEnd = addMinutes(slot, selectedService.duration);
        
        // Check for conflicts
        const hasConflict = appointments.some(app => {
          const appStart = new Date(app.startTime);
          const appEnd = new Date(app.endTime);
          // A slot is busy if it overlaps with any existing appointment
          return (slot >= appStart && slot < appEnd) || (slotEnd > appStart && slotEnd <= appEnd);
        });

        return !hasConflict;
      });
    } catch (err) {
      console.error("Error generating slots:", err);
      return [];
    }
  };

  const handleBooking = async () => {
    if (!barbershop || !selectedService || !selectedTime) {
      console.warn("Missing data for booking:", { barbershop, selectedService, selectedTime });
      return;
    }
    setIsBooking(true);

    try {
      console.log("Starting booking process for:", clientName, clientPhone);
      
      // 1. Find or Create Client
      const qClient = query(
        collection(db, `barbershops/${barbershop.id}/clients`),
        where('phone', '==', clientPhone),
        limit(1)
      );
      const snapClient = await getDocs(qClient);
      let clientId = '';
      
      if (snapClient.empty) {
        console.log("Creating new client...");
        const newClient = await addDoc(collection(db, `barbershops/${barbershop.id}/clients`), {
          name: clientName,
          phone: clientPhone,
          visitCount: 0,
          totalSpent: 0,
          points: 0,
          barbershopId: barbershop.id,
          createdAt: new Date().toISOString()
        });
        clientId = newClient.id;
      } else {
        clientId = snapClient.docs[0].id;
        console.log("Existing client found:", clientId);
      }

      // 2. Create Appointment
      const start = parse(selectedTime, 'HH:mm', selectedDate);
      const end = addMinutes(start, selectedService.duration);

      console.log("Creating appointment from", start.toISOString(), "to", end.toISOString());

      await addDoc(collection(db, `barbershops/${barbershop.id}/appointments`), {
        clientId,
        clientName,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        status: 'scheduled',
        barbershopId: barbershop.id
      });

      console.log("Booking successful!");
      setBookingSuccess(true);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Erro ao realizar agendamento. Por favor, tente novamente.");
    } finally {
      setIsBooking(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!barbershop) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-zinc-950 p-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-2">Barbearia não encontrada</h1>
        <p className="text-zinc-500">O link que você acessou parece estar incorreto.</p>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-8 rounded-3xl text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Agendamento Confirmado!</h2>
          <p className="text-zinc-500 text-sm mb-8">
            Tudo certo, {clientName.split(' ')[0]}! Seu horário para {selectedService?.name} está reservado.
          </p>
          <div className="bg-zinc-800/50 p-4 rounded-2xl mb-8 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Data:</span>
              <span className="text-white font-bold">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Horário:</span>
              <span className="text-white font-bold">{selectedTime}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Barbearia:</span>
              <span className="text-white font-bold">{barbershop.name}</span>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold mb-6">Enviamos uma confirmação para seu telefone</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all"
          >
            Fazer outro agendamento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-10">
      {/* Header */}
      <div className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-40 p-4">
        <div className="max-w-md mx-auto flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            {barbershop.name.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{barbershop.name}</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Agendamento Online</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 pt-8">
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-10 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1 last:flex-none">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
                step >= s ? "bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.5)]" : "bg-zinc-800 text-zinc-500"
              )}>
                {s}
              </div>
              {s < 3 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-2 rounded-full transition-all duration-300",
                  step > s ? "bg-blue-600" : "bg-zinc-800"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Service */}
        {step === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-white">Escolha o serviço</h2>
            <div className="space-y-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setStep(2);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between p-5 rounded-3xl border transition-all text-left group",
                    selectedService?.id === service.id ? "bg-blue-600/10 border-blue-600" : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                  )}
                >
                  <div className="flex-1">
                    <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors">{service.name}</h3>
                    <div className="flex items-center gap-3 mt-1 text-zinc-500 text-xs">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration} min</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-700" />
                      <span>R$ {service.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-blue-500 transition-all" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="p-2 -ml-2 text-zinc-500 hover:text-white">
                <ChevronLeft />
              </button>
              <h2 className="text-xl font-bold text-white">Data e Horário</h2>
            </div>

            {/* Date Selection */}
            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {Array.from({ length: 14 }).map((_, i) => {
                const date = addDays(new Date(), i);
                const isSelected = isSameDay(date, selectedDate);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[70px] p-4 rounded-2xl border transition-all",
                      isSelected ? "bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]" : "bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-widest mb-1">{format(date, 'EEE', { locale: ptBR })}</span>
                    <span className="text-lg font-bold">{format(date, 'dd')}</span>
                  </button>
                );
              })}
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-3 gap-3">
              {getAvailableSlots().map((slot, i) => {
                const timeStr = format(slot, 'HH:mm');
                const isSelected = selectedTime === timeStr;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedTime(timeStr)}
                    className={cn(
                      "py-3 rounded-xl border font-bold text-sm transition-all",
                      isSelected ? "bg-blue-600 border-blue-500 text-white" : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    {timeStr}
                  </button>
                );
              })}
              {getAvailableSlots().length === 0 && (
                <div className="col-span-full py-10 text-center text-zinc-500">
                  <p>Nenhum horário disponível para esta data.</p>
                </div>
              )}
            </div>

            <button
              disabled={!selectedTime}
              onClick={() => setStep(3)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
            >
              Continuar
            </button>
          </div>
        )}

        {/* Step 3: Client Info */}
        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="p-2 -ml-2 text-zinc-500 hover:text-white">
                <ChevronLeft />
              </button>
              <h2 className="text-xl font-bold text-white">Seus Dados</h2>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text"
                    required
                    placeholder="Como devemos te chamar?"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold ml-1">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="tel"
                    required
                    placeholder="(00) 00000-0000"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resumo do Agendamento</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Serviço:</span>
                  <span className="text-white font-bold">{selectedService?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Data:</span>
                  <span className="text-white font-bold">{format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Horário:</span>
                  <span className="text-white font-bold">{selectedTime}</span>
                </div>
                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Total:</span>
                  <span className="text-emerald-500 font-bold text-lg">R$ {selectedService?.price.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              disabled={!clientName || !clientPhone || isBooking}
              onClick={handleBooking}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
            >
              {isBooking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Agendamento'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
