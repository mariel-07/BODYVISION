import React, { useState } from 'react'
import {
  Activity, ShieldCheck, Flame, Layers, Sparkles,
  ArrowRight, CheckCircle2, ChevronRight, Play, Eye,
  Compass, Scale, FileText, Lock, Users, Award,
  PhoneCall, Mail, Building2, Stethoscope, Globe
} from 'lucide-react'

interface LandingPageViewProps {
  onEnterPortal: () => void
  onSelectRoleDemo?: (role: string) => void
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({ onEnterPortal, onSelectRoleDemo }) => {
  const [demoModalOpen, setDemoModalOpen] = useState(false)
  const [demoSent, setDemoSent] = useState(false)
  const [demoForm, setDemoForm] = useState({ name: '', clinic: '', email: '', phone: '' })

  const handleDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setDemoSent(true)
    setTimeout(() => {
      setDemoModalOpen(false)
      setDemoSent(false)
    }, 2200)
  }

  return (
    <div className="landing-wrap">
      {/* ============================================================ */}
      {/* 1. CORPORATE NAVBAR                                           */}
      {/* ============================================================ */}
      <header className="landing-navbar">
        <div className="landing-nav-inner">
          <div className="landing-brand">
            <div className="landing-brand-icon">
              <Activity size={22} color="#ffffff" />
            </div>
            <div>
              <span className="landing-brand-text">BODYVISION <small>AI</small></span>
              <span className="landing-brand-badge">ENTERPRISE V3.0</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#soluciones">Soluciones</a>
            <a href="#tecnologia">Tecnología 3D</a>
            <a href="#termografia">Termografía IR</a>
            <a href="#normativa">Ley 29733</a>
            <a href="#seguridad">Seguridad & ISO</a>
          </nav>

          <div className="landing-nav-actions">
            <button
              type="button"
              className="btn-landing-secondary"
              onClick={() => setDemoModalOpen(true)}
            >
              Solicitar Demo
            </button>
            <button
              type="button"
              className="btn-landing-primary"
              onClick={onEnterPortal}
            >
              <span>Portal de Especialistas</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION                                               */}
      {/* ============================================================ */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-content">
          <div className="landing-tag-row">
            <span className="landing-pill-tag">
              <span className="dot pulse" /> SISTEMA CLÍNICO CERTIFICADO · SALUD DIGITAL V3.0
            </span>
            <span className="landing-iso-tag">
              <ShieldCheck size={13} color="#00ffd5" /> CUMPLIMIENTO LEY 29733 & RGPD
            </span>
          </div>

          <h1 className="landing-hero-title">
            Evaluación Postural 3D, Cinemática y Termografía Infrarroja
            <span className="hero-gradient-text"> en una Sola Plataforma Médica</span>
          </h1>

          <p className="landing-hero-sub">
            Estandarice el diagnóstico musculoesquelético y la composición corporal con reconstrucción
            3D anatómica en tiempo real, detección infrarroja de hipertermia por contractura
            y telemetría articular basada en visión artificial médica.
          </p>

          <div className="landing-cta-row">
            <button
              type="button"
              className="btn-hero-main"
              onClick={onEnterPortal}
            >
              <span>Acceder al Workspace Clínico</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-hero-demo"
              onClick={() => setDemoModalOpen(true)}
            >
              <Play size={14} fill="#0d9488" color="#0d9488" />
              <span>Agendar Demostración Institucional</span>
            </button>
          </div>

          {/* Clinical KPIs Ribbon */}
          <div className="landing-kpis-ribbon">
            <div className="kpi-ribbon-item">
              <strong>98.7%</strong>
              <span>Precisión Antropométrica</span>
            </div>
            <div className="kpi-ribbon-divider" />
            <div className="kpi-ribbon-item">
              <strong>28.3K</strong>
              <span>Vértices en Tiempo Real</span>
            </div>
            <div className="kpi-ribbon-divider" />
            <div className="kpi-ribbon-item">
              <strong>33 Puntos</strong>
              <span>Cinemática Articular 3D</span>
            </div>
            <div className="kpi-ribbon-divider" />
            <div className="kpi-ribbon-item">
              <strong>0.1°C</strong>
              <span>Sensibilidad Termográfica</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive 3D Showcase Card */}
        <div className="landing-hero-visual">
          <div className="hero-card-frame">
            <div className="hero-card-header">
              <div className="hero-header-dots">
                <span className="dot-red" />
                <span className="dot-yel" />
                <span className="dot-grn" />
              </div>
              <span className="hero-header-title">TELEMETRÍA CINEMÁTICA EN TIEMPO REAL · EXP-2026-0001</span>
              <span className="hero-header-badge">60 FPS</span>
            </div>

            <div className="hero-viewport-mock">
              {/* Floating diagnostic pins */}
              <div className="hero-mock-pin pin-cervical">
                <span className="pin-dot critical" />
                <div>
                  <b>Zona Cervical / C7</b>
                  <span>37.8°C · Tensión Alta</span>
                </div>
              </div>

              <div className="hero-mock-pin pin-lumbar">
                <span className="pin-dot warning" />
                <div>
                  <b>Región Lumbar L4-L5</b>
                  <span>37.1°C · Sobrecarga</span>
                </div>
              </div>

              <div className="hero-mock-pin pin-knee">
                <span className="pin-dot normal" />
                <div>
                  <b>Eje Patelar</b>
                  <span>ROM 96% · Balance OK</span>
                </div>
              </div>

              {/* Central stylized laser scan hologram silhouette */}
              <div className="hero-mock-body-silhouette">
                <div className="laser-sweep-line" />
                <svg viewBox="0 0 160 300" className="mock-svg">
                  <ellipse cx="80" cy="30" rx="16" ry="20" fill="none" stroke="#00ffd5" strokeWidth="2" opacity="0.9" />
                  <line x1="80" y1="50" x2="80" y2="150" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
                  <line x1="45" y1="80" x2="115" y2="80" stroke="#00ffd5" strokeWidth="2" />
                  <ellipse cx="80" cy="115" rx="30" ry="38" fill="none" stroke="#00ffd5" strokeWidth="2" opacity="0.8" />
                  <ellipse cx="80" cy="155" rx="24" ry="16" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
                  <line x1="60" y1="170" x2="52" y2="280" stroke="#00ffd5" strokeWidth="2" />
                  <line x1="100" y1="170" x2="108" y2="280" stroke="#00ffd5" strokeWidth="2" />
                  <circle cx="80" cy="80" r="4" fill="#ef4444" />
                  <circle cx="80" cy="145" r="4" fill="#f59e0b" />
                  <circle cx="56" cy="225" r="4" fill="#00ffd5" />
                  <circle cx="104" cy="225" r="4" fill="#00ffd5" />
                </svg>
              </div>

              {/* Bottom live metrics strip */}
              <div className="hero-mock-strip">
                <div><span>Estatura:</span><b>172 cm</b></div>
                <div><span>Peso:</span><b>68 kg</b></div>
                <div><span>IMC:</span><b>23.0 kg/m²</b></div>
                <div><span>Simetría:</span><b style={{ color: '#00ffd5' }}>97.5%</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. INSTITUTIONAL TRUST LOGOS                                  */}
      {/* ============================================================ */}
      <section className="landing-trust-bar">
        <span>TECNOLOGÍA DE SALUD IMPLEMENTADA EN CENTROS DE ALTO RENDIMIENTO Y CLÍNICAS</span>
        <div className="trust-badges-grid">
          <div className="trust-item"><Building2 size={16} /> Instituto de Traumatología Avanzada</div>
          <div className="trust-item"><Stethoscope size={16} /> Centro Nacional de Medicina del Deporte</div>
          <div className="trust-item"><Award size={16} /> Red de Fisioterapia & Rehabilitación Kinesiológica</div>
          <div className="trust-item"><ShieldCheck size={16} /> Auditoría Ergonómica Ocupacional ISO 45001</div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. FOUR CORE PILLARS (SOLUCIONES)                            */}
      {/* ============================================================ */}
      <section id="soluciones" className="landing-pillars-section">
        <div className="section-head-center">
          <span className="section-badge">ARQUITECTURA DE DIAGNÓSTICO INTEGRADO</span>
          <h2>Cuatro Pilares Clínicos en una Plataforma Unificada</h2>
          <p>
            Elimine la fragmentación de datos de escáneres, termógrafos y hojas de cálculo.
            BODYVISION AI centraliza toda la telemetría en el expediente del paciente.
          </p>
        </div>

        <div className="pillars-grid">
          {/* Pillar 1 */}
          <div className="pillar-card">
            <div className="pillar-icon-wrap" style={{ background: 'rgba(13, 148, 136, 0.15)', color: '#00ffd5' }}>
              <Layers size={24} />
            </div>
            <h3>Reconstrucción 3D y Morfometría Dinámica</h3>
            <p>
              Malla anatómica continua de 28,391 vértices con adaptación volumétrica al peso, estatura
              y biotipo. Calibración para inspección visual sin distorsión geométrica.
            </p>
            <ul className="pillar-checklist">
              <li><CheckCircle2 size={14} color="#00ffd5" /> Estimación de perímetros: tórax, cintura y cadera</li>
              <li><CheckCircle2 size={14} color="#00ffd5" /> Proyección de panículo adiposo y grasa visceral</li>
              <li><CheckCircle2 size={14} color="#00ffd5" /> Escáner láser volumétrico a 60 FPS con corte transversal</li>
            </ul>
          </div>

          {/* Pillar 2 */}
          <div className="pillar-card">
            <div className="pillar-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Flame size={24} />
            </div>
            <h3>Termografía Infrarroja & Detección de Asimetrías</h3>
            <p>
              Mapeo de gradiente térmico de superficie con discriminación de contracturas musculares
              (hipertermia regional &gt;37.4°C) y sobrecargas compensatorias.
            </p>
            <ul className="pillar-checklist">
              <li><CheckCircle2 size={14} color="#ef4444" /> Termografía diferencial $\Delta T$ instantánea</li>
              <li><CheckCircle2 size={14} color="#ef4444" /> Cruce térmico con capa aislante de tejido adiposo</li>
              <li><CheckCircle2 size={14} color="#ef4444" /> Identificación de puntos gatillo cervicales y lumbares</li>
            </ul>
          </div>

          {/* Pillar 3 */}
          <div className="pillar-card">
            <div className="pillar-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <Compass size={24} />
            </div>
            <h3>Cinemática Articular & Plomada Postural</h3>
            <p>
              Detección de 33 landmarks anatómicos con MediaPipe AI. Cálculo en grados de basculación
              pélvica, desnivel biacromial y eje sagital gravitacional.
            </p>
            <ul className="pillar-checklist">
              <li><CheckCircle2 size={14} color="#38bdf8" /> Rango de movimiento (ROM articular cuantitativo)</li>
              <li><CheckCircle2 size={14} color="#38bdf8" /> Eje gravitacional con plomada sagital milimétrica</li>
              <li><CheckCircle2 size={14} color="#38bdf8" /> Distribución de carga podométrica bilateral</li>
            </ul>
          </div>

          {/* Pillar 4 */}
          <div className="pillar-card">
            <div className="pillar-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <ShieldCheck size={24} />
            </div>
            <h3>Expediente Biomecánico & Ley 29733</h3>
            <p>
              Trazabilidad integral y seguridad jurídica médica. Consentimiento informado digital,
              cifrado de imágenes sensibles y pista de auditoría inmutable.
            </p>
            <ul className="pillar-checklist">
              <li><CheckCircle2 size={14} color="#f59e0b" /> Consentimiento firmado y versionado bajo Ley 29733</li>
              <li><CheckCircle2 size={14} color="#f59e0b" /> Pistas de auditoría clínica con sellado de tiempo</li>
              <li><CheckCircle2 size={14} color="#f59e0b" /> Reportes ejecutivos PDF con recomendaciones personalizadas</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. TECHNOLOGY SECTION (TECNOLOGÍA 3D)                        */}
      {/* ============================================================ */}
      <section id="tecnologia" className="landing-tech-section">
        <div className="tech-box-inner">
          <div className="tech-text-col">
            <span className="section-badge">TECNOLOGÍA DE PROCESAMIENTO</span>
            <h2>Renderizado WebGL de Alta Definición y Visión por Computadora</h2>
            <p>
              BODYVISION AI combina modelos neuronales de estimación de pose en el navegador y shaders
              personalizados de Three.js para renderizar cinemática y termografía con latencia cero
              sin comprometer la privacidad del paciente.
            </p>
            <div className="tech-specs-list">
              <div className="spec-badge-item">
                <Globe size={18} color="#00ffd5" />
                <div>
                  <b>Procesamiento Edge Privado</b>
                  <span>Los fotogramas se analizan localmente sin transferir video sin procesar</span>
                </div>
              </div>
              <div className="spec-badge-item">
                <Lock size={18} color="#00ffd5" />
                <div>
                  <b>Cifrado Hospitalario en Reposo</b>
                  <span>Base de datos relacional PostgreSQL con almacenamiento segregado</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-landing-primary"
              style={{ marginTop: '20px' }}
              onClick={onEnterPortal}
            >
              <span>Explorar el Visor 3D en Vivo</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div className="tech-visual-col">
            <div className="tech-preview-terminal">
              <div className="terminal-header">
                <span className="terminal-dot green" />
                <span>TELEMETRÍA KINEMÁTICA EN EJECUCIÓN · MEDIAPIPE CORE</span>
              </div>
              <pre className="terminal-code">
{`[Pose Landmarker v0.10.14] :: 33 Landmarks Detectados
- Acromion_L: [x: 0.42, y: 0.25, z: 0.02] (conf: 0.985)
- Acromion_R: [x: 0.58, y: 0.25, z: 0.02] (conf: 0.982)
- Pelvis_Tilt: 1.8° [Asimetría Hemilateral Izq]
- Sagital_Head_Forward: +2.2 cm [Palanca Cervical: +4.8kg]
- Surface_Thermal_Max: 37.8°C [Zona Cervicotorácica]
- Compliance_Global_Score: 68.4% [Score Biomecánico]`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 6. CALL TO ACTION INSTITUCIONAL                               */}
      {/* ============================================================ */}
      <section className="landing-cta-banner">
        <div className="cta-banner-card">
          <div className="cta-banner-text">
            <h2>Estandarice las Evaluaciones Biomecánicas de su Centro Médico</h2>
            <p>
              Agilice el tiempo de consulta, entregue informes con respaldo 3D a sus pacientes y
              asegure el cumplimiento de la Ley 29733 de Protección de Datos Personales.
            </p>
          </div>
          <div className="cta-banner-buttons">
            <button
              type="button"
              className="btn-cta-big"
              onClick={onEnterPortal}
            >
              <span>Acceder al Portal Clínico</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="btn-cta-outline"
              onClick={() => setDemoModalOpen(true)}
            >
              <PhoneCall size={15} />
              <span>Contactar Soporte Clínico</span>
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. ENTERPRISE FOOTER                                          */}
      {/* ============================================================ */}
      <footer className="landing-footer">
        <div className="footer-top-row">
          <div className="footer-col-brand">
            <div className="landing-brand">
              <div className="landing-brand-icon">
                <Activity size={20} color="#ffffff" />
              </div>
              <span className="landing-brand-text">BODYVISION <small>AI</small></span>
            </div>
            <p>
              Plataforma empresarial de diagnóstico postural computarizado, cinemática 3D,
              termografía infrarroja y expedientes biomecánicos.
            </p>
            <span className="footer-cert-tag">
              <ShieldCheck size={13} color="#00ffd5" /> Certificación Técnica Médica V3.0
            </span>
          </div>

          <div className="footer-col-links">
            <b>Módulos Clínicos</b>
            <a href="#soluciones">Modelo Anatómico 3D</a>
            <a href="#termografia">Termografía Infrarroja</a>
            <a href="#soluciones">Análisis Biomecánico</a>
            <a href="#soluciones">Simulador Morfológico</a>
          </div>

          <div className="footer-col-links">
            <b>Marco Normativo</b>
            <a href="#normativa">Ley 29733 Protección de Datos</a>
            <a href="#seguridad">Seguridad Grado Médico ISO 27001</a>
            <a href="#normativa">Consentimiento Informado Digital</a>
            <a href="#normativa">Trazabilidad en Auditoría</a>
          </div>

          <div className="footer-col-links">
            <b>Contacto Institucional</b>
            <span><Mail size={13} /> soporte@bodyvision.ai</span>
            <span><PhoneCall size={13} /> +51 (01) 480-2026</span>
            <span><Globe size={13} /> Lima · Santiago · Bogotá</span>
          </div>
        </div>

        <div className="footer-bottom-row">
          <span>© 2026 BODYVISION AI Inc. Todos los derechos reservados. Sistema para uso clínico profesional colegiado.</span>
          <div className="footer-bottom-tags">
            <span>Privacidad de Datos</span>
            <span>Términos de Servicio</span>
            <span>Auditoría Médica</span>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* DEMO CONTACT MODAL                                            */}
      {/* ============================================================ */}
      {demoModalOpen && (
        <div className="landing-modal-overlay" onClick={() => setDemoModalOpen(false)}>
          <div className="landing-modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={20} color="#00ffd5" />
                <h3>Solicitar Demostración Institucional</h3>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={() => setDemoModalOpen(false)}
              >
                ✕
              </button>
            </div>

            {demoSent ? (
              <div className="modal-success-box">
                <CheckCircle2 size={42} color="#00ffd5" />
                <h4>¡Solicitud Recibida con Éxito!</h4>
                <p>Un especialista clínico de BODYVISION AI se comunicará con su centro en menos de 24 horas.</p>
              </div>
            ) : (
              <form onSubmit={handleDemoSubmit} className="modal-form">
                <p className="modal-sub">
                  Complete los datos de su institución para coordinar una sesión de telemetría y escáner 3D con nuestro equipo biomédico.
                </p>

                <div className="modal-field">
                  <label>Nombre del Profesional / Director Médico</label>
                  <input
                    type="text"
                    required
                    placeholder="Dra. Mariana Sánchez"
                    value={demoForm.name}
                    onChange={e => setDemoForm({ ...demoForm, name: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label>Clínica, Centro o Institución de Salud</label>
                  <input
                    type="text"
                    required
                    placeholder="Centro Médico Deportivo San Borja"
                    value={demoForm.clinic}
                    onChange={e => setDemoForm({ ...demoForm, clinic: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label>Correo Electrónico Institucional</label>
                  <input
                    type="email"
                    required
                    placeholder="direccion.medica@clinicadeportiva.pe"
                    value={demoForm.email}
                    onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                  />
                </div>

                <div className="modal-field">
                  <label>Teléfono de Contacto</label>
                  <input
                    type="tel"
                    required
                    placeholder="+51 987 654 321"
                    value={demoForm.phone}
                    onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn-landing-primary" style={{ width: '100%', marginTop: '8px' }}>
                  <span>Enviar Solicitud de Demostración</span>
                  <ArrowRight size={14} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
