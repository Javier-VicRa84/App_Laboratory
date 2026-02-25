import React, { useEffect, useState } from 'react';
import { ShieldCheck, Plus, AlertTriangle, Calendar, Settings, Trash2, Beaker, BarChart3, Activity, Save, History, Filter } from 'lucide-react';
import { Equipment, Technique } from '../types';
import { format, isAfter, addDays, subDays } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

interface QCMaterial {
  id: number;
  name: string;
  lot_number: string;
  technique_id: number;
  technique_name?: string;
  target_value: number;
  std_deviation: number;
  expiry_date: string;
  status: string;
}

interface QCResult {
  id: number;
  material_id: number;
  material_name?: string;
  value: number;
  target_value?: number;
  std_deviation?: number;
  analyst_id: number;
  analyst_name?: string;
  timestamp: string;
  observations: string;
}

export default function Quality() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'materials' | 'monitoring'>('equipment');
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [materials, setMaterials] = useState<QCMaterial[]>([]);
  const [results, setResults] = useState<QCResult[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);

  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

  const [equipForm, setEquipForm] = useState({
    name: '',
    internal_code: '',
    status: 'operational',
    last_maintenance: format(new Date(), 'yyyy-MM-dd'),
    next_maintenance: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
    notes: ''
  });

  const [materialForm, setMaterialForm] = useState({
    name: '',
    lot_number: '',
    technique_id: '',
    target_value: '',
    std_deviation: '',
    expiry_date: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
    status: 'active'
  });

  const [resultForm, setResultForm] = useState({
    material_id: '',
    value: '',
    observations: ''
  });

  const fetchData = async () => {
    try {
      const [equipRes, matRes, resRes, techRes] = await Promise.all([
        fetch('/api/equipment'),
        fetch('/api/qc-materials-detailed'),
        fetch('/api/qc-results-detailed'),
        fetch('/api/techniques')
      ]);
      
      if (equipRes.ok) setEquipment(await equipRes.json());
      if (matRes.ok) setMaterials(await matRes.json());
      if (resRes.ok) setResults(await resRes.json());
      if (techRes.ok) setTechniques(await techRes.json());
    } catch (error) {
      console.error('Error fetching quality data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEquipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(equipForm),
    });
    if (res.ok) {
      fetchData();
      setIsEquipModalOpen(false);
      setEquipForm({
        name: '',
        internal_code: '',
        status: 'operational',
        last_maintenance: format(new Date(), 'yyyy-MM-dd'),
        next_maintenance: format(addDays(new Date(), 180), 'yyyy-MM-dd'),
        notes: ''
      });
    }
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/qc-materials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...materialForm,
        technique_id: Number(materialForm.technique_id),
        target_value: Number(materialForm.target_value),
        std_deviation: Number(materialForm.std_deviation)
      }),
    });
    if (res.ok) {
      fetchData();
      setIsMaterialModalOpen(false);
      setMaterialForm({
        name: '',
        lot_number: '',
        technique_id: '',
        target_value: '',
        std_deviation: '',
        expiry_date: format(addDays(new Date(), 365), 'yyyy-MM-dd'),
        status: 'active'
      });
    }
  };

  const handleResultSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/qc-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...resultForm,
        material_id: Number(resultForm.material_id),
        value: Number(resultForm.value),
        analyst_id: 1 // Mock analyst ID
      }),
    });
    if (res.ok) {
      fetchData();
      setIsResultModalOpen(false);
      setResultForm({
        material_id: '',
        value: '',
        observations: ''
      });
    }
  };

  const handleDeleteEquip = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este equipo?')) {
      await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const handleDeleteMaterial = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este material de control?')) {
      await fetch(`/api/qc-materials/${id}`, { method: 'DELETE' });
      fetchData();
    }
  };

  const isOverdue = (date: string) => {
    return isAfter(new Date(), new Date(date));
  };

  const getChartData = () => {
    if (!selectedMaterialId) return [];
    const material = materials.find(m => m.id === selectedMaterialId);
    if (!material) return [];

    return results
      .filter(r => r.material_id === selectedMaterialId)
      .reverse()
      .map(r => ({
        date: format(new Date(r.timestamp), 'dd/MM HH:mm'),
        value: r.value,
        target: material.target_value,
        sd1_pos: material.target_value + material.std_deviation,
        sd1_neg: material.target_value - material.std_deviation,
        sd2_pos: material.target_value + (material.std_deviation * 2),
        sd2_neg: material.target_value - (material.std_deviation * 2),
        sd3_pos: material.target_value + (material.std_deviation * 3),
        sd3_neg: material.target_value - (material.std_deviation * 3),
      }));
  };

  const selectedMaterial = materials.find(m => m.id === selectedMaterialId);
  const chartData = getChartData();

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Calidad</h2>
          <p className="text-zinc-500">Equipos, controles y monitoreo estadístico</p>
        </div>
        <div className="flex gap-3">
          {activeTab === 'equipment' && (
            <button 
              onClick={() => setIsEquipModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Nuevo Equipo
            </button>
          )}
          {activeTab === 'materials' && (
            <button 
              onClick={() => setIsMaterialModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <Beaker size={20} />
              Nuevo Material
            </button>
          )}
          {activeTab === 'monitoring' && (
            <button 
              onClick={() => setIsResultModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <Activity size={20} />
              Cargar Control
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-2 p-1 bg-white/5 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('equipment')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Equipos
        </button>
        <button 
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'materials' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Materiales de Control
        </button>
        <button 
          onClick={() => setActiveTab('monitoring')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'monitoring' ? 'bg-emerald-500 text-black' : 'text-zinc-500 hover:text-white'}`}
        >
          Monitoreo Estadístico
        </button>
      </div>

      {activeTab === 'equipment' && (
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
                    onClick={() => handleDeleteEquip(item.id)}
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
      )}

      {activeTab === 'materials' && (
        <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-black/20">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Material / Lote</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Técnica</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Valor Diana</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">DE (±)</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vencimiento</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {materials.map(mat => (
                <tr key={mat.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-white">{mat.name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">Lote: {mat.lot_number}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-300">{mat.technique_name}</td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-400">{mat.target_value}</td>
                  <td className="px-6 py-4 text-xs text-zinc-400">{mat.std_deviation}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold ${isOverdue(mat.expiry_date) ? 'text-red-400' : 'text-zinc-500'}`}>
                      {mat.expiry_date}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteMaterial(mat.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Filter size={14} /> Seleccionar Control
                </h3>
                <div className="space-y-2">
                  {materials.map(mat => (
                    <button
                      key={mat.id}
                      onClick={() => setSelectedMaterialId(mat.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all ${selectedMaterialId === mat.id ? 'bg-emerald-500/10 border-emerald-500/50 text-white' : 'bg-black/20 border-white/5 text-zinc-500 hover:border-white/20'}`}
                    >
                      <p className="text-xs font-bold">{mat.name}</p>
                      <p className="text-[10px] opacity-60">{mat.technique_name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {selectedMaterial && (
                <div className="bg-[#151619] border border-white/10 rounded-2xl p-6 space-y-4">
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Parámetros Estadísticos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Diana</p>
                      <p className="text-lg font-bold text-emerald-400">{selectedMaterial.target_value}</p>
                    </div>
                    <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">DE</p>
                      <p className="text-lg font-bold text-zinc-300">{selectedMaterial.std_deviation}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 space-y-6">
              <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                    <BarChart3 size={18} className="text-emerald-400" /> Gráfico de Levey-Jennings
                  </h3>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-tighter">
                    <span className="flex items-center gap-1 text-emerald-400"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Diana</span>
                    <span className="flex items-center gap-1 text-zinc-500"><div className="w-2 h-2 rounded-full bg-zinc-500" /> ±1 SD</span>
                    <span className="flex items-center gap-1 text-amber-500"><div className="w-2 h-2 rounded-full bg-amber-500" /> ±2 SD</span>
                    <span className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 rounded-full bg-red-500" /> ±3 SD</span>
                  </div>
                </div>

                <div className="h-[400px] w-full">
                  {selectedMaterialId ? (
                    chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                          <XAxis 
                            dataKey="date" 
                            stroke="#71717a" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#71717a" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            domain={[
                              (dataMin: number) => Math.min(dataMin, selectedMaterial!.target_value - (selectedMaterial!.std_deviation * 3.5)),
                              (dataMax: number) => Math.max(dataMax, selectedMaterial!.target_value + (selectedMaterial!.std_deviation * 3.5))
                            ]}
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '12px' }}
                          />
                          
                          {/* Reference Lines for SDs */}
                          <ReferenceLine y={selectedMaterial.target_value} stroke="#10b981" strokeWidth={2} />
                          <ReferenceLine y={selectedMaterial.target_value + selectedMaterial.std_deviation} stroke="#71717a" strokeDasharray="3 3" />
                          <ReferenceLine y={selectedMaterial.target_value - selectedMaterial.std_deviation} stroke="#71717a" strokeDasharray="3 3" />
                          <ReferenceLine y={selectedMaterial.target_value + (selectedMaterial.std_deviation * 2)} stroke="#f59e0b" strokeDasharray="3 3" />
                          <ReferenceLine y={selectedMaterial.target_value - (selectedMaterial.std_deviation * 2)} stroke="#f59e0b" strokeDasharray="3 3" />
                          <ReferenceLine y={selectedMaterial.target_value + (selectedMaterial.std_deviation * 3)} stroke="#ef4444" strokeDasharray="3 3" />
                          <ReferenceLine y={selectedMaterial.target_value - (selectedMaterial.std_deviation * 3)} stroke="#ef4444" strokeDasharray="3 3" />

                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#ffffff" 
                            strokeWidth={3} 
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} 
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                        <History size={48} />
                        <p className="text-sm italic">No hay resultados registrados para este material</p>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2">
                      <BarChart3 size={48} />
                      <p className="text-sm italic">Seleccione un material de control para ver el gráfico</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Últimos Resultados de Control</h3>
                </div>
                <table className="w-full text-left">
                  <thead className="bg-black/10">
                    <tr>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Material</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Valor</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Desviación</th>
                      <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Analista</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {results.slice(0, 10).map(res => {
                      const mat = materials.find(m => m.id === res.material_id);
                      const diff = mat ? (res.value - mat.target_value) / mat.std_deviation : 0;
                      return (
                        <tr key={res.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-xs text-zinc-500">{format(new Date(res.timestamp), 'dd/MM/yy HH:mm')}</td>
                          <td className="px-6 py-4 text-xs text-white font-medium">{res.material_name}</td>
                          <td className="px-6 py-4 text-xs font-bold text-emerald-400">{res.value}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${Math.abs(diff) > 3 ? 'bg-red-500/20 text-red-400' : Math.abs(diff) > 2 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)} SD
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-400">{res.analyst_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isEquipModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Equipo</h3>
            <form onSubmit={handleEquipSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre del Equipo</label>
                <input 
                  value={equipForm.name}
                  onChange={(e) => setEquipForm({...equipForm, name: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Código Interno</label>
                <input 
                  value={equipForm.internal_code}
                  onChange={(e) => setEquipForm({...equipForm, internal_code: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Última Calibración</label>
                  <input 
                    type="date"
                    value={equipForm.last_maintenance}
                    onChange={(e) => setEquipForm({...equipForm, last_maintenance: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Próxima Calibración</label>
                  <input 
                    type="date"
                    value={equipForm.next_maintenance}
                    onChange={(e) => setEquipForm({...equipForm, next_maintenance: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsEquipModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMaterialModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Material de Control</h3>
            <form onSubmit={handleMaterialSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre del Material</label>
                  <input 
                    value={materialForm.name}
                    onChange={(e) => setMaterialForm({...materialForm, name: e.target.value})}
                    placeholder="Ej: Control Normal Bioquímica"
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Lote</label>
                  <input 
                    value={materialForm.lot_number}
                    onChange={(e) => setMaterialForm({...materialForm, lot_number: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Técnica</label>
                  <select 
                    value={materialForm.technique_id}
                    onChange={(e) => setMaterialForm({...materialForm, technique_id: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
                  >
                    <option value="">Seleccionar...</option>
                    {techniques.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Valor Diana</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={materialForm.target_value}
                    onChange={(e) => setMaterialForm({...materialForm, target_value: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Desviación Estándar</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={materialForm.std_deviation}
                    onChange={(e) => setMaterialForm({...materialForm, std_deviation: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fecha de Vencimiento</label>
                  <input 
                    type="date"
                    value={materialForm.expiry_date}
                    onChange={(e) => setMaterialForm({...materialForm, expiry_date: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsMaterialModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isResultModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Cargar Resultado de Control</h3>
            <form onSubmit={handleResultSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Material de Control</label>
                <select 
                  value={resultForm.material_id}
                  onChange={(e) => setResultForm({...resultForm, material_id: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">Seleccionar...</option>
                  {materials.map(m => <option key={m.id} value={m.id}>{m.name} (Lote: {m.lot_number})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Valor Obtenido</label>
                <input 
                  type="number"
                  step="0.01"
                  value={resultForm.value}
                  onChange={(e) => setResultForm({...resultForm, value: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Observaciones</label>
                <textarea 
                  value={resultForm.observations}
                  onChange={(e) => setResultForm({...resultForm, observations: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white h-24" 
                />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" onClick={() => setIsResultModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Guardar Resultado</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
