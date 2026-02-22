import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Beaker, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface Stats {
  totalSamples: number;
  pendingSamples: number;
  samplesByType: { type: string; count: number }[];
  samplesByMonth: { month: string; count: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats/summary')
      .then(res => res.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="p-8 text-zinc-500">Cargando dashboard...</div>;

  const cards = [
    { title: 'Total Muestras', value: stats.totalSamples, icon: Beaker, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { title: 'Pendientes', value: stats.pendingSamples, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { title: 'Clientes Activos', value: 12, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { title: 'Alertas Calidad', value: 2, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Panel de Control</h2>
        <p className="text-zinc-500">Resumen operativo del laboratorio</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={card.color} size={24} />
              </div>
              <ArrowUpRight size={16} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
            </div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.title}</p>
            <p className="text-3xl font-bold text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Ingreso de Muestras (6 meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.samplesByMonth}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="month" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#151619', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Muestra M-00{i+1} Validada</p>
                  <p className="text-xs text-zinc-500">Por Analista Juan Pérez • Hace 2 horas</p>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
