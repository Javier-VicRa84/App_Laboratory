import React, { useEffect, useState } from 'react';
import { Package, Plus, AlertCircle, TrendingDown, Search, Trash2, Download } from 'lucide-react';
import { InventoryItem } from '../types';
import { exportToExcel } from '../services/excelService';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    batch: '',
    stock: 0,
    min_stock: 0,
    unit: 'un',
    expiry_date: '',
    location: ''
  });

  const fetchInventory = () => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(setItems);
  };

  useEffect(fetchInventory, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      fetchInventory();
      setIsModalOpen(false);
      setFormData({
        name: '',
        batch: '',
        stock: 0,
        min_stock: 0,
        unit: 'un',
        expiry_date: '',
        location: ''
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este insumo?')) {
      await fetch(`/api/inventory/${id}`, { method: 'DELETE' });
      fetchInventory();
    }
  };

  const handleConsume = async (item: InventoryItem) => {
    const amount = prompt(`Registrar consumo para ${item.name}. Stock actual: ${item.stock} ${item.unit}. Ingrese cantidad a descontar:`, '1');
    if (amount && !isNaN(parseFloat(amount))) {
      const newStock = Math.max(0, item.stock - parseFloat(amount));
      await fetch(`/api/inventory/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock }),
      });
      fetchInventory();
    }
  };

  const handleExportExcel = () => {
    const exportData = items.map(item => ({
      'Nombre': item.name,
      'Lote': item.batch,
      'Stock': item.stock,
      'Unidad': item.unit,
      'Stock Mínimo': item.min_stock,
      'Vencimiento': item.expiry_date,
      'Ubicación': item.location
    }));
    exportToExcel(exportData, 'Inventario_Laboratorio', 'Stock');
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Inventario</h2>
          <p className="text-zinc-500">Control de reactivos e insumos</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleExportExcel}
            className="bg-white/5 hover:bg-white/10 text-zinc-400 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/10"
          >
            <Download size={20} />
            Exportar Excel
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus size={20} />
            Nuevo Insumo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Package className="text-purple-400" size={20} />
              </div>
              <div className="flex gap-2 items-center">
                {item.stock <= item.min_stock && (
                  <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
                    <TrendingDown size={14} />
                  </div>
                )}
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
            <p className="text-xs text-zinc-500 mb-4">Lote: {item.batch}</p>

            <div className="flex items-end justify-between mb-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Stock Actual</p>
                <p className={`text-2xl font-bold ${item.stock <= item.min_stock ? 'text-red-400' : 'text-white'}`}>
                  {item.stock} <span className="text-sm font-normal text-zinc-500">{item.unit}</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Vencimiento</p>
                <p className="text-xs text-zinc-300">{item.expiry_date}</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">{item.location}</span>
              <button 
                onClick={() => handleConsume(item)}
                className="text-emerald-400 text-xs font-bold hover:underline"
              >
                Registrar Consumo
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">Nuevo Insumo</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre del Insumo</label>
                <input 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Lote</label>
                  <input 
                    value={formData.batch}
                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Unidad</label>
                  <input 
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                    placeholder="Ej: ml, gr, un"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Stock Actual</label>
                  <input 
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseFloat(e.target.value) || 0})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Stock Mínimo</label>
                  <input 
                    type="number"
                    value={formData.min_stock}
                    onChange={(e) => setFormData({...formData, min_stock: parseFloat(e.target.value) || 0})}
                    required 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  />
                </div>
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
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ubicación</label>
                <input 
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                  placeholder="Ej: Estante A, Heladera 1"
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
