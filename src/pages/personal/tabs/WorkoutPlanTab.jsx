import React, { useState, useEffect } from 'react';
import { Plus, Search, Dumbbell, Calendar, Edit3, Trash2, User, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import WorkoutModal from '../../../components/modals/WorkoutModal';

export default function WorkoutPlanTab() {
  const [workouts, setWorkouts] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Estados do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkoutToEdit, setSelectedWorkoutToEdit] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // 1. Busca Alunos e Treinos do Supabase
  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar alunos com papel 'student'
      const { data: studentsData, error: sErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'student')
        .order('full_name');

      if (sErr) throw sErr;
      setStudents(studentsData || []);

      // Buscar treinos diretamente da tabela workouts (lendo coluna JSON exercises)
      const { data: workoutsData, error: wErr } = await supabase
        .from('workouts')
        .select('*')
        .order('created_at', { ascending: false });

      if (wErr) throw wErr;

      const formattedWorkouts = (workoutsData || []).map((w) => {
        let exList = [];
        if (Array.isArray(w.exercises)) {
          exList = w.exercises;
        } else if (typeof w.exercises === 'string') {
          try {
            exList = JSON.parse(w.exercises);
          } catch (e) {
            exList = [];
          }
        }

        return {
          ...w,
          title: w.title || w.name || 'Treino Sem Título',
          exercises: exList
        };
      });

      setWorkouts(formattedWorkouts);
    } catch (err) {
      console.error('Erro ao carregar treinos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Excluir Treino do Supabase
  const handleDeleteWorkout = async (workoutId) => {
    if (!confirm('Tem certeza que deseja excluir este treino? O aluno perderá o acesso a esta ficha.')) return;

    try {
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) throw error;

      await fetchData();
    } catch (err) {
      alert('Erro ao excluir treino: ' + err.message);
    }
  };

  // 3. Abrir Modal para Edição
  const handleOpenEdit = (workout) => {
    setSelectedWorkoutToEdit(workout);
    setIsModalOpen(true);
  };

  // 4. Abrir Modal para Novo Treino
  const handleOpenNew = (studentId = null) => {
    if (studentId) {
      setSelectedWorkoutToEdit({ student_id: studentId, isNew: true });
    } else {
      setSelectedWorkoutToEdit(null);
    }
    setIsModalOpen(true);
  };

  // Agrupamento de treinos por aluno com filtro de busca
  const groupedByStudent = students.map((student) => {
    const studentWorkouts = workouts.filter((w) => w.student_id === student.id);
    return {
      student,
      workouts: studentWorkouts
    };
  }).filter((group) => {
    const search = searchTerm.toLowerCase();
    const matchesStudent = group.student.full_name?.toLowerCase().includes(search);
    const matchesWorkout = group.workouts.some(w => 
      w.title?.toLowerCase().includes(search) || 
      w.day_of_week?.toLowerCase().includes(search)
    );
    return search === '' || matchesStudent || matchesWorkout;
  });

  return (
    <div className="space-y-6 text-white max-w-7xl mx-auto">
      
      {/* Topo / Cabeçalho */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Calendar className="text-emerald-400" size={28} />
            Montar e Gerenciar Treinos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Crie e atribua fichas de treino semanais para cada aluno cadastrado.
          </p>
        </div>

        <button
          onClick={() => handleOpenNew()}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl flex items-center gap-2 transition cursor-pointer text-sm shadow-lg shadow-emerald-500/10"
        >
          <Plus size={18} /> Novo Treino
        </button>
      </div>

      {/* Barra de Pesquisa */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome do aluno, dia ou título do treino..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
        />
      </div>

      {/* Lista Agrupada por Alunos */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 flex justify-center items-center gap-2">
          <Loader2 className="animate-spin text-emerald-400" size={24} />
          <span>Carregando planos de treino...</span>
        </div>
      ) : groupedByStudent.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-500">
          Nenhum aluno ou treino localizado com os termos buscados.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByStudent.map(({ student, workouts: studentWorkouts }) => (
            <div key={student.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              
              {/* Cabeçalho do Card do Aluno */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{student.full_name || 'Aluno sem nome'}</h3>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenNew(student.id)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
                >
                  <Plus size={14} /> Adicionar Dia de Treino
                </button>
              </div>

              {/* Grid de Treinos do Aluno */}
              {studentWorkouts.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">Nenhum treino montado para este aluno ainda.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentWorkouts.map((workout) => (
                    <div key={workout.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-slate-700 transition">
                      
                      <div>
                        {/* Topo do Treino */}
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {workout.day_of_week || 'Geral'}
                            </span>
                            <h4 className="font-bold text-white text-sm mt-1.5">{workout.title}</h4>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(workout)}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                              title="Editar Treino"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteWorkout(workout.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition cursor-pointer"
                              title="Excluir Treino"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        {/* Itens do Treino */}
                        <div className="space-y-1.5 mt-3">
                          <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Dumbbell size={12} className="text-emerald-400" /> {workout.exercises?.length || 0} EXERCÍCIOS:
                          </p>
                          <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {workout.exercises?.map((item, idx) => (
                              <div key={idx} className="bg-slate-900/80 p-2 rounded-lg text-xs flex justify-between items-center border border-slate-900">
                                <span className="font-medium text-slate-200 truncate pr-2">{idx + 1}. {item.exercise_name || item.name || 'Exercício'}</span>
                                <span className="text-[10px] text-slate-400 shrink-0 font-mono">{item.sets}x ({item.reps})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Componente Modal */}
      {isModalOpen && (
        <WorkoutModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onWorkoutSaved={() => {
            setIsModalOpen(false);
            fetchData();
          }}
          workoutToEdit={selectedWorkoutToEdit}
        />
      )}
    </div>
  );
}