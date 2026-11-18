import React, { useState } from 'react'
import {
  ChevronDown, ChevronUp, Activity, Scale, Percent,
  Dumbbell, Compass, Flame, Layers, CheckCircle2, AlertTriangle, Info
} from 'lucide-react'
import { ActiveLayer } from './Dashboard3DViewer'

interface BiometricsAccordionProps {
  activeLayer: ActiveLayer
  setActiveLayer: (layer: ActiveLayer) => void
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
}

export const BiometricsAccordion: React.FC<BiometricsAccordionProps> = ({
  activeLayer,
  setActiveLayer,
  selectedHotspot,
  onSelectHotspot
}) => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    rom: true,
    symmetry: true,
    composition: true
  })

  const toggleSection = (sec: string) => {
    setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }))
  }

  // Circular progress calculations for 68.4%
  const radius = 64
  const circumference = 2 * Math.PI * radius
  const overallScore = 68.4
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  return (
    <div className="dash-biometrics-card">
      {/* Panel Title */}
      <div className="dash-biometrics-header">
        <div>
          <div className="dash-bio-title">
            <Activity size={16} color="#38bdf8" />
            <span>ANÁLISIS CORPORAL Y MÉTRICAS DETALLADAS</span>
          </div>
          <p className="dash-bio-sub">
            Evaluación biomecánica cuantitativa y composición de tejidos
          </p>
        </div>
      </div>

      {/* CIRCULAR CENTRAL SCORE GAUGE (68.4%) */}
      <div className="dash-circle-gauge-wrap">
        <div className="circle-gauge-box">
          <svg className="circle-svg" width="160" height="160" viewBox="0 0 160 160">
            <defs>
              <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5d4" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
              <filter id="gaugeShadow">
                <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#00f5d4" floodOpacity="0.4" />
              </filter>
            </defs>
            {/* Background Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="circle-bg"
              strokeWidth="12"
              fill="transparent"
            />
            {/* Progress Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              className="circle-progress"
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="url(#scoreGradient)"
              fill="transparent"
              transform="rotate(-90 80 80)"
              filter="url(#gaugeShadow)"
            />
          </svg>

          {/* Center Text inside Donut */}
          <div className="circle-inner-content">
            <span className="circle-num">68.4<small>%</small></span>
            <span className="circle-lbl">NIVEL GENERAL</span>
            <span className="circle-sub">Cumplimiento</span>
          </div>
        </div>

        {/* Sub-scores below circle */}
        <div className="gauge-submetrics">
          <div className="submetric-pill">
            <span>Alineación Postural</span>
            <b style={{ color: '#00ffd5' }}>74.0%</b>
          </div>
          <div className="submetric-pill">
            <span>Simetría de Carga</span>
            <b style={{ color: '#38bdf8' }}>69.2%</b>
          </div>
          <div className="submetric-pill">
            <span>Composición & Grasa</span>
            <b style={{ color: '#ffd166' }}>62.0%</b>
          </div>
        </div>
      </div>

      {/* ACCORDION SECTIONS */}
      <div className="accordion-container">
        {/* SECTION 1: RANGO DE MOVIMIENTOS (ROM) */}
        <div className="accordion-item">
          <button
            className={`accordion-trigger ${openSections.rom ? 'open' : ''}`}
            onClick={() => toggleSection('rom')}
          >
            <div className="trigger-left">
              <Compass size={15} color="#00ffd5" />
              <span>Rango de Movimientos (ROM Articular)</span>
            </div>
            <div className="trigger-right">
              <span className="badge-score-sm ok">81.4% Promedio</span>
              {openSections.rom ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {openSections.rom && (
            <div className="accordion-content">
              {/* Metric Row: Cervical */}
              <div
                className={`metric-progress-row ${selectedHotspot === 'cervical' ? 'highlight' : ''}`}
                onClick={() => onSelectHotspot('cervical')}
              >
                <div className="progress-label-row">
                  <b>Flexión / Extensión Cervical</b>
                  <span className="val-text">82% <small>(42° / 50° ROM)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill ok" style={{ width: '82%' }} />
                </div>
                <small className="metric-note">Leve restricción en extensión final C5-C7.</small>
              </div>

              {/* Metric Row: Shoulders */}
              <div
                className={`metric-progress-row ${selectedHotspot === 'torso' ? 'highlight' : ''}`}
                onClick={() => onSelectHotspot('torso')}
              >
                <div className="progress-label-row">
                  <b>Abducción Glenohumeral (Hombros)</b>
                  <span className="val-text">91% <small>(164° / 180° ROM)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill ok" style={{ width: '91%' }} />
                </div>
                <small className="metric-note">Excelente movilidad y ritmo escapulohumeral.</small>
              </div>

              {/* Metric Row: Lumbar */}
              <div
                className={`metric-progress-row ${selectedHotspot === 'lumbar' ? 'highlight' : ''}`}
                onClick={() => onSelectHotspot('lumbar')}
              >
                <div className="progress-label-row">
                  <b>Flexión Lumbar & Tronco</b>
                  <span className="val-text warning">64% <small>(54° / 85° ROM)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill warning" style={{ width: '64%' }} />
                </div>
                <small className="metric-note" style={{ color: '#ffd166' }}>
                  Restricción moderada por hipertonía paravertebral L4-L5.
                </small>
              </div>

              {/* Metric Row: Knees */}
              <div
                className={`metric-progress-row ${selectedHotspot === 'knee_left' ? 'highlight' : ''}`}
                onClick={() => onSelectHotspot('knee_left')}
              >
                <div className="progress-label-row">
                  <b>Flexión Patelofemoral (Rodillas)</b>
                  <span className="val-text">96% <small>(134° / 140° ROM)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill ok" style={{ width: '96%' }} />
                </div>
                <small className="metric-note">Rango bilateral completo sin bloqueos mecánicos.</small>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 2: SIMETRÍA CORPORAL & BIOMECÁNICA */}
        <div className="accordion-item">
          <button
            className={`accordion-trigger ${openSections.symmetry ? 'open' : ''}`}
            onClick={() => toggleSection('symmetry')}
          >
            <div className="trigger-left">
              <Activity size={15} color="#38bdf8" />
              <span>Simetría Corporal & Biomecánica</span>
            </div>
            <div className="trigger-right">
              <span className="badge-score-sm warning">76.8% Balance</span>
              {openSections.symmetry ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {openSections.symmetry && (
            <div className="accordion-content">
              {/* Row: Hombros */}
              <div className="metric-progress-row">
                <div className="progress-label-row">
                  <b>Nivelación Biacromial (Hombros)</b>
                  <span className="val-text">92% <small>(Desnivel 1.1 cm)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill ok" style={{ width: '92%' }} />
                </div>
                <small className="metric-note">Hombro izquierdo levemente ascendido.</small>
              </div>

              {/* Row: Pelvis */}
              <div className="metric-progress-row">
                <div className="progress-label-row">
                  <b>Basculación Pélvica (Eje ASIS)</b>
                  <span className="val-text warning">86% <small>(Desviación 1.8°)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill warning" style={{ width: '86%' }} />
                </div>
                <small className="metric-note" style={{ color: '#ffd166' }}>
                  Inclinación antero-lateral que sobrecarga la hemicadena izquierda.
                </small>
              </div>

              {/* Row: Plantar Weight Distribution */}
              <div className="metric-progress-row">
                <div className="progress-label-row">
                  <b>Distribución de Carga Plantar</b>
                  <span className="val-text">52% Izq · 48% Der</span>
                </div>
                <div className="dual-progress-bar">
                  <div className="dual-fill left" style={{ width: '52%' }}>52% Izq</div>
                  <div className="dual-fill right" style={{ width: '48%' }}>48% Der</div>
                </div>
                <small className="metric-note">Asimetría de apoyo compatible con compensación lumbar.</small>
              </div>

              {/* Row: Eje Sagital */}
              <div className="metric-progress-row">
                <div className="progress-label-row">
                  <b>Línea de Plomada (Eje Sagital)</b>
                  <span className="val-text warning">88% <small>(Anterior 2.2 cm)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill warning" style={{ width: '88%' }} />
                </div>
                <small className="metric-note">Cabeza adelantada generando palanca cervical de +4.8 kg.</small>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: ÍNDICE DE MASA CORPORAL (IMC) & COMPOSICIÓN (GRASA Y MASA) */}
        <div className="accordion-item">
          <button
            className={`accordion-trigger ${openSections.composition ? 'open' : ''}`}
            onClick={() => {
              toggleSection('composition')
              setActiveLayer('fat')
            }}
          >
            <div className="trigger-left">
              <Scale size={15} color="#ffd166" />
              <span>IMC & Métricas de Composición (Grasa y Masa)</span>
            </div>
            <div className="trigger-right">
              <span className="badge-score-sm fat">21.8% Grasa</span>
              {openSections.composition ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {openSections.composition && (
            <div className="accordion-content">
              {/* BMI Card Highlights */}
              <div className="comp-grid-highlights">
                <div className="comp-metric-card">
                  <span>Índice Masa Corporal</span>
                  <strong>23.4 <small>kg/m²</small></strong>
                  <span className="status-chip normal">Normopeso Saludable</span>
                </div>
                <div className="comp-metric-card highlight-fat">
                  <span>Grasa Corporal Total</span>
                  <strong>21.8<small>%</small></strong>
                  <span className="status-chip fat">14.8 kg Masa Grasa</span>
                </div>
                <div className="comp-metric-card">
                  <span>Masa Muscular Magra</span>
                  <strong>34.2 <small>kg</small></strong>
                  <span className="status-chip muscle">74.3% Masa Activa</span>
                </div>
                <div className="comp-metric-card">
                  <span>Grasa Visceral</span>
                  <strong>Grado 4</strong>
                  <span className="status-chip normal">Rango Óptimo (1-9)</span>
                </div>
              </div>

              {/* Composition Breakdown Bars */}
              <div className="metric-progress-row" style={{ marginTop: '12px' }}>
                <div className="progress-label-row">
                  <b>Agua Corporal Total (TBW)</b>
                  <span className="val-text">58.6% <small>(40.1 Litros)</small></span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill ok" style={{ width: '58.6%' }} />
                </div>
                <small className="metric-note">Nivel de hidratación celular fisiológicamente óptimo.</small>
              </div>

              <div className="metric-progress-row">
                <div className="progress-label-row">
                  <b>Distribución Adiposa Subcutánea</b>
                  <span className="val-text">Tronco 12.4% · Miembros 9.4%</span>
                </div>
                <div className="progress-bar-track">
                  <div className="progress-bar-fill fat" style={{ width: '68%' }} />
                </div>
                <small className="metric-note">Patrón de adiposidad central leve sin riesgo metabólico.</small>
              </div>

              {/* Layer switch shortcut */}
              <div className="comp-action-box">
                <button
                  className={`btn-activate-fat-layer ${activeLayer === 'fat' ? 'active' : ''}`}
                  onClick={() => setActiveLayer('fat')}
                >
                  <Layers size={13} />
                  <span>{activeLayer === 'fat' ? 'Capa de Grasa Activa en Modelo 3D' : 'Proyectar Capa de Grasa en Modelo 3D'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
