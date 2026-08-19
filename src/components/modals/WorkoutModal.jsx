import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Dumbbell, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MUSCLE_GROUPS = [
  'Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen', 'Glúteos', 'Cardio'
];

const DAYS_OF_WEEK = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
];

export default function WorkoutModal({ isOpen, onClose, onWorkoutSaved, workoutToEdit }) {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Segunda-feira');

  const [selectedGroup, setSelectedGroup] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [exerciseBank, setExerciseBank] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);

  const [isAddingNewEx, setIsAddingNewEx] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExGroup, setNewExGroup] = useState('Peito');
  const [newExVideo, setNewExVideo] = useState('');
  const [creatingEx, setCreatingEx] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen, workoutToEdit]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const { data: studentsData, error: sErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');

      if (sErr) console.error('Erro ao buscar alunos:', sErr);
      setStudents(studentsData || []);

      if (studentsData && studentsData.length > 0 && !workoutToEdit) {
        setSelectedStudent(studentsData[0].id);
      }

      await loadExerciseBank();

      if (workoutToEdit) {
        setSelectedStudent(workoutToEdit.student_id || '');
        setDayOfWeek(workoutToEdit.day_of_week || 'Segunda-feira');
        
        if (workoutToEdit.workout_items) {
          const formattedItems = [...workoutToEdit.workout_items]
            .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            .map((item) => ({
              exercise_id: item.exercise_id,
              exercise_name: item.exercise_name,
              sets: item.sets || 4,
              reps: item.reps || '10-12',
              rest_time: item.rest_time || '60s'
            }));
          setSelectedExercises(formattedItems);
        }
      } else {
        setDayOfWeek('Segunda-feira');
        setSelectedExercises([]);
        setSelectedGroup('Todos');
        setIsAddingNewEx(false);
      }
    } catch (err) {
      console.error('Erro ao carregar dados da modal:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseBank = async () => {
    const { data: exData, error: eErr } = await supabase
      .from('exercises')
      .select('*')
      .order('name');

    if (eErr) console.error('Erro ao buscar banco de exercícios:', eErr);
    setExerciseBank(exData || []);
  };

  const handleCreateExerciseInBank = async (e) => {
    e.preventDefault();
    if (!newExName.trim()) return alert('Informe o nome do exercício.');

    try {
      setCreatingEx(true);
      const category = (newExGroup === 'Pernas' || newExGroup === 'Glúteos') ? 'Membros Inferiores' : 'Membros Superiores';

      const { data, error } = await supabase
        .from('exercises')
        .insert([
          {
            name: newExName.trim(),
            target_muscle_group: newExGroup,
            category: category,
            video_url: newExVideo.trim()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      alert(`Exercício "${newExName}" cadastrado com sucesso!`);
      setNewExName('');
      setNewExVideo('');
      setIsAddingNewEx(false);
      await loadExerciseBank();

      if (data) {
        handleAddExercise(data);
      }
    } catch (err) {
      alert('Erro ao cadastrar exercício: ' + err.message);
    } finally {
      setCreatingEx(false);
    }
  };

  const handleAddExercise = (exercise) => {
    const newItem = {
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      sets: 4,
      reps: '10-12',
      rest_time: '60s'
    };
    setSelectedExercises((prev) => [...prev, newItem]);
  };

  const handleRemoveExercise = (indexToRemove) => {
    setSelectedExercises((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUpdateItem = (index, field, value) => {
    setSelectedExercises((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveWorkout = async (e) => {
    e.preventDefault();

    if (!selectedStudent) return alert('Selecione um aluno.');
    if (selectedExercises.length === 0) return alert('Adicione pelo menos um exercício ao treino.');

    try {
      setSaving(true);
      let workoutId = workoutToEdit?.id;
      const workoutTitle = `Treino de ${dayOfWeek}`;

      if (workoutToEdit) {
        const { error: wError } = await supabase
          .from('workouts')
          .update({
            student_id: selectedStudent,
            day_of_week: dayOfWeek,
            title: workoutTitle
          })
          .eq('id', workoutId);

        if (wError) throw wError;
        await supabase.from('workout_items').delete().eq('workout_id', workoutId);
      } else {
        const { data: newWorkout, error: wError } = await supabase
          .from('workouts')
          .insert([
            {
              student_id: selectedStudent,
              day_of_week: dayOfWeek,
              title: workoutTitle
            }
          ])
          .select()
          .single();

        if (wError) throw wError;
        workoutId = newWorkout.id;
      }

      // Incluído order_index para preservar a quantidade exata e ordem dos exercícios
      const itemsToInsert = selectedExercises.map((ex, index) => ({
        workout_id: workoutId,
        exercise_id: ex.exercise_id || null,
        exercise_name: ex.exercise_name,
        sets: Number(ex.sets) || 4,
        reps: String(ex.reps),
        rest_time: String(ex.rest_time),
        order_index: index
      }));

      const { error: iError } = await supabase.from('workout_items').insert(itemsToInsert);
      if (iError) throw iError;

      alert('Treino salvo com sucesso!');
      onWorkoutSaved();
      onClose();
    } catch (err) {
      alert('Erro ao salvar treino: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredExercises = exerciseBank.filter((ex) => {
    const group = ex.target_muscle_group || ex.category || '';
    const matchesGroup = selectedGroup === 'Todos' || group.toLowerCase() === selectedGroup.toLowerCase();
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 pl-0 lg:pl-64 z-50 transition-all">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.6);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #10b981;
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Topo / Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-950 shrink-0">
          <div className="flex items-center gap-3 text-emerald-400 font-bold text-xl">
            <Dumbbell size={24} />
            <span>{workoutToEdit ? 'Editar Treino do Aluno' : 'Montar Treino do Aluno'}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer hover:bg-slate-800">
            <X size={24} />
          </button>
        </div>

        {/* Corpo Unificado */}
        <div className="p-5 sm:p-6 flex-1 flex flex-col gap-5 overflow-hidden text-sm min-h-0">
          
          {/* Seletor de Aluno e Dia da Semana */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800/80 shrink-0">
            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold text-xs sm:text-sm">Aluno:</label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer text-sm"
              >
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name || st.email}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1.5 font-semibold text-xs sm:text-sm">Dia da Semana:</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-medium focus:outline-none focus:border-emerald-500 cursor-pointer text-sm"
              >
                {DAYS_OF_WEEK.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid Principal Dividido em 50% / 50% */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
            
            {/* ESQUERDA: Banco de Exercícios */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800/80 flex flex-col gap-3.5 min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <h4 className="font-bold text-white text-base">Banco de Exercícios</h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNewEx(!isAddingNewEx)}
                  className="px-3.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={15} /> {isAddingNewEx ? 'Fechar' : 'Novo Exercício'}
                </button>
              </div>

              {/* Form de Novo Exercício */}
              {isAddingNewEx && (
                <form onSubmit={handleCreateExerciseInBank} className="bg-slate-900 border border-emerald-500/40 p-3.5 rounded-xl space-y-3 text-xs shrink-0">
                  <p className="font-bold text-emerald-400 border-b border-slate-800 pb-1.5 text-xs">Novo Exercício na Biblioteca:</p>
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Nome do Exercício"
                      value={newExName}
                      onChange={(e) => setNewExName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newExGroup}
                      onChange={(e) => setNewExGroup(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
                    >
                      {MUSCLE_GROUPS.filter(g => g !== 'Todos').map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <input
                      type="url"
                      placeholder="Vídeo (opcional)"
                      value={newExVideo}
                      onChange={(e) => setNewExVideo(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500 text-xs"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewEx(false)}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={creatingEx}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-1 transition"
                    >
                      <Check size={14} /> {creatingEx ? 'Salvando...' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              )}

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
                <select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-emerald-400 font-semibold focus:outline-none focus:border-emerald-500 cursor-pointer text-xs sm:text-sm"
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group} className="text-white bg-slate-900">
                      {group === 'Todos' ? '🏋️ Todos Grupos' : `💪 ${group}`}
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <Search className="absolute left-3 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="Buscar nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Lista do Banco */}
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-2 custom-scrollbar min-h-0">
                {filteredExercises.length === 0 ? (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    <p>Nenhum exercício encontrado.</p>
                  </div>
                ) : (
                  filteredExercises.map((ex) => (
                    <div
                      key={ex.id}
                      className="bg-slate-900 border border-slate-800/80 hover:border-emerald-500/50 p-3 rounded-xl flex justify-between items-center transition gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-white text-sm leading-tight truncate">{ex.name}</p>
                        <span className="text-xs bg-slate-800/80 text-slate-400 px-2.5 py-0.5 rounded-md inline-block mt-1 font-medium">
                          {ex.target_muscle_group || ex.category || 'Geral'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddExercise(ex)}
                        className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition shrink-0"
                      >
                        <Plus size={16} /> Adicionar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* DIREITA: Exercícios Selecionados do Treino */}
            <div className="bg-slate-950 p-4 sm:p-5 rounded-xl border border-slate-800/80 flex flex-col gap-3.5 min-h-0">
              <h4 className="font-bold text-white text-base flex justify-between items-center shrink-0">
                <span>Exercícios do Treino</span>
                <span className="text-emerald-400 bg-emerald-500/10 px-3 py-0.5 rounded-full text-xs font-semibold">
                  {selectedExercises.length} {selectedExercises.length === 1 ? 'exercício' : 'exercícios'}
                </span>
              </h4>

              {/* Lista dos Exercícios Selecionados */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar min-h-0">
                {selectedExercises.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-slate-800/80 rounded-xl text-slate-500 p-6 text-center">
                    <Dumbbell size={36} className="text-slate-700 mb-2" />
                    <p className="text-sm font-semibold">Nenhum exercício adicionado a este treino.</p>
                    <p className="text-xs text-slate-600 mt-1">Escolha exercícios no painel ao lado para montar a ficha.</p>
                  </div>
                ) : (
                  selectedExercises.map((item, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-800/80 p-3.5 rounded-xl space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">
                          {index + 1}. {item.exercise_name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveExercise(index)}
                          className="text-slate-500 hover:text-red-400 p-1 cursor-pointer transition rounded-lg hover:bg-slate-800"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs sm:text-sm">
                        <div>
                          <label className="text-slate-400 block mb-1 text-xs font-medium">Séries:</label>
                          <input
                            type="number"
                            min="1"
                            value={item.sets}
                            onChange={(e) => handleUpdateItem(index, 'sets', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center font-bold focus:border-emerald-500 focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 text-xs font-medium">Repetições:</label>
                          <input
                            type="text"
                            value={item.reps}
                            onChange={(e) => handleUpdateItem(index, 'reps', e.target.value)}
                            placeholder="Ex: 10-12"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center font-bold focus:border-emerald-500 focus:outline-none text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 text-xs font-medium">Descanso:</label>
                          <input
                            type="text"
                            value={item.rest_time}
                            onChange={(e) => handleUpdateItem(index, 'rest_time', e.target.value)}
                            placeholder="Ex: 60s"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-center font-bold focus:border-emerald-500 focus:outline-none text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Rodapé Fixo */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveWorkout}
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition cursor-pointer text-sm"
          >
            {saving ? 'Salvando...' : 'Salvar Treino'}
          </button>
        </div>
      </div>
    </div>
  );
}