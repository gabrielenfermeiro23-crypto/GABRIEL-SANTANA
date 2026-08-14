import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Edit, Search, X, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; // Ajuste o caminho de importação se necessário

export default function WorkoutPlanTab() {
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [availableExercises, setAvailableExercises] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados do Formulário de Treino
  const [editingWorkoutId, setEditingWorkoutId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('Segunda-feira');
  const [selectedExercises, setSelectedExercises] = useState([]); // Exercícios no treino atual
  const [exerciseSearch, setExerciseSearch] = useState('');

  const daysList = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo', 'Geral'
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 1. Carrega Treinos, Alunos e Exercícios do Supabase
  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // Buscar Alunos
      const { data: studentsData } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      if (studentsData) setStudents(studentsData);

      // Buscar Banco de Exercícios
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .order('name');
      if (exercisesData) setAvailableExercises(exercisesData);

      // Buscar Treinos com os seus respectivos Exercícios
      const { data: workoutsData, error: wError } = await supabase
        .from('workouts')
        .select(`
          id,
          title,
          student_id,
          day_of_week,
          workout_items (
            id,
            exercise_name,
            sets,
            reps,
            rest_time,
            notes
          )
        `)
        .order('created_at', { ascending: false });

      if (wError) throw wError;

      if (workoutsData) {
        const formattedWorkouts = workoutsData.map(w => ({
          ...w,
          exercises: w.workout_items || []
        }));
        setWorkouts(formattedWorkouts);
      }
    } catch (error) {
      console.error('Erro ao carregar dados de treinos:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper para buscar nome do aluno
  const getStudentName = (studentId) => {
    const student = students.find((s) => String(s.id) === String(studentId));
    return student ? (student.full_name || student.email) : 'Aluno não vinculado';
  };

  // Abrir Modal de Criação / Edição
  const handleOpenModal = (workoutToEdit = null) => {
    if (workoutToEdit) {
      setEditingWorkoutId(workoutToEdit.id);
      setSelectedStudentId(workoutToEdit.student_id || '');
      setWorkoutTitle(workoutToEdit.title || '');
      setDayOfWeek(workoutToEdit.day_of_week || 'Segunda-feira');
      setSelectedExercises(
        workoutToEdit.exercises.map(ex => ({
          id: ex.id || Date.now(),
          name: ex.exercise_name || ex.name,
          sets: ex.sets || 3,
          reps: ex.reps || '10-12',
          rest: ex.rest_time || '60s',
          notes: ex.notes || ''
        }))
      );
    } else {
      setEditingWorkoutId(null);
      setSelectedStudentId(students[0]?.id || '');
      setWorkoutTitle('');
      setDayOfWeek('Segunda-feira');
      setSelectedExercises([]);
    }
    setIsModalOpen(true);
  };

  // 🚫 TRAVA DE SEGURANÇA: Adicionar Exercício ao Treino (Sem Duplicidade)
  const handleAddExerciseToWorkout = (exercise) => {
    // 1. Checa se o exercício já está na lista atual do treino
    const isAlreadyAdded = selectedExercises.some(
      (item) => item.name.toLowerCase().trim() === exercise.name.toLowerCase().trim()
    );

    if (isAlreadyAdded) {
      alert(`⚠️ O exercício "${exercise.name}" já está incluído neste treino!`);
      return;
    }

    // 2. Se não existir, adiciona à lista
    const newWorkoutItem = {
      exercise_id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: '10-12',
      rest: '60s',
      notes: ''
    };

    setSelectedExercises((prev) => [...prev, newWorkoutItem]);
  };

  // Atualizar valores de séries/reps/descanso na lista temporária
  const handleUpdateItemField = (index, field, value) => {
    setSelectedExercises((prev) => {
      const updated = [...prev];
      updated[index][field] = value;
      return updated;
    });
  };

  // Remover exercício do treino atual
  const handleRemoveExerciseFromWorkout = (index) => {
    setSelectedExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // 💾 SALVAR NO SUPABASE (Workout + Items)
  const handleSaveWorkout = async (e) => {
    e.preventDefault();
    if (!workoutTitle.trim()) return alert('Informe o título do treino.');
    if (selectedExercises.length === 0) return alert('Adicione pelo menos um exercício ao treino.');

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      const workoutPayload = {
        title: workoutTitle.trim(),
        student_id: selectedStudentId || null,
        personal_id: user ? user.id : null,
        day_of_week: dayOfWeek,
        updated_at: new Date().toISOString()
      };

      let workoutId = editingWorkoutId;

      if (editingWorkoutId) {
        // Atualiza treino existente
        const { error } = await supabase
          .from('workouts')
          .update(workoutPayload)
          .eq('id', editingWorkoutId);

        if (error) throw error;

        // Limpa os itens antigos do treino para regravar a nova lista
        await supabase.from('workout_items').delete().eq('workout_id', editingWorkoutId);
      } else {
        // Cria novo treino
        const { data, error } = await supabase
          .from('workouts')
          .insert([workoutPayload])
          .select();

        if (error) throw error;
        workoutId = data[0].id;
      }

      // Inserir os exercícios vinculados
      const itemsPayload = selectedExercises.map((ex, index) => ({
        workout_id: workoutId,
        exercise_id: String(ex.exercise_id).startsWith('def-') ? null : ex.exercise_id,
        exercise_name: ex.name,
        sets: parseInt(ex.sets) || 3,
        reps: String(ex.reps),
        rest_time: String(ex.rest),
        notes: ex.notes || '',
        order_index: index
      }));

      const { error: itemsError } = await supabase.from('workout_items').insert(itemsPayload);
      if (itemsError) throw itemsError;

      setIsModalOpen(false);
      fetchInitialData(); // Atualiza a tela
    } catch (error) {
      console.error('Erro ao salvar treino:', error.message);
      alert('Erro ao salvar o treino: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Excluir Treino
  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Tem certeza de que deseja excluir este treino?')) return;

    try {
      const { error } = await supabase.from('workouts').delete().eq('id', id);
      if (error) throw error;

      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    } catch (error) {
      alert('Erro ao excluir treino: ' + error.message);
    }
  };

  // Filtra lista de exercícios para adicionar
  const filteredAvailableExercises = availableExercises.filter((ex) =>
    ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            💪 Planos de Treino
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Crie, edite e organize a rotina de exercícios dos seus alunos.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal(null)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={18} /> Montar Novo Treino
        </button>
      </div>

      {/* Carregando State */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 flex justify-center items-center gap-2">
          <Loader2 className="animate-spin text-emerald-400" size={24} />
          <span>Carregando treinos...</span>
        </div>
      ) : workouts.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-400">Nenhum treino cadastrado ainda.</p>
          <p className="text-xs text-slate-500">Clique no botão acima para criar o primeiro treino.</p>
        </div>
      ) : (
        /* Lista de Treinos Cadastrados */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-white">
                    {workout.title || 'Treino Sem Nome'}
                  </h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {workout.day_of_week || 'Geral'}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 font-medium">
                  👤 {getStudentName(workout.student_id)}
                </p>

                {/* Lista de Exercícios no Card */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Exercícios ({workout.exercises.length}):</span>
                  <ul className="text-xs space-y-1 text-slate-300">
                    {workout.exercises && workout.exercises.length > 0 ? (
                      workout.exercises.map((ex, idx) => (
                        <li key={idx} className="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 flex justify-between">
                          <span className="truncate pr-2">{ex.exercise_name || ex.name}</span>
                          <span className="text-slate-400 font-mono whitespace-nowrap">{ex.sets}x{ex.reps}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic text-xs">Nenhum exercício detalhado</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleDeleteWorkout(workout.id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Excluir
                </button>
                <button
                  onClick={() => handleOpenModal(workout)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 MODAL DE MONTAR/EDITAR TREINO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

            {/* Topo Modal */}
            <div className="p-5 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Dumbbell className="text-emerald-400" />
                {editingWorkoutId ? 'Editar Treino' : 'Montar Novo Treino'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <form onSubmit={handleSaveWorkout} className="p-6 overflow-y-auto space-y-6 flex-1">

              {/* Informações Básicas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-slate-300 block mb-1">Selecione o Aluno</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Sem vínculo</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name || s.email}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Título do Treino</label>
                  <input
                    type="text"
                    placeholder="Ex: Treino A - Peito & Tríceps"
                    value={workoutTitle}
                    onChange={(e) => setWorkoutTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Dia / Agrupamento</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Área Principal: Busca + Exercícios Selecionados */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 border-t border-slate-800">

                {/* Coluna Esquerda: Busca e Adição de Exercícios */}
                <div className="md:col-span-5 space-y-3 border-r border-slate-800/80 pr-0 md:pr-4">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">1. Escolha os Exercícios</span>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar do banco..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {filteredAvailableExercises.map((ex) => {
                      // 🔍 Checa se o exercício já está no treino para desabilitar botão
                      const isAdded = selectedExercises.some(
                        (item) => item.name.toLowerCase().trim() === ex.name.toLowerCase().trim()
                      );

                      return (
                        <div key={ex.id} className="flex items-center justify-between p-2 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                          <span className="text-slate-200 font-medium truncate pr-2">{ex.name}</span>
                          <button
                            type="button"
                            disabled={isAdded}
                            onClick={() => handleAddExerciseToWorkout(ex)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${isAdded
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              }`}S
                          >
                            {isAdded ? 'Adicionado ✓' : '+ Adicionar'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coluna Direita: Exercícios Incluídos e Ajustes */}
                <div className="md:col-span-7 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                    2. Ficha do Treino ({selectedExercises.length} exercícios)
                  </span>

                  {selectedExercises.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs">
                      Nenhum exercício selecionado ainda.<br />Clique no botão "+ Adicionar" da lista ao lado.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {selectedExercises.map((item, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{idx + 1}. {item.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveExerciseFromWorkout(idx)}
                              className="text-slate-500 hover:text-red-400 p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div>
                              <label className="text-[10px] text-slate-500 block">Séries</label>
                              <input
                                type="number"
                                value={item.sets}
                                onChange={(e) => handleUpdateItemField(idx, 'sets', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Reps</label>
                              <input
                                type="text"
                                value={item.reps}
                                onChange={(e) => handleUpdateItemField(idx, 'reps', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center text-white"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-500 block">Descanso</label>
                              <input
                                type="text"
                                value={item.rest}
                                onChange={(e) => handleUpdateItemField(idx, 'rest', e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center text-white"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Botões de Rodapé do Modal */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                  {saving ? 'Salvando...' : 'Salvar Treino'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}