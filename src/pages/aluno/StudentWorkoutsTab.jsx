import React, { useState, useEffect } from 'react';
import { Dumbbell, CheckCircle2, Clock, Calendar, CheckSquare, Square, Flame, Loader2, PlayCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase'; // Ajuste o caminho de importação para a lib do Supabase se necessário

export default function StudentWorkoutsTab() {
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedSets, setCompletedSets] = useState({}); // Controla séries concluídas ex: { 'itemId-setIndex': true }
  const [loggingWorkout, setLoggingWorkout] = useState(false);
  const [workoutFinishedToday, setWorkoutFinishedToday] = useState(false);

  useEffect(() => {
    fetchStudentWorkouts();
  }, []);

  // 1. Busca os treinos vinculados ao Aluno Logado no Supabase
  const fetchStudentWorkouts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.warn('Nenhum usuário logado encontrado.');
        setLoading(false);
        return;
      }

      // Busca os treinos vinculados ao ID do Aluno
      const { data: workoutsData, error } = await supabase
        .from('workouts')
        .select(`
          id,
          title,
          day_of_week,
          description,
          workout_items (
            id,
            exercise_name,
            sets,
            reps,
            rest_time,
            notes,
            order_index
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (workoutsData && workoutsData.length > 0) {
        // Ordena os exercícios internos pelo order_index
        const formatted = workoutsData.map(w => ({
          ...w,
          exercises: (w.workout_items || []).sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
        }));

        setWorkouts(formatted);
        // Define o primeiro treino como selecionado por padrão
        setActiveWorkout(formatted[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar treinos do aluno:', error.message);
  } finally {
      setLoading(false);
    }
  };

  // 2. Alterna a marcação individual de uma série
  const toggleSetCompletion = (itemId, setIndex) => {
    const key = `${itemId}-${setIndex}`;
    setCompletedSets((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // 3. Calcula porcentagem de progresso do treino atual
  const calculateProgress = () => {
    if (!activeWorkout || !activeWorkout.exercises.length) return 0;

    let totalSets = 0;
    let doneSets = 0;

    activeWorkout.exercises.forEach((ex) => {
      const setsCount = parseInt(ex.sets) || 1;
      totalSets += setsCount;

      for (let i = 0; i < setsCount; i++) {
        if (completedSets[`${ex.id}-${i}`]) {
          doneSets++;
        }
      }
    });

    return totalSets > 0 ? Math.round((doneSets / totalSets) * 100) : 0;
  };

  // 4. Registra conclusão do Treino
  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;

    try {
      setLoggingWorkout(true);
      const { data: { user } } = await supabase.auth.getUser();

      // Grava no log de treinos concluídos no Supabase (se a tabela existir)
      await supabase.from('workout_logs').insert([
        {
          student_id: user?.id,
          workout_id: activeWorkout.id,
          completed_at: new Date().toISOString()
        }
      ]);

      setWorkoutFinishedToday(true);
      setTimeout(() => setWorkoutFinishedToday(false), 5000);
    } catch (err) {
      console.error('Erro ao finalizar treino:', err.message);
    } finally {
      setLoggingWorkout(false);
    }
  };

  const progressPercentage = calculateProgress();

  return (
    <div className="space-y-6">
      {/* Topo / Boas-vindas */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flame className="text-orange-500 animate-pulse" />
            Meus Treinos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Selecione o treino do dia, acompanhe suas séries e marque ao concluir.
          </p>
        </div>

        {activeWorkout && (
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 w-full md:w-auto justify-between md:justify-start">
            <span className="text-xs text-slate-400 font-medium">Progresso do Treino:</span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono">{progressPercentage}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 flex justify-center items-center gap-2">
          <Loader2 className="animate-spin text-emerald-400" size={24} />
          <span>Carregando sua rotina de treinos...</span>
        </div>
      ) : workouts.length === 0 ? (
        /* Caso o Personal ainda não tenha criado treinos */
        <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
          <Dumbbell className="mx-auto text-slate-600" size={40} />
          <p className="text-base font-semibold text-slate-300">Nenhum treino atribuído ainda!</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Seu Personal Trainer ainda não cadastrou um plano de treino para o seu perfil. Solicite o envio da sua ficha.
          </p>
        </div>
      ) : (
        /* Conteúdo Principal */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Aba Lateral: Seleção de Treinos / Fichas */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
              Fichas Disponíveis ({workouts.length})
            </span>

            <div className="space-y-2">
              {workouts.map((w) => {
                const isActive = activeWorkout?.id === w.id;
                return (
                  <button
                    key={w.id}
                    onClick={() => setActiveWorkout(w)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500/10 border-emerald-500/50 text-white shadow-lg shadow-emerald-500/5'
                        : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <h4 className="text-sm font-bold text-white">{w.title}</h4>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar size={12} className="text-emerald-400" />
                        {w.day_of_week || 'Geral'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-950 text-slate-400 border border-slate-800">
                      {w.exercises?.length || 0} ex.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Área Direita: Execução do Treino Selecionado */}
          <div className="lg:col-span-8 space-y-4">
            {activeWorkout && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
                
                {/* Cabeçalho da Ficha */}
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Ficha Ativa</span>
                    <h3 className="text-xl font-extrabold text-white">{activeWorkout.title}</h3>
                  </div>
                  {workoutFinishedToday && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 size={16} /> Treino Concluído! 🔥
                    </span>
                  )}
                </div>

                {/* Lista de Exercícios */}
                <div className="space-y-4">
                  {activeWorkout.exercises.map((ex, exIndex) => {
                    const setsCount = parseInt(ex.sets) || 3;

                    return (
                      <div
                        key={ex.id || exIndex}
                        className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 space-y-3 hover:border-slate-700 transition"
                      >
                        {/* Nome do Exercício & Tags */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20">
                              {exIndex + 1}
                            </span>
                            <h4 className="text-sm font-bold text-white">{ex.exercise_name || ex.name}</h4>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span className="flex items-center gap-1 font-mono">
                              <Clock size={13} className="text-cyan-400" /> Descanso: {ex.rest_time || '60s'}
                            </span>
                          </div>
                        </div>

                        {/* Observações do Personal se houver */}
                        {ex.notes && (
                          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs text-slate-300 italic">
                            💡 <span className="font-semibold text-slate-200">Nota:</span> {ex.notes}
                          </div>
                        )}

                        {/* Grade de Séries para Checkbox */}
                        <div className="pt-2 border-t border-slate-900">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                            Marcação de Séries (Meta: {ex.reps} reps)
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {Array.from({ length: setsCount }).map((_, setIdx) => {
                              const isChecked = !!completedSets[`${ex.id}-${setIdx}`];

                              return (
                                <button
                                  key={setIdx}
                                  type="button"
                                  onClick={() => toggleSetCompletion(ex.id, setIdx)}
                                  className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                                    isChecked
                                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                                  }`}
                                >
                                  <span>Série {setIdx + 1}</span>
                                  {isChecked ? <CheckSquare size={16} className="text-emerald-400" /> : <Square size={16} className="text-slate-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

                {/* Botão de Finalizar Treino */}
                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={handleFinishWorkout}
                    disabled={loggingWorkout}
                    className="w-full sm:w-auto px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loggingWorkout ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <CheckCircle2 size={18} />
                    )}
                    {loggingWorkout ? 'Registrando...' : 'Concluir Treino de Hoje 🎉'}
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}