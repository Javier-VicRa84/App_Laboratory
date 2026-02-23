import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, AlertCircle, Globe } from 'lucide-react';
import { ExternalCustomer } from '../types';

export default function ExternalCustomers() {
  const [customers, setCustomers] = useState<ExternalCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<ExternalCustomer | null>(null);

  const fetchCustomers = () => {
    fetch('/api/external-customers')
      .then(res => res.json())
      .then(setCustomers);
  };

  useEffect(fetchCustomers, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingCustomer ? `/api/external-customers/${editingCustomer.id}` : '/api/external-customers';
    const method = editingCustomer ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchCustomers();
      setIsModalOpen(false);
      setEditingCustomer(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este cliente externo?')) {
      await fetch(`/api/external-customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    }
  };

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.tax_id.includes(searchTerm)
  );

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Clientes Externos</h2>
          <p className="text-zinc-500">Servicios a terceros y clientes fuera de producción propia</p>
        </div>
        <button 
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Cliente Externo
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o CUIT/DNI..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{customer.name}</h3>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-sm text-zinc-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-zinc-600" />
                <span>CUIT/DNI: {customer.tax_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-zinc-600" />
                <span>{customer.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-zinc-600" />
                <span>Empresa: {customer.phone}</span>
              </div>
              {customer.contact_mobile && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-blue-600/50" />
                  <span>Celular: {customer.contact_mobile}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-zinc-600" />
                <span>{customer.address}, {customer.city}, {customer.province}, {customer.country}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Contacto: {customer.contact_person}</span>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-xl font-bold text-white mb-6">{editingCustomer ? 'Editar Cliente Externo' : 'Nuevo Cliente Externo'}</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Razón Social / Nombre</label>
                <input name="name" defaultValue={editingCustomer?.name} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">CUIT / DNI</label>
                <input name="tax_id" defaultValue={editingCustomer?.tax_id} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Persona de Contacto</label>
                <input name="contact_person" defaultValue={editingCustomer?.contact_person} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                <input name="email" type="email" defaultValue={editingCustomer?.email} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Teléfono Empresa</label>
                <input name="phone" defaultValue={editingCustomer?.phone} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Celular Contacto</label>
                <input name="contact_mobile" defaultValue={editingCustomer?.contact_mobile} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Dirección</label>
                <input name="address" defaultValue={editingCustomer?.address} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Ciudad / Localidad</label>
                <input name="city" defaultValue={editingCustomer?.city} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Provincia</label>
                <input name="province" defaultValue={editingCustomer?.province} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">País</label>
                <input name="country" defaultValue={editingCustomer?.country || 'Argentina'} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="col-span-2 flex justify-end gap-4 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-2 rounded-xl transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
