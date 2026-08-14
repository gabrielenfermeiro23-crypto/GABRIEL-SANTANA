import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Ajuste o caminho se necessário

export default function Sidebar({ activeTab, setActiveTab, setSelectedStudent, onSignOut, theme }) {
  // Estado para armazenar os dados reais do perfil
  const [profile, setProfile] = useState({
    fullName: '',
    avatarUrl: ''
  });

  const menuItems = [
    { id: 'students', label: 'Meus Alunos', icon: '👥' },
    { id: 'workout', label: 'Montar Treinos', icon: '📋' },
    { id: 'exercises', label: 'Banco de Exercícios', icon: '🏋️' },
    { id: 'progress', label: 'Progresso & Avaliação', icon: '📈' },
    { id: 'financial', label: 'Gestão Financeira', icon: '💰' },
    { id: 'profile', label: 'Meu Perfil', icon: '👤' },
  ];

  // 1. Função para carregar perfil do banco
  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (data && !error) {
        setProfile({
          fullName: data.full_name || '',
          avatarUrl: data.avatar_url || ''
        });
      }
    } catch (err) {
      console.error('Erro ao carregar perfil na Sidebar:', err);
    }
  };

  // 2. Carrega ao montar o componente e escuta alterações em tempo real
  useEffect(() => {
    loadUserProfile();

    // Evento escutado quando o usuário clica em "Salvar" no perfil
    window.addEventListener('profileUpdated', loadUserProfile);

    return () => {
      window.removeEventListener('profileUpdated', loadUserProfile);
    };
  }, []);

  const handleTabChange = (tabId) => {
    if (setSelectedStudent) setSelectedStudent(null);
    setActiveTab(tabId);
  };

  const isItemActive = (itemId) => {
    if (activeTab === itemId) return true;
    if (itemId === 'progress' && (activeTab === 'assessment' || activeTab === 'historico')) return true;
    return false;
  };

  const handleLogoutClick = async () => {
    try {
      if (onSignOut) {
        await onSignOut();
      } else {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (error) {
      console.error("Erro ao efetuar logout no Sidebar:", error);
      localStorage.clear();
      window.location.reload();
    }
  };

  // Primeira letra do nome para o fallback do avatar
  const initialLetter = profile.fullName 
    ? profile.fullName.charAt(0).toUpperCase() 
    : 'P';

  return (
    <aside 
      className="w-72 min-h-screen p-5 flex flex-col justify-between border-r shadow-2xl z-20 shrink-0"
      style={{ backgroundColor: theme?.bgCard || '#141414', borderColor: theme?.border || '#262626' }}
    >
      <div className="space-y-6">
        
        {/* Header Personal Dinâmico */}
        <div 
          onClick={() => handleTabChange('profile')} 
          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/50 border border-zinc-800 cursor-pointer hover:border-cyan-400 transition-all group"
        >
          {/* Avatar com Foto ou Inicial do Nome */}
          <div className="w-11 h-11 rounded-full bg-cyan-400 text-black font-extrabold text-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 shrink-0 overflow-hidden">
            {profile.avatarUrl ? (
              <img 
                src={profile.avatarUrl} 
                alt="Foto do perfil" 
                className="w-full h-full object-cover"
              />
            ) : (
              initialLetter
            )}
          </div>

          <div className="min-w-0">
            <p className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors truncate">
              {profile.fullName || 'Personal'}
            </p>
            <p className="text-xs font-semibold text-cyan-400">Painel Geral</p>
          </div>
        </div>

        {/* Links do Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active = isItemActive(item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full min-h-[52px] flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
                  active
                    ? 'bg-cyan-400 text-black shadow-lg shadow-cyan-500/25 scale-[1.01]'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-lg shrink-0 flex items-center justify-center w-6">{item.icon}</span>
                <span className="leading-tight truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Botão de Sair */}
      <button
        onClick={handleLogoutClick}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all mt-4 cursor-pointer"
      >
        <span className="text-base">🚪</span> Sair da Conta
      </button>
    </aside>
  );
}