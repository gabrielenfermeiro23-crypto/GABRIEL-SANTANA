import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';

// Páginas
import Auth from './pages/Auth';
import Dashboard from './pages/personal/Dashboard';
import StudentPortal from './pages/aluno/StudentPortal';

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null); // 'aluno' | 'personal'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para identificar se o usuário é Aluno ou Personal
    const checkUserRoleAndSession = async (currentSession) => {
      if (!currentSession?.user) {
        setSession(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);

      try {
        const user = currentSession.user;

        // 1. Checa no metadata do Supabase Auth
        let rawRole = user.user_metadata?.role;

        // Normaliza 'student' -> 'aluno'
        let detectedRole = (rawRole === 'student' || rawRole === 'aluno') ? 'aluno' : rawRole;

        // 2. Se não encontrou no metadata, consulta na tabela 'students'
        if (!detectedRole) {
          const { data: studentData, error } = await supabase
            .from('students')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          if (!error && studentData) {
            detectedRole = 'aluno';
          } else {
            detectedRole = 'personal';
          }
        }

        setUserRole(detectedRole);
      } catch (err) {
        console.error('Erro ao determinar perfil:', err);
        // Em caso de erro crítico de rede, mantemos sem perfil por segurança
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    // 1. Verifica a sessão inicial ao carregar
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserRoleAndSession(session);
    });

    // 2. Listener em tempo real para Login / Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true); // Evita oscilação de tela na troca de estado
      checkUserRoleAndSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função de Logout
  const handleSignOut = async () => {
    try {
      if (supabase) await supabase.auth.signOut();
    } catch (error) {
      console.error('Erro ao sair:', error);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setSession(null);
      setUserRole(null);
      window.location.reload();
    }
  };

  // Tela de Loading de Permissões
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // 1. Não logado -> Tela de Login / Cadastro
  if (!session) {
    return <Auth />;
  }

  // 2. Visão do Aluno
  if (userRole === 'aluno') {
    return (
      <StudentPortal
        session={session}
        onSignOut={handleSignOut}
        studentData={session.user?.user_metadata}
      />
    );
  }

  // 3. Visão do Personal Trainer (Default fallback para segurança de contas de personal)
  return (
    <Dashboard 
      session={session} 
      onSignOut={handleSignOut} 
    />
  );
}