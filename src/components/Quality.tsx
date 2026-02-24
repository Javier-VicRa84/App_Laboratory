import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, AlertTriangle, Calendar, Settings, Trash2 } from 'lucide-react';
import { Equipment } from '../types';
import { format, isAfter, addDays } from 'date-fns';

export default function Quality() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    internal_code: '',
    status: 'operational',
    last_maintenance: format(new Date(), 'yyyy-MM-dd'),
    next_maintenance: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
    notes: ''
  });

  const fetchEquipment = () => {
    fetch('/api/equipment')
      .then(res => res.json())
      .then(setEquipment);
  };

  useEffect(fetchEquipment, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      fetchEquipment();
      setIsModalOpen(false);
      setFormData({
        name: '',
        internal_code: '',
        status: 'operational',
        last_maintenance: format(new Date(), 'yyyy-MM-dd'),
        next_maintenance: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
        notes: ''
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este equipo?')) {
      await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      fetchEquipment();
    }
  };

  const isOverdue = (date: string) => {
    return isAfter(new Date(), new Date(date));
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Módulo de Calidad</h2>
          <p className="text-zinc-500">Gestión de equipos y calibraciones</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Equipo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {equipment.map(item => (
          <div key={item.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl">
                <Settings className="text-emerald-400" size={20} />
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'operational' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.status}
                </span>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
            <p className="text-xs text-zinc-500 font-mono mb-4">ID: {item.internal_code}</p>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Última Calibración:</span>
                <span className="text-zinc-300">{item.last_maintenance}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Próxima Calibración:</span>
                <span className={`font-bold ${isOverdue(item.next_maintenance) ? 'text-red-400' : 'text-emerald-400'}`}>
                  {item.next_maintenance}
                </span>
              </div>
            </div>

            {isOverdue(item.next_maintenance) && (
              <div className="mt-4 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-[10px] font-bold uppercase">
                <AlertTriangle size={14} />
                Calibración Vencida
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/5 flex gap-3">
              <button className="flex-1 text-xs font-bold py-2 bg-white/5 text-zinc-400 rounded-lg hover:text-white transition-all">Historial</button>
              <button className="flex-1 text-xs font-bold py-2 bg-white/5 text-zinc-400 rounded-lg hover:text-white transition-all">Verificar</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Equipo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre del Equipo</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Código Interno</label>
                <input 
                  value={formData.internal_code}
                  onChange={(e) => setFormData({...formData, internal_code: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Última Calibración</label>
                  <input 
                    type="date"
                    value={formData.last_maintenance}
                    onChange={(e) => setFormData({...formData, last_maintenance: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Próxima Calibración</label>
                  <input 
                    type="date"
                    value={formData.next_maintenance}
                    onChange={(e) => setFormData({...formData, next_maintenance: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
