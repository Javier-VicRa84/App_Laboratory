import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Mail, Phone, MapPin, AlertCircle, Download } from 'lucide-react';
import { Customer } from '../types';
import { exportToExcel } from '../services/excelService';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = () => {
    fetch('/api/customers')
      .then(res => res.json())
      .then(setCustomers);
  };

  useEffect(fetchCustomers, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
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
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      fetchCustomers();
    }
  };

  const handleExportExcel = () => {
    const exportData = customers.map(c => ({
      'Razón Social': c.name,
      'CUIT/DNI': c.tax_id,
      'Categoría': c.category || 'Productor',
      'Contacto': c.contact_person,
      'Email': c.email,
      'Teléfono': c.phone,
      'Celular': c.contact_mobile,
      'Dirección': `${c.address}, ${c.city}, ${c.province}`
    }));
    exportToExcel(exportData, 'Clientes_Laboratorio', 'Clientes');
  };

  const filtered = customers.filter(c => 
    (categoryFilter === 'all' || c.category === categoryFilter) &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.tax_id.includes(searchTerm))
  );

  const groupedCustomers = filtered.reduce((acc, customer) => {
    const cat = customer.category || 'Productor';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(customer);
    return acc;
  }, {} as Record<string, Customer[]>);

  return (
    <div className="p-8 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Clientes</h2>
          <p className="text-zinc-500">Gestión de base de datos de clientes</p>
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
            onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Plus size={20} />
            Nuevo Cliente
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o CUIT/DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
          />
        </div>
        <div className="flex gap-2 bg-[#151619] p-1 rounded-xl border border-white/10">
          {['all', 'Productor', 'Cliente', 'Fábrica Propia'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                categoryFilter === cat ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-12">
        {(Object.entries(groupedCustomers) as [string, Customer[]][]).map(([category, categoryCustomers]) => (
          <section key={category} className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em]">{category}s</h3>
              <div className="h-px flex-1 bg-white/5" />
              <span className="text-[10px] font-bold text-zinc-600 bg-white/5 px-2 py-1 rounded-lg">
                {categoryCustomers.length} {categoryCustomers.length === 1 ? 'Registro' : 'Registros'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {categoryCustomers.map(customer => (
                <div key={customer.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">{customer.name}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        customer.category === 'Fábrica Propia' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                        customer.category === 'Cliente' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 
                        'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {customer.category || 'Productor'}
                      </span>
                    </div>
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
                        <Phone size={14} className="text-emerald-600/50" />
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
                    <button className="text-emerald-400 text-xs font-bold hover:underline">Ver Historial</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 bg-[#151619] rounded-3xl border border-dashed border-white/10">
            <Search className="mx-auto text-zinc-700 mb-4" size={48} />
            <p className="text-zinc-500 font-medium">No se encontraron clientes con los criterios de búsqueda.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-2xl p-8">
            <h3 className="text-xl font-bold text-white mb-6">{editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}</h3>
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
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Categoría</label>
                <select name="category" defaultValue={editingCustomer?.category || 'Productor'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="Productor">Productor</option>
                  <option value="Cliente">Cliente</option>
                  <option value="Fábrica Propia">Fábrica Propia</option>
                </select>
              </div>
              <div className="col-span-2 flex justify-end gap-4 mt-4">
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
