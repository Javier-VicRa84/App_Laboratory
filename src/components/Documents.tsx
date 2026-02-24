import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, File, Search, Clock, User, Trash2 } from 'lucide-react';
import { Document } from '../types';

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'SOP',
    version: '1.0',
    author: '',
    expiry_date: '',
    file_path: ''
  });

  const fetchDocs = () => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(setDocs);
  };

  useEffect(fetchDocs, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      fetchDocs();
      setIsModalOpen(false);
      setFormData({
        title: '',
        type: 'SOP',
        version: '1.0',
        author: '',
        expiry_date: '',
        file_path: ''
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este documento?')) {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      fetchDocs();
    }
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Documentación</h2>
          <p className="text-zinc-500">Gestión de SOPs, instructivos y protocolos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Subir Documento
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {docs.map(doc => (
          <div key={doc.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-xl">
                <File className="text-blue-400" size={20} />
              </div>
              <div className="flex gap-2 items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v{doc.version}</span>
                <button 
                  onClick={() => handleDelete(doc.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <h3 className="text-sm font-bold text-white mb-2 line-clamp-2">{doc.title}</h3>
            <span className="px-2 py-0.5 bg-white/5 text-zinc-500 text-[9px] font-bold uppercase rounded">{doc.type}</span>

            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <User size={12} />
                <span>Autor: {doc.author}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                <Clock size={12} />
                <span>Vence: {doc.expiry_date}</span>
              </div>
            </div>

            <button className="w-full mt-6 py-2 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-xl hover:bg-emerald-500/20 transition-all">
              Ver Documento
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Subir Documento</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Título del Documento</label>
                <input 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="SOP">SOP</option>
                    <option value="Instructivo">Instructivo</option>
                    <option value="Protocolo">Protocolo</option>
                    <option value="Norma">Norma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Versión</label>
                  <input 
                    value={formData.version}
                    onChange={(e) => setFormData({...formData, version: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Autor</label>
                <input 
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha Vencimiento</label>
                <input 
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
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
