import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Search, Edit2, ChevronRight, Eye, 
  Dumbbell, FileText, DollarSign, Calendar, AlertCircle, Loader2, X 
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Controle de Perfil Selecionado e Abas Internas (Resumo, Treinos, Avaliações, Financeiro)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('resumo'); // 'resumo' | 'treinos' | 'avaliacoes' | 'financeiro'
  const [studentWorkouts, setStudentWorkouts] = useState([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);

  // Modal de Edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    plan: 'Mensal',
    status: 'Ativo'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  // Busca os treinos do aluno selecionado ao mudar de aba ou de aluno
  useEffect(() => {
    if (selectedStudent && activeSubTab === 'treinos') {
      fetchStudentWorkouts(selectedStudent.id);
    }
  }, [selectedStudent, activeSubTab]);

  // 1. Busca Lista de Alunos no Supabase
  const fetchStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('Erro ao buscar alunos:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Busca os Treinos do Aluno Selecionado no Supabase
  const fetchStudentWorkouts = async (studentId) => {
    try {
      setLoadingWorkouts(true);
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          title,
          day_of_week,
          workout_items ( id, exercise_name, sets, reps, rest_time )
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudentWorkouts(data || []);
    } catch (err) {
      console.error('Erro ao buscar treinos do aluno:', err.message);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  // 3. Abre o Modal de Edição preenchendo os dados
  const handleOpenEditModal = (student) => {
    setEditingStudent(student);
    setEditForm({
      full_name: student.full_name || student.name || '',
      phone: student.phone || '',
      plan: student.plan || 'Mensal',
      status: student.status || 'Ativo'
    });
    setShowEditModal(true);
  };

  // 4. Salva a Edição no Supabase
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          plan: editForm.plan,
          status: editForm.status
        })
        .eq('id', editingStudent.id);

      if (error) throw error;

      if (selectedStudent && selectedStudent.id === editingStudent.id) {
        setSelectedStudent((prev) => ({
          ...prev,
          full_name: editForm.full_name,
          phone: editForm.phone,
          plan: editForm.plan,
          status: editForm.status
        }));
      }

      await fetchStudents();
      setShowEditModal(false);
    } catch (err) {
      console.error('Erro ao atualizar aluno:', err.message);
      alert('Erro ao salvar edições: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Filtros ajustados de busca e status
  const filteredStudents = students.filter((s) => {
    const studentName = (s.full_name || s.name || '').toLowerCase();
    const studentEmail = (s.email || '').toLowerCase();
    const search = searchTerm.trim().toLowerCase();

    const matchesSearch = !search || studentName.includes(search) || studentEmail.includes(search);

    const rawStatus = (s.status || 'Ativo').toLowerCase();
    const isAtivo = rawStatus === 'ativo' || rawStatus === 'active';
    const isInativo = rawStatus === 'inativo' || rawStatus === 'inactive';

    let matchesStatus = true;
    if (statusFilter === 'ativo') matchesStatus = isAtivo;
    if (statusFilter === 'inativo') matchesStatus = isInativo;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Visualização Detalhada do Aluno Selecionado */}
      {selectedStudent ? (
        <div className="space-y-6">
          <button
            onClick={() => setSelectedStudent(null)}
            className="text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            ← Voltar para Lista de Alunos
          </button>

          {/* Banner do Perfil */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-2xl font-black flex items-center justify-center uppercase">
                  {(selectedStudent.full_name || selectedStudent.name || 'A').charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-extrabold text-white">
                      {selectedStudent.full_name || selectedStudent.name || 'Aluno sem nome'}
                    </h2>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                      ['ativo', 'active'].includes((selectedStudent.status || '').toLowerCase())
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}>
                      Status: {selectedStudent.status || 'Inativo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{selectedStudent.email || 'Sem e-mail informado'}</p>
                </div>
              </div>

              {/* Menu de Sub-abas */}
              <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto overflow-x-auto">
                {['resumo', 'treinos', 'avaliacoes', 'financeiro'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSubTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                      activeSubTab === tab
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'avaliacoes' ? 'Avaliações' : tab}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Conteúdo da Sub-aba Selecionada */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            {activeSubTab === 'resumo' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">Informações Gerais</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block font-semibold">E-mail</span>
                    <span className="text-sm text-white font-medium">{selectedStudent.email || 'Não informado'}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block font-semibold">Telefone</span>
                    <span className="text-sm text-white font-medium">{selectedStudent.phone || 'Não informado'}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="text-xs text-slate-500 block font-semibold">Plano Ativo</span>
                    <span className="text-sm text-cyan-400 font-bold">{selectedStudent.plan || 'Mensal'}</span>
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'treinos' && (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Dumbbell className="text-cyan-400" size={20} />
                  Fichas de Treino Cadastradas
                </h3>

                {loadingWorkouts ? (
                  <div className="py-12 text-center text-slate-400 flex justify-center items-center gap-2">
                    <Loader2 className="animate-spin text-cyan-400" size={20} />
                    <span>Buscando treinos no banco...</span>
                  </div>
                ) : studentWorkouts.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 border-dashed rounded-xl p-8 text-center space-y-2">
                    <AlertCircle className="mx-auto text-slate-600" size={32} />
                    <p className="text-sm font-semibold text-slate-300">Nenhum treino encontrado para este aluno.</p>
                    <p className="text-xs text-slate-500">Acesse a aba "Montar Treinos" no menu lateral para criar uma nova ficha.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentWorkouts.map((w) => (
                      <div key={w.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                          <h4 className="text-sm font-bold text-white">{w.title}</h4>
                          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                            {w.day_of_week || 'Geral'}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {(w.workout_items || []).map((ex, idx) => (
                            <div key={ex.id || idx} className="text-xs text-slate-400 flex justify-between py-1 border-b border-slate-900/50">
                              <span>{ex.exercise_name}</span>
                              <span className="font-mono text-slate-300">{ex.sets}x{ex.reps} ({ex.rest_time || '60s'})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSubTab === 'avaliacoes' && (
              <div className="text-slate-400 text-sm">Histórico de avaliações físicas vinculado ao aluno.</div>
            )}

            {activeSubTab === 'financeiro' && (
              <div className="text-slate-400 text-sm">Histórico e faturas do plano {selectedStudent.plan || 'Mensal'}.</div>
            )}
          </div>
        </div>
      ) : (
        /* Lista Geral de Alunos */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-cyan-400" /> Meus Alunos
              </h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie cadastros, status de acesso e perfis de alunos.</p>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="Buscar aluno por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
          </div>

          {/* Grade de Alunos */}
          {loading ? (
            <div className="py-16 text-center text-slate-400 flex justify-center items-center gap-2">
              <Loader2 className="animate-spin text-cyan-400" size={24} />
              <span>Carregando alunos...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              Nenhum aluno encontrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => {
                const name = s.full_name || s.name || 'Aluno sem nome';
                const isAtivo = ['ativo', 'active'].includes((s.status || '').toLowerCase());

                return (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center uppercase">
                          {name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">{name}</h3>
                          <p className="text-xs text-slate-400">{s.email || 'Sem e-mail'}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                        isAtivo
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {s.status || 'Inativo'}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1 pt-2 border-t border-slate-950">
                      <p>Tel: {s.phone || 'Não informado'}</p>
                      <p>Plano: <span className="text-slate-200 font-medium">{s.plan || 'Mensal'}</span></p>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        onClick={() => handleOpenEditModal(s)}
                        className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 size={13} /> Editar
                      </button>
                      <button
                        onClick={() => {
                          setSelectedStudent(s);
                          setActiveSubTab('resumo');
                        }}
                        className="flex-1 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-xs font-bold text-cyan-400 transition flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Ver Perfil <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal de Edição de Cadastro */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Editar Cadastro do Aluno</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Telefone / WhatsApp</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Plano</label>
                  <select
                    value={editForm.plan}
                    onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 cursor-pointer font-bold"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {saving && <Loader2 className="animate-spin" size={14} />}
                  {saving ? 'Salvando...' : 'Salvar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}