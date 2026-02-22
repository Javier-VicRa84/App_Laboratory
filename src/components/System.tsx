import React, { useEffect, useState } from 'react';
import { Activity, Database, Server, Shield, Clock, Terminal } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  module: string;
  details: string;
  timestamp: string;
  username?: string;
}

export default function System() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dbStats, setDbStats] = useState({ size: '1.2 MB', tables: 9, records: 154 });

  useEffect(() => {
    // In a real app, we'd have a specific endpoint for logs
    fetch('/api/audit_logs')
      .then(res => res.json())
      .then(setLogs);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Administración del Sistema</h2>
        <p className="text-zinc-500">Estado del servidor, base de datos y auditoría</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Database className="text-emerald-400" size={20} />
            </div>
            <h3 className="font-bold text-white">Base de Datos</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Motor:</span>
              <span className="text-zinc-300">SQLite 3</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Tamaño:</span>
              <span className="text-zinc-300">{dbStats.size}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Tablas:</span>
              <span className="text-zinc-300">{dbStats.tables}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Server className="text-blue-400" size={20} />
            </div>
            <h3 className="font-bold text-white">Servidor</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Runtime:</span>
              <span className="text-zinc-300">Node.js / Express</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Uptime:</span>
              <span className="text-zinc-300">99.9%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Estado:</span>
              <span className="text-emerald-400 font-bold">Online</span>
            </div>
          </div>
        </div>

        <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="text-purple-400" size={20} />
            </div>
            <h3 className="font-bold text-white">Seguridad</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">SSL:</span>
              <span className="text-emerald-400">Activo</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Backup:</span>
              <span className="text-zinc-300">Diario (03:00 AM)</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Logs:</span>
              <span className="text-zinc-300">Retención 90 días</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-black/20">
          <Terminal size={18} className="text-zinc-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-widest">Registro de Auditoría</h3>
        </div>
        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-black/10 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha/Hora</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Módulo</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acción</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs.length > 0 ? logs.map(log => (
                <tr key={log.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-[10px] font-mono text-zinc-500">
                    {format(new Date(log.timestamp), 'dd/MM/yy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 text-xs text-white">
                    {log.username || 'Sistema'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-white/5 text-zinc-500 text-[9px] font-bold uppercase rounded">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-emerald-400">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-400 truncate max-w-xs">
                    {log.details}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-600 italic">
                    No hay registros de auditoría recientes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
