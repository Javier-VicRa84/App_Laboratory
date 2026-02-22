import React, { useEffect, useState } from 'react';
import { FileText, Download, QrCode, Search, CheckCircle2 } from 'lucide-react';
import { Sample, Analysis } from '../types';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Reports() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/samples-detailed')
      .then(res => res.json())
      .then(setSamples);
  }, []);

  const generatePDF = async (sample: Sample) => {
    const res = await fetch(`/api/sample-analysis/${sample.id}`);
    const analyses: Analysis[] = await res.json();

    const doc = new jsPDF() as any;
    
    // Header
    doc.setFillColor(21, 22, 25);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(24);
    doc.text('LABFLOW LIMS', 15, 25);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('Protocolo de Análisis de Laboratorio', 15, 32);

    // Sample Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Protocolo N°: ${sample.code}`, 15, 55);
    doc.text(`Cliente: ${sample.customer_name}`, 15, 62);
    doc.text(`Fecha de Ingreso: ${format(new Date(sample.entry_date), 'dd/MM/yyyy')}`, 15, 69);
    doc.text(`Tipo de Muestra: ${sample.type}`, 15, 76);

    // Table
    const tableData = analyses.map(a => [
      a.technique_name,
      a.result_value?.toString() || 'N/A',
      'Unidad', // In a real app, units would come from the technique
      a.status === 'validated' ? 'Validado' : 'Pendiente'
    ]);

    doc.autoTable({
      startY: 85,
      head: [['Parámetro', 'Resultado', 'Unidad', 'Estado']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text('Observaciones:', 15, finalY + 20);
    doc.setFontSize(10);
    doc.text(sample.observations || 'Sin observaciones técnicas adicionales.', 15, finalY + 28);
    
    doc.text('Firma Responsable Técnico', 150, finalY + 50);
    doc.line(140, finalY + 45, 200, finalY + 45);

    doc.save(`Protocolo_${sample.code}.pdf`);
  };

  const filtered = samples.filter(s => 
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Informes y Protocolos</h2>
        <p className="text-zinc-500">Generación de certificados y reportes oficiales</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
        <input
          type="text"
          placeholder="Buscar por código o cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#151619] border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-black/20 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Código</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado General</th>
              <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtered.map(sample => (
              <tr key={sample.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono text-emerald-400 font-bold">{sample.code}</span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-white">{sample.customer_name}</p>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {sample.status === 'validated' ? (
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                    <span className="text-xs text-zinc-400 capitalize">{sample.status.replace('_', ' ')}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => generatePDF(sample)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-500/20 transition-all"
                    >
                      <Download size={14} />
                      PDF
                    </button>
                    <button className="p-1.5 bg-white/5 text-zinc-400 rounded-lg hover:text-white transition-all">
                      <QrCode size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
