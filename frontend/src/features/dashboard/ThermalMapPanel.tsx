import React, { useState } from 'react'
import {
  Flame, Thermometer, AlertTriangle, CheckCircle2,
  Maximize2, ArrowRightLeft, ShieldAlert, Zap, Info
} from 'lucide-react'
import { ANATOMICAL_HOTSPOTS } from './Dashboard3DViewer'

interface ThermalMapPanelProps {
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
  activeLayer: string
  setActiveLayer: (layer: any) => void
}

export const ThermalMapPanel: React.FC<ThermalMapPanelProps> = ({
  selectedHotspot,
  onSelectHotspot,
  activeLayer,
  setActiveLayer
}) => {
  const [viewOrientation, setViewOrientation] = useState<'anterior' | 'posterior'>('posterior')
  const [showInsulationEffect, setShowInsulationEffect] = useState(false)

  const activeSpot = ANATOMICAL_HOTSPOTS.find(h => h.id === selectedHotspot) || ANATOMICAL_HOTSPOTS[0]

  return (
    <div className="dash-thermal-card">
      {/* Header */}
      <div className="dash-thermal-header">
        <div>
          <div className="dash-thermal-title">
            <Flame size={16} color="#ef4444" />
            <span>MAPA TÉRMICO / ANÁLISIS DE SUPERFICIE</span>
          </div>
          <p className="dash-thermal-sub">
            Termografía infrarroja de tensión muscular y asimetrías
          </p>
        </div>

        {/* Anterior / Posterior switch */}
        <div className="thermal-view-switch">
          <button
            className={`btn-orient ${viewOrientation === 'anterior' ? 'active' : ''}`}
            onClick={() => setViewOrientation('anterior')}
          >
            Anterior
          </button>
          <button
            className={`btn-orient ${viewOrientation === 'posterior' ? 'active' : ''}`}
            onClick={() => setViewOrientation('posterior')}
          >
            Posterior
          </button>
        </div>
      </div>

      {/* Main Thermal Visualization Body */}
      <div className="thermal-body-container">
        {/* Left Side: SVG Thermal Silhouette */}
        <div className="thermal-silhouette-wrap">
          <svg
            className="thermal-svg"
            viewBox="0 0 240 380"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Radial Gradients for Heat zones */}
              <radialGradient id="heatCervical" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
                <stop offset="55%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="heatLumbar" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.92" />
                <stop offset="60%" stopColor="#eab308" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="heatKnee" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.88" />
                <stop offset="65%" stopColor="#10b981" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="normoChest" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.7" />
                <stop offset="80%" stopColor="#065f46" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
              </radialGradient>

              <radialGradient id="adiposeShield" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d97706" stopOpacity="0.7" />
                <stop offset="70%" stopColor="#b45309" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#000" stopOpacity="0" />
              </radialGradient>

              <filter id="thermalGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Base Body Contour (Posterior / Anterior silhouette) */}
            <g opacity="0.35" stroke="#38bdf8" strokeWidth="1.2">
              {/* Head */}
              <circle cx="120" cy="42" r="22" fill="#082f49" />
              {/* Neck */}
              <path d="M112 64 L112 76 L128 76 L128 64 Z" fill="#082f49" />
              {/* Shoulders & Torso */}
              <path
                d="M112 76 C95 78 72 85 64 100 L72 170 L86 170 L92 210 L148 210 L154 170 L168 170 L176 100 C168 85 145 78 128 76 Z"
                fill="#082f49"
              />
              {/* Arms */}
              <path d="M64 100 L50 170 L42 225 L54 228 L64 172 L72 120 Z" fill="#082f49" />
              <path d="M176 100 L190 170 L198 225 L186 228 L176 172 L168 120 Z" fill="#082f49" />
              {/* Legs */}
              <path d="M94 210 L88 280 L84 340 L102 340 L110 280 L116 210 Z" fill="#082f49" />
              <path d="M146 210 L152 280 L156 340 L138 340 L130 280 L124 210 Z" fill="#082f49" />
            </g>

            {/* BASE THERMAL EMISSION: Normothermic green tone layer */}
            <g filter="url(#thermalGlow)" opacity="0.8">
              {/* Torso background normothermic field */}
              <ellipse cx="120" cy="140" rx="36" ry="50" fill="url(#normoChest)" />
              {/* Right arm & leg normothermic fields */}
              <ellipse cx="60" cy="160" rx="12" ry="40" fill="url(#normoChest)" />
              <ellipse cx="180" cy="160" rx="12" ry="40" fill="url(#normoChest)" />
              <ellipse cx="144" cy="275" rx="14" ry="55" fill="url(#normoChest)" />
              <ellipse cx="96" cy="275" rx="14" ry="55" fill="url(#normoChest)" />
            </g>

            {/* HOT ZONE 1: Cervical / Upper Trapezius (RED - 37.8°C) */}
            <g
              filter="url(#thermalGlow)"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectHotspot('cervical')}
            >
              <ellipse
                cx="120"
                cy="82"
                rx={selectedHotspot === 'cervical' ? '32' : '28'}
                ry={selectedHotspot === 'cervical' ? '18' : '15'}
                fill="url(#heatCervical)"
              />
              <circle cx="120" cy="80" r="5" fill="#ffffff" opacity="0.9" />
              <circle cx="120" cy="80" r="11" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>

            {/* HOT ZONE 2: Lumbar Region (YELLOW/ORANGE - 37.1°C) */}
            <g
              filter="url(#thermalGlow)"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectHotspot('lumbar')}
            >
              <ellipse
                cx="120"
                cy="175"
                rx={selectedHotspot === 'lumbar' ? '30' : '26'}
                ry={selectedHotspot === 'lumbar' ? '17' : '14'}
                fill="url(#heatLumbar)"
              />
              <circle cx="120" cy="175" r="4.5" fill="#fef08a" />
              <circle cx="120" cy="175" r="9" stroke="#f59e0b" strokeWidth="1.5" />
            </g>

            {/* HOT ZONE 3: Left Knee / Patellar Tendon (YELLOW - 36.9°C) */}
            <g
              filter="url(#thermalGlow)"
              style={{ cursor: 'pointer' }}
              onClick={() => onSelectHotspot('knee_left')}
            >
              <ellipse
                cx="98"
                cy="278"
                rx={selectedHotspot === 'knee_left' ? '18' : '15'}
                ry={selectedHotspot === 'knee_left' ? '18' : '15'}
                fill="url(#heatKnee)"
              />
              <circle cx="98" cy="278" r="4" fill="#fef08a" />
              <circle cx="98" cy="278" r="8" stroke="#f59e0b" strokeWidth="1.2" />
            </g>

            {/* ADIPOSE LAYER OVERLAY (When fat insulation mode is enabled) */}
            {showInsulationEffect && (
              <g filter="url(#thermalGlow)">
                <ellipse cx="120" cy="165" rx="32" ry="24" fill="url(#adiposeShield)" />
                <text x="120" y="168" fill="#ffd166" fontSize="8" textAnchor="middle" fontWeight="bold">
                  Aislante Adiposo (-1.2°C)
                </text>
              </g>
            )}

            {/* Interactive Callout Pointers */}
            <g fontSize="8" fontFamily="Manrope, sans-serif" fontWeight="700">
              {/* Cervical tag */}
              <line x1="120" y1="80" x2="35" y2="55" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="10" y="44" width="55" height="18" rx="4" fill="#381017" stroke="#ef4444" strokeWidth="1" />
              <text x="37" y="56" fill="#fecaca" textAnchor="middle">37.8°C C-7</text>

              {/* Lumbar tag */}
              <line x1="120" y1="175" x2="205" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="175" y="150" width="56" height="18" rx="4" fill="#35240f" stroke="#f59e0b" strokeWidth="1" />
              <text x="203" y="162" fill="#fed7aa" textAnchor="middle">37.1°C L4-5</text>

              {/* Knee tag */}
              <line x1="98" y1="278" x2="30" y2="285" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="5" y="275" width="55" height="18" rx="4" fill="#35240f" stroke="#f59e0b" strokeWidth="1" />
              <text x="32" y="287" fill="#fed7aa" textAnchor="middle">36.9°C Rót</text>
            </g>
          </svg>
        </div>

        {/* Right Side: Temperature Scale & Reading */}
        <div className="thermal-side-meta">
          <div className="thermal-scale-card">
            <span className="scale-title">GRADIENTE TÉRMICO</span>
            <div className="thermal-gradient-bar">
              <span className="grad-tick hot">38.5°C</span>
              <div className="grad-fill" />
              <span className="grad-tick warm">36.8°C</span>
              <span className="grad-tick norm">35.5°C</span>
              <span className="grad-tick cold">28.0°C</span>
            </div>
            <div className="scale-legend">
              <div className="legend-row">
                <span className="leg-dot red" /> <b>&gt;37.4°C:</b> Hipertermia
              </div>
              <div className="legend-row">
                <span className="leg-dot yel" /> <b>36.6-37.3:</b> Sobrecarga
              </div>
              <div className="legend-row">
                <span className="leg-dot grn" /> <b>35.0-36.5:</b> Normotérmico
              </div>
            </div>
          </div>

          {/* Quick Delta Indicator */}
          <div className="thermal-delta-box">
            <div className="delta-head">
              <Zap size={14} color="#f59e0b" />
              <span>ASIMETRÍA TÉRMICA</span>
            </div>
            <strong className="delta-value">ΔT = 1.9°C</strong>
            <small>Diferencial crítico entre zona cervical (37.8°C) y tronco basal (35.9°C).</small>
          </div>
        </div>
      </div>

      {/* Selected Hotspot Breakdown Card */}
      <div className="thermal-hotspot-panel">
        <div className="hotspot-active-header">
          <div className="hotspot-title-row">
            <span className={`status-badge ${activeSpot.status}`}>
              {activeSpot.status === 'critical' ? 'HIPERTERMIA ACTIVA' : activeSpot.status === 'warning' ? 'SOBRECARGA' : 'NORMAL'}
            </span>
            <b>{activeSpot.name}</b>
          </div>
          <span className="hotspot-temp-pill">{activeSpot.temp}</span>
        </div>

        <p className="hotspot-desc">{activeSpot.description}</p>

        {/* Correlated Clinical Meaning */}
        <div className="hotspot-correlation-grid">
          <div className="corr-item">
            <span>Diagnóstico Térmico:</span>
            <strong>{activeSpot.metric}</strong>
          </div>
          <div className="corr-item">
            <span>Correlación Postural / ROM:</span>
            <strong>{activeSpot.rom}</strong>
          </div>
        </div>

        {/* Sync Buttons */}
        <div className="thermal-action-row">
          <button
            className="btn-sync-3d"
            onClick={() => {
              setActiveLayer('thermal')
              onSelectHotspot(activeSpot.id)
            }}
          >
            <Flame size={13} /> Ver en 3D
          </button>
          <button
            className={`btn-sync-fat ${showInsulationEffect ? 'active' : ''}`}
            onClick={() => {
              setShowInsulationEffect(!showInsulationEffect)
              if (!showInsulationEffect) setActiveLayer('fat')
            }}
            title="Ver cómo la capa de grasa subcutánea aísla la emisión infrarroja"
          >
            <Thermometer size={13} /> {showInsulationEffect ? 'Ocultar Aislante Adiposo' : 'Cruzar con Capa de Grasa'}
          </button>
        </div>
      </div>
    </div>
  )
}
