import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Search, 
  ShieldAlert, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Clock, 
  Thermometer, 
  Beaker, 
  Download,
  ChevronRight,
  Save,
  Trash2,
  Activity,
  History,
  RefreshCw,
  Pencil,
  X
} from 'lucide-react';
import { 
  Sample, 
  Customer, 
  Technique, 
  TriquinosisJornada, 
  TriquinosisTropa,
  TriquinosisPool, 
  TriquinosisTemperature,
  Equipment
} from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuthStore } from '../store/authStore';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel } from '../services/excelService';

export default function Triquinosis() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'jornada' | 'protocolos' | 'actas'>('jornada');
  const [currentJornada, setCurrentJornada] = useState<TriquinosisJornada | null>(null);
  const [tropas, setTropas] = useState<TriquinosisTropa[]>([]);
  const [pools, setPools] = useState<TriquinosisPool[]>([]);
  const [temps, setTemps] = useState<TriquinosisTemperature[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isJornadaModalOpen, setIsJornadaModalOpen] = useState(false);
  const [isTropaModalOpen, setIsTropaModalOpen] = useState(false);
  const [isTempModalOpen, setIsTempModalOpen] = useState(false);
  const [tropaFilter, setTropaFilter] = useState<'all' | 'internal' | 'external'>('all');
  const [isEditingJornada, setIsEditingJornada] = useState(false);
  const [editingTropa, setEditingTropa] = useState<TriquinosisTropa | null>(null);
  const [positivePoolId, setPositivePoolId] = useState<number | null>(null);
  const [larvaeInput, setLarvaeInput] = useState('');
  const [observationsInput, setObservationsInput] = useState('');
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  const fetchData = async () => {
    try {
      const [jornadasRes, equipmentRes, samplesRes, customersRes, techniquesRes] = await Promise.all([
        fetch('/api/triquinosis-jornadas'),
        fetch('/api/equipment'),
        fetch('/api/samples-detailed'),
        fetch('/api/customers'),
        fetch('/api/techniques')
      ]);
      
      if (!jornadasRes.ok || !equipmentRes.ok || !samplesRes.ok || !customersRes.ok || !techniquesRes.ok) {
        throw new Error('Error al cargar datos de la API');
      }

      const jornadas: TriquinosisJornada[] = await jornadasRes.json();
      const openJornada = jornadas.find(j => j.status === 'open');
      setCurrentJornada(openJornada || null);
      
      if (openJornada) {
        const [poolsRes, tempsRes, tropasRes] = await Promise.all([
          fetch(`/api/triquinosis-pools?jornada_id=${openJornada.id}`),
          fetch(`/api/triquinosis-temperatures?jornada_id=${openJornada.id}`),
          fetch(`/api/triquinosis-tropas?jornada_id=${openJornada.id}`)
        ]);
        if (poolsRes.ok) {
          const data = await poolsRes.json();
          setPools(data.sort((a: any, b: any) => a.pool_number.localeCompare(b.pool_number)));
        }
        if (tempsRes.ok) setTemps(await tempsRes.json());
        if (tropasRes.ok) {
          const data = await tropasRes.json();
          setTropas(data.sort((a: any, b: any) => a.id - b.id));
        }
      } else {
        setPools([]);
        setTemps([]);
        setTropas([]);
      }

      setEquipment(await equipmentRes.json());
      const allTechs: Technique[] = await techniquesRes.json();
      setTechniques(allTechs.filter(t => t.name.toLowerCase().includes('triquinosis')));
      setSamples((await samplesRes.json()).filter((s: Sample) => s.type === 'Triquinosis'));
      setCustomers(await customersRes.json());
    } catch (error) {
      console.error('Error fetching triquinosis data:', error);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStartJornada = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const techniqueId = Number(data.technique_id);
    const type = data.type as 'normal' | 'sospechosa';

    try {
      if (isEditingJornada && currentJornada) {
        const res = await fetch(`/api/triquinosis-jornadas/${currentJornada.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            technique_id: techniqueId,
            type: type
          }),
        });
        if (!res.ok) throw new Error('Error al actualizar jornada');
      } else {
        const res = await fetch('/api/triquinosis-jornadas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: format(new Date(), 'yyyy-MM-dd'),
            analyst_id: user?.id,
            technique_id: techniqueId,
            type: type,
            status: 'open'
          }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Error al iniciar jornada');
        }
      }

      await fetchData();
      setIsJornadaModalOpen(false);
      setIsEditingJornada(false);
    } catch (error: any) {
      console.error('Error in handleStartJornada:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleAddTropa = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!currentJornada) return;

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    const totalAnimals = Number(data.total_animals);
    const isInternal = data.is_internal === 'on' ? 1 : 0;

    console.log('Saving tropa:', { editingTropa, data, isInternal });

    try {
      // Auto-delete if editing and animals is 0
      if (editingTropa && totalAnimals === 0) {
        if (confirm('La cantidad de animales es 0. ¿Desea eliminar esta tropa de la jornada?')) {
          await handleDeleteTropa(editingTropa.id);
          setIsTropaModalOpen(false);
          setEditingTropa(null);
          return;
        }
      }

      const url = editingTropa ? `/api/triquinosis-tropas/${editingTropa.id}` : '/api/triquinosis-tropas';
      const method = editingTropa ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jornada_id: currentJornada.id,
          customer_id: data.customer_id,
          tropa_number: data.tropa_number,
          total_animals: totalAnimals,
          species: data.species,
          category: data.category,
          is_internal: isInternal
        }),
      });

      console.log('Save response status:', res.status);

      if (res.ok) {
        setIsTropaModalOpen(false);
        setEditingTropa(null);
        await fetchData();
      } else {
        const err = await res.json();
        console.error('Save failed:', err);
        alert('Error al guardar la tropa');
      }
    } catch (error) {
      console.error('Error saving tropa:', error);
    }
  };

  const filteredTropas = tropas.filter(t => {
    if (tropaFilter === 'internal') return t.is_internal === 1;
    if (tropaFilter === 'external') return t.is_internal === 0;
    return true;
  });

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === Number(customerId));
    const checkbox = document.getElementById('is_internal') as HTMLInputElement;
    if (checkbox && customer) {
      checkbox.checked = customer.category === 'Fábrica Propia';
    }
  };

  const handleGeneratePools = async () => {
    if (!currentJornada) {
      alert('Inicie una jornada primero.');
      return;
    }
    if (tropas.length === 0) {
      alert('Debe cargar al menos una tropa para generar los pools.');
      return;
    }

    const poolSize = currentJornada.type === 'normal' ? 20 : 10;
    
    try {
      // 1. Delete existing pools for this jornada
      const existingPools = await (await fetch(`/api/triquinosis-pools?jornada_id=${currentJornada.id}`)).json();
      if (Array.isArray(existingPools)) {
        await Promise.all(existingPools.map(p => 
          fetch(`/api/triquinosis-pools/${p.id}`, { method: 'DELETE' })
        ));
      }

      // 2. Generate initial pools
      const poolsToCreate = [];
      let currentPoolAnimals = 0;
      let currentPoolComposition: {tropa: string, count: number}[] = [];
      let globalOrder = 1;

      // Sort tropas by ID to ensure consistent distribution
      const sortedTropas = [...tropas].sort((a, b) => a.id - b.id);

      for (let tIdx = 0; tIdx < sortedTropas.length; tIdx++) {
        const tropa = sortedTropas[tIdx];
        let remainingFromTropa = tropa.total_animals;

        while (remainingFromTropa > 0) {
          const spaceInPool = poolSize - currentPoolAnimals;
          const taking = Math.min(remainingFromTropa, spaceInPool);
          
          currentPoolComposition.push({ tropa: tropa.tropa_number, count: taking });
          currentPoolAnimals += taking;
          remainingFromTropa -= taking;
          
          const isLastTropa = tIdx === sortedTropas.length - 1;
          const isTropaEmpty = remainingFromTropa === 0;

          if (currentPoolAnimals === poolSize || (isLastTropa && isTropaEmpty)) {
            poolsToCreate.push({
              jornada_id: currentJornada.id,
              pool_number: (poolsToCreate.length + 1).toString().padStart(3, '0'),
              sample_count: currentPoolAnimals,
              weight: currentPoolAnimals * 5,
              result: 'pending',
              range_start: globalOrder,
              range_end: globalOrder + currentPoolAnimals - 1,
              composition: currentPoolComposition.map(c => `${c.tropa}(${c.count})`).join(', '),
              composition_tropas: currentPoolComposition.map(c => c.tropa).join('/'),
              composition_counts: currentPoolComposition.map(c => c.count).join('/')
            });
            globalOrder += currentPoolAnimals;
            currentPoolAnimals = 0;
            currentPoolComposition = [];
          }
        }
      }

      // 3. Merge last pool if < 4 samples
      if (poolsToCreate.length > 1) {
        const lastPool = poolsToCreate[poolsToCreate.length - 1];
        if (lastPool.sample_count < 4) {
          const secondToLast = poolsToCreate[poolsToCreate.length - 2];
          secondToLast.sample_count += lastPool.sample_count;
          secondToLast.range_end = lastPool.range_end;
          secondToLast.weight = secondToLast.sample_count * 5;
          secondToLast.composition = secondToLast.composition + ', ' + lastPool.composition;
          secondToLast.composition_tropas = secondToLast.composition_tropas + '/' + lastPool.composition_tropas;
          secondToLast.composition_counts = secondToLast.composition_counts + '/' + lastPool.composition_counts;
          poolsToCreate.pop();
        }
      }

      // 4. Create pools in DB
      const poolPromises = poolsToCreate.map(poolData => 
        fetch('/api/triquinosis-pools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(poolData),
        })
      );

      const results = await Promise.all(poolPromises);
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        alert('Error al crear algunos pools.');
      }
      
      await fetchData();
    } catch (error) {
      console.error('Error generating pools:', error);
      alert('Error al generar pools');
    }
  };

  const handleFinishJornada = async () => {
    if (!currentJornada) return;
    console.log('Finishing jornada:', currentJornada.id);
    
    if (pools.length === 0) {
      alert('No se puede finalizar una jornada sin haber generado los pools de análisis.');
      return;
    }

    const pendingPools = pools.filter(p => p.result === 'pending');
    if (pendingPools.length > 0) {
      alert(`No se puede finalizar la jornada. Hay ${pendingPools.length} pools pendientes de resultado. Por favor, cargue todos los resultados (ND o P) antes de finalizar.`);
      return;
    }

    if (!window.confirm('¿Está seguro de que desea FINALIZAR la jornada? Una vez finalizada, no podrá agregar más tropas ni modificar resultados.')) {
      return;
    }

    try {
      const res = await fetch(`/api/triquinosis-jornadas/${currentJornada.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });

      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Error del servidor al finalizar: ${err.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Network error finishing jornada:', error);
      alert(`Error de conexión: ${error.message}`);
    }
  };

  const handleDeleteTropa = async (id: number) => {
    if (!id) return;
    
    const confirmed = window.confirm('¿Está seguro de que desea eliminar esta tropa? Esta acción no se puede deshacer.');
    if (!confirmed) return;
    
    try {
      const res = await fetch(`/api/triquinosis-tropas/${id}`, { 
        method: 'DELETE',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!res.ok) {
        alert(`Error del servidor al eliminar: ${res.status}`);
        return;
      }

      const result = await res.json();
      if (result.success) {
        await fetchData();
        
        if (currentJornada) {
          const poolsRes = await fetch(`/api/triquinosis-pools?jornada_id=${currentJornada.id}`);
          if (poolsRes.ok) {
            const currentPools = await poolsRes.json();
            if (Array.isArray(currentPools) && currentPools.length > 0) {
              if (window.confirm('Tropa eliminada. ¿Desea regenerar los pools para actualizar la numeración?')) {
                await handleGeneratePools();
              }
            }
          }
        }
      } else {
        alert(`No se pudo eliminar: ${result.error || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error in handleDeleteTropa:', error);
      alert(`Error de conexión al eliminar: ${error.message}`);
    }
  };

  const handleExportJornadaExcel = () => {
    if (!currentJornada) return;
    
    const exportData = pools.map(p => ({
      'Fecha': currentJornada.date,
      'Pool N°': p.pool_number,
      'Tropas': p.composition_tropas,
      'Rango': `${p.range_start} - ${p.range_end}`,
      'Cant. Muestras': p.sample_count,
      'Resultado': p.result === 'ND' ? 'Negativo' : (p.result === 'P' ? 'Positivo' : 'Pendiente'),
      'Larvas/g': p.larvae_count || 0,
      'Observaciones': p.observations || ''
    }));

    exportToExcel(exportData, `Jornada_Triquinosis_${currentJornada.date}`, 'Pools');
  };

  const handleUpdatePoolResult = async (poolId: number, result: 'ND' | 'P', larvaeCount: number = 0, observations: string = '') => {
    if (result === 'P' && larvaeCount <= 0) {
      alert('Para un resultado Positivo, la cantidad de larvas debe ser mayor a 0.');
      return;
    }
    if (result === 'ND') {
      larvaeCount = 0;
      observations = '';
    }

    try {
      const res = await fetch(`/api/triquinosis-pools/${poolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, larvae_count: larvaeCount, observations }),
      });
      if (res.ok) {
        await fetchData();
      } else {
        const err = await res.json();
        alert(`Error al actualizar resultado: ${err.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error updating pool result:', error);
      alert('Error de conexión al actualizar resultado');
    }
  };

  const handleAddTemp = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!currentJornada) return;

    let waterTemp: number;
    let chamberTemp: number;
    let time: string;

    if (e) {
      const formData = new FormData(e.currentTarget);
      waterTemp = Number(formData.get('water_temp'));
      chamberTemp = Number(formData.get('chamber_temp'));
      time = formData.get('time') as string;
    } else {
      // Fallback or initial call if needed (though now we use modal)
      waterTemp = 45;
      chamberTemp = 45.5;
      time = format(new Date(), 'HH:mm');
    }

    await fetch('/api/triquinosis-temperatures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jornada_id: currentJornada.id,
        time: time,
        water_temp: waterTemp.toFixed(1),
        chamber_temp: chamberTemp.toFixed(1),
        observations: waterTemp < 44 || waterTemp > 46 ? 'DESVÍO DETECTADO' : ''
      }),
    });
    setIsTempModalOpen(false);
    fetchData();
  };

  const generateADA = (jornada: TriquinosisJornada, pools: TriquinosisPool[]) => {
    try {
      console.log('Generating ADA PDF...', { jornada, poolsCount: pools.length });
      const doc = new jsPDF() as any;
      
      // Header
      doc.setFillColor(21, 22, 25);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('ACTA DE ANÁLISIS DE TRIQUINOSIS (ADA)', 15, 20);
      doc.setFontSize(10);
      doc.text('Formulario oficial SENASA: M-09-P-03-F-02', 15, 30);

      // Info
      doc.setTextColor(0, 0, 0);
      const dateStr = jornada.date ? format(new Date(jornada.date), 'dd/MM/yyyy') : format(new Date(), 'dd/MM/yyyy');
      doc.text(`Fecha de Inicio: ${dateStr}`, 15, 50);
      doc.text(`Responsable de Análisis: ${user?.full_name || 'No especificado'}`, 15, 57);
      doc.text(`Director Técnico: Vet. SENASA (Mat. Prof. XXXX)`, 15, 64);

      // Table
      const tableData = pools.map((p, i) => [
        dateStr, // Fecha de inicio
        p.pool_number, // Nº interno de analisis
        p.composition_tropas || '-', // numero de tropas o tropas
        `${p.range_start} - ${p.range_end}`, // Nº de orden
        p.composition_counts || '-', // Nº de animal por tropa
        p.result === 'P' ? `Positivo (${p.larvae_count} l/g)` : (p.result === 'ND' ? 'Negativo' : 'Pendiente'), // Resultado
        user?.full_name || '', // Firma Responsable
        'Vet. SENASA', // Firma Director tecnico
        dateStr // Fecha obtencion resultado
      ]);

      autoTable(doc, {
        startY: 75,
        head: [['Fecha Inicio', 'N° Interno', 'Tropas', 'N° Orden', 'Animal/Tropa', 'Resultado', 'Responsable', 'Dir. Técnico', 'Fecha Result.']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] },
        styles: { fontSize: 6 }
      });

      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      setPdfPreviewUrl(url);
      setPreviewTitle(`ADA - ${dateStr}`);
      console.log('ADA PDF generated successfully');
    } catch (error) {
      console.error('Error generating ADA PDF:', error);
      alert('Error al generar la vista previa del ADA. Verifique los datos de la jornada.');
    }
  };

  const generateDocument = async (type: string) => {
    if (!currentJornada) {
      alert('Debe haber una jornada activa para generar documentos.');
      return;
    }

    const doc = new jsPDF() as any;
    const margin = 15;
    let y = 20;

    // Common Header
    doc.setFillColor(21, 22, 25);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text('LABOFRÍO LIMS - GESTIÓN SANITARIA', margin, y);
    doc.setFontSize(10);
    doc.text(`Documento: ${type} | Fecha: ${format(new Date(currentJornada.date), 'dd/MM/yyyy')}`, margin, y + 10);
    doc.setTextColor(0, 0, 0);
    y = 55;

    switch (type) {
      case 'LIB':
        doc.setFontSize(14);
        doc.text('ACTA DE LIBERACIÓN AL CONSUMO', margin, y);
        y += 15;
        doc.setFontSize(10);
        doc.text('Se certifica que los animales analizados en la presente jornada han resultado NEGATIVOS', margin, y);
        doc.text('para Trichinella spiralis mediante el método de Digestión Artificial (Res. 740/99).', margin, y + 5);
        y += 20;
        autoTable(doc, {
          startY: y,
          head: [['Tropa', 'Productor', 'Especie', 'Cantidad', 'Resultado']],
          body: tropas.map(t => [
            t.tropa_number, 
            customers.find(c => c.id === t.customer_id)?.name || 'N/A',
            t.species, 
            t.total_animals, 
            pools.every(p => p.result === 'ND') ? 'NEGATIVO' : 'VER ADA'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] }
        });
        break;

      case 'TPD':
        doc.setFontSize(14);
        doc.text('CONTROL DE TEMPERATURA DEL DIGESTOR (TPD)', margin, y);
        y += 15;
        autoTable(doc, {
          startY: y,
          head: [['Hora', 'Temp. Baño (°C)', 'Temp. Cámara (°C)', 'Observaciones']],
          body: temps.map(t => [t.time, t.water_temp, t.chamber_temp, t.observations || '-']),
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] }
        });
        break;

      case 'TRZ':
        doc.setFontSize(14);
        doc.text('TRAZABILIDAD POR LOTE (TRZ)', margin, y);
        y += 15;
        autoTable(doc, {
          startY: y,
          head: [['Análisis', 'Rango Orden', 'Cant.', 'Resultado', 'Disposición']],
          body: pools.map(p => [
            p.pool_number, 
            `${p.range_start} - ${p.range_end}`, 
            p.sample_count, 
            p.result, 
            p.result === 'ND' ? 'LIBERADO' : 'DECOMISO/RE-ANÁLISIS'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] }
        });
        break;

      default:
        doc.text(`Generación de documento ${type} en proceso...`, margin, y);
    }

    // Footer Signatures
    const finalY = (doc as any).lastAutoTable?.finalY || 200;
    doc.line(margin, finalY + 40, margin + 50, finalY + 40);
    doc.text('Analista', margin + 10, finalY + 45);
    doc.line(140, finalY + 40, 190, finalY + 40);
    doc.text('Inspector SENASA', 150, finalY + 45);

    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);
    setPreviewTitle(`${type} - ${format(new Date(currentJornada.date), 'dd/MM/yyyy')}`);
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="text-red-500" size={24} />
            <h2 className="text-3xl font-bold text-white tracking-tight">Módulo Triquinosis</h2>
          </div>
          <p className="text-zinc-500">Control Sanitario SENASA - Digestión Artificial</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchData}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="Refrescar Datos"
          >
            <RefreshCw size={20} />
          </button>
          {currentJornada ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Jornada Activa: {format(new Date(currentJornada.date), 'dd/MM/yyyy')}</span>
              <div className="flex items-center gap-2 ml-4 border-l border-emerald-500/20 pl-4">
                <button 
                  onClick={handleExportJornadaExcel}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all flex items-center gap-1"
                  title="Exportar a Excel"
                >
                  <Download size={12} /> Excel
                </button>
                <button 
                  onClick={() => {
                    setIsEditingJornada(true);
                    setIsJornadaModalOpen(true);
                  }}
                  className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-all"
                >
                  Editar
                </button>
                <button 
                  onClick={handleFinishJornada}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg transition-all ${
                    pools.length > 0 && pools.every(p => p.result !== 'pending')
                      ? 'bg-emerald-500 text-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setIsJornadaModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus size={20} />
              Iniciar Jornada
            </button>
          )}
        </div>
      </header>

      <nav className="flex gap-1 bg-[#151619] p-1 rounded-xl border border-white/10 w-fit">
        <button 
          onClick={() => setActiveTab('jornada')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'jornada' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Jornada de Faena
        </button>
        <button 
          onClick={() => setActiveTab('protocolos')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'protocolos' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Protocolos SENASA
        </button>
        <button 
          onClick={() => setActiveTab('actas')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'actas' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Actas e Informes
        </button>
      </nav>

      {activeTab === 'jornada' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <History size={18} className="text-red-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-widest">Tropas</h3>
                    </div>
                    <div className="flex gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5">
                      {(['all', 'external', 'internal'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setTropaFilter(f)}
                          className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter transition-all ${
                            tropaFilter === f ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-400'
                          }`}
                        >
                          {f === 'all' ? 'Todas' : f === 'external' ? 'Clientes' : 'Internas'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {currentJornada && (
                  <button 
                    onClick={() => setIsTropaModalOpen(true)}
                    className="text-red-400 text-xs font-bold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Cargar Tropa
                  </button>
                )}
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[600px]">
                  <thead className="bg-black/10">
                  <tr>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tropa</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Productor</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Animales</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredTropas.map(tropa => (
                    <tr key={tropa.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-4 font-mono text-xs text-red-400 font-bold">
                        <div className="flex items-center gap-2">
                          {tropa.is_internal === 1 && <Activity size={12} className="text-blue-400" />}
                          {tropa.tropa_number}
                          {tropa.is_internal === 1 && (
                            <span className="bg-blue-500/20 text-blue-400 text-[8px] px-1 rounded uppercase tracking-tighter">Interno</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs text-white">{customers.find(c => c.id === tropa.customer_id)?.name}</td>
                      <td className="px-4 py-4 text-xs text-zinc-300">{tropa.total_animals}</td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Editing tropa:', tropa);
                              setEditingTropa(tropa);
                              setIsTropaModalOpen(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                            title="Editar Tropa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Deleting tropa button clicked, ID:', tropa.id);
                              handleDeleteTropa(tropa.id);
                            }}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            title="Eliminar Tropa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {tropas.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-zinc-600 italic text-sm">
                        No hay tropas cargadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

            <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div className="flex items-center gap-2">
                  <Beaker size={18} className="text-emerald-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Pools de Análisis (ADA)</h3>
                </div>
                {currentJornada && tropas.length > 0 && (
                  <button 
                    onClick={handleGeneratePools}
                    className="text-emerald-400 text-xs font-bold flex items-center gap-1 hover:underline"
                  >
                    <Save size={14} /> Generar Pools Automáticamente
                  </button>
                )}
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left min-w-[1000px]">
                  <thead className="bg-black/10">
                    <tr>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Análisis</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">N° Orden</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tropas</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cant.</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tot.</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Resultado</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Peso</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Agua</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pepsina</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">HCl</th>
                      <th className="px-4 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pools.map(pool => (
                      <tr key={pool.id} className={`hover:bg-white/5 transition-colors ${pool.result === 'P' ? 'bg-red-500/5' : pool.sample_count < 10 ? 'bg-amber-500/5' : ''}`}>
                        <td className="px-4 py-4 font-mono text-xs text-white">{pool.pool_number}</td>
                        <td className="px-4 py-4 font-mono text-xs text-zinc-500">{pool.range_start} - {pool.range_end}</td>
                        <td className="px-4 py-4 text-[10px] text-zinc-400 font-mono">{pool.composition_tropas || '-'}</td>
                        <td className="px-4 py-4 text-[10px] text-zinc-400 font-mono">{pool.composition_counts || '-'}</td>
                        <td className="px-4 py-4 text-xs text-zinc-300">{pool.sample_count}</td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdatePoolResult(pool.id, 'ND')}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${pool.result === 'ND' ? 'bg-emerald-500 text-black' : 'bg-white/5 text-zinc-500 hover:text-white'}`}
                            >
                              ND
                            </button>
                            <button 
                              onClick={() => {
                                setPositivePoolId(pool.id);
                                setLarvaeInput(pool.larvae_count > 0 ? pool.larvae_count.toString() : '');
                                setObservationsInput(pool.observations || '');
                              }}
                              className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${pool.result === 'P' ? 'bg-red-500 text-white' : 'bg-white/5 text-zinc-500 hover:text-red-400'}`}
                            >
                              P
                            </button>
                          </div>
                          {pool.result === 'P' && pool.observations && (
                            <div className="mt-1 text-[9px] text-red-400 font-medium leading-tight max-w-[150px]">
                              {pool.observations}
                            </div>
                          )}
                          {positivePoolId === pool.id && (
                            <div className="mt-2 flex flex-col gap-2 bg-black/40 p-2 rounded-lg border border-red-500/30 w-[200px]">
                              <div className="flex items-center gap-2">
                                <input 
                                  type="number" 
                                  value={larvaeInput}
                                  onChange={(e) => setLarvaeInput(e.target.value)}
                                  placeholder="Larvas/g"
                                  className="w-20 bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                                  autoFocus
                                />
                                <input 
                                  type="text" 
                                  value={observationsInput}
                                  onChange={(e) => setObservationsInput(e.target.value)}
                                  placeholder="ID Cerdo / Obs"
                                  className="flex-1 bg-black border border-white/10 rounded px-2 py-1 text-[10px] text-white"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setPositivePoolId(null)}
                                  className="text-zinc-500 text-[10px] px-2 py-1"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => {
                                    handleUpdatePoolResult(pool.id, 'P', Number(larvaeInput) || 0, observationsInput);
                                    setPositivePoolId(null);
                                  }}
                                  className="bg-red-500 text-white text-[10px] px-3 py-1 rounded font-bold"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-300">{pool.weight}g</td>
                        <td className="px-4 py-4 text-xs text-zinc-300">{pool.sample_count < 10 ? '750ml' : '1500ml'}</td>
                        <td className="px-4 py-4 text-xs text-zinc-500">{pool.sample_count < 10 ? '7.5g' : '15g'}</td>
                        <td className="px-4 py-4 text-xs text-zinc-500">{pool.sample_count < 10 ? '7.5ml' : '15ml'}</td>
                        <td className="px-4 py-4">
                          <button className="text-zinc-600 hover:text-white transition-colors">
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {pools.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-4 py-12 text-center text-zinc-600 italic text-sm">
                          {currentJornada ? 'No hay pools registrados en esta jornada' : 'Inicie una jornada para comenzar'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Thermometer size={18} className="text-blue-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest">Control de Temperatura (TPD)</h3>
                </div>
                {currentJornada && (
                  <button 
                    onClick={() => setIsTempModalOpen(true)}
                    className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all"
                  >
                    Registrar Punto
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {temps.slice(-4).map(t => (
                  <div key={t.id} className={`p-4 rounded-xl border ${t.water_temp < 44 || t.water_temp > 46 ? 'bg-red-500/10 border-red-500/20' : 'bg-black/20 border-white/5'}`}>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">{t.time}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-white">{t.water_temp}°C</span>
                      <span className="text-[10px] text-zinc-500">Baño</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">Resumen de Jornada</h4>
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Total Tropas:</span>
                  <span className="text-sm font-bold text-white">{tropas.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Total Animales:</span>
                  <span className="text-sm font-bold text-white">{tropas.reduce((acc, t) => acc + t.total_animals, 0)}</span>
                </div>
              </div>

              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 pt-4 border-t border-white/5">Resumen de Análisis</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Total Pools:</span>
                  <span className="text-sm font-bold text-white">{pools.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Pools ND:</span>
                  <span className="text-sm font-bold text-emerald-400">{pools.filter(p => p.result === 'ND').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Pools P:</span>
                  <span className="text-sm font-bold text-red-400">{pools.filter(p => p.result === 'P').length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400">Pendientes:</span>
                  <span className="text-sm font-bold text-amber-400">{pools.filter(p => p.result === 'pending').length}</span>
                </div>
              </div>
              {currentJornada && (
                <div className="space-y-3 mt-6">
                  {pools.length > 0 && pools.every(p => p.result !== 'pending') && (
                    <button 
                      onClick={() => generateADA(currentJornada, pools)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                    >
                      <Download size={18} />
                      Generar ADA
                    </button>
                  )}
                  <button 
                    onClick={handleFinishJornada}
                    className={`w-full font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
                      pools.length > 0 && pools.every(p => p.result !== 'pending')
                        ? 'bg-emerald-500 text-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                    }`}
                  >
                    <CheckCircle2 size={18} />
                    Finalizar Jornada
                  </button>
                  {pools.some(p => p.result === 'pending') && (
                    <p className="text-[10px] text-amber-500 text-center">Complete todos los resultados para finalizar</p>
                  )}
                </div>
              )}
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Info size={16} />
                <h4 className="text-xs font-bold uppercase tracking-widest">Puntos Críticos</h4>
              </div>
              <ul className="text-[10px] text-zinc-500 space-y-2">
                <li>• Temperatura: 44-46°C (Obligatorio)</li>
                <li>• Tiempo digestión: 60 min</li>
                <li>• Sedimentación: 30 min</li>
                <li>• Clarificación: 10 min</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'protocolos' && (
        <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Protocolos de Ingreso</h3>
          </div>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-black/10">
              <tr>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Protocolo</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Productor / RENSPA</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Especie / DTE</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estado</th>
                <th className="px-6 py-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {samples.map(sample => (
                <tr key={sample.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-red-400 font-bold">{sample.code}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-white">{sample.customer_name}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">{sample.renspa}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-zinc-300">{sample.animal_species}</p>
                    <p className="text-[10px] text-zinc-500 font-mono">DTE: {sample.dte}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sample.status === 'validated' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                      {sample.status === 'validated' ? 'Negativo' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}

      {activeTab === 'actas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 'ADA', name: 'Acta de Análisis (ADA)', desc: 'Registro oficial por pool. Formulario M-09-P-03-F-02.' },
            { id: 'LIB', name: 'Liberación al Consumo (LIB)', desc: 'Habilita el despacho cuando todos los pools son ND.' },
            { id: 'REA', name: 'Acta de Re-análisis (REA)', desc: 'Documenta la subdivisión ante un pool positivo.' },
            { id: 'DES', name: 'Acta de Destrucción (DES)', desc: 'Decomiso y destrucción bajo supervisión SENASA.' },
            { id: 'NOT', name: 'Notificación SENASA (NOT)', desc: 'Comunicación formal ante resultado positivo.' },
            { id: 'TPD', name: 'Control Temperatura (TPD)', desc: 'Registro horario de temperatura del digestor.' },
            { id: 'MUE', name: 'Registro de Muestras (MUE)', desc: 'Recepción e identificación por tropa.' },
            { id: 'TRZ', name: 'Trazabilidad (TRZ)', desc: 'Vincula producción, recepción y disposición final.' },
            { id: 'IRP', name: 'Informe al Productor (IRP)', desc: 'Resultado individual por tropa para el origen.' },
          ].map(acta => (
            <div key={acta.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <FileText className="text-emerald-400" size={20} />
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{acta.id}</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{acta.name}</h3>
              <p className="text-xs text-zinc-500 mb-6 line-clamp-2">{acta.desc}</p>
              <button 
                onClick={() => acta.id === 'ADA' ? generateADA(currentJornada!, pools) : generateDocument(acta.id)}
                className="w-full py-2 bg-white/5 text-zinc-400 text-xs font-bold rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
              >
                Generar Documento
              </button>
            </div>
          ))}
        </div>
      )}

      {isJornadaModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-white mb-6">{isEditingJornada ? 'Editar Jornada' : 'Iniciar Nueva Jornada'}</h3>
            <form onSubmit={handleStartJornada} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Método de Análisis</label>
                <select name="technique_id" required defaultValue={isEditingJornada ? currentJornada?.technique_id : ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="">Seleccionar Método...</option>
                  {techniques.map(t => <option key={t.id} value={t.id}>{t.name} ({t.method})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Tipo de Faena</label>
                <select name="type" required defaultValue={isEditingJornada ? currentJornada?.type : 'normal'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                  <option value="normal">Normal (Pools de 20)</option>
                  <option value="sospechosa">Sospechosa (Pools de 10)</option>
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => { setIsJornadaModalOpen(false); setIsEditingJornada(false); }} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">{isEditingJornada ? 'Guardar Cambios' : 'Empezar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTropaModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-white mb-6">{editingTropa ? 'Editar Tropa' : 'Cargar Nueva Tropa'}</h3>
            <form onSubmit={handleAddTropa} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Productor</label>
                <select 
                  name="customer_id" 
                  required 
                  defaultValue={editingTropa?.customer_id} 
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
                >
                  <option value="">Seleccionar Productor...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.category || 'Productor'})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">N° de Tropa</label>
                  <input name="tropa_number" required defaultValue={editingTropa?.tropa_number} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" placeholder="Ej: 555" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Cant. Animales</label>
                  <input name="total_animals" type="number" required defaultValue={editingTropa?.total_animals} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Ej: 100" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Especie</label>
                  <select name="species" defaultValue={editingTropa?.species || 'Porcino'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                    <option value="Porcino">Porcino</option>
                    <option value="Jabalí">Jabalí</option>
                    <option value="Puma">Puma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Categoría</label>
                  <select name="category" defaultValue={editingTropa?.category || 'Gordo'} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white">
                    <option value="Lechón">Lechón</option>
                    <option value="Cachorro">Cachorro</option>
                    <option value="Gordo">Gordo</option>
                    <option value="Cerda">Cerda</option>
                    <option value="Padrillo">Padrillo</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  name="is_internal" 
                  id="is_internal"
                  defaultChecked={editingTropa?.is_internal === 1}
                  className="w-4 h-4 rounded border-white/10 bg-black/50 text-red-500 focus:ring-red-500/50" 
                />
                <label htmlFor="is_internal" className="text-xs font-bold text-zinc-300 uppercase tracking-widest cursor-pointer">Fábrica Propia / Análisis Interno</label>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => { setIsTropaModalOpen(false); setEditingTropa(null); }} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-2 rounded-xl transition-all">
                  {editingTropa ? 'Guardar Cambios' : 'Cargar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTempModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold text-white mb-6">Registrar Temperatura</h3>
            <form onSubmit={handleAddTemp} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Hora</label>
                  <input 
                    name="time" 
                    type="time" 
                    required 
                    defaultValue={format(new Date(), 'HH:mm')}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Baño María (°C)</label>
                  <input 
                    name="water_temp" 
                    type="number" 
                    step="0.1" 
                    required 
                    placeholder="45.0"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Cámara (°C)</label>
                <input 
                  name="chamber_temp" 
                  type="number" 
                  step="0.1" 
                  required 
                  placeholder="45.5"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                />
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setIsTempModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 py-2 rounded-xl transition-all">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex flex-col z-[60]">
          <header className="p-4 border-b border-white/10 flex items-center justify-between bg-[#151619]">
            <h3 className="text-lg font-bold text-white">{previewTitle}</h3>
            <div className="flex items-center gap-4">
              <a 
                href={pdfPreviewUrl} 
                download={`${previewTitle}.pdf`}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
              >
                <Download size={18} /> Descargar PDF
              </a>
              <button 
                onClick={() => {
                  URL.revokeObjectURL(pdfPreviewUrl);
                  setPdfPreviewUrl(null);
                }}
                className="text-zinc-400 hover:text-white p-2"
              >
                <X size={24} />
              </button>
            </div>
          </header>
          <div className="flex-1 bg-zinc-900 p-4">
            <iframe 
              src={pdfPreviewUrl} 
              className="w-full h-full rounded-xl border border-white/5 shadow-2xl"
              title="PDF Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

