import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Dumbbell, Search } from 'lucide-react';

const DAYS_OF_WEEK = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
  'Domingo',
  'Treino A',
  'Treino B',
  'Treino C',
  'Treino D',
  'Treino E'
];

export default function WorkoutModal({
  isOpen,
  onClose,
  students = [],
  customExercises = [],
  workoutToEdit = null,
  onSave
}) {
  const [studentId, setStudentId] = useState('');
  const [workoutName, setWorkoutName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Segunda-feira');
  const [notes, setNotes] = useState('');
  const [exercisesList, setExercisesList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtro de busca
  const [searchQuery, setSearchQuery] = useState('');

  // Filtra exercícios do banco
  const filteredExercises = customExercises.filter((ex) => {
    const name = typeof ex === 'string' ? ex : ex.name || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  useEffect(() => {
    if (isOpen) {
      if (workoutToEdit) {
        setStudentId(workoutToEdit.student_id || workoutToEdit.studentId || '');
        setWorkoutName(workoutToEdit.name || workoutToEdit.title || '');
        setDayOfWeek(workoutToEdit.day_of_week || workoutToEdit.day || 'Segunda-feira');
        setNotes(workoutToEdit.notes || workoutToEdit.description || '');

        const formattedExercises = (workoutToEdit.exercises || workoutToEdit.items || []).map((item, idx) => ({
          id: item.id || `edit-${idx}-${Date.now()}`,
          name: item.name || item.custom_name || item.exercise_name || 'Exercício sem nome',
          sets: item.sets || '3',
          reps: item.reps || '10-12',
          rest: item.rest || '60s'
        }));

        setExercisesList(formattedExercises);
      } else {
        setStudentId(students.length > 0 ? students[0].id : '');
        setWorkoutName('Treino A');
        setDayOfWeek('Segunda-feira');
        setNotes('');
        setExercisesList([]);
      }
      setSearchQuery('');
    }
  }, [workoutToEdit, isOpen, students]);

  if (!isOpen) return null;

  const handleAddExercise = (exercise) => {
    const name = typeof exercise === 'string' ? exercise : exercise.name;
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      name: name,
      sets: '3',
      reps: '10-12',
      rest: '60s'
    };

    setExercisesList([...exercisesList, newItem]);
  };

  const handleRemoveExercise = (index) => {
    setExercisesList(exercisesList.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...exercisesList];
    updated[index][field] = value;
    setExercisesList(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!studentId) {
      alert('Selecione um aluno!');
      return;
    }

    if (!workoutName.trim()) {
      alert('Digite o nome do treino!');
      return;
    }

    if (exercisesList.length === 0) {
      alert('Adicione pelo menos um exercício à ficha de treino!');
      return;
    }

    setIsSubmitting(true);

    const workoutPayload = {
      student_id: studentId,
      name: workoutName.trim(),
      title: workoutName.trim(),
      day_of_week: dayOfWeek,
      notes: notes ? notes.trim() : null,
      exercises: exercisesList
    };

    if (workoutToEdit && workoutToEdit.id) {
      workoutPayload.id = workoutToEdit.id;
    }

    try {
      if (onSave) {
        await onSave(workoutPayload);
      }
      onClose();
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
      alert('Erro ao salvar o treino: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-2 sm:p-4">
      {/* Forçado a ocupar 96% da largura e 94% da altura da tela */}
      <div className="relative w-full max-w-[96vw] h-[94vh] bg-[#090e1a] border-2 border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Cabeçalho Gigante */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-800 bg-[#050811] shrink-0">
          <h3 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-4 tracking-wide">
            <Dumbbell className="text-emerald-400" size={42} />
            {workoutToEdit ? 'Editar Treino' : 'Montar Treino'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-3 rounded-2xl transition hover:bg-slate-800/80"
            type="button"
          >
            <X size={38} />
          </button>
        </div>

        {/* Formulario ocupando todo o espaço */}
        <form onSubmit={handleSubmit} className="p-8 flex flex-col flex-1 overflow-hidden space-y-6">
          
          {/* Topo - Inputs Gigantes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div>
              <label className="block text-xl font-black text-slate-200 mb-3 uppercase tracking-wider">
                Selecione o Aluno
              </label>
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full bg-[#03050a] border-2 border-slate-700/90 rounded-2xl px-6 py-4 text-white font-bold text-2xl focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                required
              >
                <option value="" disabled className="text-xl">Sem vínculo</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id} className="text-xl py-2">
                    {st.name || st.full_name || 'Aluno sem nome'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xl font-black text-slate-200 mb-3 uppercase tracking-wider">
                Título do Treino
              </label>
              <input
                type="text"
                placeholder="Ex: Treino A"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full bg-[#03050a] border-2 border-slate-700/90 rounded-2xl px-6 py-4 text-white font-bold text-2xl focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xl font-black text-slate-200 mb-3 uppercase tracking-wider">
                Dia / Agrupamento
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-[#03050a] border-2 border-slate-700/90 rounded-2xl px-6 py-4 text-white font-bold text-2xl focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day} className="text-xl py-2">
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Área Dupla Dividida */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
            
            {/* ESQUERDA: Exercícios do Banco (5 colunas) */}
            <div className="lg:col-span-5 flex flex-col h-full space-y-4 min-h-0">
              <label className="text-xl font-black uppercase tracking-wider text-emerald-400 shrink-0">
                1. ESCOLHA OS EXERCÍCIOS
              </label>

              {/* Busca */}
              <div className="relative shrink-0">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={28} />
                <input
                  type="text"
                  placeholder="Buscar do banco..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#03050a] border-2 border-slate-700/90 rounded-2xl pl-16 pr-6 py-4 text-white text-2xl font-semibold focus:ring-4 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Lista Scrollável */}
              <div className="space-y-4 flex-1 overflow-y-auto pr-3">
                {filteredExercises.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 bg-[#03050a] rounded-2xl border-2 border-slate-800 text-2xl font-bold">
                    Nenhum exercício encontrado.
                  </div>
                ) : (
                  filteredExercises.map((ex, idx) => {
                    const exName = typeof ex === 'string' ? ex : ex.name;
                    return (
                      <div
                        key={idx}
                        className="bg-[#03050a] border-2 border-slate-800 hover:border-slate-600 p-6 rounded-2xl flex items-center justify-between gap-4 transition shadow-lg"
                      >
                        <span className="font-black text-white text-2xl tracking-wide">
                          {exName}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddExercise(ex)}
                          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-lg flex items-center gap-2 transition shrink-0 shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          <Plus size={26} /> Adicionar
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DIREITA: Ficha de Treino Ocupando Espaço Maior (7 colunas) */}
            <div className="lg:col-span-7 flex flex-col h-full space-y-4 min-h-0">
              <label className="text-xl font-black uppercase tracking-wider text-emerald-400 shrink-0">
                2. FICHA DO TREINO ({exercisesList.length} {exercisesList.length === 1 ? 'EXERCÍCIO' : 'EXERCÍCIOS'})
              </label>

              {/* Card Container da Ficha */}
              <div className="bg-[#03050a]/90 border-2 border-dashed border-slate-800 rounded-3xl p-6 flex-1 overflow-y-auto flex flex-col min-h-0">
                {exercisesList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-400">
                    <Dumbbell className="text-slate-800 mb-6" size={80} />
                    <p className="font-black text-slate-200 text-3xl mb-3">Nenhum exercício na ficha</p>
                    <p className="text-2xl text-slate-400 font-medium">Clique no botão "+ Adicionar" da lista ao lado para colocar exercícios aqui.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {exercisesList.map((item, idx) => (
                      <div
                        key={item.id || idx}
                        className="bg-[#060a14] p-6 rounded-2xl border-2 border-slate-700 flex flex-col gap-5 shadow-2xl"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-black text-white text-3xl">
                            {idx + 1}. {item.name}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(idx)}
                            className="text-slate-400 hover:text-red-400 p-3 transition rounded-xl hover:bg-slate-800"
                            title="Remover exercício"
                          >
                            <Trash2 size={32} />
                          </button>
                        </div>

                        {/* Campos de Séries, Reps e Descanso bem destacados */}
                        <div className="grid grid-cols-3 gap-6 bg-[#03050a] p-5 rounded-2xl border border-slate-800">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-400 uppercase mb-2 tracking-widest">Séries</span>
                            <input
                              type="text"
                              value={item.sets}
                              onChange={(e) => handleUpdateItem(idx, 'sets', e.target.value)}
                              className="w-full bg-[#090e1a] border-2 border-slate-700 rounded-xl py-3 px-3 text-center text-white font-black text-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-400 uppercase mb-2 tracking-widest">Reps</span>
                            <input
                              type="text"
                              value={item.reps}
                              onChange={(e) => handleUpdateItem(idx, 'reps', e.target.value)}
                              className="w-full bg-[#090e1a] border-2 border-slate-700 rounded-xl py-3 px-3 text-center text-white font-black text-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>

                          <div className="flex flex-col items-center">
                            <span className="text-sm font-black text-slate-400 uppercase mb-2 tracking-widest">Descanso</span>
                            <input
                              type="text"
                              value={item.rest}
                              onChange={(e) => handleUpdateItem(idx, 'rest', e.target.value)}
                              className="w-full bg-[#090e1a] border-2 border-slate-700 rounded-xl py-3 px-3 text-center text-white font-black text-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Rodapé Gigante */}
          <div className="flex justify-end gap-6 pt-4 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-10 py-5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xl font-bold rounded-2xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-12 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-800 text-slate-950 text-2xl font-black rounded-2xl transition shadow-xl shadow-emerald-500/20 active:scale-95"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Treino'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}