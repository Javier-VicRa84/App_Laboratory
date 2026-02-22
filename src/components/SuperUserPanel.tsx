import React, { useState, useEffect } from 'react';
import { Database, AlertCircle, Save, Trash2, RefreshCw } from 'lucide-react';

export default function SuperUserPanel() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, we'd have an endpoint to list tables
    // For now, we know the main ones
    setTables([
      'users', 'customers', 'techniques', 'samples', 'sample_analysis', 
      'equipment', 'inventory', 'documents', 'triquinosis_jornadas', 
      'triquinosis_tropas', 'triquinosis_pools', 'triquinosis_temperatures'
    ]);
  }, []);

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${tableName.replace(/_/g, '-')}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch (error) {
      console.error('Error fetching table data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar este registro?')) return;
    try {
      const res = await fetch(`/api/${selectedTable.replace(/_/g, '-')}/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchTableData(selectedTable);
      }
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Database className="text-amber-500" /> Panel de Super Usuario
          </h2>
          <p className="text-zinc-500 text-sm">Corrección directa de base de datos y soporte técnico</p>
        </div>
      </header>

      <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Seleccionar Tabla</label>
            <select 
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
            >
              <option value="">Seleccione una tabla...</option>
              {tables.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button 
            onClick={() => selectedTable && fetchTableData(selectedTable)}
            className="mt-6 p-2 bg-white/5 rounded-xl text-zinc-400 hover:text-white transition-all"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {selectedTable && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-black/20">
                <tr>
                  {data.length > 0 && Object.keys(data[0]).map(key => (
                    <th key={key} className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{key}</th>
                  ))}
                  <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    {Object.values(row).map((val: any, j) => (
                      <td key={j} className="px-4 py-3 text-xs text-zinc-300 truncate max-w-[150px]">
                        {val?.toString() || '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => handleDelete(row.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!selectedTable && (
          <div className="py-20 text-center space-y-4">
            <AlertCircle size={48} className="mx-auto text-zinc-700" />
            <p className="text-zinc-500">Seleccione una tabla para visualizar y corregir datos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
