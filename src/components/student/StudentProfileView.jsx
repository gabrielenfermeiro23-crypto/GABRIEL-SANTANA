import React, { useState } from 'react';

export default function StudentProfileView({ student, allWorkouts = [], allAssessments = [], onSaveWorkout, onSaveAssessment, onBack, theme }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [newWorkout, setNewWorkout] = useState({ title: '', exercises: '' });
  const [newAssessment, setNewAssessment] = useState({ weight: '', fatPercentage: '', muscleMass: '' });

  const handleAddWorkout = (e) => {
    e.preventDefault();
    if (!newWorkout.title) return;
    onSaveWorkout({
      student_id: student.id,
      title: newWorkout.title,
      exercises: newWorkout.exercises,
      date: new Date().toLocaleDateString('pt-BR')
    });
    setNewWorkout({ title: '', exercises: '' });
  };

  const handleAddAssessment = (e) => {
    e.preventDefault();
    if (!newAssessment.weight) return;
    onSaveAssessment({
      student_id: student.id,
      weight: newAssessment.weight,
      fatPercentage: newAssessment.fatPercentage,
      muscleMass: newAssessment.muscleMass,
      date: new Date().toLocaleDateString('pt-BR')
    });
    setNewAssessment({ weight: '', fatPercentage: '', muscleMass: '' });
  };

  if (!student) return null;

  return (
    <div className="space-y-6">
      {/* Botão de Voltar */}
      <button 
        onClick={onBack}
        className="text-base font-bold px-5 py-3 rounded-xl border border-zinc-800 bg-black/60 text-zinc-200 hover:bg-white/10 hover:border-cyan-400 transition-all flex items-center gap-2"
      >
        ← Voltar para Lista de Alunos
      </button>

      {/* Header Aluno com Capa */}
      <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-900/90 shadow-2xl">
        <div 
          className="h-44 w-full bg-cover bg-center relative"
          style={{ backgroundImage: "url('/bg-meupersonal.png')" }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
        </div>

        <div className="p-6 relative -mt-14 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
          <div className="flex items-end gap-5">
            <div className="w-24 h-24 rounded-full bg-cyan-400 text-black flex items-center justify-center font-extrabold text-4xl border-4 border-zinc-950 shadow-2xl">
              {student.name ? student.name[0].toUpperCase() : 'A'}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-wide">{student.name}</h1>
              <p className="text-base text-zinc-300 font-semibold mt-1">
                Status:{' '}
                <span className={student.status === 'active' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                  {student.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border border-zinc-800 p-2 rounded-2xl bg-black/80">
            {[
              { id: 'summary', label: 'Resumo' },
              { id: 'workouts', label: 'Treinos' },
              { id: 'assessments', label: 'Avaliações' },
              { id: 'financial', label: 'Financeiro' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 rounded-xl text-base font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-500/20 scale-[1.02]' 
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo com Dados Reais e Sincronizados */}
      <div className="p-8 rounded-2xl border border-zinc-800 bg-zinc-900/90 shadow-2xl">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-3">Informações Gerais</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-base">
              <div className="p-5 rounded-xl bg-black/50 border border-zinc-800">
                <p className="text-zinc-400 font-semibold mb-1">E-mail</p>
                <p className="text-white font-bold">{student.email || 'Não informado'}</p>
              </div>
              <div className="p-5 rounded-xl bg-black/50 border border-zinc-800">
                <p className="text-zinc-400 font-semibold mb-1">Telefone</p>
                <p className="text-white font-bold">{student.phone || 'Não informado'}</p>
              </div>
              <div className="p-5 rounded-xl bg-black/50 border border-zinc-800">
                <p className="text-zinc-400 font-semibold mb-1">Objetivo</p>
                <p className="text-cyan-400 font-bold">{student.objective || 'Emagrecimento / Hipertrofia'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workouts' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-4">Montar / Adaptar Ficha</h3>
            <form onSubmit={handleAddWorkout} className="p-6 rounded-xl bg-black/60 border border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Nome do Treino (ex: Treino A - Hipertrofia)" 
                  value={newWorkout.title}
                  onChange={(e) => setNewWorkout({ ...newWorkout, title: e.target.value })}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-base focus:border-cyan-400 focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Exercícios e Séries" 
                  value={newWorkout.exercises}
                  onChange={(e) => setNewWorkout({ ...newWorkout, exercises: e.target.value })}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-base focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-cyan-400 text-black font-bold rounded-xl hover:bg-cyan-300">
                + Gravar Treino Adaptado
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4">
              {allWorkouts.map((w, idx) => (
                <div key={idx} className="p-5 rounded-xl bg-black/40 border border-zinc-800">
                  <p className="text-xl font-bold text-white">{w.title}</p>
                  <p className="text-base text-zinc-400 mt-1">{w.exercises}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-8">
            <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-4">Avaliações do Aluno</h3>
            <form onSubmit={handleAddAssessment} className="p-6 rounded-xl bg-black/60 border border-zinc-800 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  placeholder="Peso (kg)" 
                  value={newAssessment.weight}
                  onChange={(e) => setNewAssessment({ ...newAssessment, weight: e.target.value })}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-base focus:border-cyan-400 focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="% Gordura" 
                  value={newAssessment.fatPercentage}
                  onChange={(e) => setNewAssessment({ ...newAssessment, fatPercentage: e.target.value })}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-base focus:border-cyan-400 focus:outline-none"
                />
                <input 
                  type="text" 
                  placeholder="Massa Magra (kg)" 
                  value={newAssessment.muscleMass}
                  onChange={(e) => setNewAssessment({ ...newAssessment, muscleMass: e.target.value })}
                  className="p-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-base focus:border-cyan-400 focus:outline-none"
                />
              </div>
              <button type="submit" className="px-6 py-3 bg-cyan-400 text-black font-bold rounded-xl hover:bg-cyan-300">
                + Salvar Avaliação
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allAssessments.map((a, idx) => (
                <div key={idx} className="p-6 rounded-xl bg-black/40 border border-zinc-800 space-y-2">
                  <p className="text-cyan-400 font-bold text-lg">Avaliação - {a.date}</p>
                  <p className="text-base text-zinc-300">Peso: <strong className="text-white">{a.weight}</strong></p>
                  <p className="text-base text-zinc-300">Gordura: <strong className="text-white">{a.fatPercentage}</strong></p>
                  <p className="text-base text-zinc-300">Massa Magra: <strong className="text-white">{a.muscleMass}</strong></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-white border-b border-zinc-800 pb-4">Status de Pagamento</h3>
            <div className="p-6 rounded-xl bg-black/50 border border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-lg font-bold text-white">Plano PersonalTrainer Individual</p>
                <p className="text-base text-zinc-400">Vencimento mensal recorrente</p>
              </div>
              <span className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/40 rounded-xl font-bold text-base">
                Em Dia
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}