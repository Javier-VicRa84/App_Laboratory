import React, { useEffect, useState } from 'react';
import { Plus, Search, Beaker, Calendar, Clock, ChevronRight } from 'lucide-react';
import { Sample, Customer, Technique } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Samples() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    const [sRes, cRes, tRes] = await Promise.all([
      fetch('/api/samples-detailed'),
      fetch('/api/customers'),
      fetch('/api/techniques')
    ]);
    setSamples(await sRes.json());
    setCustomers(await cRes.json());
    setTechniques(await tRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    // Create Sample
    const sampleRes = await fetch('/api/samples', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: `M-${Date.now().toString().slice(-6)}`,
        customer_id: data.customer_id,
        type: data.type,
        description: data.description,
        estimated_delivery: data.estimated_delivery,
        responsible_service: data.responsible_service,
        status: 'pending'
      }),
    });

    if (sampleRes.ok) {
      const { id: sampleId } = await sampleRes.json();
      
      // Assign Analysis
      const selectedTechniques = formData.getAll('techniques').map(Number);
      if (selectedTechniques.length > 0) {
        await fetch('/api/sample-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sample_id: sampleId, technique_ids: selectedTechniques }),
        });
      }

      fetchData();
      setIsModalOpen(false);
    }
  };

  const statusColors = {
    pending: 'bg-zinc-500/10 text-zinc-400',
    in_progress: 'bg-blue-500/10 text-blue-400',
    completed: 'bg-emerald-500/10 text-emerald-400',
    validated: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Muestras</h2>
          <p className="text-zinc-500">Ingreso y seguimiento de muestras</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Ingresar Muestra
        </button>
      </header>

      <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Código</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tipo</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Ingreso</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {samples.map(sample => (
              <tr key={sample.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4">
                  <span className="font-mono text-emerald-400 font-bold">{sample.code}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">{sample.customer_name}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-zinc-400">{sample.type}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <Calendar size={12} />
                    {format(new Date(sample.entry_date), 'dd MMM yyyy', { locale: es })}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColors[sample.status]}`}>
                    {sample.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all">
                    <ChevronRight size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-3xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Ingreso de Muestra</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Cliente</label>
                <select name="customer_id" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="">Seleccionar Cliente...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo de Muestra</label>
                <select name="type" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="Agua">Agua</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Suelo">Suelo</option>
                  <option value="Efluente">Efluente</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Descripción Específica</label>
                <textarea name="description" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white h-24" placeholder="Ej: Trozo de carne vacuna, 500g..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha Estimada Entrega</label>
                <input name="estimated_delivery" type="date" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Servicio Responsable</label>
                <input name="responsible_service" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Ej: Microbiología" />
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Análisis Solicitados</label>
                <div className="grid grid-cols-2 gap-3">
                  {techniques.map(t => (
                    <label key={t.id} className="flex items-center gap-3 p-3 bg-black/30 border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all">
                      <input type="checkbox" name="techniques" value={t.id} className="w-4 h-4 accent-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase">{t.method}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Registrar Ingreso</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
