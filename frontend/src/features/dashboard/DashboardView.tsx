import React from 'react'
import {
  Activity, Archive, Camera, Cuboid, FileText,
  ScanFace, Settings, SlidersHorizontal, ArrowRight, ShieldCheck,
  CheckCircle2, AlertTriangle, Database
} from 'lucide-react'
import { Profile, DashboardStats } from '../../services/api'

interface DashboardViewProps {
  profiles: Profile[]
  stats: DashboardStats | null
  onNavigate: (section: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({ profiles, stats, onNavigate }) => {
  const pCount = stats ? stats.profiles_count : profiles.length
  const mCount = stats ? stats.measurements_count : 0
  const mediaCount = stats ? stats.media_count : 0
  const aCount = stats ? stats.analyses_count : 0
  const cCount = stats ? stats.consents_active : 0

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <div className="welcome">
        <div>
          <span className="eyebrow light">PANEL DE CONTROL ENTERPRISE · V3.0</span>
          <h2>
            Inteligencia corporal,<br />
            <em>datos con trazabilidad.</em>
          </h2>
          <p>
            Plataforma unificada para administración de expedientes, captura fotográfica segura,
            estimación de landmarks de pose, visualización 3D y simulaciones hipotéticas no destructivas.
          </p>
        </div>
        <div className="welcome-orbit">
          <div className="orbit-ring" />
          <Activity size={52} />
          <span>BODY<br />VISION</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-four">
        <div className="stat">
          <div className="stat-icon"><Archive size={20} /></div>
          <span>Expedientes</span>
          <strong>{pCount}</strong>
          <small>{cCount} con consentimiento activo</small>
        </div>
        <div className="stat">
          <div className="stat-icon"><Activity size={20} /></div>
          <span>Mediciones</span>
          <strong>{mCount}</strong>
          <small>Datos observados trazables</small>
        </div>
        <div className="stat">
          <div className="stat-icon"><Camera size={20} /></div>
          <span>Capturas Seguras</span>
          <strong>{mediaCount}</strong>
          <small>Imágenes validadas y cifradas</small>
        </div>
        <div className="stat">
          <div className="stat-icon"><ScanFace size={20} /></div>
          <span>Análisis de Pose IA</span>
          <strong>{aCount}</strong>
          <small>Estimaciones visuales 33 pts</small>
        </div>
      </div>

      {/* Quick Launchpad */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          <div>
            <h3>Accesos Rápidos a Módulos del Sistema</h3>
            <p>Arquitectura modular desacoplada por dominio de negocio</p>
          </div>
          <span className="badge-live">9 MÓDULOS ACTIVOS</span>
        </div>
        <div className="launchpad-grid">
          {[
            { id: 'Expedientes', name: 'Expedientes', desc: 'Ficha clínica y consentimientos', icon: Archive },
            { id: 'Mediciones', name: 'Mediciones', desc: 'Catálogo y corrección histórica', icon: Activity },
            { id: 'Captura', name: 'Captura Segura', desc: 'Guía de encuadre y hashing', icon: Camera },
            { id: 'Análisis IA', name: 'Análisis Pose IA', desc: 'MediaPipe 33 landmarks', icon: ScanFace },
            { id: 'Visor 3D', name: 'Visor 3D', desc: 'Malla R3F, wireframe y capas', icon: Cuboid },
            { id: 'Simulador', name: 'Simulador Hipotético', desc: 'Escenarios no destructivos', icon: SlidersHorizontal },
            { id: 'Reportes', name: 'Reportes de Evolución', desc: 'Exportación con procedencia', icon: FileText },
            { id: 'Administración', name: 'Admin & Auditoría', desc: 'RBAC y logs de seguridad', icon: Settings },
          ].map(m => {
            const Icon = m.icon
            return (
              <button key={m.id} className="launchpad-card" onClick={() => onNavigate(m.id)}>
                <div className="launchpad-icon"><Icon size={20} /></div>
                <div className="launchpad-info">
                  <b>{m.name}</b>
                  <span>{m.desc}</span>
                </div>
                <ArrowRight size={16} className="arrow" />
              </button>
            )
          })}
        </div>
      </section>

      {/* Two Column Grid */}
      <div className="grid-two" style={{ marginTop: '16px' }}>
        {/* Pipeline Diagram */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Cadena de Custodia y Procesamiento</h3>
              <p>Flujo seguro de extremo a extremo</p>
            </div>
            <ShieldCheck size={18} color="#45cbbd" />
          </div>
          <div className="workflow-steps">
            <div className="workflow-step">
              <span className="step-num">01</span>
              <div>
                <b>Consentimiento y Registro</b>
                <p>Verificación previa de finalidad bajo Ley 29733 / RGPD.</p>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-num">02</span>
              <div>
                <b>Captura Guiada e Integridad</b>
                <p>Encuadre estandarizado, despojo de EXIF y cálculo SHA-256.</p>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-num">03</span>
              <div>
                <b>Extracción de Pose (Estimación Visual)</b>
                <p>Procesamiento de landmarks anatómicos sin diagnóstico clínico.</p>
              </div>
            </div>
            <div className="workflow-step">
              <span className="step-num">04</span>
              <div>
                <b>Visualización 3D y Simulación</b>
                <p>Alineación en visor R3F y escenarios hipotéticos aislados.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Expedientes Recientes</h3>
              <p>Últimos registros en la base de datos local</p>
            </div>
            <button className="btn-link" onClick={() => onNavigate('Expedientes')}>Ver todos</button>
          </div>
          {profiles.length === 0 ? (
            <div className="empty">
              <Database size={24} style={{ marginBottom: 8, opacity: 0.5 }} />
              <p>Aún no hay expedientes creados en el sistema.</p>
              <button className="primary" style={{ margin: '8px auto 0' }} onClick={() => onNavigate('Expedientes')}>
                Crear primer expediente
              </button>
            </div>
          ) : (
            <div className="activity-list">
              {profiles.slice(0, 5).map(p => (
                <div key={p.id} className="activity-row" onClick={() => onNavigate('Expedientes')}>
                  <div className="mini-icon"><Archive size={16} /></div>
                  <div>
                    <b>{p.display_name}</b>
                    <span>Código: {p.display_code} · ID: #{p.id}</span>
                  </div>
                  <div className="activity-badge">
                    <span className="dot" /> {p.status.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Compliance Note */}
      <div className="compliance-banner">
        <AlertTriangle size={16} color="#e5a93c" />
        <div>
          <b>Aviso de Cumplimiento y Límites Clínicos:</b> BODYVISION AI es un sistema de asistencia analítica y estimación visual de landmarks. No formula diagnósticos médicos ni sustituye el criterio de profesionales colegiados de la salud. Todos los datos sensibles se mantienen bajo control de consentimiento.
        </div>
      </div>
    </div>
  )
}
