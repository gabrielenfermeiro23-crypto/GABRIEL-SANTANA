import React from 'react';

export default function SidebarStudent({ activeTab, setActiveTab, onSignOut, studentData, theme }) {
  // Item 'my-financial' removido para evitar redundância
  const menuItems = [
    { id: 'my-workouts', label: 'Meus Treinos', icon: '🏋️' },
    { id: 'my-progress', label: 'Minha Evolução', icon: '📈' },
    { id: 'my-profile', label: 'Meu Perfil', icon: '👤' },
  ];

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
      console.error("Erro no logout:", error);
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <aside 
      className="w-72 min-h-screen p-5 flex flex-col justify-between border-r shadow-2xl z-20 shrink-0"
      style={{ backgroundColor: theme?.bgCard || '#141414', borderColor: theme?.border || '#262626' }}
    >
      <div className="space-y-6">
        {/* Header do Aluno */}
        <div 
          onClick={() => setActiveTab('my-profile')} 
          className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-black/50 border border-zinc-800 cursor-pointer hover:border-emerald-400 transition-all group"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-400 text-black font-extrabold text-lg flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
            {studentData?.name ? studentData.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
              {studentData?.name || 'Aluno'}
            </p>
            <p className="text-xs font-semibold text-emerald-400">Área do Aluno</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const active = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full min-h-[52px] flex items-center gap-3.5 px-4 py-3 rounded-2xl text-sm font-bold transition-all text-left ${
                  active
                    ? 'bg-emerald-400 text-black shadow-lg shadow-emerald-500/25 scale-[1.01]'
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

      {/* Sair */}
      <button
        onClick={handleLogoutClick}
        className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-400 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 transition-all mt-4 cursor-pointer"
      >
        <span className="text-base">🚪</span> Sair da Conta
      </button>
    </aside>
  );
}