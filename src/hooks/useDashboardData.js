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

      const [
        { data: studentsData },
        { data: financialData },
        { data: exercisesData },
        { data: workoutsData },
        { data: assessmentsData },
        { data: logsData }
      ] = await Promise.all([
        supabase.from('students').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_records').select('*').order('due_date', { ascending: true }),
        supabase.from('custom_exercises').select('*').order('name', { ascending: true }),
        supabase.from('workouts').select('*').order('created_at', { ascending: false }),
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
        supabase.from('logs').select('*').order('created_at', { ascending: false })
      ]);

      if (studentsData) setStudents(studentsData);
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
  // Gestão de Alunos
  // ----------------------------------------------------
  const saveStudent = async (studentData) => {
    try {
      if (studentData.id) {
        // Atualizar aluno existente
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', studentData.id);

        if (error) throw error;
      } else {
        // Criar novo aluno
        const { error } = await supabase
          .from('students')
          .insert([studentData]);

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
      const { error } = await supabase.from('students').delete().eq('id', id);
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
      // 1. Obtém a sessão do usuário logado (Personal)
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      if (!currentUserId) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        return;
      }

      // 2. Busca o aluno selecionado no estado para capturar e-mail
      const selectedStudent = students.find((s) => String(s.id) === String(recordData.student_id));

      // 3. Monta o payload completo enviando 'personal_id'
      const payload = {
        student_id: recordData.student_id,
        student_email: selectedStudent?.email || recordData.student_email || null,
        amount: parseFloat(recordData.amount),
        due_date: recordData.due_date,
        status: recordData.status || 'pending',
        description: recordData.notes || recordData.description || 'Mensalidade',
        personal_id: currentUserId // <-- Chave corrigida de user_id para personal_id
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
  // Gestão de Treinos
  // ----------------------------------------------------
  const saveWorkout = async (workoutData) => {
    try {
      if (workoutData.id) {
        const { error } = await supabase
          .from('workouts')
          .update({
            student_id: workoutData.student_id,
            name: workoutData.name,
            notes: workoutData.notes,
            exercises: workoutData.exercises
          })
          .eq('id', workoutData.id);

        if (error) throw error;
      } else {
        const cleanPayload = {
          student_id: workoutData.student_id,
          name: workoutData.name,
          notes: workoutData.notes,
          exercises: workoutData.exercises
        };

        const { error } = await supabase
          .from('workouts')
          .insert([cleanPayload]);

        if (error) throw error;
      }

      await fetchData();
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
  const activeStudents = students.filter((s) => s.status === 'active').length;
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