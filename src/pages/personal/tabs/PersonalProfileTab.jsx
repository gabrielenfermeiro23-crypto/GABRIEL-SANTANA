import React, { useState, useEffect } from 'react';
import { User, Camera, ShieldCheck, Mail, Phone, FileText, Share2, Globe, Save, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase.js';
import toast from 'react-hot-toast';

export default function PersonalProfileTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    full_name: '',
    cref: '',
    email: '',
    phone: '',
    bio: '',
    instagram: '',
    website: '',
    avatar_url: '',
    custom_logo_url: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            id: user.id,
            full_name: data.full_name || data.name || '',
            cref: data.cref || '',
            email: user.email || data.email || '',
            phone: data.phone || '',
            bio: data.bio || '',
            instagram: data.instagram || '',
            website: data.website || '',
            avatar_url: data.avatar_url || '',
            custom_logo_url: data.custom_logo_url || ''
          });
        } else {
          setProfile((prev) => ({
            ...prev,
            id: user.id,
            email: user.email || ''
          }));
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toast.error('Erro ao carregar dados do perfil.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) throw new Error('Usuário não autenticado.');

      const payload = {
        id: user.id,
        full_name: profile.full_name,
        cref: profile.cref,
        phone: profile.phone,
        bio: profile.bio,
        instagram: profile.instagram,
        website: profile.website,
        avatar_url: profile.avatar_url,
        custom_logo_url: profile.custom_logo_url,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;

      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      toast.error('Erro ao salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="ml-3 font-semibold">Carregando dados do perfil...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* BANNER / FOTO DE CAPA E AVATAR */}
        <div className="relative rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-xl">
          <div className="h-36 w-full bg-gradient-to-r from-cyan-900 via-zinc-900 to-zinc-950 relative">
            <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
          </div>

          <div className="px-6 pb-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 -mt-16 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-zinc-800 border-4 border-zinc-900 overflow-hidden shadow-2xl flex items-center justify-center text-cyan-400 font-extrabold text-3xl uppercase">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : (
                    profile.full_name?.slice(0, 2) || 'PT'
                  )}
                </div>
              </div>

              <div className="mb-2">
                <h2 className="text-2xl font-black text-white">{profile.full_name || 'Personal Trainer'}</h2>
                <p className="text-sm font-semibold text-cyan-400 flex items-center justify-center md:justify-start gap-1">
                  <ShieldCheck size={16} /> CREF: {profile.cref || 'Não informado'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-cyan-400/20 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {/* INFORMAÇÕES PESSOAIS & PROFISSIONAIS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <User className="text-cyan-400" size={20} /> Informações Principais
            </h3>
            <p className="text-xs text-zinc-400">Estes dados serão exibidos nos relatórios PDF emitidos para seus alunos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Nome Completo</label>
              <input
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Ex: Maria Joyce Ambrozio"
                className="w-full bg-zinc-800/80 text-white font-medium px-4 py-3 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Registro CREF</label>
              <input
                type="text"
                name="cref"
                value={profile.cref}
                onChange={handleChange}
                placeholder="Ex: 014029-G/PB"
                className="w-full bg-zinc-800/80 text-white font-medium px-4 py-3 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">E-mail de Contato</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  disabled
                  className="w-full bg-zinc-800/40 text-zinc-400 font-medium pl-10 pr-4 py-3 rounded-xl border border-zinc-800 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Telefone / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="text"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="Ex: (83) 99118-9562"
                  className="w-full bg-zinc-800/80 text-white font-medium pl-10 pr-4 py-3 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Biografia Profissional / Apresentação</label>
            <textarea
              name="bio"
              rows={3}
              value={profile.bio}
              onChange={handleChange}
              placeholder="Descreva suas especialidades, formações acadêmicas e área de atuação..."
              className="w-full bg-zinc-800/80 text-white font-medium p-4 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all resize-none text-sm"
            />
          </div>
        </div>

        {/* PERSONALIZAÇÃO DA CONSULTORIA / MIDIAS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Globe className="text-cyan-400" size={20} /> Presença Digital & Marca
            </h3>
            <p className="text-xs text-zinc-400">Links para suas redes sociais e URL da sua foto de perfil.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">Instagram (@usuario)</label>
              <div className="relative">
                <Share2 className="absolute left-3 top-3.5 text-zinc-500" size={18} />
                <input
                  type="text"
                  name="instagram"
                  value={profile.instagram}
                  onChange={handleChange}
                  placeholder="@seu.instagram"
                  className="w-full bg-zinc-800/80 text-white font-medium pl-10 pr-4 py-3 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase mb-2">URL da Foto de Perfil (Avatar)</label>
              <input
                type="url"
                name="avatar_url"
                value={profile.avatar_url}
                onChange={handleChange}
                placeholder="https://sua-imagem.com/foto.jpg"
                className="w-full bg-zinc-800/80 text-white font-medium px-4 py-3 rounded-xl border border-zinc-700 outline-none focus:border-cyan-400 transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* BOTÃO FLUTUANTE DE SALVAR NO RODAPÉ */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-cyan-400/20 active:scale-95 disabled:opacity-50 text-base"
          >
            {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
            {saving ? 'Guardando Alterações...' : 'Salvar Perfil Profissional'}
          </button>
        </div>

      </form>
    </div>
  );
}