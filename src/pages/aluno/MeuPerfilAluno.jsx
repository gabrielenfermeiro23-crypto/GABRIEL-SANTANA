import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

export default function MeuPerfilAluno() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [userId, setUserId] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
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
        setPhone(data.phone || '')
        setAvatarUrl(data.avatar_url || '')
        // Garante o e-mail preenchido se já existir no banco
        if (data.email) setEmail(data.email)
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
      const filePath = `alunos/${userId}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      setAvatarUrl(data.publicUrl)

      await supabase.from('profiles').upsert({ id: userId, avatar_url: data.publicUrl })
      
      // 🔔 Dispara evento para atualizar a foto na Sidebar/Header do Aluno
      window.dispatchEvent(new Event('profileUpdated'))

      setMessage({ type: 'success', text: 'Foto atualizada com sucesso!' })
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
      // 1. Atualiza a senha no Auth se preenchida
      if (newPassword) {
        const { error: pwdError } = await supabase.auth.updateUser({ password: newPassword })
        if (pwdError) throw pwdError
      }

      // 2. Trata o telefone para manter apenas dígitos (ideal para automação do WhatsApp)
      const cleanedPhone = phone ? phone.replace(/\D/g, '') : ''

      // 3. Objeto completo enviado à tabela profiles
      const updates = {
        id: userId,
        full_name: fullName,
        email: email,             // ✉️ Salva o e-mail no SQL
        phone: cleanedPhone,      // 📱 Telefone limpo para envios de mensagens
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('profiles').upsert(updates)
      if (error) throw error

      setNewPassword('')
      setMessage({ type: 'success', text: 'Seus dados foram atualizados com sucesso!' })

      // 🔔 Dispara evento para atualizar o nome/avatar na Sidebar do Aluno em tempo real
      window.dispatchEvent(new Event('profileUpdated'))

    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Erro ao salvar alterações.' })
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

  if (loading) return <div style={{ color: '#fff', padding: 20 }}>Carregando perfil...</div>

  return (
    <div style={{ width: '100%', maxWidth: 700, margin: '0 auto', color: '#fff' }}>
      
      {/* HEADER ALUNO */}
      <div style={{
        background: 'linear-gradient(135deg, #0A192F 0%, #020C1B 100%)',
        borderRadius: '20px 20px 0 0',
        padding: '24px',
        border: '1px solid rgba(0, 191, 255, 0.3)',
        borderBottom: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 16
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 75, height: 75, borderRadius: '50%', border: '3px solid #00BFFF',
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#001A3A', fontSize: 28, fontWeight: 900, color: '#00BFFF'
          }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              fullName ? fullName.charAt(0).toUpperCase() : 'A'
            )}
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
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{fullName || 'Aluno'}</h2>
          <p style={{ margin: '4px 0 0 0', color: '#00BFFF', fontSize: 13, fontWeight: 700 }}>
            Perfil de Aluno
          </p>
        </div>
      </div>

      {/* FORMULÁRIO ALUNO */}
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
          <div>
            <label style={styles.label}>Nome Completo</label>
            <input 
              type="text" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              style={styles.input} 
              required 
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={styles.label}>E-mail</label>
              <input 
                type="email" 
                value={email} 
                disabled 
                style={{ ...styles.input, opacity: 0.5, cursor: 'not-allowed' }} 
              />
            </div>
            <div>
              <label style={styles.label}>Alterar Senha</label>
              <input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Nova senha se desejar" 
                style={styles.input} 
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Telefone / WhatsApp</label>
            <input 
              type="text" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="(00) 00000-0000" 
              style={styles.input} 
            />
          </div>

          <button 
            type="submit" 
            disabled={saving || uploading} 
            style={{
              padding: '12px 24px', 
              background: 'linear-gradient(135deg, #008CFF 0%, #00BFFF 100%)',
              color: '#FFF', 
              border: 'none', 
              borderRadius: 10, 
              fontWeight: 800, 
              fontSize: 14,
              cursor: saving || uploading ? 'not-allowed' : 'pointer', 
              alignSelf: 'flex-end', 
              marginTop: 10,
              opacity: saving || uploading ? 0.6 : 1
            }}
          >
            {saving ? 'Salvando...' : 'Atualizar Meus Dados'}
          </button>
        </form>
      </div>

    </div>
  )
}