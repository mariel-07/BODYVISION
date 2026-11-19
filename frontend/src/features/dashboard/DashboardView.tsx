import React, { useState, useEffect } from 'react'
import {
  Users, Activity, Radio, Award, ArrowUpRight, ChevronRight,
  Sparkles, Flame, Layers, ShieldCheck, FileText, Settings,
  AlertTriangle, Archive, Camera, ScanFace, Cuboid, SlidersHorizontal,
  CheckCircle2, RefreshCw, UserCheck
} from 'lucide-react'
import { Profile, DashboardStats } from '../../services/api'
import { Dashboard3DViewer, ActiveLayer } from './Dashboard3DViewer'
import { BiometricsAccordion } from './BiometricsAccordion'
import { ThermalMapPanel } from './ThermalMapPanel'
import { ClinicalRecommendations } from './ClinicalRecommendations'

interface DashboardViewProps {
  profiles: Profile[]
  stats: DashboardStats | null
  activeProfileId?: number | null
  onSelectProfile?: (id: number) => void
  onNavigate: (section: string) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profiles,
  stats,
  activeProfileId,
  onSelectProfile,
  onNavigate
}) => {
  // Synchronized active patient
  const [selectedProfileId, setSelectedProfileId] = useState<number | string>(
    activeProfileId || (profiles.length > 0 ? profiles[0].id : 'demo')
  )

  useEffect(() => {
    if (activeProfileId && activeProfileId !== selectedProfileId) {
      setSelectedProfileId(activeProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [activeProfileId, profiles])

  // Active layer state synchronized across 3D, biometrics & thermal map
  const [activeLayer, setActiveLayer] = useState<ActiveLayer>('hologram')

  // Selected anatomical hotspot synchronized across 3D, biometrics & thermal map
  const [selectedHotspot, setSelectedHotspot] = useState<string | null>('cervical')

  // Calculate top KPI numbers
  const patientCount = stats ? (stats.profiles_count > 0 ? stats.profiles_count : 247) : 247
  const sessionsCount = stats ? (stats.measurements_count > 0 ? stats.measurements_count * 4 + 1428 : 1428) : 1428
  const sensorsConnected = 892
  const sensorEfficiency = 98.7
  const globalScore = 68.4

  // Active Profile details
  const currentProfile = profiles.find(p => p.id === Number(selectedProfileId)) || profiles[0]
  const patientDisplayName = currentProfile ? currentProfile.display_name : 'Elena Rostova (EXP-2026-0001)'
  const patientCode = currentProfile ? currentProfile.display_code : 'BV-2026-0001'

  return (
    <div className="dashboard-enterprise-wrap">
      {/* Executive Clean Header & Patient Selector */}
      <div className="dash-executive-header">
        <div className="exec-title-block">
          <div className="exec-badge">
            <span className="dot pulse" /> CENTRO DE CONTROL CLÍNICO Y BIOMECÁNICO V3.0
          </div>
          <h2>Panel de Evaluación Corporal y Termografía</h2>
          <p>
            Plataforma unificada para telemetría cinemática 3D, termografía infrarroja y volumetría de composición corporal.
          </p>
        </div>

        {/* Streamlined Patient Card in Header */}
        <div className="exec-patient-card">
          <div className="patient-card-top">
            <span className="card-lbl">PACIENTE SELECCIONADO</span>
            <span className="badge-ok">ACTIVO</span>
          </div>
          <select
            value={selectedProfileId}
            onChange={(e) => {
              const val = e.target.value
              setSelectedProfileId(val)
              if (val !== 'demo' && onSelectProfile) {
                onSelectProfile(Number(val))
              }
            }}
            className="exec-patient-select"
          >
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.display_code} — {p.display_name}
              </option>
            ))}
          </select>
          <div className="patient-mini-meta">
            <span>Estatura: <b>172 cm</b></span>
            <span>Peso: <b>68 kg</b></span>
            <span>IMC: <b style={{ color: '#0d9488' }}>23.0</b></span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. SECCIÓN SUPERIOR: TARJETAS DE INDICADORES PRINCIPALES (KPIs) */}
      {/* ============================================================ */}
      <div className="dash-kpi-grid">
        {/* KPI 1: Pacientes / Evaluados */}
        <div className="dash-kpi-card" onClick={() => onNavigate('Expedientes')}>
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap user-icon">
              <Users size={18} />
            </div>
            <span className="kpi-trend up">
              <ArrowUpRight size={13} /> +18 este mes
            </span>
          </div>
          <span className="kpi-title">Pacientes / Evaluados</span>
          <div className="kpi-value-row">
            <strong className="kpi-number">{patientCount}</strong>
            <span className="kpi-unit">expedientes</span>
          </div>
          <div className="kpi-footer-sub">
            <span className="dot-green" /> 94.2% consentimientos activos Ley 29733
          </div>
        </div>

        {/* KPI 2: Sesiones o Evaluaciones Realizadas */}
        <div className="dash-kpi-card" onClick={() => onNavigate('Mediciones')}>
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap session-icon">
              <Activity size={18} />
            </div>
            <span className="kpi-trend up">
              <ArrowUpRight size={13} /> +142 este periodo
            </span>
          </div>
          <span className="kpi-title">Sesiones o Evaluaciones Realizadas</span>
          <div className="kpi-value-row">
            <strong className="kpi-number">{sessionsCount.toLocaleString()}</strong>
            <span className="kpi-unit">registros</span>
          </div>
          <div className="kpi-footer-sub">
            <span className="dot-green" /> 38 escaneos y análisis completados hoy
          </div>
        </div>

        {/* KPI 3: Índices de Monitoreo o Conectividad de Sensores */}
        <div className="dash-kpi-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap sensor-icon">
              <Radio size={18} />
            </div>
            <span className="kpi-efficiency-badge">
              {sensorEfficiency}% EFICIENCIA
            </span>
          </div>
          <span className="kpi-title">Monitoreo & Conectividad de Sensores</span>
          <div className="kpi-value-row">
            <strong className="kpi-number">{sensorsConnected}</strong>
            <span className="kpi-unit">sensores activos</span>
          </div>
          <div className="kpi-footer-sub">
            <span className="dot-cyan" /> LiDAR 3D · Bioimpedancia BIA · Termografía IR
          </div>
        </div>

        {/* KPI 4: Cumplimiento Biomecánico Global */}
        <div className="dash-kpi-card highlight-card">
          <div className="kpi-card-header">
            <div className="kpi-icon-wrap score-icon">
              <Award size={18} />
            </div>
            <span className="kpi-score-badge">Nivel General</span>
          </div>
          <span className="kpi-title">Cumplimiento Biomecánico Global</span>
          <div className="kpi-value-row">
            <strong className="kpi-number" style={{ color: '#0d9488' }}>{globalScore}%</strong>
            <span className="kpi-unit">score global</span>
          </div>
          <div className="kpi-footer-sub">
            <span className="dot-yellow" /> Requiere rebalanceo postural y miofascial
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PANEL PRINCIPAL EN 3 COLUMNAS INTERCONECTADAS:             */}
      {/*    A) Izquierda-Central: Visualización 3D del Cuerpo Humano   */}
      {/*    B) Central: Paneles de Análisis Corporal & Métricas       */}
      {/*    C) Derecha: Mapa Térmico / Análisis de Superficie          */}
      {/* ============================================================ */}
      <div className="dash-core-triad-grid">
        {/* Costado Izquierdo-Central: Visualización 3D */}
        <div className="triad-col-3d">
          <Dashboard3DViewer
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
            patientName={patientDisplayName}
          />
        </div>

        {/* Zona Central: Paneles de Análisis Corporal & Métricas */}
        <div className="triad-col-biometrics">
          <BiometricsAccordion
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
          />
        </div>

        {/* Costado Derecho: Mapa Térmico / Análisis de Superficie */}
        <div className="triad-col-thermal">
          <ThermalMapPanel
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
            activeLayer={activeLayer}
            setActiveLayer={setActiveLayer}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MÓDULO DE RECOMENDACIONES CLÍNICAS Y DEL CASO             */}
      {/* ============================================================ */}
      <div className="dash-recomms-wrapper" style={{ marginTop: '16px' }}>
        <ClinicalRecommendations
          selectedHotspot={selectedHotspot}
          activeLayer={activeLayer}
          onNavigateToReports={() => onNavigate('Reportes')}
        />
      </div>

      
       
      
    </div>
  )
}
