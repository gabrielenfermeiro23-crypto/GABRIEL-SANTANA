import { useState, useEffect } from 'react';
import { supabase } from "../lib/supabase";

export function useDashboardData() {
  const [students, setStudents] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Busca perfis sem filtro restrito de role para evitar ocultar alunos cadastrados
      const [
        { data: studentsData, error: errStudents },
        { data: financialData },
        { data: exercisesData },
        { data: workoutsData, error: errWorkouts },
        { data: assessmentsData },
        { data: logsData }
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase.from('financial_records').select('*').order('due_date', { ascending: true }),
        supabase.from('custom_exercises').select('*').order('name', { ascending: true }),
        supabase.from('workouts').select('*').order('created_at', { ascending: false }),
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('logs').select('*').order('created_at', { ascending: false })
      ]);

      if (errStudents) console.error("Erro ao carregar alunos:", errStudents.message);
      if (errWorkouts) console.error("Erro ao carregar treinos:", errWorkouts.message);

      // Filtra alunos aceitando variações de role (student, aluno, null, etc)
      if (studentsData) {
        const filteredStudents = studentsData.filter(s => 
          !s.role || 
          s.role.toLowerCase() === 'student' || 
          s.role.toLowerCase() === 'aluno'
        );
        setStudents(filteredStudents.length > 0 ? filteredStudents : studentsData);
      }

      if (financialData) setFinancialRecords(financialData);
      if (exercisesData) setCustomExercises(exercisesData);
      if (workoutsData) setWorkouts(workoutsData);
      if (assessmentsData) setAssessments(assessmentsData);
      if (logsData) setLogs(logsData);

    } catch (error) {
      console.error('Erro ao buscar dados do Supabase:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ----------------------------------------------------
  // Gestão de Alunos (Salva na tabela 'profiles')
  // ----------------------------------------------------
  const saveStudent = async (studentData) => {
    try {
      if (studentData.id) {
        const { error } = await supabase
          .from('profiles')
          .update(studentData)
          .eq('id', studentData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([{ ...studentData, role: 'student' }]);

        if (error) throw error;
      }

      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error.message || error);
      alert('Erro ao salvar aluno: ' + (error.message || 'Erro desconhecido'));
    }
  };

  const deleteStudent = async (id) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Erro ao excluir aluno:', error.message || error);
    }
  };

  // ----------------------------------------------------
  // Gestão de Cobranças
  // ----------------------------------------------------
  const togglePayment = async (recordId, currentStatusOrRecord) => {
    try {
      const cleanId = typeof recordId === 'object' ? recordId?.id : recordId;

      if (!cleanId) {
        console.error('ID da cobrança não encontrado:', recordId);
        return;
      }

      const currentRecord = financialRecords.find((r) => String(r.id) === String(cleanId));
      const currentStatus = String(currentRecord?.status || currentStatusOrRecord || '').toLowerCase();

      const isCurrentlyPaid = currentStatus === 'paid' || currentStatus === 'pago';

      const candidates = isCurrentlyPaid 
        ? ['pending', 'PENDENTE', 'pending_payment', 'pendente'] 
        : ['paid', 'PAGO', 'paid_out', 'pago'];

      let success = false;
      let lastError = null;

      for (const testStatus of candidates) {
        const { error } = await supabase
          .from('financial_records')
          .update({ status: testStatus })
          .eq('id', cleanId);

        if (!error) {
          success = true;
          break;
        }
        lastError = error;
      }

      if (!success) throw lastError;

      await fetchData();
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error?.message || error);
      alert('Erro ao atualizar pagamento: ' + (error?.message || 'Erro no servidor'));
    }
  };

  const saveFinancialRecord = async (recordData) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      const selectedStudent = students.find((s) => String(s.id) === String(recordData.student_id));

      const payload = {
        student_id: recordData.student_id,
        student_email: selectedStudent?.email || recordData.student_email || null,
        amount: parseFloat(recordData.amount),
        due_date: recordData.due_date,
        status: recordData.status || 'pending',
        description: recordData.notes || recordData.description || 'Mensalidade',
        personal_id: currentUserId
      };

      const { error } = await supabase
        .from('financial_records')
        .insert([payload]);

      if (error) throw error;

      await fetchData();
    } catch (error) {
      console.error('Erro ao salvar cobrança:', error.message || error);
      alert('Erro ao salvar cobrança: ' + (error.message || 'Erro de permissão no servidor'));
    }
  };

  // ----------------------------------------------------
  // Gestão de Treinos (Corrigida para compatibilidade total com JSON e títulos)
  // ----------------------------------------------------
  const saveWorkout = async (workoutData) => {
    try {
      // Normaliza os exercícios para garantir salvamento no formato de objeto/Array JSON
      let formattedExercises = workoutData.exercises;
      if (typeof formattedExercises === 'string') {
        try {
          formattedExercises = JSON.parse(formattedExercises);
        } catch (e) {
          formattedExercises = [];
        }
      }

      const payload = {
        student_id: workoutData.student_id || workoutData.user_id,
        name: workoutData.title || workoutData.name || 'Treino',
        title: workoutData.title || workoutData.name || 'Treino',
        notes: workoutData.notes || workoutData.day_of_week || '',
        day_of_week: workoutData.day_of_week || null,
        exercises: formattedExercises
      };

      if (workoutData.id) {
        const { error } = await supabase
          .from('workouts')
          .update(payload)
          .eq('id', workoutData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('workouts')
          .insert([payload]);

        if (error) throw error;
      }

      await fetchData();
      alert('Treino salvo com sucesso!');
    } catch (error) {
      console.error('Erro detalhado ao salvar treino no Supabase:', error);
      alert('Erro ao salvar treino: ' + (error.message || 'Erro desconhecido'));
    }
  };

  // ----------------------------------------------------
  // Gestão de Avaliações
  // ----------------------------------------------------
  const saveAssessment = async (assessmentData) => {
    const { error } = await supabase.from('assessments').insert([assessmentData]);
    if (!error) fetchData();
  };

  const deleteAssessment = async (id) => {
    const { error } = await supabase.from('assessments').delete().eq('id', id);
    if (!error) fetchData();
  };

  // ----------------------------------------------------
  // Gestão de Exercícios Customizados
  // ----------------------------------------------------
  const saveExercise = async (exerciseData) => {
    const { error } = await supabase.from('custom_exercises').insert([exerciseData]);
    if (!error) fetchData();
  };

  const deleteExercise = async (id) => {
    const { error } = await supabase.from('custom_exercises').delete().eq('id', id);
    if (!error) fetchData();
  };

  // ----------------------------------------------------
  // Autenticação
  // ----------------------------------------------------
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // ----------------------------------------------------
  // Cálculo das Métricas Gerais
  // ----------------------------------------------------
  const totalStudents = students.length;
  
  const activeStudents = students.filter((s) => {
    const st = String(s.status || '').toLowerCase();
    return st === 'active' || st === 'ativo' || st === 'ativa' || st === '';
  }).length;

  const pendingPayments = financialRecords
    .filter((f) => String(f.status).toLowerCase() === 'pending' || String(f.status).toLowerCase() === 'pendente')
    .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

  return {
    students,
    financialRecords,
    customExercises,
    workouts,
    assessments,
    logs,
    loading,
    metrics: { totalStudents, activeStudents, pendingPayments },
    togglePayment,
    saveFinancialRecord,
    saveStudent,
    deleteStudent,
    saveWorkout,
    saveAssessment,
    deleteAssessment,
    saveExercise,
    deleteExercise,
    handleSignOut,
    fetchData
  };
}