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

        // 1. Checa primeiro no metadata do Supabase Auth
        let role = user.user_metadata?.role;

        // 2. Se não estiver no metadata, busca na tabela 'students'
        if (!role || (role !== 'aluno' && role !== 'student')) {
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('email', user.email)
            .maybeSingle();

          if (studentData) {
            role = 'aluno';
          } else {
            role = 'personal';
          }
        }

        setUserRole(role === 'student' ? 'aluno' : role);
      } catch (err) {
        console.error('Erro ao determinar perfil:', err);
        setUserRole('personal');
      } finally {
        setLoading(false);
      }
    };

    // 1. Verifica sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserRoleAndSession(session);
    });

    // 2. Listener para Login / Logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  // Carregando
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

  // Não logado -> Tela de Auth
  if (!session) {
    return <Auth />;
  }

  // ==========================================
  // 1. VISÃO EXCLUSIVA DO ALUNO
  // ==========================================
  if (userRole === 'aluno' || userRole === 'student') {
    return (
      <StudentPortal
        session={session}
        onSignOut={handleSignOut}
        studentData={session.user?.user_metadata}
      />
    );
  }

  // ==========================================
  // 2. VISÃO EXCLUSIVA DO PERSONAL
  // ==========================================
  return (
    <Dashboard 
      session={session} 
      onSignOut={handleSignOut} 
    />
  );
}