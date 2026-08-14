import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function StudentDashboard({ student, onSignOut }) {
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' | 'financial'
  const [workouts, setWorkouts] = useState([]);
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [weights, setWeights] = useState({});
  const [financialRecords, setFinancialRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [financialLoading, setFinancialLoading] = useState(false);

  // Estado para o Modal Celebrativo de Fim de Treino
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [motivationalMessage, setMotivationalMessage] = useState('');

  // Estados do Cronômetro de Descanso
  const [restTime, setRestTime] = useState(0);
  const [totalRestTime, setTotalRestTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentTimerExercise, setCurrentTimerExercise] = useState('');

  const studentEmail = (student?.email || 'gabrielenfermeiro23@gmail.com').toLowerCase().trim();
  const studentName = (student?.name || student?.full_name || 'Gabriel').split(' ')[0];

  // Frases motivacionais para incentivar o aluno
  const motivationalQuotes = [
    "Mais um treino pra conta! A constância é a chave do sucesso! 💪⚡",
    "Excelente trabalho! Cada repetição te aproxima do seu objetivo! 🔥🏻",
    "Treino pago com sucesso! Seu corpo e sua mente agradecem! 🏆🚀",
    "Sensacional! A disciplina de hoje é o resultado de amanhã! 🦾🔥",
    "Orgulho do processo! Descanse bem, você destruiu hoje! 🎉💪"
  ];

  // Helper para formatar o nome dos exercícios
  const formatExerciseName = (name) => {
    if (!name) return 'Exercício';
    return String(name).replaceAll('-', ' ');
  };

  // Helper para verificar se a data venceu
  const isOverdue = (dueDate, status) => {
    const lowerStatus = String(status || '').toLowerCase();
    if (lowerStatus === 'paid' || lowerStatus === 'pago') return false;
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Verifica se o aluno possui qualquer pendência financeira em atraso
  const hasDebt = financialRecords.some(record => isOverdue(record.due_date, record.status));

  // Efeito do Cronômetro
  useEffect(() => {
    let timer = null;
    if (isTimerRunning && restTime > 0) {
      timer = setInterval(() => {
        setRestTime((prev) => prev - 1);
      }, 1000);
    } else if (restTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      playBeepSound();
      toast.success('Descanso finalizado! Hora da próxima série! ⚡', { duration: 4000 });
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isTimerRunning, restTime]);

  const playBeepSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) { }
  };

  // Carregar Treinos
  useEffect(() => {
    let isMounted = true;

    async function fetchWorkouts() {
      try {
        setLoading(true);

        const { data: allWorkouts, error } = await supabase
          .from('workouts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (isMounted && allWorkouts) {
          const filtered = allWorkouts.filter((w) => {
            const wEmail = (w.student_email || w.email || '').toLowerCase().trim();
            const wName = (w.student_name || w.student || '').toLowerCase().trim();
            const wId = w.student_id;

            return (
              (student?.id && wId === student.id) ||
              (wEmail && wEmail === studentEmail) ||
              (wName && wName.includes('gabriel'))
            );
          });

          const finalWorkouts = filtered.length > 0 ? filtered : allWorkouts;

          const enrichedWorkouts = await Promise.all(
            finalWorkouts.map(async (workout) => {
              if (workout.exercises && Array.isArray(workout.exercises) && workout.exercises.length > 0) {
                return workout;
              }

              const { data: subExercises } = await supabase
                .from('workout_exercises')
                .select('*')
                .eq('workout_id', workout.id);

              if (subExercises && subExercises.length > 0) {
                return { ...workout, exercises: subExercises };
              }

              const { data: directExercises } = await supabase
                .from('exercises')
                .select('*')
                .eq('workout_id', workout.id);

              if (directExercises && directExercises.length > 0) {
                return { ...workout, exercises: directExercises };
              }

              return workout;
            })
          );

          setWorkouts(enrichedWorkouts);
          if (enrichedWorkouts.length > 0) {
            setActiveWorkout(enrichedWorkouts[0]);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar treinos:', err);
        toast.error('Erro ao carregar seus treinos.');
      } fontFinally: {
        if (isMounted) setLoading(false);
      }
    }

    fetchWorkouts();

    return () => {
      isMounted = false;
    };
  }, [student, studentEmail]);

  // Carregar Cobranças / Mensalidades do Aluno
  useEffect(() => {
    async function fetchFinancialRecords() {
      try {
        setFinancialLoading(true);

        const { data: { session } } = await supabase.auth.getSession();
        const activeEmail = (session?.user?.email || studentEmail || '').toLowerCase().trim();
        const activeId = student?.id || session?.user?.id;

        let query = supabase.from('financial_records').select('*');

        if (activeId || activeEmail) {
          const conditions = [];
          if (activeId) conditions.push(`student_id.eq.${activeId}`);
          if (activeEmail) conditions.push(`student_email.ilike.%${activeEmail}%`);

          query = query.or(conditions.join(','));
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          const { data: allRecords } = await supabase
            .from('financial_records')
            .select('*');

          if (allRecords && allRecords.length > 0) {
            const filteredLocal = allRecords.filter((r) => {
              const rEmail = (r.student_email || r.email || '').toLowerCase().trim();
              const rId = r.student_id || r.user_id;

              return (
                (activeId && rId === activeId) ||
                (activeEmail && rEmail.includes(activeEmail)) ||
                (activeEmail && activeEmail.includes(rEmail))
              );
            });

            setFinancialRecords(filteredLocal);
            return;
          }
        }

        setFinancialRecords(data || []);
      } catch (err) {
        console.error('Erro ao carregar mensalidades:', err);
      } finally {
        setFinancialLoading(false);
      }
    }

    fetchFinancialRecords();
  }, [student, studentEmail]);

  const parseRestSeconds = (restStr) => {
    if (!restStr) return 60;
    const str = String(restStr).toLowerCase().trim();
    if (str.includes('m')) {
      const parts = str.split('m');
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return minutes * 60 + seconds;
    }
    const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
    return isNaN(num) || num <= 0 ? 60 : num;
  };

  const startRestTimer = (seconds, exerciseName = '') => {
    setTotalRestTime(seconds);
    setRestTime(seconds);
    setCurrentTimerExercise(formatExerciseName(exerciseName));
    setIsTimerRunning(true);
    toast.success(`Descanso de ${seconds}s iniciado! ⏱️`);
  };

  const getExercisesList = (workout) => {
    if (!workout) return [];
    let raw = workout.exercises || workout.exercises_list || workout.items || workout.data;
    if (!raw) return [];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { }
    }
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch (e) { }
    }
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      if (Array.isArray(raw.exercises)) return raw.exercises;
      if (Array.isArray(raw.items)) return raw.items;
      if (Array.isArray(raw.data)) return raw.data;
    }
    return [];
  };

  const toggleExercise = (exerciseId, exerciseObj = null) => {
    if (hasDebt) {
      toast.error('Acesso bloqueado por pendência financeira.');
      return;
    }

    const isNowDone = !completedExercises.includes(exerciseId);

    setCompletedExercises((prev) =>
      isNowDone ? [...prev, exerciseId] : prev.filter((id) => id !== exerciseId)
    );

    if (isNowDone && exerciseObj) {
      const restSecs = parseRestSeconds(exerciseObj.rest);
      startRestTimer(restSecs, exerciseObj.name || exerciseObj.title || '');
    }
  };

  const handleWeightChange = (exerciseId, value) => {
    setWeights((prev) => ({ ...prev, [exerciseId]: value }));
  };

  const handleFinishWorkout = async () => {
    if (hasDebt) {
      toast.error('Não é possível concluir treinos com faturas pendentes.');
      return;
    }

    try {
      const workoutTitle = activeWorkout?.name || activeWorkout?.title || 'Treino';

      const logPayload = {
        title: `Treino Concluído: ${workoutTitle}`,
      };

      if (student?.id) {
        logPayload.student_id = student.id;
      }

      const { error } = await supabase.from('logs').insert([logPayload]);

      if (error) {
        console.warn('Aviso do log no Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Erro ao salvar log:', err);
    } finally {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
      setMotivationalMessage(randomQuote);
      setShowFinishModal(true);
      setIsTimerRunning(false);
      setRestTime(0);
    }
  };

  const closeFinishModal = () => {
    setShowFinishModal(false);
    setCompletedExercises([]);
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-100">
        <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-medium text-xs mt-4">Carregando painel...</p>
      </div>
    );
  }

  const currentExercises = activeWorkout ? getExercisesList(activeWorkout) : [];
  const totalExercises = currentExercises.length;
  const completedCount = completedExercises.length;
  const progressPercentage = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  return (
    <div className="w-full max-w-5xl mx-auto p-3 md:p-6 space-y-6 text-slate-100 relative">

      {/* 0. NAVEGAÇÃO DE ABAS */}
      <div className="flex border-b border-slate-800 pb-2 gap-4">
        <button
          onClick={() => setActiveTab('workouts')}
          className={`pb-2 px-3 font-extrabold text-sm transition-all border-b-2 ${activeTab === 'workouts'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          🏋️‍♂️ Meus Treinos
        </button>
        <button
          onClick={() => setActiveTab('financial')}
          className={`pb-2 px-3 font-extrabold text-sm transition-all border-b-2 flex items-center gap-2 ${activeTab === 'financial'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
        >
          💳 Minhas Mensalidades
          {hasDebt && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SEÇÃO 1: ABA DE TREINOS */}
      {/* ========================================================================= */}
      {activeTab === 'workouts' && (
        <>
          {/* BANNER DE AVISO / BLOQUEIO CASO ESTEJA EM DÍVIDA */}
          {hasDebt ? (
            <div className="bg-red-950/40 border border-red-500/40 rounded-3xl p-6 text-center space-y-4 backdrop-blur-md shadow-2xl">
              <div className="w-16 h-16 bg-red-500/20 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-3xl">
                🔒
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-red-400">Acesso aos Treinos Bloqueado</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Identificamos uma ou mais mensalidades em atraso na sua conta. Entre em contato com a recepção ou faça o pagamento para liberar o acesso às fichas de exercício.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('financial')}
                className="px-6 py-3 bg-red-500 hover:bg-red-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Verificar Minhas Mensalidades 💳
              </button>
            </div>
          ) : (
            <>
              {/* MÉTRICAS DE RESUMO DAS FICHAS */}
              <section className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg backdrop-blur-sm">
                  <span className="text-2xl md:text-3xl font-black text-cyan-400">{workouts.length}</span>
                  <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Fichas</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg backdrop-blur-sm">
                  <span className="text-2xl md:text-3xl font-black text-blue-400">{completedCount}/{totalExercises}</span>
                  <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Feitos</span>
                </div>
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center shadow-lg backdrop-blur-sm">
                  <span className="text-2xl md:text-3xl font-black text-emerald-400">{progressPercentage}%</span>
                  <span className="block text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Progresso</span>
                </div>
              </section>

              {/* SELETOR DE FICHAS EM BOTÕES */}
              {workouts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Fichas Disponíveis</p>
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {workouts.map((workout) => (
                      <button
                        key={workout.id}
                        onClick={() => {
                          setActiveWorkout(workout);
                          setCompletedExercises([]);
                        }}
                        className={`px-5 py-3 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border ${activeWorkout?.id === workout.id
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-[1.01]'
                            : 'bg-slate-900/90 border-slate-800/90 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                      >
                        {workout.name || workout.title || 'Ficha de Treino'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CARD DO TREINO SELECIONADO */}
              {activeWorkout ? (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-6 shadow-2xl backdrop-blur-xl">

                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-xl font-black text-white">
                          {activeWorkout.name || activeWorkout.title}
                        </h2>
                        {(activeWorkout.notes || activeWorkout.description) && (
                          <p className="text-xs text-slate-400 mt-1">
                            {activeWorkout.notes || activeWorkout.description}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-black text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-3 py-1 rounded-full uppercase tracking-wider">
                        Ativo
                      </span>
                    </div>

                    <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800/60">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Lista de Exercícios */}
                  <div className="space-y-3">
                    {currentExercises.map((exercise, index) => {
                      const exerciseId = exercise.id || `ex-${index}`;
                      const isDone = completedExercises.includes(exerciseId);
                      const restDisplay = exercise.rest
                        ? (String(exercise.rest).endsWith('s') ? exercise.rest : `${exercise.rest}s`)
                        : '60s';

                      const rawName = exercise.name || exercise.title;
                      const formattedName = formatExerciseName(rawName);

                      return (
                        <div
                          key={exerciseId}
                          className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDone
                              ? 'bg-cyan-950/20 border-cyan-500/30 opacity-70'
                              : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
                            }`}
                        >
                          <div
                            onClick={() => toggleExercise(exerciseId, exercise)}
                            className="cursor-pointer space-y-1.5 flex-1"
                          >
                            <p className={`font-extrabold text-sm ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                              {formattedName}
                            </p>

                            <div className="flex flex-wrap gap-2 text-[11px]">
                              <span className="bg-slate-900 text-cyan-400 font-bold px-2.5 py-0.5 rounded-md border border-slate-800">
                                {exercise.sets || 3} Séries
                              </span>
                              <span className="bg-slate-900 text-blue-400 font-bold px-2.5 py-0.5 rounded-md border border-slate-800">
                                {exercise.reps || '10-12'} Reps
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/60">
                            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-xl">
                              <span className="text-[10px] uppercase font-bold text-slate-400">Carga:</span>
                              <input
                                type="text"
                                placeholder="-- kg"
                                value={weights[exerciseId] || ''}
                                onChange={(e) => handleWeightChange(exerciseId, e.target.value)}
                                className="w-14 bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none text-right"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => startRestTimer(parseRestSeconds(exercise.rest), rawName)}
                              className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl text-xs font-bold text-slate-400 hover:text-cyan-400 transition-all flex items-center gap-1"
                            >
                              ⏱️ {restDisplay}
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleExercise(exerciseId, exercise)}
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all ${isDone
                                  ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-black text-sm'
                                  : 'bg-slate-900 border-slate-800 text-transparent hover:border-slate-600'
                                }`}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleFinishWorkout}
                    disabled={completedExercises.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-sm transition-all shadow-lg shadow-cyan-500/10 uppercase tracking-wide cursor-pointer"
                  >
                    Concluir Treino 🔥
                  </button>
                </div>
              ) : (
                <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-8 text-center">
                  <p className="text-slate-400 text-sm font-semibold">Nenhuma ficha disponível no momento.</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO 2: ABA DE MENSALIDADES E FINANÇAS */}
      {/* ========================================================================= */}
      {activeTab === 'financial' && (
        <div className="space-y-6">

          {/* RESUMO FINANCEIRO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Status Geral</span>
              {hasDebt ? (
                <span className="text-red-400 font-black text-lg flex items-center justify-center gap-1">
                  ⚠️ Em Atraso
                </span>
              ) : (
                <span className="text-emerald-400 font-black text-lg flex items-center justify-center gap-1">
                  ✅ Em Dia
                </span>
              )}
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 text-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mb-1">Pendências</span>
              <span className="text-amber-400 font-black text-lg">
                R$ {financialRecords
                  .filter(r => String(r.status).toLowerCase() !== 'paid' && String(r.status).toLowerCase() !== 'pago')
                  .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0)
                  .toFixed(2)}
              </span>
            </div>
          </div>

          {/* TABELA DE MENSALIDADES */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              📋 Histórico de Cobranças
            </h3>

            {financialLoading ? (
              <p className="text-center text-slate-400 text-xs py-6">Carregando cobranças...</p>
            ) : financialRecords.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-8">Nenhuma cobrança registrada para a sua conta.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase">
                      <th className="pb-3 px-2">Descrição</th>
                      <th className="pb-3 px-2">Vencimento</th>
                      <th className="pb-3 px-2">Valor</th>
                      <th className="pb-3 px-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {financialRecords.map((record) => {
                      const isPaid = String(record.status).toLowerCase() === 'paid' || String(record.status).toLowerCase() === 'pago';
                      const overdue = isOverdue(record.due_date, record.status);

                      return (
                        <tr key={record.id} className="hover:bg-slate-950/40">
                          <td className="py-3.5 px-2 font-bold text-slate-200">
                            {record.description || record.notes || 'Mensalidade'}
                          </td>
                          <td className="py-3.5 px-2 text-slate-400 font-medium">
                            {record.due_date ? new Date(record.due_date).toLocaleDateString('pt-BR') : '--'}
                          </td>
                          <td className="py-3.5 px-2 font-extrabold text-cyan-300">
                            R$ {parseFloat(record.amount || 0).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {isPaid ? (
                              <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                                ✓ Pago
                              </span>
                            ) : overdue ? (
                              <span className="bg-red-950/80 text-red-400 border border-red-800/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase animate-pulse">
                                ⚠️ Atrasado
                              </span>
                            ) : (
                              <span className="bg-amber-950/80 text-amber-400 border border-amber-800/80 px-2.5 py-1 rounded-full text-[10px] font-black uppercase">
                                ⏳ Pendente
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CRONÔMETRO FLUTUANTE DE DESCANSO */}
      {(isTimerRunning || restTime > 0) && (
        <div className="fixed bottom-6 right-4 left-4 md:left-auto md:w-96 bg-slate-900/95 backdrop-blur-2xl border border-cyan-500/40 rounded-3xl p-4 shadow-2xl z-50 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase font-black tracking-widest text-cyan-400">Descanso Ativo</p>
              <p className="text-xs text-slate-300 font-bold truncate max-w-[180px]">
                {currentTimerExercise || 'Próxima Série'}
              </p>
            </div>
            <div className="text-2xl font-black font-mono text-cyan-300">
              {formatTimer(restTime)}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setRestTime((prev) => prev + 15)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-bold border border-slate-700"
            >
              +15s
            </button>
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="flex-1 py-2 bg-cyan-500 text-slate-950 rounded-xl text-xs font-black"
            >
              {isTimerRunning ? 'Pausar' : 'Continuar'}
            </button>
            <button
              onClick={() => { setIsTimerRunning(false); setRestTime(0); }}
              className="px-3 py-2 bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MODAL CELEBRATIVO DE CONCLUSÃO DE TREINO */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-6 md:p-8 max-w-md w-full text-center space-y-6 shadow-2xl relative overflow-hidden">

            <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="w-20 h-20 bg-gradient-to-tr from-cyan-500 to-blue-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/30 text-4xl transform hover:scale-105 transition-all">
              🏆
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white">
                Treino Finalizado, {studentName}! 🔥
              </h3>
              <p className="text-xs md:text-sm text-cyan-400 font-semibold leading-relaxed px-2">
                "{motivationalMessage}"
              </p>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 grid grid-cols-2 gap-3 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Ficha Concluída</span>
                <span className="text-xs font-extrabold text-white truncate block">
                  {activeWorkout?.name || activeWorkout?.title || 'Treino'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Exercícios Feitos</span>
                <span className="text-xs font-extrabold text-cyan-400 block">
                  {completedCount} de {totalExercises}
                </span>
              </div>
            </div>

            <button
              onClick={closeFinishModal}
              className="w-full py-3.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20"
            >
              Fechar & Continuar 🚀
            </button>
          </div>
        </div>
      )}

    </div>
  );
}