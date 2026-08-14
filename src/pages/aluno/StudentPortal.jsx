import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import SidebarStudent from './SidebarStudent';
import StudentDashboard from './StudentDashboard';

// Ícones SVG inline para performance
const Icone = ({ nome, className = "w-5 h-5" }) => {
  const icones = {
    Haltere: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M6.5 4.5v15M17.5 4.5v15" />
    ),
    Chave: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 0121 9z" />
    ),
    SetaDireita: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    ),
    Sucesso: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  };

  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      {icones[nome]}
    </svg>
  );
};

export default function StudentPortal({ onStudentLogin, session, onSignOut, studentData: initialStudentData }) {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Estado do Aluno Logado
  const [loggedStudent, setLoggedStudent] = useState(initialStudentData || null);
  const [activeTab, setActiveTab] = useState('my-workouts');

  // URL do Papel de Parede da Academia
  const bgGymUrl = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop";

  // Verifica se o aluno já veio logado via sessão ou prop
  useEffect(() => {
    if (initialStudentData) {
      setLoggedStudent(initialStudentData);
    } else if (session?.user) {
      // Se tiver sessão Supabase, tenta buscar os dados do aluno
      fetchStudentBySession(session.user);
    }
  }, [session, initialStudentData]);

  const fetchStudentBySession = async (user) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!error && data) {
        setLoggedStudent(data);
      }
    } catch (err) {
      console.error('Erro ao buscar dados do aluno:', err);
    }
  };

  // Autenticação do aluno via Código de Acesso / CPF / Token / E-mail
  const handleAccess = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      // Busca o aluno no Supabase pelo access_code ou email
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`access_code.eq.${accessCode.trim()},email.eq.${accessCode.trim()}`)
        .single();

      if (error || !data) {
        throw new Error('Código de acesso inválido ou aluno não encontrado.');
      }

      // Aluno autenticado com sucesso
      setLoggedStudent(data);

      if (onStudentLogin) {
        onStudentLogin(data);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao conectar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Função para deslogar do Portal do Aluno
  const handleLogout = async () => {
    setLoggedStudent(null);
    setAccessCode('');
    if (onSignOut) {
      await onSignOut();
    } else {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  // =========================================================
  // 1. TELA INTERNA DO ALUNO (Sessão Ativa com Wallpaper)
  // =========================================================
  if (loggedStudent) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex overflow-hidden">
        {/* PAPEL DE PAREDE DE FUNDO */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-20"
          style={{ backgroundImage: `url("${bgGymUrl}")` }}
        />
        {/* OVERLAY DE GRADIENTE E LUZES */}
        <div className="fixed inset-0 bg-gradient-to-tr from-slate-950 via-slate-950/90 to-cyan-950/30 pointer-events-none z-0" />

        {/* Menu Lateral Exclusivo do Aluno */}
        <div className="relative z-10">
          <SidebarStudent
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onSignOut={handleLogout}
            studentData={loggedStudent}
          />
        </div>

        {/* Conteúdo das Abas do Aluno */}
        <main className="relative z-10 flex-1 p-6 overflow-y-auto">
          {activeTab === 'my-workouts' && (
            <StudentDashboard student={loggedStudent} />
          )}

          {activeTab === 'my-progress' && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-white">Minha Evolução</h2>
              <p className="text-slate-400 text-sm">
                Acompanhe aqui o histórico de avaliações físicas e relatórios de progresso.
              </p>
            </div>
          )}

          {activeTab === 'my-financial' && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-white">Minhas Mensalidades</h2>
              <p className="text-slate-400 text-sm">
                Confira o status de pagamento e histórico financeiro das suas mensalidades.
              </p>
            </div>
          )}

          {activeTab === 'my-profile' && (
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
              <h2 className="text-xl font-bold text-white">Meu Perfil</h2>
              <div className="text-slate-300 text-sm space-y-2">
                <p><strong>Nome:</strong> {loggedStudent.name}</p>
                <p><strong>E-mail:</strong> {loggedStudent.email || 'Não informado'}</p>
                <p><strong>Telefone:</strong> {loggedStudent.phone || 'Não informado'}</p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // =========================================================
  // 2. TELA DE LOGIN DO ALUNO (Com Wallpaper + Efeito Glass)
  // =========================================================
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 overflow-hidden">
      {/* PAPEL DE PAREDE DE FUNDO */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0 opacity-25"
        style={{ backgroundImage: `url("${bgGymUrl}")` }}
      />
      {/* OVERLAY ESCURO */}
      <div className="fixed inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/95 to-slate-950 pointer-events-none z-0" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        
        {/* Detalhe de iluminação de fundo */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header do Portal */}
        <div className="text-center space-y-3 mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-cyan-400">
            <Icone nome="Haltere" className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Portal do Aluno
          </h1>
          <p className="text-slate-400 text-sm">
            Digite seu código de acesso ou e-mail fornecido pelo seu Personal Trainer.
          </p>
        </div>

        {/* Formulário de Acesso */}
        <form onSubmit={handleAccess} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Código de Acesso ou E-mail
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-500">
                <Icone nome="Chave" className="w-5 h-5" />
              </span>
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Ex: 123456 ou seu@email.com"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Mensagem de Erro */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium text-center">
              {errorMsg}
            </div>
          )}

          {/* Botão de Entrar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Verificando...</span>
            ) : (
              <>
                <span>Acessar Meus Treinos</span>
                <Icone nome="SetaDireita" className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Rodapé informativo */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          Dúvidas sobre seu código? Entre em contato com seu Personal.
        </div>
      </div>
    </div>
  );
}