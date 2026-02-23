import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Beaker, 
  ClipboardList, 
  FileText, 
  Settings, 
  ShieldCheck, 
  BookOpen, 
  Package, 
  BarChart3,
  LogOut,
  Menu,
  X,
  Terminal,
  Globe
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'triquinosis', label: 'Triquinosis', icon: ShieldCheck },
  { id: 'customers', label: 'Productores', icon: Users },
  { id: 'external-customers', label: 'Clientes Externos', icon: Globe },
  { id: 'suppliers', label: 'Proveedores', icon: Package },
  { id: 'internal-analyses', label: 'Análisis Internos', icon: Beaker },
  { id: 'samples', label: 'Muestras', icon: Beaker },
  { id: 'techniques', label: 'Técnicas', icon: Settings },
  { id: 'results', label: 'Resultados', icon: ClipboardList },
  { id: 'reports', label: 'Informes', icon: FileText },
  { id: 'quality', label: 'Calidad', icon: ShieldCheck },
  { id: 'documents', label: 'Documentación', icon: BookOpen },
  { id: 'inventory', label: 'Inventario', icon: Package },
  { id: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { id: 'users', label: 'Usuarios', icon: Users },
  { id: 'system', label: 'Sistema', icon: Terminal },
  { id: 'superuser', label: 'Soporte Técnico', icon: Terminal, role: 'superuser' },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { logout, user } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(true);

  const filteredMenuItems = menuItems.filter(item => !item.role || item.role === user?.role);

  return (
    <div className={cn(
      "bg-[#151619] text-white transition-all duration-300 flex flex-col h-screen sticky top-0",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="p-6 flex items-center justify-between border-b border-white/10">
        {isOpen && <h1 className="text-xl font-bold tracking-tighter text-emerald-400">LABFLOW LIMS</h1>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 hover:bg-white/10 rounded">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
              activeTab === item.id 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "text-zinc-400 hover:bg-white/5 hover:text-white"
            )}
          >
            <item.icon size={20} className={cn(
              activeTab === item.id ? "text-emerald-400" : "text-zinc-500 group-hover:text-zinc-300"
            )} />
            {isOpen && <span className="text-sm font-medium">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10">
        {isOpen && (
          <div className="mb-4 px-2">
            <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Usuario</p>
            <p className="text-sm font-medium text-zinc-200 truncate">{user?.full_name}</p>
            <p className="text-[10px] text-zinc-500 uppercase">{user?.role}</p>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut size={20} />
          {isOpen && <span className="text-sm font-medium">Cerrar Sesión</span>}
        </button>
      </div>
    </div>
  );
}
