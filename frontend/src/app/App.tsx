import { useEffect, useState } from 'react'
import {
  Activity, Archive, Camera, CircleUserRound,
  Cuboid, FileText, LayoutDashboard, LockKeyhole,
  ScanFace, Settings, ShieldCheck, SlidersHorizontal,
  UserCheck, ChevronDown
} from 'lucide-react'
import { api, Profile, DashboardStats } from '../services/api'

// Feature Modules
import { DashboardView } from '../features/dashboard/DashboardView'
import { ProfilesView } from '../features/profiles/ProfilesView'
import { MeasurementsView } from '../features/measurements/MeasurementsView'
import { CaptureView } from '../features/capture/CaptureView'
import { PoseAnalysisView } from '../features/pose-analysis/PoseAnalysisView'
import { BodyViewerView } from '../features/body-viewer/BodyViewerView'
import { SimulationsView } from '../features/simulations/SimulationsView'
import { ReportsView } from '../features/reports/ReportsView'
import { AdminView } from '../features/admin/AdminView'

const nav = [
  ['Dashboard', LayoutDashboard],
  ['Expedientes', Archive],
  ['Mediciones', Activity],
  ['Captura', Camera],
  ['Análisis IA', ScanFace],
  ['Visor 3D', Cuboid],
  ['Simulador', SlidersHorizontal],
  ['Reportes', FileText],
  ['Administración', Settings],
] as const

export default function App() {
  const [section, setSection] = useState('Dashboard')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [error, setError] = useState('')

  // Shared context across navigation with localStorage persistence
  const [contextProfileId, setContextProfileId] = useState<number | null>(() => {
    const saved = localStorage.getItem('bv_active_profile_id')
    return saved ? Number(saved) : null
  })
  const [contextMediaId, setContextMediaId] = useState<number | null>(null)

  const handleSelectProfile = (id: number) => {
    setContextProfileId(id)
    localStorage.setItem('bv_active_profile_id', String(id))
  }

  const refreshData = () => {
    api.profiles()
      .then(p => {
        setProfiles(p)
        const savedId = localStorage.getItem('bv_active_profile_id')
        const matched = p.find(item => item.id === Number(savedId))
        if (matched) {
          setContextProfileId(matched.id)
        } else if (p.length > 0) {
          // If no saved id or it was deleted, select first
          setContextProfileId(p[0].id)
          localStorage.setItem('bv_active_profile_id', String(p[0].id))
        }
      })
      .catch(e => setError(e.message))

    api.stats().then(setStats).catch(() => setStats(null))
  }

  useEffect(() => {
    refreshData()
  }, [])

  const handleNavigate = (targetSection: string, profileId?: number, mediaId?: number) => {
    setSection(targetSection)
    if (profileId !== undefined) {
      handleSelectProfile(profileId)
    }
    if (mediaId !== undefined) {
      setContextMediaId(mediaId)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeProfile = profiles.find(p => p.id === contextProfileId) || profiles[0]

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand" onClick={() => handleNavigate('Dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark"><Activity size={21} /></div>
          <div>
            <b>BODYVISION</b>
            <span>CLINICAL AI · V3.0</span>
          </div>
        </div>

        <div className="workspace">
          <span className="dot" /> SISTEMA CLÍNICO ACTIVO
          <small>ARQUITECTURA ENTERPRISE</small>
        </div>

        {/* Global Active Patient Selector Widget in Sidebar */}
        <div className="sidebar-patient-box">
          <span className="patient-box-caption">EXPEDIENTE SELECCIONADO</span>
          <select
            className="patient-box-select"
            value={contextProfileId || ''}
            onChange={(e) => {
              const id = Number(e.target.value)
              if (id) handleSelectProfile(id)
            }}
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.display_code} — {p.display_name}
              </option>
            ))}
          </select>
        </div>

        <p className="nav-caption">PLATAFORMA</p>
        <nav>
          {nav.map(([label, Item]) => (
            <button
              key={label}
              className={section === label ? 'nav-item active' : 'nav-item'}
              onClick={() => handleNavigate(label)}
            >
              <Item size={17} />
              <span>{label}</span>
              {label === 'Administración' && <LockKeyhole size={13} className="lock" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <ShieldCheck size={16} />
          <span>Ley 29733 & Trazabilidad Médica</span>
        </div>
      </aside>

      {/* Main App Content Area */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <span className="eyebrow">BODYVISION AI / WORKSPACE MÉDICO</span>
            <h1>{section}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {activeProfile && (
              <div className="topbar-patient-pill" onClick={() => handleNavigate('Expedientes', activeProfile.id)}>
                <UserCheck size={15} color="#0d9488" />
                <div>
                  <b style={{ fontSize: '11px', color: '#0f172a' }}>{activeProfile.display_name}</b>
                  <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>{activeProfile.display_code} · Expediente Activo</span>
                </div>
              </div>
            )}

            <div className="top-user">
              <div className="avatar"><CircleUserRound size={20} /></div>
              <div>
                <b>Dra. Valeria Morales</b>
                <span>Especialista Clínico Colegiado</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Section Content */}
        <div className="content">
          {error && <div className="alert error">{error}</div>}

          {section === 'Dashboard' && (
            <DashboardView
              profiles={profiles}
              stats={stats}
              activeProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Expedientes' && (
            <ProfilesView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
              onRefresh={refreshData}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Mediciones' && (
            <MeasurementsView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
            />
          )}

          {section === 'Captura' && (
            <CaptureView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Análisis IA' && (
            <PoseAnalysisView
              profiles={profiles}
              initialProfileId={contextProfileId}
              initialMediaId={contextMediaId}
              onSelectProfile={handleSelectProfile}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Visor 3D' && (
            <BodyViewerView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
            />
          )}

          {section === 'Simulador' && (
            <SimulationsView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
            />
          )}

          {section === 'Reportes' && (
            <ReportsView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onSelectProfile={handleSelectProfile}
            />
          )}

          {section === 'Administración' && (
            <AdminView />
          )}
        </div>

        {/* Global Footer */}
        <footer className="footer">
          <span>BODYVISION AI · PLATAFORMA DE TELEMETRÍA Y BIOMECÁNICA CORPORAL V3.0</span>
          <span>Estimaciones visuales y modelos predictivos bajo control de consentimiento.</span>
        </footer>
      </main>
    </div>
  )
}
