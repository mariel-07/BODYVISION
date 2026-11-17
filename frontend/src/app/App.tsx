import { useEffect, useState } from 'react'
import {
  Activity, Archive, Camera, CircleUserRound,
  Cuboid, FileText, LayoutDashboard, LockKeyhole,
  ScanFace, Settings, ShieldCheck, SlidersHorizontal
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

  // Shared context across navigation
  const [contextProfileId, setContextProfileId] = useState<number | null>(null)
  const [contextMediaId, setContextMediaId] = useState<number | null>(null)

  const refreshData = () => {
    api.profiles()
      .then(p => {
        setProfiles(p)
        if (!contextProfileId && p.length > 0) {
          setContextProfileId(p[0].id)
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
    if (profileId !== undefined) setContextProfileId(profileId)
    if (mediaId !== undefined) setContextMediaId(mediaId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand" onClick={() => handleNavigate('Dashboard')} style={{ cursor: 'pointer' }}>
          <div className="brand-mark"><Activity size={21} /></div>
          <div>
            <b>BODYVISION</b>
            <span>AI ENTERPRISE</span>
          </div>
        </div>

        <div className="workspace">
          <span className="dot" /> ENTORNO LOCAL
          <small>ARQUITECTURA V3.0</small>
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
          <span>Ley 29733 & Trazabilidad</span>
        </div>
      </aside>

      {/* Main App Content Area */}
      <main className="main">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <span className="eyebrow">BODYVISION AI / ENTERPRISE WORKSPACE</span>
            <h1>{section}</h1>
          </div>
          <div className="top-user">
            <div className="avatar"><CircleUserRound size={19} /></div>
            <div>
              <b>Dra. Valeria Morales</b>
              <span>Especialista Autorizado · Auditoría ON</span>
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
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Expedientes' && (
            <ProfilesView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onRefresh={refreshData}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Mediciones' && (
            <MeasurementsView
              profiles={profiles}
              initialProfileId={contextProfileId}
            />
          )}

          {section === 'Captura' && (
            <CaptureView
              profiles={profiles}
              initialProfileId={contextProfileId}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Análisis IA' && (
            <PoseAnalysisView
              profiles={profiles}
              initialProfileId={contextProfileId}
              initialMediaId={contextMediaId}
              onNavigate={handleNavigate}
            />
          )}

          {section === 'Visor 3D' && (
            <BodyViewerView
              profiles={profiles}
              initialProfileId={contextProfileId}
            />
          )}

          {section === 'Simulador' && (
            <SimulationsView
              profiles={profiles}
              initialProfileId={contextProfileId}
            />
          )}

          {section === 'Reportes' && (
            <ReportsView
              profiles={profiles}
              initialProfileId={contextProfileId}
            />
          )}

          {section === 'Administración' && (
            <AdminView />
          )}
        </div>

        {/* Global Footer */}
        <footer className="footer">
          <span>BODYVISION AI · ARQUITECTURA ENTERPRISE V3.0</span>
          <span>Estimaciones visuales y modelos hipotéticos no equivalen a diagnóstico clínico.</span>
        </footer>
      </main>
    </div>
  )
}
