import React, { useState, useEffect } from 'react';
import { Plus, Search, Video, Trash2, Dumbbell } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Cardio'
];

export default function ExercisesTab() {
  const [exercises, setExercises] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [targetGroup, setTargetGroup] = useState('Peito');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('exercises').select('*').order('name');
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Erro ao carregar exercícios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExercise = async (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Informe o nome do exercício.');

    try {
      setLoading(true);
      const { error } = await supabase.from('exercises').insert([
        {
          name,
          target_muscle_group: targetGroup,
          category: targetGroup === 'Pernas' || targetGroup === 'Glúteos' ? 'Membros Inferiores' : 'Membros Superiores',
          video_url: videoUrl
        }
      ]);

      if (error) throw error;

      alert('Exercício cadastrado com sucesso!');
      setName('');
      setVideoUrl('');
      setIsModalOpen(false);
      loadExercises();
    } catch (err) {
      alert('Erro ao cadastrar exercício: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!confirm('Deseja realmente excluir este exercício?')) return;

    try {
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;
      loadExercises();
    } catch (err) {
      alert('Erro ao deletar exercício: ' + err.message);
    }
  };

  const filteredExercises = exercises.filter((ex) => {
    const muscle = ex.target_muscle_group || ex.category || '';
    const matchesCategory = selectedCategory === 'Todos' || muscle.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-xl text-emerald-400">
            <Dumbbell size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Biblioteca de Exercícios</h2>
            <p className="text-xs text-slate-400">Gerencie a lista total de exercícios e seus links explicativos.</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
        >
          <Plus size={16} /> Cadastrar Exercício
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {['Todos', ...MUSCLE_GROUPS].map((group) => (
            <button
              key={group}
              onClick={() => setSelectedCategory(group)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                selectedCategory === group
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 text-xs">Carregando exercícios...</div>
      ) : filteredExercises.length === 0 ? (
        <div className="text-center py-12 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          Nenhum exercício encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExercises.map((ex) => (
            <div key={ex.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
              <div>
                <h4 className="text-sm font-bold text-white">{ex.name}</h4>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full inline-block mt-1">
                  {ex.target_muscle_group || ex.category || 'Geral'}
                </span>
                
                {ex.video_url && (
                  <a
                    href={ex.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[11px] text-red-400 hover:underline mt-2 font-medium"
                  >
                    <Video size={14} /> Demonstrativo em Vídeo
                  </a>
                )}
              </div>

              <button
                onClick={() => handleDeleteExercise(ex.id)}
                className="text-slate-500 hover:text-red-400 p-2 transition cursor-pointer"
                title="Excluir exercício"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Cadastrar Novo Exercício</h3>

            <form onSubmit={handleCreateExercise} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Nome do Exercício:</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Tríceps Testa na Polia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Grupo Muscular:</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g} className="bg-slate-900 text-white">{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Link do Vídeo Demonstrativo (opcional):</label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 rounded-xl font-bold hover:bg-emerald-400 transition cursor-pointer"
                >
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}