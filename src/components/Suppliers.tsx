import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, AlertCircle, Package } from 'lucide-react';
import { Supplier } from '../types';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const fetchSuppliers = () => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(setSuppliers);
  };

  useEffect(fetchSuppliers, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers';
    const method = editingSupplier ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchSuppliers();
      setIsModalOpen(false);
      setEditingSupplier(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este proveedor?')) {
      await fetch(`/api/suppliers/${id}`, { method: 'DELETE' });
      fetchSuppliers();
    }
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.tax_id.includes(searchTerm) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Proveedores</h2>
          <p className="text-zinc-500">Gestión de proveedores de insumos y servicios</p>
        </div>
        <button 
          onClick={() => { setEditingSupplier(null); setIsModalOpen(true); }}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Proveedor
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre, CUIT o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(supplier => (
          <div key={supplier.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{supplier.name}</h3>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{supplier.category}</span>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingSupplier(supplier); setIsModalOpen(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(supplier.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-zinc-600" />
                <span>CUIT: {supplier.tax_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-zinc-600" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-zinc-600" />
                <span>Empresa: {supplier.phone}</span>
              </div>
              {supplier.contact_mobile && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-indigo-600/50" />
                  <span>Celular: {supplier.contact_mobile}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-zinc-600" />
                <span>{supplier.address}, {supplier.city}, {supplier.province}, {supplier.country}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Contacto: {supplier.contact_person}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">{editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Razón Social / Nombre</label>
                <input name="name" defaultValue={editingSupplier?.name} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">CUIT</label>
                <input name="tax_id" defaultValue={editingSupplier?.tax_id} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Categoría</label>
                <select name="category" defaultValue={editingSupplier?.category || 'Reactivos'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="Reactivos">Reactivos</option>
                  <option value="Vidriería">Vidriería</option>
                  <option value="Equipamiento">Equipamiento</option>
                  <option value="Servicios">Servicios</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Persona de Contacto</label>
                <input name="contact_person" defaultValue={editingSupplier?.contact_person} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                <input name="email" type="email" defaultValue={editingSupplier?.email} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Teléfono Empresa</label>
                <input name="phone" defaultValue={editingSupplier?.phone} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Celular Contacto</label>
                <input name="contact_mobile" defaultValue={editingSupplier?.contact_mobile} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Dirección</label>
                <input name="address" defaultValue={editingSupplier?.address} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ciudad / Localidad</label>
                <input name="city" defaultValue={editingSupplier?.city} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Provincia</label>
                <input name="province" defaultValue={editingSupplier?.province} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">País</label>
                <input name="country" defaultValue={editingSupplier?.country || 'Argentina'} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Notas</label>
                <textarea name="notes" defaultValue={editingSupplier?.notes} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white h-24" />
              </div>
              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
