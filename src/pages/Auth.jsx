import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('personal') // 'personal' ou 'student'
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      if (isSignUp) {
        // CADASTRAR COM METADADOS
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role
            }
          }
        })
        if (error) throw error
        setMessage('Cadastro realizado! Verifique seu e-mail de confirmação.')
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      }
    } catch (error) {
      setMessage(error.message || 'Ocorreu um erro ao processar a solicitação.')
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsSignUp(!isSignUp)
    setMessage('')
  }

  const theme = {
    bgPrincipal: '#000A1D',
    azulPrincipal: '#008CFF',
    azulEletrico: '#00BFFF',
    textoBranco: '#FFFFFF',
    textoSecundario: '#D9E2F0'
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      position: 'relative',
      backgroundColor: theme.bgPrincipal,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px 16px',
      boxSizing: 'border-box',
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      overflow: 'hidden'
    }}>

      {/* CAMADA DA IMAGEM DE FUNDO COM SUPORTE E FALLBACK */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: "url('/bg-meupersonal.png'), radial-gradient(circle at center, #001232 0%, #000a1d 100%)",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        zIndex: 1,
        opacity: 1
      }} />

      {/* OVERLAY SUAVE */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 10, 29, 0.45)',
        zIndex: 2
      }} />

      {/* CONTEÚDO PRINCIPAL */}
      <div style={{ position: 'relative', zIndex: 3, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* CABEÇALHO */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '2px',
            color: theme.azulEletrico,
            textTransform: 'uppercase',
            marginBottom: 4,
            textShadow: '0 0 12px rgba(0, 191, 255, 0.8)'
          }}>
            SUPERE SEUS LIMITES • TRANSFORME SUA VIDA
          </div>
          
          <h1 style={{
            fontSize: 36,
            fontWeight: 900,
            margin: '0 0 2px 0',
            color: theme.textoBranco,
            letterSpacing: '-0.5px'
          }}>
            Meu<span style={{ color: theme.azulPrincipal }}>Personal</span> <span style={{ color: theme.azulEletrico, fontSize: 22 }}>App</span>
          </h1>
        </div>

        {/* CARD DE LOGIN / CADASTRO (GLASSMORPHISM) */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(0, 18, 50, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          padding: '28px 24px',
          borderRadius: 22,
          border: '1px solid rgba(0, 191, 255, 0.4)',
          boxShadow: '0 16px 40px rgba(0, 10, 29, 0.85), 0 0 25px rgba(0, 191, 255, 0.2)',
          boxSizing: 'border-box'
        }}>
          <h2 style={{ margin: '0 0 4px 0', fontSize: 18, textAlign: 'center', color: theme.textoBranco }}>
            {isSignUp ? 'Criar sua conta' : 'Bem-vindo de volta!'}
          </h2>
          <p style={{ margin: '0 0 20px 0', fontSize: 13, textAlign: 'center', color: theme.textoSecundario }}>
            {isSignUp ? 'Preencha os dados abaixo para se cadastrar' : 'Faça login para continuar sua jornada'}
          </p>

          {message && (
            <div style={{
              padding: '10px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 12,
              textAlign: 'center',
              background: message.includes('realizado') ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)',
              border: message.includes('realizado') ? '1px solid #10b981' : '1px solid #ef4444',
              color: message.includes('realizado') ? '#6ee7b7' : '#f87171'
            }}>
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            
            {/* NOVO: CAMPO DE NOME NO CADASTRO */}
            {isSignUp && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textoSecundario, display: 'block', marginBottom: 5 }}>
                  NOME COMPLETO
                </label>
                <input 
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required={isSignUp}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(0, 191, 255, 0.35)',
                    background: 'rgba(0, 10, 29, 0.85)',
                    color: theme.textoBranco,
                    outline: 'none',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* NOVO: SELEÇÃO DE TIPO DE CONTA NO CADASTRO */}
            {isSignUp && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: theme.textoSecundario, display: 'block', marginBottom: 5 }}>
                  TIPO DE CONTA
                </label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(0, 191, 255, 0.35)',
                    background: 'rgba(0, 10, 29, 0.85)',
                    color: theme.textoBranco,
                    outline: 'none',
                    fontSize: 14,
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="personal" style={{ background: theme.bgPrincipal }}>Personal Trainer</option>
                  <option value="student" style={{ background: theme.bgPrincipal }}>Aluno</option>
                </select>
              </div>
            )}

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.textoSecundario, display: 'block', marginBottom: 5 }}>
                E-MAIL
              </label>
              <input 
                type="email"
                placeholder="meupersonalapp@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(0, 191, 255, 0.35)',
                  background: 'rgba(0, 10, 29, 0.85)',
                  color: theme.textoBranco,
                  outline: 'none',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: theme.textoSecundario, display: 'block', marginBottom: 5 }}>
                SENHA
              </label>
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(0, 191, 255, 0.35)',
                  background: 'rgba(0, 10, 29, 0.85)',
                  color: theme.textoBranco,
                  outline: 'none',
                  fontSize: 14,
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              style={{
                width: '100%',
                padding: '13px',
                background: `linear-gradient(135deg, ${theme.azulPrincipal} 0%, ${theme.azulEletrico} 100%)`,
                color: theme.textoBranco,
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 18px rgba(0, 140, 255, 0.5)',
                marginTop: 6
              }}
            >
              {loading ? 'Aguarde...' : isSignUp ? 'Cadastrar' : 'Entrar'}
            </button>
          </form>

          <div style={{ marginTop: 18, textAlign: 'center', fontSize: 13, color: theme.textoSecundario }}>
            {isSignUp ? 'Já tem uma conta? ' : 'Não tem uma conta? '}
            <button 
              type="button"
              onClick={toggleMode} 
              style={{
                background: 'none',
                border: 'none',
                color: theme.azulEletrico,
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </div>
        </div>

        {/* RODAPÉ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          maxWidth: 520,
          marginTop: 32,
          width: '100%',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ color: theme.azulEletrico, fontSize: 16 }}>🏋️‍♂️</div>
            <p style={{ fontSize: 10, fontWeight: 800, color: theme.textoBranco, margin: '4px 0 2px 0', textTransform: 'uppercase' }}>
              TREINOS PERSONALIZADOS
            </p>
            <p style={{ fontSize: 10, color: theme.textoSecundario, margin: 0 }}>Feitos para você</p>
          </div>

          <div style={{ borderLeft: '1px solid rgba(0, 191, 255, 0.25)', borderRight: '1px solid rgba(0, 191, 255, 0.25)' }}>
            <div style={{ color: theme.azulEletrico, fontSize: 16 }}>📈</div>
            <p style={{ fontSize: 10, fontWeight: 800, color: theme.textoBranco, margin: '4px 0 2px 0', textTransform: 'uppercase' }}>
              ACOMPANHE O PROGRESSO
            </p>
            <p style={{ fontSize: 10, color: theme.textoSecundario, margin: 0 }}>Evolua todo dia</p>
          </div>

          <div>
            <div style={{ color: theme.azulEletrico, fontSize: 16 }}>⚡</div>
            <p style={{ fontSize: 10, fontWeight: 800, color: theme.textoBranco, margin: '4px 0 2px 0', textTransform: 'uppercase' }}>
              MAIS SAÚDE & VIDA
            </p>
            <p style={{ fontSize: 10, color: theme.textoSecundario, margin: 0 }}>Corpo e mente</p>
          </div>
        </div>

      </div>

    </div>
  )
}