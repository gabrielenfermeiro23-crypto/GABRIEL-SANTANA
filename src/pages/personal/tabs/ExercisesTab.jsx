import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Dumbbell, Search, Loader2, Eye, X } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Ajuste o caminho caso necessário

const DEFAULT_EXERCISES = [
  { id: 'def-1', name: 'Supino Reto com Barra', category: 'Peitoral' },
  { id: 'def-2', name: 'Supino Inclinado com Halteres', category: 'Peitoral' },
  { id: 'def-3', name: 'Crossover na Polia High-to-Low', category: 'Peitoral' },
  { id: 'def-4', name: 'Peck Deck / Voador', category: 'Peitoral' },
  { id: 'def-5', name: 'Puxada Frontal Pulldown', category: 'Costas' },
  { id: 'def-6', name: 'Remada Curvada com Barra', category: 'Costas' },
  { id: 'def-7', name: 'Remada Baixa com Triângulo', category: 'Costas' },
  { id: 'def-8', name: 'Pulldown na Polia Alta', category: 'Costas' },
  { id: 'def-9', name: 'Agachamento Livre com Barra', category: 'Pernas' },
  { id: 'def-10', name: 'Leg Press 45°', category: 'Pernas' },
  { id: 'def-11', name: 'Cadeira Extensora', category: 'Pernas' },
  { id: 'def-12', name: 'Mesa Flexora', category: 'Pernas' },
  { id: 'def-13', name: 'Stiff com Halteres', category: 'Pernas' },
  { id: 'def-14', name: 'Gêmeos Sentado (Panturrilha)', category: 'Pernas' },
  { id: 'def-15', name: 'Desenvolvimento com Halteres', category: 'Ombros' },
  { id: 'def-16', name: 'Elevação Lateral', category: 'Ombros' },
  { id: 'def-17', name: 'Elevação Frontal na Polia', category: 'Ombros' },
  { id: 'def-18', name: 'Rosca Direta com Barra W', category: 'Bíceps' },
  { id: 'def-19', name: 'Rosca Alternada no Banco Inclinado', category: 'Bíceps' },
  { id: 'def-20', name: 'Tríceps Corda na Polia', category: 'Tríceps' },
  { id: 'def-21', name: 'Tríceps Testa com Barra W', category: 'Tríceps' },
  { id: 'def-22', name: 'Abdominal Supra na Prancha', category: 'Core' },
  { id: 'def-23', name: 'Prancha Ventral Isométrica', category: 'Core' }
];

// Componente individual de Imagem para tratar erros de URL quebrada e manter leveza
function ExerciseImage({ src, alt }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="flex flex-col items-center gap-1.5 text-slate-600">
        <Dumbbell size={28} />
        <span className="text-[10px] font-bold uppercase tracking-wider">Sem GIF</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      loading="lazy"
    />
  );
}

export default function ExercisesTab() {
  const [dbExercises, setDbExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Peitoral');
  const [previewGif, setPreviewGif] = useState(null);

  const categoriesList = [
    'Todos',
    'Peitoral',
    'Costas',
    'Pernas',
    'Ombros',
    'Bíceps',
    'Tríceps',
    'Core',
    'Glúteos',
    'Antebraço',
    'Trapézio',
    'Panturrilhas',
    'Cardio'
  ];

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      if (data) {
        setDbExercises(data);
      }
    } catch (error) {
      console.error('Erro ao buscar exercícios do Supabase:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Unifica dando prioridade absoluta aos registros do banco (que contêm as URLs do Storage)
  const allExercises = [...dbExercises];
  DEFAULT_EXERCISES.forEach((def) => {
    const exists = allExercises.some(
      (item) => item.name.toLowerCase() === def.name.toLowerCase()
    );
    if (!exists) {
      allExercises.push(def);
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      const newExercisePayload = {
        name: newName.trim(),
        category: newCategory,
        created_by: user ? user.id : null
      };

      const { data, error } = await supabase
        .from('exercises')
        .insert([newExercisePayload])
        .select();

      if (error) throw error;

      if (data && data.length > 0) {
        setDbExercises((prev) => [...prev, data[0]]);
      }

      setNewName('');
    } catch (error) {
      console.error('Erro ao cadastrar exercício:', error.message);
      alert('Erro ao cadastrar exercício: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (String(id).startsWith('def-')) return;

    if (!window.confirm('Tem certeza de que deseja remover este exercício?')) return;

    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDbExercises((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error('Erro ao deletar exercício:', error.message);
      alert('Erro ao excluir exercício: ' + error.message);
    }
  };

  const filtered = allExercises.filter((ex) => {
    const matchName = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat =
      selectedCategory === 'Todos' ||
      ex.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchName && matchCat;
  });

  const groupedExercises = filtered.reduce((acc, ex) => {
    const cat = ex.category || 'Geral';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Dumbbell className="text-cyan-400" />
            Banco de Exercícios
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Organizado por grupos musculares com GIFs de demonstração em tempo real.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-3 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Form para Adicionar */}
      <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3 items-center">
        <input
          type="text"
          placeholder="Nome do novo exercício customizado..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500"
          required
        />
        <select
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          className="w-full sm:w-48 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-cyan-500"
        >
          {categoriesList.filter(c => c !== 'Todos').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
          {submitting ? 'Salvando...' : 'Cadastrar'}
        </button>
      </form>

      {/* Pills de Categorias */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categoriesList.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900/80 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Carregando State */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 flex justify-center items-center gap-2">
          <Loader2 className="animate-spin text-cyan-400" size={24} />
          <span>Carregando exercícios do banco...</span>
        </div>
      ) : Object.keys(groupedExercises).length === 0 ? (
        <div className="text-center py-12 text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
          Nenhum exercício encontrado.
        </div>
      ) : (
        Object.entries(groupedExercises).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-md font-bold text-cyan-400 uppercase tracking-wider">{category}</h3>
              <div className="h-px bg-slate-800 flex-1" />
              <span className="text-xs text-slate-500 font-semibold">{items.length} exercícios</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((ex) => (
                <div 
                  key={ex.id} 
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-3 flex flex-col justify-between transition group shadow-lg"
                >
                  {/* GIF do Exercício Otimizado */}
                  <div 
                    onClick={() => ex.gif_url && setPreviewGif(ex)}
                    className="relative w-full h-40 bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-800 flex items-center justify-center cursor-pointer group-hover:opacity-95 transition"
                  >
                    <ExerciseImage src={ex.gif_url} alt={ex.name} />

                    {ex.gif_url && (
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-bold">
                        <Eye size={16} /> Ver Animação
                      </div>
                    )}
                  </div>

                  {/* Nome e Ação */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-sm line-clamp-1">{ex.name}</span>
                    
                    {!String(ex.id).startsWith('def-') && (
                      <button 
                        onClick={() => handleDeleteExercise(ex.id)} 
                        title="Excluir exercício"
                        className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Modal de Previsualização do GIF */}
      {previewGif && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl space-y-4">
            <button
              onClick={() => setPreviewGif(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/50 transition cursor-pointer"
            >
              <X size={20} />
            </button>
            
            <div>
              <span className="text-cyan-400 font-bold uppercase text-xs tracking-wider">
                {previewGif.category}
              </span>
              <h3 className="text-xl font-extrabold text-white">{previewGif.name}</h3>
            </div>

            <div className="w-full h-72 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={previewGif.gif_url}
                alt={previewGif.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}