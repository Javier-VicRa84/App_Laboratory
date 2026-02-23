import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Beaker, Calendar, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { InternalAnalysis } from '../types';
import { format } from 'date-fns';

export default function InternalAnalyses() {
  const [analyses, setAnalyses] = useState<InternalAnalysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnalysis, setEditingAnalysis] = useState<InternalAnalysis | null>(null);

  const fetchAnalyses = () => {
    fetch('/api/internal-analyses')
      .then(res => res.json())
      .then(setAnalyses);
  };

  useEffect(fetchAnalyses, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingAnalysis ? `/api/internal-analyses/${editingAnalysis.id}` : '/api/internal-analyses';
    const method = editingAnalysis ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchAnalyses();
      setIsModalOpen(false);
      setEditingAnalysis(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este registro de análisis interno?')) {
      await fetch(`/api/internal-analyses/${id}`, { method: 'DELETE' });
      fetchAnalyses();
    }
  };

  const filtered = analyses.filter(a => 
    a.sample_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.result.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Análisis Internos</h2>
          <p className="text-zinc-500">Control de calidad propio (Agua, Suelo, Alimentos, etc.)</p>
        </div>
        <button 
          onClick={() => { setEditingAnalysis(null); setIsModalOpen(true); }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Análisis Interno
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por tipo de muestra, descripción o resultado..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(analysis => (
          <div key={analysis.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{analysis.sample_type}</h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  analysis.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {analysis.status === 'completed' ? 'Completado' : 'Pendiente'}
                </span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingAnalysis(analysis); setIsModalOpen(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(analysis.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-zinc-300 mb-4 line-clamp-2">{analysis.description}</p>

            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-zinc-600" />
                <span>Recolección: {analysis.collection_date}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-zinc-600" />
                <span>Análisis: {analysis.analysis_date || 'Pendiente'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Beaker size={14} className="text-zinc-600" />
                <span className="font-medium text-zinc-200">Resultado: {analysis.result || 'En proceso...'}</span>
              </div>
            </div>

            {analysis.observations && (
              <div className="mt-4 p-3 bg-black/30 rounded-lg border border-white/5">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Observaciones</p>
                <p className="text-xs text-zinc-400 italic">{analysis.observations}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">{editingAnalysis ? 'Editar Análisis Interno' : 'Nuevo Análisis Interno'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo de Muestra</label>
                <select name="sample_type" defaultValue={editingAnalysis?.sample_type || 'Agua'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="Agua">Agua</option>
                  <option value="Suelo">Suelo</option>
                  <option value="Alimento">Alimento</option>
                  <option value="Superficie">Superficie</option>
                  <option value="Aire">Aire</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Estado</label>
                <select name="status" defaultValue={editingAnalysis?.status || 'pending'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="pending">Pendiente</option>
                  <option value="completed">Completado</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Descripción / Punto de Muestreo</label>
                <input name="description" defaultValue={editingAnalysis?.description} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Ej: Grifo cocina central" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha Recolección</label>
                <input name="collection_date" type="date" defaultValue={editingAnalysis?.collection_date || format(new Date(), 'yyyy-MM-dd')} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha Análisis</label>
                <input name="analysis_date" type="date" defaultValue={editingAnalysis?.analysis_date} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Resultado</label>
                <input name="result" defaultValue={editingAnalysis?.result} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Ej: Ausencia de coliformes" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Observaciones</label>
                <textarea name="observations" defaultValue={editingAnalysis?.observations} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white h-24" />
              </div>
              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-purple-500 hover:bg-purple-600 text-white font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
