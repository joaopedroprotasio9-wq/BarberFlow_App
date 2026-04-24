import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Barbershop, Barber } from '../types';
import { Plus, User, Trash2, CheckCircle2, XCircle, Calendar, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const DAYS = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export function Barbers({ barbershop }: { barbershop: Barbershop }) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBarber, setNewBarber] = useState<Partial<Barber>>({
    name: '',
    imageUrl: '',
    active: true,
    workingDays: [1, 2, 3, 4, 5, 6], // Seg-Sáb por padrão
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Barber>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, `barbershops/${barbershop.id}/barbers`));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Barber));
        setBarbers(data);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching barbers:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [barbershop.id]);

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBarber.name) return;
    setSaving(true);
    try {
      await addDoc(collection(db, `barbershops/${barbershop.id}/barbers`), {
        ...newBarber,
        barbershopId: barbershop.id,
      });
      setIsAdding(false);
      setNewBarber({ name: '', imageUrl: '', active: true, workingDays: [1, 2, 3, 4, 5, 6] });
    } catch (err) {
      console.error('Error adding barber:', err);
      alert('Erro ao adicionar barbeiro.');
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (barber: Partial<Barber>, dayId: number) => {
    const currentDays = barber.workingDays || [];
    const newDays = currentDays.includes(dayId)
      ? currentDays.filter(d => d !== dayId)
      : [...currentDays, dayId].sort();
    
    if (isAdding) {
      setNewBarber({ ...newBarber, workingDays: newDays });
    } else if (editingId && barber.id === editingId) {
      setEditForm({ ...editForm, workingDays: newDays });
    } else if (barber.id) {
      handleUpdateBarber(barber.id, { workingDays: newDays });
    }
  };

  const handleUpdateBarber = async (id: string, updates: Partial<Barber>) => {
    try {
      await updateDoc(doc(db, `barbershops/${barbershop.id}/barbers`, id), updates);
    } catch (err: any) {
      console.error('Error updating barber:', err);
      alert(`Erro ao atualizar barbeiro: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteBarber = async (id: string) => {
    setSaving(true);
    try {
      await deleteDoc(doc(db, `barbershops/${barbershop.id}/barbers`, id));
      setDeletingId(null);
    } catch (err: any) {
      console.error('Error deleting barber:', err);
      alert(`Erro ao excluir barbeiro: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Equipe de Barbeiros</h2>
          <p className="text-zinc-500 text-sm mt-1">Gerencie quem realiza os cortes e seus dias de trabalho.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
        >
          {isAdding ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancelar' : 'Novo Barbeiro'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddBarber} className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Nome do Barbeiro</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={newBarber.name}
                      onChange={e => setNewBarber({ ...newBarber, name: e.target.value })}
                      placeholder="Ex: João Silva"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">URL da Foto (Opcional)</label>
                  <div className="relative">
                    <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="url"
                      value={newBarber.imageUrl}
                      onChange={e => setNewBarber({ ...newBarber, imageUrl: e.target.value })}
                      placeholder="https://exemplo.com/foto.jpg"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Dias de Trabalho (Disponibilidade)</label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(newBarber, day.id)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          newBarber.workingDays?.includes(day.id)
                            ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]'
                            : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Barbeiro
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers.map(barber => (
          <motion.div
            layout
            key={barber.id}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl relative group hover:border-blue-500/30 transition-all overflow-hidden"
          >
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => {
                  setEditingId(barber.id);
                  setEditForm(barber);
                }}
                className="p-2 text-zinc-400 hover:text-blue-500 transition-colors bg-zinc-800/80 rounded-lg hover:bg-zinc-700 backdrop-blur-sm"
              >
                <Plus className="w-4 h-4 rotate-45" /> {/* Generic edit icon - using Plus rotated or we could import Edit */}
              </button>
              <button
                onClick={() => setDeletingId(barber.id)}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors bg-zinc-800/80 rounded-lg hover:bg-zinc-700 backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              {barber.imageUrl ? (
                <img 
                  src={barber.imageUrl} 
                  alt={barber.name}
                  className="w-12 h-12 rounded-full object-cover border border-zinc-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(barber.name);
                  }}
                />
              ) : (
                <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700">
                  <User className="w-6 h-6 text-zinc-400" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-white">{barber.name}</h3>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${barber.active ? 'bg-green-500' : 'bg-zinc-500'}`} />
                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                    {barber.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold">Agenda Semanal</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map(day => {
                    const isWorking = barber.workingDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        onClick={() => toggleDay(barber, day.id)}
                        className={`text-[9px] px-2 py-1 rounded-md font-bold transition-all ${
                          isWorking
                            ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                            : 'bg-zinc-800/50 text-zinc-600 border border-zinc-800/50 hover:border-zinc-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-zinc-800/50">
                <button
                  onClick={() => handleUpdateBarber(barber.id, { active: !barber.active })}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                    barber.active 
                      ? 'bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500' 
                      : 'bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {barber.active ? 'Desativar' : 'Ativar'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {barbers.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl">
            <User className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">Nenhum barbeiro cadastrado.<br/>Adicione o primeiro para começar.</p>
          </div>
        )}
      </div>
      </div>

      {/* Edit Dialog */}
    <AnimatePresence>
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Editar Barbeiro</h3>
              <button onClick={() => setEditingId(null)} className="text-zinc-500 hover:text-white">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({...editForm, name: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">URL da Foto</label>
                <input
                  type="url"
                  value={editForm.imageUrl}
                  onChange={e => setEditForm({...editForm, imageUrl: e.target.value})}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Dias de Trabalho</label>
                <div className="flex flex-wrap gap-2">
                  {DAYS.map(day => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(editForm, day.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                        editForm.workingDays?.includes(day.id)
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingId(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    if (editingId) {
                      await handleUpdateBarber(editingId, editForm);
                      setEditingId(null);
                    }
                  }}
                  className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar Alterações
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Excluir Barbeiro?</h3>
                <p className="text-zinc-500 text-sm mb-8">
                  Tem certeza que deseja remover este membro da equipe? Esta ação não pode ser desfeita.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setDeletingId(null)}
                    className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={() => handleDeleteBarber(deletingId)}
                    disabled={saving}
                    className="py-3 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Sim, Excluir
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
