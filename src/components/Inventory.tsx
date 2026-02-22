import React, { useEffect, useState } from 'react';
import { Package, Plus, AlertCircle, TrendingDown, Search } from 'lucide-react';
import { InventoryItem } from '../types';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(setItems);
  }, []);

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Inventario</h2>
          <p className="text-zinc-500">Control de reactivos e insumos</p>
        </div>
        <button className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all">
          <Plus size={20} />
          Nuevo Insumo
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Package className="text-purple-400" size={20} />
              </div>
              {item.stock <= item.min_stock && (
                <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg">
                  <TrendingDown size={14} />
                </div>
              )}
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
              <button className="text-emerald-400 text-xs font-bold hover:underline">Registrar Consumo</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
