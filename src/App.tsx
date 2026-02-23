/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuthStore } from './store/authStore';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import Samples from './components/Samples';
import Techniques from './components/Techniques';
import Results from './components/Results';
import Reports from './components/Reports';
import Quality from './components/Quality';
import Documents from './components/Documents';
import Inventory from './components/Inventory';
import Suppliers from './components/Suppliers';
import ExternalCustomers from './components/ExternalCustomers';
import InternalAnalyses from './components/InternalAnalyses';
import Triquinosis from './components/Triquinosis';
import Users from './components/Users';
import System from './components/System';
import SuperUserPanel from './components/SuperUserPanel';

export default function App() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'triquinosis': return <Triquinosis />;
      case 'customers': return <Customers />;
      case 'samples': return <Samples />;
      case 'techniques': return <Techniques />;
      case 'results': return <Results />;
      case 'reports': return <Reports />;
      case 'quality': return <Quality />;
      case 'documents': return <Documents />;
      case 'inventory': return <Inventory />;
      case 'suppliers': return <Suppliers />;
      case 'external-customers': return <ExternalCustomers />;
      case 'internal-analyses': return <InternalAnalyses />;
      case 'stats': return <Dashboard />; // Reusing dashboard for stats as it contains charts
      case 'users': return <Users />;
      case 'system': return <System />;
      case 'superuser': return <SuperUserPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-zinc-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        {renderContent()}
      </main>
    </div>
  );
}

