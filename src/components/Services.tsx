import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Barbershop, Service } from '../types';
import { Plus, Scissors, Clock, DollarSign, Trash2, X, Loader2 } from 'lucide-react';

interface ServicesProps {
  barbershop: Barbershop;
}

export function Services({ barbershop }: ServicesProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('30');

  useEffect(() => {
    const q = query(
      collection(db, `barbershops/${barbershop.id}/services`),
      orderBy('name', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setServices(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service)));
      setLoading(false);
    });

    return () => unsub();
  }, [barbershop.id]);

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const serviceData = {
        name,
        description,
        price: Number(price),
        duration: Number(duration),
        barbershopId: barbershop.id
      };

      if (editingService) {
        await updateDoc(doc(db, `barbershops/${barbershop.id}/services`, editingService.id), serviceData);
      } else {
        await addDoc(collection(db, `barbershops/${barbershop.id}/services`), serviceData);
      }
      
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || '');
    setPrice(service.price.toString());
    setDuration(service.duration.toString());
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingService(null);
    setName('');
    setDescription('');
    setPrice('');
    setDuration('30');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, `barbershops/${barbershop.id}/services`, id));
      setIsDeleting(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Serviços</h2>
          <p className="text-zinc-500 text-sm">Defina os serviços que seus clientes podem agendar.</p>
        </div>
        <button 
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Serviço
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-zinc-700 transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                  <Scissors className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-500">R$ {service.price.toFixed(2)}</p>
                  <div className="flex items-center justify-end gap-1 text-zinc-500 text-xs mt-1">
                    <Clock className="w-3 h-3" />
                    {service.duration} min
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-white mb-2">{service.name}</h3>
              <p className="text-sm text-zinc-500 mb-6 line-clamp-2">{service.description || 'Sem descrição.'}</p>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleEdit(service)}
                  className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
                >
                  Editar
                </button>
                <button 
                  onClick={() => setIsDeleting(service.id)}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/10 hover:text-red-500 text-zinc-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {services.length === 0 && (
            <div className="col-span-full py-20 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-500">
              <Scissors className="w-12 h-12 mb-4 opacity-20" />
              <p>Nenhum serviço cadastrado ainda.</p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Excluir Serviço?</h3>
            <p className="text-zinc-500 text-sm mb-8">Esta ação não pode ser desfeita. O serviço será removido permanentemente.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleting(null)}
                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(isDeleting)}
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
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-white">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white">
                <X />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nome do Serviço</label>
                <input 
                  required
                  placeholder="Ex: Corte Degradê"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Descrição (Opcional)</label>
                <textarea 
                  placeholder="Descreva o que está incluso..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50 min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Preço (R$)</label>
                  <input 
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Duração (min)</label>
                  <select 
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
              >
                {editingService ? 'Salvar Alterações' : 'Criar Serviço'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
