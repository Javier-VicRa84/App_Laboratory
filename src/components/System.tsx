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
  const [dbStats, setDbStats] = useState({ size: '1.2 MB', tables: 10, records: 154 });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/audit_logs')
      .then(res => res.json())
      .then(setLogs);
    
    fetch('/api/settings-map')
      .then(res => res.json())
      .then(setSettings);
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings-bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        alert('Configuración guardada correctamente');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting('lab_logo', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Administración del Sistema</h2>
        <p className="text-zinc-500">Estado del servidor, base de datos y auditoría</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ... existing stats cards ... */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center gap-2 bg-black/20">
            <Server size={18} className="text-zinc-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Datos del Laboratorio</h3>
          </div>
          <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Logo del Laboratorio</label>
                <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/5">
                  {settings.lab_logo ? (
                    <img src={settings.lab_logo} alt="Logo" className="h-16 w-16 object-contain bg-white rounded p-1" />
                  ) : (
                    <div className="h-16 w-16 bg-white/5 rounded flex items-center justify-center text-zinc-600 text-[10px] text-center p-2">Sin Logo</div>
                  )}
                  <div className="flex-1">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20 cursor-pointer"
                    />
                    <p className="text-[9px] text-zinc-600 mt-2">Se recomienda formato cuadrado (PNG/JPG). El logo se guardará en la base de datos.</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Nombre del Laboratorio</label>
                <input 
                  value={settings.lab_name || ''} 
                  onChange={e => updateSetting('lab_name', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Dirección</label>
                <input 
                  value={settings.lab_address || ''} 
                  onChange={e => updateSetting('lab_address', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Teléfono</label>
                <input 
                  value={settings.lab_phone || ''} 
                  onChange={e => updateSetting('lab_phone', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Email</label>
                <input 
                  value={settings.lab_email || ''} 
                  onChange={e => updateSetting('lab_email', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Director Técnico</label>
                <input 
                  value={settings.director_name || ''} 
                  onChange={e => updateSetting('director_name', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Matrícula</label>
                <input 
                  value={settings.director_mat || ''} 
                  onChange={e => updateSetting('director_mat', e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm" 
                />
              </div>
            </div>
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-bold px-6 py-2 rounded-xl text-sm transition-all"
              >
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
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
    </div>
  );
}
