import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, File, Search, Clock, User } from 'lucide-react';
import { Document } from '../types';

export default function Documents() {
  const [docs, setDocs] = useState<Document[]>([]);

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(setDocs);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Documentación</h2>
          <p className="text-zinc-500">Gestión de SOPs, instructivos y protocolos</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
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
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">v{doc.version}</span>
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
    </div>
  );
}
