import React, { useEffect, useState } from 'react';
import { Plus, Search, Settings, Variable, Calculator, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Technique } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

export default function Techniques() {
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variables, setVariables] = useState<{ name: string; unit: string; type: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fisicoquímica',
    method: '',
    formula: '',
    notes: ''
  });

  const fetchTechniques = () => {
    fetch('/api/techniques')
      .then(res => res.json())
      .then(setTechniques);
  };

  useEffect(fetchTechniques, []);

  const addVariable = () => {
    setVariables([...variables, { name: '', unit: '', type: 'variable' }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleAiImport = async () => {
    if (!aiInput.trim()) return;
    setIsAiLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analiza la siguiente descripción de una técnica analítica de laboratorio y extrae la información en formato JSON. 
        Descripción: "${aiInput}"
        
        El JSON debe tener esta estructura exacta:
        {
          "name": "Nombre de la técnica",
          "method": "Método o norma",
          "category": "Fisicoquímica" | "Microbiología" | "Sensorial" | "Cromatografía",
          "formula": "Fórmula matemática usando los nombres de las variables",
          "variables": [
            { "name": "NombreCortoVariable", "unit": "unidad", "type": "variable" | "constant" }
          ],
          "notes": "Breve descripción adicional"
        }`,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '{}');
      setFormData({
        name: result.name || '',
        category: result.category || 'Fisicoquímica',
        method: result.method || '',
        formula: result.formula || '',
        notes: result.notes || ''
      });
      setVariables(result.variables || []);
      setAiInput('');
    } catch (error) {
      console.error("Error con la IA:", error);
      alert("No se pudo procesar el texto. Intente ser más específico.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...formData,
      variables: JSON.stringify(variables),
      status: 'active'
    };

    const res = await fetch('/api/techniques', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      fetchTechniques();
      setIsModalOpen(false);
      setVariables([]);
      setFormData({ name: '', category: 'Fisicoquímica', method: '', formula: '', notes: '' });
    }
  };

  return (
    <div className="p-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Técnicas Analíticas</h2>
          <p className="text-zinc-500">Configuración de parámetros y fórmulas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus size={20} />
          Nueva Técnica
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {techniques.map(t => (
          <div key={t.id} className="bg-[#151619] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t.category}</span>
                <h3 className="text-xl font-bold text-white">{t.name}</h3>
              </div>
              <div className="p-2 bg-white/5 rounded-lg">
                <Settings size={18} className="text-zinc-500" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Calculator size={14} className="text-zinc-600" />
                <span className="font-mono bg-black/30 px-2 py-1 rounded border border-white/5">Fórmula: {t.formula}</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {JSON.parse(t.variables || '[]').map((v: any, i: number) => (
                  <span key={i} className="text-[10px] bg-zinc-500/10 text-zinc-400 px-2 py-1 rounded-full border border-white/5">
                    {v.name} ({v.unit})
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Método: <span className="text-zinc-300">{t.method}</span></span>
              <button className="text-emerald-400 font-bold hover:underline">Editar Configuración</button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#151619] border border-white/10 rounded-2xl w-full max-w-5xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Configurar Nueva Técnica</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white">Cerrar</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* AI Import Section */}
              <div className="lg:col-span-1 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <Sparkles size={18} />
                  <h4 className="text-sm font-bold uppercase tracking-widest">Asistente IA</h4>
                </div>
                <p className="text-xs text-zinc-400">Pega la descripción de tu libro de técnicas y la IA rellenará el formulario por ti.</p>
                <textarea 
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white h-40 focus:border-emerald-500/50 outline-none"
                  placeholder="Ej: Determinación de proteínas por Kjeldahl. La fórmula es (V*F*0.014*6.25*100)/P donde V es ml de ácido, F es factor y P es peso..."
                />
                <button 
                  onClick={handleAiImport}
                  disabled={isAiLoading || !aiInput.trim()}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  Procesar con IA
                </button>
              </div>

              {/* Manual Form Section */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Nombre del Parámetro</label>
                      <input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                        placeholder="Ej: % Proteínas" 
                      />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Categoría</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        required 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white"
                      >
                        <option value="Fisicoquímica">Fisicoquímica</option>
                        <option value="Microbiología">Microbiología</option>
                        <option value="Sensorial">Sensorial</option>
                        <option value="Cromatografía">Cromatografía</option>
                      </select>
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Método / Norma</label>
                      <input 
                        value={formData.method}
                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                        required 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white" 
                        placeholder="Ej: Kjeldahl, AOAC 981.10" 
                      />
                    </div>
                    <div className="col-span-2 lg:col-span-1">
                      <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Fórmula Matemática</label>
                      <input 
                        value={formData.formula}
                        onChange={(e) => setFormData({...formData, formula: e.target.value})}
                        required 
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono" 
                        placeholder="Ej: (V * F * 0.014 * 6.25) / P" 
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Variables Requeridas</label>
                      <button type="button" onClick={addVariable} className="text-emerald-400 text-xs font-bold flex items-center gap-1 hover:text-emerald-300">
                        <Plus size={14} /> Añadir Variable
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {variables.map((v, i) => (
                        <div key={i} className="grid grid-cols-4 gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                          <div>
                            <label className="block text-[10px] text-zinc-600 uppercase mb-1">Nombre</label>
                            <input 
                              value={v.name} 
                              onChange={(e) => {
                                const newVars = [...variables];
                                newVars[i].name = e.target.value;
                                setVariables(newVars);
                              }}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" 
                              placeholder="Ej: V"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-600 uppercase mb-1">Unidad</label>
                            <input 
                              value={v.unit} 
                              onChange={(e) => {
                                const newVars = [...variables];
                                newVars[i].unit = e.target.value;
                                setVariables(newVars);
                              }}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white" 
                              placeholder="Ej: ml"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-zinc-600 uppercase mb-1">Tipo</label>
                            <select 
                              value={v.type} 
                              onChange={(e) => {
                                const newVars = [...variables];
                                newVars[i].type = e.target.value;
                                setVariables(newVars);
                              }}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
                            >
                              <option value="variable">Variable</option>
                              <option value="constant">Constante</option>
                            </select>
                          </div>
                          <button type="button" onClick={() => removeVariable(i)} className="p-2 text-zinc-600 hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold px-8 py-2 rounded-xl transition-all">Guardar Técnica</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

