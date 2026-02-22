import React, { useEffect, useState } from 'react';
import { Plus, Search, User, Shield, Mail, Edit2, Trash2, Lock } from 'lucide-react';
import { User as UserType } from '../store/authStore';

export default function Users() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  const fetchUsers = () => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers);
  };

  useEffect(fetchUsers, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
    const method = editingUser ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      fetchUsers();
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      fetchUsers();
    }
  };

  const filtered = users.filter(u => 
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestión de Usuarios</h2>
          <p className="text-zinc-500">Administración de accesos y roles del sistema</p>
        </div>
        <button 
          onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nuevo Usuario
        </button>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por nombre o usuario..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(u => (
          <div key={u.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <User className="text-emerald-400" size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{u.full_name}</h3>
                  <p className="text-xs text-zinc-500">@{u.username}</p>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => { setEditingUser(u); setIsModalOpen(true); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => handleDelete(u.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-3 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-zinc-600" />
                <span className="capitalize">Rol: {u.role}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-zinc-600" />
                <span>{u.email || 'Sin correo'}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${u.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {u.status || 'active'}
              </span>
              <button className="text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                <Lock size={10} /> Reset Clave
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-lg p-8">
            <h3 className="text-xl font-bold text-white mb-6">{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre Completo</label>
                <input name="full_name" defaultValue={editingUser?.full_name} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Usuario</label>
                  <input name="username" defaultValue={editingUser?.username} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Rol</label>
                  <select name="role" defaultValue={editingUser?.role} required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                    <option value="admin">Administrador</option>
                    <option value="analyst">Analista</option>
                    <option value="technician">Técnico</option>
                    <option value="quality">Calidad</option>
                  </select>
                </div>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Contraseña Inicial</label>
                  <input name="password" type="password" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Correo Electrónico</label>
                <input name="email" type="email" defaultValue={editingUser?.email} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <div className="flex justify-end gap-4 mt-6">
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
