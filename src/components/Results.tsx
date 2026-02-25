import React, { useEffect, useState } from 'react';
import { Search, Calculator, CheckCircle2, AlertCircle, Save, Beaker } from 'lucide-react';
import { Analysis, Sample } from '../types';
import { evaluate } from 'mathjs';
import { useAuthStore } from '../store/authStore';

export default function Results() {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [inputValues, setInputValues] = useState<Record<number, Record<string, number>>>({});
  const { user } = useAuthStore();

  useEffect(() => {
    fetch('/api/samples-detailed')
      .then(res => res.json())
      .then(data => setSamples(data.filter((s: Sample) => s.status !== 'validated')));
  }, []);

  const fetchAnalyses = (sampleId: number) => {
    fetch(`/api/sample-analysis/${sampleId}`)
      .then(res => res.json())
      .then(data => {
        setAnalyses(data);
        const initialInputs: Record<number, Record<string, number>> = {};
        data.forEach((a: Analysis) => {
          if (a.variables_data) {
            initialInputs[a.id] = JSON.parse(a.variables_data);
          } else {
            const vars = JSON.parse(a.variables || '[]');
            initialInputs[a.id] = vars.reduce((acc: any, v: any) => ({ ...acc, [v.name]: 0 }), {});
          }
        });
        setInputValues(initialInputs);
      });
  };

  const calculateResult = (analysis: Analysis) => {
    try {
      const scope: Record<string, number> = { ...(inputValues[analysis.id] || {}) };
      
      // Add config values (factors/constants) to scope
      if (analysis.config) {
        try {
          const configValues = JSON.parse(analysis.config);
          if (Array.isArray(configValues)) {
            configValues.forEach((c: any) => {
              if (c.key) {
                scope[c.key] = parseFloat(c.value) || 0;
              }
            });
          }
        } catch (e) {
          console.error("Error parsing analysis config:", e);
        }
      }

      const result = evaluate(analysis.formula || '0', scope);
      return Number(result.toFixed(4));
    } catch (e) {
      return 0;
    }
  };

  const handleSaveResult = async (analysis: Analysis) => {
    const result = calculateResult(analysis);
    const res = await fetch(`/api/analysis-result/${analysis.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result_value: result,
        variables_data: inputValues[analysis.id],
        status: 'completed',
        analyst_id: user?.id
      }),
    });

    if (res.ok) {
      fetchAnalyses(selectedSample!.id);
      alert('Resultado guardado correctamente');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-white tracking-tight">Carga de Resultados</h2>
        <p className="text-zinc-500">Ingreso de variables y cálculo automático</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Muestras Pendientes</h3>
          <div className="bg-[#151619] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
            {samples.map(sample => (
              <button
                key={sample.id}
                onClick={() => { setSelectedSample(sample); fetchAnalyses(sample.id); }}
                className={`w-full text-left p-4 hover:bg-white/5 transition-all ${selectedSample?.id === sample.id ? 'bg-emerald-500/5 border-l-2 border-emerald-500' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-mono text-emerald-400 font-bold text-sm">{sample.code}</span>
                  <span className="text-[10px] text-zinc-500">{sample.type}</span>
                </div>
                <p className="text-sm font-medium text-white truncate">
                  {sample.is_internal ? 'Análisis Interno' : (sample.customer_name || 'Sin Cliente')}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedSample ? (
            <>
              <div className="bg-[#151619] border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Beaker className="text-emerald-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Análisis para {selectedSample.code}</h3>
                    <p className="text-sm text-zinc-500">{selectedSample.description}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  {analyses.map(analysis => (
                    <div key={analysis.id} className="bg-black/20 border border-white/5 rounded-2xl p-6 space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">{analysis.technique_name}</h4>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${analysis.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
                          {analysis.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {JSON.parse(analysis.variables || '[]').map((v: any) => (
                          <div key={v.name}>
                            <label className="block text-[10px] text-zinc-500 uppercase font-bold mb-1">{v.name} ({v.unit})</label>
                            <input
                              type="number"
                              value={inputValues[analysis.id]?.[v.name] || 0}
                              onChange={(e) => {
                                setInputValues({
                                  ...inputValues,
                                  [analysis.id]: {
                                    ...inputValues[analysis.id],
                                    [v.name]: parseFloat(e.target.value) || 0
                                  }
                                });
                              }}
                              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:border-emerald-500/50 outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                          <div className="text-zinc-500 text-xs font-mono">Fórmula: {analysis.formula}</div>
                          <div className="text-white font-bold text-xl">
                            Resultado: <span className="text-emerald-400">{calculateResult(analysis)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleSaveResult(analysis)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
                        >
                          <Save size={18} />
                          Guardar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 bg-[#151619] border border-dashed border-white/10 rounded-2xl p-12">
              <AlertCircle size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium">Seleccione una muestra para cargar resultados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
