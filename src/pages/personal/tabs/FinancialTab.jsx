import React, { useState } from 'react';

// Ícones SVG inline
const Icone = ({ nome, className = "w-5 h-5" }) => {
  const icones = {
    Dollar: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    Check: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    ),
    Clock: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    Plus: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    ),
    Fechar: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    ),
    Lixeira: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    ),
    Busca: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    )
  };

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icones[nome]}
    </svg>
  );
};

export default function FinancialTab({
  financialRecords = [],
  students = [],
  onTogglePayment,
  onSaveRecord,
  onDeleteRecord
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Auxiliar para obter o objeto completo do aluno
  const getStudent = (studentId) => {
    return students.find((s) => String(s.id) === String(studentId));
  };

  // Auxiliar para obter o nome do aluno
  const getStudentName = (studentId) => {
    const student = getStudent(studentId);
    return student ? (student.name || student.email) : 'Aluno não identificado';
  };

  // Data atual formatada para YYYY-MM-DD mantendo o fuso horário local
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localDate = new Date(today.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
  };

  // Formulário de novo lançamento
  const [formData, setFormData] = useState({
    student_id: '',
    amount: '',
    due_date: getTodayDate(),
    status: 'pending',
    notes: 'Mensalidade'
  });

  // Filtro de lançamentos por status e nome/e-mail do aluno
  const filteredRecords = financialRecords.filter((record) => {
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const student = getStudent(record.student_id);
    const studentName = getStudentName(record.student_id).toLowerCase();
    const studentEmail = (record.student_email || student?.email || '').toLowerCase();
    const search = searchTerm.toLowerCase();

    const matchesSearch = studentName.includes(search) || studentEmail.includes(search);
    return matchesStatus && matchesSearch;
  });

  // Cálculos das Métricas
  const totalReceived = financialRecords
    .filter((r) => r.status === 'paid')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  const totalPending = financialRecords
    .filter((r) => r.status === 'pending')
    .reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Envio de nova cobrança garantindo e-mail padronizado e limpo
  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!formData.student_id || !formData.amount) return;

    const selectedStudent = getStudent(formData.student_id);
    const cleanEmail = selectedStudent?.email ? String(selectedStudent.email).toLowerCase().trim() : null;

    const payload = {
      student_id: formData.student_id,
      amount: parseFloat(formData.amount),
      due_date: formData.due_date,
      status: formData.status,
      student_email: cleanEmail,
      description: formData.notes,
      notes: formData.notes
    };

    if (onSaveRecord) {
      await onSaveRecord(payload);
    }

    setFormData({
      student_id: '',
      amount: '',
      due_date: getTodayDate(),
      status: 'pending',
      notes: 'Mensalidade'
    });
    setShowModal(false);
  };

  // Garante envio limpo do ID (evita o erro [object Object])
  const handleToggle = (record) => {
    if (onTogglePayment) {
      const recordId = typeof record === 'object' ? record.id : record;
      onTogglePayment(recordId, record);
    }
  };

  // Garante envio seguro do ID para exclusão
  const handleDelete = (record) => {
    if (window.confirm('Tem certeza de que deseja excluir esta cobrança?')) {
      if (onDeleteRecord) {
        const recordId = typeof record === 'object' ? record.id : record;
        onDeleteRecord(recordId);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icone nome="Dollar" className="w-6 h-6 text-emerald-400" />
            Gestão Financeira
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Acompanhe pagamentos, mensalidades pendentes e histórico financeiro.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2"
        >
          <Icone nome="Plus" className="w-4 h-4" />
          <span>Lançar Cobrança</span>
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Total Recebido (Pago)
          </span>
          <p className="text-2xl font-black text-emerald-400">
            R$ {totalReceived.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            A Receber (Pendente)
          </span>
          <p className="text-2xl font-black text-amber-400">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800/60 p-4 rounded-xl">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Icone nome="Busca" className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail do aluno..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 text-white text-sm rounded-lg focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider whitespace-nowrap">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-400 w-full md:w-auto"
          >
            <option value="all">Todas ({financialRecords.length})</option>
            <option value="paid">Pagas</option>
            <option value="pending">Pendentes</option>
          </select>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      {filteredRecords.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="inline-flex p-3 bg-slate-800/50 rounded-2xl text-slate-500">
            <Icone nome="Dollar" className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">Nenhuma cobrança encontrada</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Tente alterar os filtros de busca para encontrar o registro.'
              : 'Clique no botão acima para lançar a primeira cobrança para seus alunos.'}
          </p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4">Aluno</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Vencimento</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-4 font-semibold text-white">
                      {getStudentName(record.student_id)}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {record.notes || record.description || 'Mensalidade'}
                    </td>
                    <td className="p-4 text-slate-300 text-xs">
                      {record.due_date
                        ? new Date(`${record.due_date}T00:00:00`).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="p-4 font-bold text-white">
                      R$ {Number(record.amount || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                          record.status === 'paid'
                            ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                            : 'bg-amber-950/60 border-amber-500/30 text-amber-400'
                        }`}
                      >
                        <Icone nome={record.status === 'paid' ? 'Check' : 'Clock'} className="w-3.5 h-3.5" />
                        {record.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(record)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                            record.status === 'paid'
                              ? 'bg-slate-800 text-slate-400 hover:text-white border-slate-700'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          }`}
                        >
                          {record.status === 'paid' ? 'Marcar Pendente' : 'Marcar como Pago'}
                        </button>

                        {onDeleteRecord && (
                          <button
                            onClick={() => handleDelete(record)}
                            title="Excluir Cobrança"
                            className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl transition-all"
                          >
                            <Icone nome="Lixeira" className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Lançar Cobrança */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <h3 className="text-lg font-bold text-white">Lançar Nova Cobrança</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all"
              >
                <Icone nome="Fechar" className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Aluno *
                </label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
                >
                  <option value="" disabled>Selecione o aluno</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name ? `${s.name} (${s.email})` : s.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Valor (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Ex: 150.00"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição / Observação
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ex: Mensalidade"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-400 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/10"
                >
                  Salvar Cobrança
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}