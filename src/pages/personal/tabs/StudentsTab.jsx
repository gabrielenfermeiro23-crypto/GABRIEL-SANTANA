import React, { useState } from 'react';

// Ícones SVG inline
const Icone = ({ nome, className = "w-5 h-5" }) => {
  const icones = {
    UserPlus: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    ),
    Search: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    ),
    User: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    ),
    Key: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
    ),
    Pencil: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    )
  };

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icones[nome]}
    </svg>
  );
};

export default function StudentsTab({
  students = [],
  onSelectStudent,
  onOpenModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Filtra alunos por nome/email e por status
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Aba */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icone nome="User" className="w-6 h-6 text-cyan-400" />
            Meus Alunos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gerencie o cadastro, acessos e perfil de cada aluno.
          </p>
        </div>

        <button
          onClick={() => onOpenModal && onOpenModal(null)}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
        >
          <Icone nome="UserPlus" className="w-4 h-4" />
          <span>Cadastrar Aluno</span>
        </button>
      </div>

      {/* Busca e Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-500">
            <Icone nome="Search" className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar aluno por nome ou e-mail..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 transition-all placeholder:text-slate-600"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-cyan-400 transition-all"
        >
          <option value="all">Todos os Status ({students.length})</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos / Pendentes</option>
        </select>
      </div>

      {/* Lista / Grid de Alunos */}
      {filteredStudents.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-800 border-dashed rounded-2xl p-12 text-center space-y-3">
          <div className="inline-flex p-3 bg-slate-800/50 rounded-2xl text-slate-500">
            <Icone nome="User" className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-300">Nenhum aluno encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Cadastre seu primeiro aluno para começar a prescrever treinos e acompanhar avaliações.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all space-y-4 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Nome, Status e Botão Editar */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {student.name}
                    </h3>
                    <p className="text-xs text-slate-400">{student.email || 'Sem e-mail'}</p>
                  </div>
                  
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                    student.status === 'active' || !student.status
                      ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-950/60 border-rose-500/30 text-rose-400'
                  }`}>
                    {student.status === 'active' || !student.status ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {/* Detalhes do Aluno */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  {student.phone && (
                    <p><strong className="text-slate-500">Tel:</strong> {student.phone}</p>
                  )}
                  {student.plan && (
                    <p><strong className="text-slate-500">Plano:</strong> {student.plan}</p>
                  )}
                  
                  {/* Código de Acesso do Aluno */}
                  <div className="pt-2 flex items-center gap-2">
                    <span className="p-1 bg-cyan-950/80 border border-cyan-500/20 text-cyan-400 rounded-lg">
                      <Icone nome="Key" className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Código de Acesso: <strong className="text-white font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{student.access_code || 'Não gerado'}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => onOpenModal && onOpenModal(student)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all text-xs flex items-center gap-1"
                  title="Editar Aluno"
                >
                  <Icone nome="Pencil" className="w-4 h-4" />
                  <span>Editar</span>
                </button>

                <button
                  onClick={() => onSelectStudent && onSelectStudent(student)}
                  className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-semibold rounded-xl text-xs transition-all"
                >
                  Ver Perfil Completo →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}