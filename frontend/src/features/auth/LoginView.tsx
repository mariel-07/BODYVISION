import React, { useState } from 'react'
import {
  Activity, ShieldCheck, Lock, Mail, ArrowRight,
  UserCheck, Stethoscope, ShieldAlert, KeyRound,
  Building2, Globe, CheckCircle2, ChevronLeft, Laptop
} from 'lucide-react'

export interface AuthUser {
  id: number
  email: string
  fullName: string
  role: string
  specialty?: string
}

interface LoginViewProps {
  onLogin: (user: AuthUser) => void
  onBackToLanding?: () => void
}

const DEMO_USERS: AuthUser[] = [
  {
    id: 1,
    email: 'valeria.morales@bodyvision.ai',
    fullName: 'Dra. Valeria Morales',
    role: 'Especialista',
    specialty: 'Biomecánica & Cinemática Postural'
  },
  {
    id: 2,
    email: 'admin@bodyvision.ai',
    fullName: 'Lic. Carlos Mendoza',
    role: 'Administrador',
    specialty: 'Administrador de Centro Clínico'
  },
  {
    id: 3,
    email: 'auditor@bodyvision.ai',
    fullName: 'Mg. Roberto Huamán',
    role: 'Auditor',
    specialty: 'Auditoría Ley 29733 / RGPD'
  }
]

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, onBackToLanding }) => {
  const [authMode, setAuthMode] = useState<'credentials' | 'sso'>('credentials')
  const [email, setEmail] = useState('valeria.morales@bodyvision.ai')
  const [password, setPassword] = useState('••••••••••••')
  const [orgCode, setOrgCode] = useState('BV-CLINICAL-PE01')
  const [rememberStation, setRememberStation] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    if (!email) {
      setErrorMsg('Ingrese su correo electrónico institucional.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      const match = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase()) || {
        id: 99,
        email,
        fullName: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        role: 'Especialista',
        specialty: 'Especialista Clínico Colegiado'
      }
      onLogin(match)
      setLoading(false)
    }, 450)
  }

  const handleQuickLogin = (user: AuthUser) => {
    setEmail(user.email)
    setPassword('••••••••••••')
    setLoading(true)
    setTimeout(() => {
      onLogin(user)
      setLoading(false)
    }, 300)
  }

  const handleSsoLogin = () => {
    setLoading(true)
    setTimeout(() => {
      onLogin(DEMO_USERS[0])
      setLoading(false)
    }, 400)
  }

  return (
    <div className="enterprise-login-screen">
      <div className="login-backdrop-glow" />

      {/* Main Corporate Two-Column Card */}
      <div className="enterprise-login-card">
        {/* ============================================================ */}
        {/* LEFT COLUMN: ENTERPRISE BRANDING & HEALTHCARE CREDIBILITY   */}
        {/* ============================================================ */}
        <div className="login-left-brand-col">
          <div className="brand-col-header">
            <div className="brand-logo-pill">
              <Activity size={22} color="#00ffd5" />
              <span>BODYVISION <b>AI</b></span>
            </div>
            <span className="badge-enterprise">ENTERPRISE V3.0</span>
          </div>

          <div className="brand-col-hero">
            <span className="hero-subtag">SISTEMA CLÍNICO INTEGRADO</span>
            <h2>Plataforma Centralizada de Evaluación Biomecánica 3D y Termografía</h2>
            <p>
              Portal unificado para especialistas en medicina deportiva, traumatología,
              rehabilitación física y ergonomía laboral.
            </p>
          </div>

          {/* Key Enterprise Value Points */}
          <div className="brand-features-list">
            <div className="feature-item">
              <div className="feature-icon"><ShieldCheck size={17} color="#00ffd5" /></div>
              <div>
                <b>Trazabilidad y Ley 29733</b>
                <span>Consentimientos digitales inmutables con registro de auditoría médica.</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Activity size={17} color="#38bdf8" /></div>
              <div>
                <b>Telemetría Articular en Vivo</b>
                <span>33 puntos cinemáticos con estimación de plomada y rangos ROM.</span>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon"><Lock size={17} color="#f59e0b" /></div>
              <div>
                <b>Seguridad y Cifrado Hospitalario</b>
                <span>Conexión segura TLS 1.3 con almacenamiento de imágenes segregado.</span>
              </div>
            </div>
          </div>

          {/* Institutional Trust Footprint */}
          <div className="brand-col-footer">
            <Building2 size={15} color="#64748b" />
            <span>Implementado en redes de salud y clínicas certificadas.</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: INSTITUTIONAL ACCESS FORM                     */}
        {/* ============================================================ */}
        <div className="login-right-form-col">
          {/* Top navigation back to Landing Page */}
          <div className="login-form-topbar">
            {onBackToLanding && (
              <button
                type="button"
                className="btn-back-landing"
                onClick={onBackToLanding}
              >
                <ChevronLeft size={15} />
                <span>Volver a la Página Principal</span>
              </button>
            )}
            <span className="station-indicator">
              <Laptop size={13} color="#00ffd5" /> ESTACIÓN SEGURA
            </span>
          </div>

          <div className="login-form-header">
            <h3>Acceso a Estación de Trabajo</h3>
            <p>Ingrese sus credenciales profesionales para acceder a la historia clínica biomecánica.</p>
          </div>

          {/* Mode Switcher: Credentials vs SSO */}
          <div className="login-mode-tabs">
            <button
              type="button"
              className={`login-mode-tab ${authMode === 'credentials' ? 'active' : ''}`}
              onClick={() => setAuthMode('credentials')}
            >
              <KeyRound size={13} /> Credenciales Clínicas
            </button>
            <button
              type="button"
              className={`login-mode-tab ${authMode === 'sso' ? 'active' : ''}`}
              onClick={() => setAuthMode('sso')}
            >
              <Globe size={13} /> Directorio Activo (SSO)
            </button>
          </div>

          {errorMsg && (
            <div className="alert error" style={{ fontSize: '11px', margin: '0 0 14px 0' }}>
              <ShieldAlert size={14} /> {errorMsg}
            </div>
          )}

          {authMode === 'credentials' ? (
            <form onSubmit={handleSubmit} className="enterprise-login-form">
              <div className="form-field-group">
                <label>
                  <Building2 size={12} color="#0d9488" /> Código Institucional de Centro
                </label>
                <input
                  type="text"
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value)}
                  placeholder="BV-CLINICAL-01"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>
                  <Mail size={12} color="#0d9488" /> Correo Profesional Colegiado
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="valeria.morales@bodyvision.ai"
                  required
                />
              </div>

              <div className="form-field-group">
                <label>
                  <Lock size={12} color="#0d9488" /> Contraseña de Estación
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <div className="form-checkbox-row">
                <label className="checkbox-station">
                  <input
                    type="checkbox"
                    checked={rememberStation}
                    onChange={e => setRememberStation(e.target.checked)}
                  />
                  <span>Recordar esta estación durante 30 días</span>
                </label>
                <span className="support-link">¿Olvidó su clave?</span>
              </div>

              <button type="submit" className="btn-enterprise-submit" disabled={loading}>
                {loading ? (
                  <span>Validando en Servidor Central...</span>
                ) : (
                  <>
                    <span>Iniciar Sesión en el Workspace</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="sso-container">
              <p className="sso-desc">
                Inicie sesión automáticamente a través del proveedor de identidad federado de su hospital (Microsoft Entra ID, Okta o Google Workspace Enterprise).
              </p>
              <button
                type="button"
                className="btn-sso-action"
                onClick={handleSsoLogin}
                disabled={loading}
              >
                <Globe size={16} color="#00ffd5" />
                <span>Autenticar con Azure Active Directory / SSO</span>
              </button>
            </div>
          )}

          {/* Quick Demo Staff Login (Essential for rapid review and testing) */}
         

          {/* Regulatory Compliance Footnote */}
          <div className="login-compliance-footer">
            <ShieldCheck size={13} color="#0d9488" />
            <span>Ley 29733 de Protección de Datos Personales · Registro Cifrado TLS 1.3</span>
          </div>
        </div>
      </div>
    </div>
  )
}
