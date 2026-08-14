import React, { useState, useEffect } from 'react';
import { supabase } from "../../../lib/supabase";

export default function PersonalProfileTab({ onSignOut, theme }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profile, setProfile] = useState({
    name: '',
    cref: '',
    email: '',
    phone: '',
    bio: ''
  });

  // 1. Carrega os dados reais do Supabase
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile({
          name: data.full_name || '',
          cref: data.cref || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
          bio: data.bio || ''
        });
      } else {
        // Se ainda não existir no profiles, usa pelo menos o e-mail da Auth
        setProfile((prev) => ({ ...prev, email: user.email || '' }));
      }
    } catch (error) {
      console.error('Erro ao buscar perfil do personal:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  // 2. Salva e persiste os dados atualizados no Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
        else throw new Error('Usuário não autenticado.');
      }

      // Limpa o telefone para manter só números (preparado para WhatsApp)
      const cleanedPhone = profile.phone ? profile.phone.replace(/\D/g, '') : '';

      const updates = {
        id: userId,
        full_name: profile.name,
        cref: profile.cref,
        email: profile.email,
        phone: cleanedPhone,
        bio: profile.bio,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil do Personal atualizado com sucesso!' });

      // 🔔 Dispara evento para a Sidebar atualizar o nome e foto em tempo real
      window.dispatchEvent(new Event('profileUpdated'));

    } catch (error) {
      console.error('Erro ao salvar no banco:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar alterações.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-zinc-400 font-bold">
        Carregando dados do perfil...
      </div>
    );
  }

  return (
    <div 
      className="max-w-4xl mx-auto rounded-2xl border overflow-hidden shadow-2xl" 
      style={{ backgroundColor: theme?.bgCard || '#141414', borderColor: theme?.border || '#262626' }}
    >
      {/* Banner de Capa */}
      <div 
        className="h-52 w-full bg-cover bg-center relative border-b"
        style={{ backgroundImage: "url('/bg-meupersonal.png')", borderColor: theme?.border || '#262626' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex items-end p-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-cyan-400 bg-zinc-900 flex items-center justify-center font-bold text-4xl text-cyan-400 shadow-2xl">
              {profile.name ? profile.name[0].toUpperCase() : 'P'}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-wide">
                {profile.name || 'Personal Trainer'}
              </h2>
              <p className="text-base text-cyan-400 font-bold tracking-wider mt-1">
                CREF: {profile.cref || 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Formulário com tipografia ampliada */}
      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        
        {/* Mensagem de Sucesso ou Erro */}
        {message.text && (
          <div className={`p-4 rounded-xl text-center text-sm font-bold border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : 'bg-red-500/10 text-red-400 border-red-500/30'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-base font-semibold mb-2 text-zinc-200">Nome Completo</label>
            <input 
              type="text" 
              name="name" 
              value={profile.name} 
              onChange={handleChange} 
              placeholder="Seu nome completo"
              required
              className="w-full p-4 text-base rounded-xl bg-black/60 border border-zinc-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" 
            />
          </div>

          <div>
            <label className="block text-base font-semibold mb-2 text-zinc-200">Registro CREF</label>
            <input 
              type="text" 
              name="cref" 
              value={profile.cref} 
              onChange={handleChange} 
              placeholder="000000-G/SP"
              className="w-full p-4 text-base rounded-xl bg-black/60 border border-zinc-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" 
            />
          </div>

          <div>
            <label className="block text-base font-semibold mb-2 text-zinc-200">E-mail de Contato</label>
            <input 
              type="email" 
              name="email" 
              value={profile.email} 
              onChange={handleChange} 
              placeholder="seuemail@exemplo.com"
              className="w-full p-4 text-base rounded-xl bg-black/60 border border-zinc-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" 
            />
          </div>

          <div>
            <label className="block text-base font-semibold mb-2 text-zinc-200">Telefone / WhatsApp</label>
            <input 
              type="text" 
              name="phone" 
              value={profile.phone} 
              onChange={handleChange} 
              placeholder="(00) 00000-0000"
              className="w-full p-4 text-base rounded-xl bg-black/60 border border-zinc-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="block text-base font-semibold mb-2 text-zinc-200">Biografia Profissional</label>
          <textarea 
            name="bio" 
            rows="4" 
            value={profile.bio} 
            onChange={handleChange} 
            placeholder="Descreva suas especialidades, formações e área de atuação..."
            className="w-full p-4 text-base rounded-xl bg-black/60 border border-zinc-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 resize-none transition-all" 
          />
        </div>

        {/* Botões do Rodapé */}
        <div className="flex items-center justify-between pt-6 border-t border-zinc-800">
          <button 
            type="submit" 
            disabled={saving}
            className="px-8 py-4 rounded-xl text-base font-bold bg-cyan-400 text-black hover:bg-cyan-300 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          <button 
            type="button"
            onClick={onSignOut}
            className="px-8 py-4 rounded-xl text-base font-bold bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-all cursor-pointer"
          >
            Sair da Conta
          </button>
        </div>
      </form>
    </div>
  );
}