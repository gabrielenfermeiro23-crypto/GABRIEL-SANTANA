import React, { useState } from 'react';

// Componentes de Interface
import Sidebar from '../../components/Sidebar';
import MetricsCards from '../../components/dashboard/MetricsCards';
import StudentProfileView from '../../components/student/StudentProfileView';

// Abas do Painel
import StudentsTab from './tabs/StudentsTab';
import WorkoutPlanTab from './tabs/WorkoutPlanTab';
import ExercisesTab from './tabs/ExercisesTab';
import PhysicalAssessmentTab from './tabs/PhysicalAssessmentTab';
import FinancialTab from './tabs/FinancialTab';
import PersonalProfileTab from './tabs/PersonalProfileTab';

// Modais Globais
import StudentModal from '../../components/modals/StudentModal';
import WorkoutModal from '../../components/modals/WorkoutModal';

// Custom Hook de Dados
import * as HookModule from '../../hooks/useDashboardData';

export default function Dashboard({ session, user, onLogout }) {
  const [activeTab, setActiveTab] = useState('students');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Modais State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  const [isWorkoutModalOpen, setIsWorkoutModalOpen] = useState(false);
  const [workoutToEdit, setWorkoutToEdit] = useState(null);

  // Hook de Dados
  const useData = HookModule.useDashboardData || HookModule.default;
  const hookResult = useData ? useData(user?.id) : {};

  const {
    students = [],
    financialRecords = [],
    customExercises = [],
    workouts = [],
    assessments = [],
    loading = false,
    metrics = { totalStudents: 0, activeWorkouts: 0, monthlyRevenue: 0, pendingPayments: 0 },
    togglePayment,
    saveFinancialRecord,
    saveStudent,
    saveWorkout,
    deleteWorkout,
    saveAssessment,
    deleteAssessment,
    saveExercise,
    deleteExercise,
    handleSignOut
  } = hookResult;

  // --- TRATAMENTO DOS HANDLERS DO FINANCEIRO (Evita erro 400 e vincula aluno) ---
  const handleTogglePaymentWrapper = (recordId, recordObject) => {
    if (!togglePayment) return;
    // Garante extração limpa do ID para não enviar [object Object]
    const cleanId = typeof recordId === 'object' ? recordId.id : recordId;
    togglePayment(cleanId, recordObject);
  };

  const handleSaveRecordWrapper = async (payload) => {
    if (!saveFinancialRecord) return;
    
    // Anexa o e-mail do aluno selecionado antes de enviar ao Supabase
    const selectedStudent = students.find((s) => String(s.id) === String(payload.student_id));
    const enrichedPayload = {
      ...payload,
      student_email: selectedStudent?.email || payload.student_email || null
    };

    await saveFinancialRecord(enrichedPayload);
  };

  const executeLogout = () => {
    if (handleSignOut) handleSignOut();
    if (onLogout) onLogout();
  };

  const handleOpenStudentModal = (student = null) => {
    setStudentToEdit(student);
    setIsStudentModalOpen(true);
  };

  const handleOpenWorkoutModal = (workout = null) => {
    setWorkoutToEdit(workout);
    setIsWorkoutModalOpen(true);
  };

  // Mapeamento Direto e Forçado
  const renderTabContent = () => {
    const raw = String(activeTab).toLowerCase();

    if (raw.includes('student') || raw.includes('aluno')) {
      return (
        <StudentsTab
          students={students}
          onSelectStudent={setSelectedStudent}
          onOpenModal={handleOpenStudentModal}
        />
      );
    }

    if (raw.includes('workout') || raw.includes('treino')) {
      return (
        <WorkoutPlanTab
          students={students}
          workouts={workouts}
          customExercises={customExercises}
          onOpenModal={handleOpenWorkoutModal}
          onDeleteWorkout={deleteWorkout}
        />
      );
    }

    if (raw.includes('exercise') || raw.includes('banco') || raw.includes('exercicio')) {
      return (
        <ExercisesTab
          customExercises={customExercises}
          onSaveExercise={saveExercise}
          onDeleteExercise={deleteExercise}
        />
      );
    }

    if (raw.includes('finan') || raw.includes('gestao')) {
      return (
        <FinancialTab
          financialRecords={financialRecords}
          students={students}
          onTogglePayment={handleTogglePaymentWrapper}
          onSaveRecord={handleSaveRecordWrapper}
        />
      );
    }

    if (raw.includes('profile') || raw.includes('perfil')) {
      return <PersonalProfileTab session={session} user={user} />;
    }

    return (
      <PhysicalAssessmentTab
        students={students}
        assessments={assessments}
        onSaveAssessment={saveAssessment}
        onDeleteAssessment={deleteAssessment}
      />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-cyan-400 font-bold space-y-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm tracking-widest uppercase">Carregando Painel...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      
      {/* 🖼️ PAPEL DE PAREDE */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-30 pointer-events-none"
        style={{ backgroundImage: `url('/bg-meupersonal.png')` }}
      />
      <div className="absolute inset-0 z-0 bg-slate-950/70 pointer-events-none" />

      {/* Sidebar Lateral */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(newTab) => {
          setActiveTab(newTab);
          setSelectedStudent(null);
        }}
        handleSignOut={executeLogout}
        onLogout={executeLogout}
        user={user}
      />

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        {selectedStudent ? (
          <StudentProfileView
            student={selectedStudent}
            workouts={workouts.filter((w) => String(w.student_id) === String(selectedStudent.id))}
            assessments={assessments.filter((a) => String(a.student_id) === String(selectedStudent.id))}
            onBack={() => setSelectedStudent(null)}
            onSaveAssessment={saveAssessment}
            onDeleteAssessment={deleteAssessment}
            onOpenWorkoutModal={() => handleOpenWorkoutModal()}
          />
        ) : (
          <>
            {/* Cards de Métricas */}
            {MetricsCards && <MetricsCards metrics={metrics} />}

            {/* Renderização do Conteúdo da Aba */}
            {renderTabContent()}
          </>
        )}
      </main>

      {/* Modais Globais */}
      {StudentModal && (
        <StudentModal
          isOpen={isStudentModalOpen}
          onClose={() => setIsStudentModalOpen(false)}
          onSave={saveStudent}
          studentToEdit={studentToEdit}
        />
      )}

      {WorkoutModal && (
        <WorkoutModal
          isOpen={isWorkoutModalOpen}
          onClose={() => {
            setIsWorkoutModalOpen(false);
            setWorkoutToEdit(null);
          }}
          students={students}
          customExercises={customExercises}
          workoutToEdit={workoutToEdit}
          onSave={saveWorkout}
        />
      )}
    </div>
  );
}