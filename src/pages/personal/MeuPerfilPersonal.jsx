import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function MeuPerfilPersonal() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [cref, setCref] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) return
      setUserId(user.id)
      setEmail(user.email || '')

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setFullName(data.full_name || '')
        setCref(data.cref || '')
        setPhone(data.phone || '')
        setBio(data.bio || '')
        setAvatarUrl(data.avatar_url || '')
        setIsActive(data.is_active ?? true)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    try {
      setUploading(true)
      setMessage({ type: '', text: '' })
      const file = e.target.files[0]
      if (!file) return

      const fileExt = file.name.split('.').pop()
      const filePath = `personais/${userId}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)

      await supabase.from('profiles').upsert({ id: userId, avatar_url: data.publicUrl })
      setMessage({ type: 'success', text: 'Foto atualizada!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao carregar foto.' })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      if (newPassword) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
        if (pwdError) throw pwdError
      }

      const updates = {
        id: userId,
        full_name: fullName,
        cref: cref,
        phone: phone,
        bio: bio,
        is_active: isActive,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      setNewPassword('')
      setMessage({ type: 'success', text: 'Perfil do Personal atualizado com sucesso!' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar.' })
    } finally {
      setSaving(false)
    }
  }

  const styles = {
    input: {
      width: '100%',
      padding: '12px 14px',
      borderRadius: 10,
      border: '1px solid rgba(0, 191, 255, 0.25)',
      background: '#060E1E',
      color: '#FFFFFF',
      outline: 'none',
      fontSize: 14,
      boxSizing: 'border-box'
    },
    label: {
      fontSize: 11,
      fontWeight: 700,
      color: '#D9E2F0',
      display: 'block',
      marginBottom: 6,
      textTransform: 'uppercase'
    }
  }

  if (loading) return <div style={{ color: '#fff', padding: 20 }}>Carregando dados...</div>

  return (
    <div style={{ width: '100%', maxWidth: 850, margin: '0 auto', color: '#fff' }}>
      
      {/* HEADER PERSONAL */}
      <div style={{
        background: 'linear-gradient(135deg, #0A192F 0%, #020C1B 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '24px',
        border: '1px solid rgba(0, 191, 255, 0.3)',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 75, height: 75, borderRadius: '50%', border: '3px solid #00BFFF',
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#001A3A', fontSize: 28, fontWeight: 900, color: '#00BFFF'
            }}>
              {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (fullName ? fullName.charAt(0).toUpperCase() : 'P')}
            </div>
            <label style={{
              position: 'absolute', bottom: -2, right: -2, background: '#008CFF', padding: '6px',
              borderRadius: '50%', cursor: 'pointer', border: '2px solid #0A192F', fontSize: 11
            }}>
              📷
              <input type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} style={{ display: 'none' }} />
            </label>
          </div>

          <div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{fullName || 'Personal Trainer'}</h2>
            <p style={{ margin: '4px 0 0 0', color: '#00BFFF', fontSize: 13, fontWeight: 700 }}>
              CREF: {cref || 'Não cadastrado'}
            </p>
          </div>
        </div>

        {/* CONTROLE DE ATIVAÇÃO / INATIVAÇÃO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(0,0,0,0.3)', padding: '8px 14px', borderRadius: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? '#6ee7b7' : '#f87171' }}>
            {isActive ? '● Cadastro Ativo' : '● Cadastro Inativo'}
          </span>
          <button
            type="button"
            onClick={() => setIsActive(!isActive)}
            style={{
              padding: '6px 12px', borderRadius: 8, border: 'none',
              background: isActive ? '#ef4444' : '#10b981', color: '#fff',
              fontWeight: 700, fontSize: 11, cursor: 'pointer'
            }}
          >
            {isActive ? 'Desativar Conta' : 'Ativar Conta'}
          </button>
        </div>
      </div>

      {/* FORMULÁRIO PERSONAL */}
      <div style={{
        background: '#0A1220', borderRadius: '0 0 20px 20px', padding: 24,
        border: '1px solid rgba(0, 191, 255, 0.3)', boxSizing: 'border-box'
      }}>
        {message.text && (
          <div style={{
            padding: '10px', borderRadius: 8, marginBottom: 16, fontSize: 12, textAlign: 'center',
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
            color: message.type === 'success' ? '#6ee7b7' : '#f87171'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={styles.label}>Nome Completo</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} style={styles.input} required />
            </div>
            <div>
              <label style={styles.label}>Registro CREF</label>
              <input type="text" value={cref} onChange={(e) => setCref(e.target.value)} placeholder="000000-G/SP" style={styles.input} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={styles.label}>E-mail de Login</label>
              <input type="email" value={email} disabled style={{ ...styles.input, opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div>
              <label style={styles.label}>Nova Senha</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nova senha se desejar alterar" style={styles.input} />
            </div>
          </div>

          <div>
            <label style={styles.label}>Telefone / WhatsApp</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" style={styles.input} />
          </div>

          <div>
            <label style={styles.label}>Biografia Profissional</label>
            <textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Suas especialidades, metodologias..." style={{ ...styles.input, resize: 'vertical' }} />
          </div>

          <button type="submit" disabled={saving || uploading} style={{
            padding: '12px 24px', background: 'linear-gradient(135deg, #008CFF 0%, #00BFFF 100%)',
            color: '#FFF', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer', alignSelf: 'flex-end', marginTop: 10
          }}>
            {saving ? 'Salvando...' : 'Salvar Perfil de Personal'}
          </button>
        </form>
      </div>

    </div>
  )
}