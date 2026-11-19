import React, { useState, useEffect } from 'react'
import {
  SlidersHorizontal, Sparkles, AlertTriangle, Save,
  CheckCircle2, ArrowRight, ShieldCheck, Layers, GitCompare
} from 'lucide-react'
import { api, Profile, Measurement, Simulation } from '../../services/api'

interface SimulationsViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
  onSelectProfile?: (id: number) => void
}

export const SimulationsView: React.FC<SimulationsViewProps> = ({ profiles, initialProfileId, onSelectProfile }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  )
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [savedSimulations, setSavedSimulations] = useState<Simulation[]>([])
  const [title, setTitle] = useState('Proyección Trimestral Hipertrofia & Reducción')

  // Simulation Sliders
  const [muscleDelta, setMuscleDelta] = useState<number>(2.5) // kg
  const [fatDelta, setFatDelta] = useState<number>(-4.0) // %
  const [postureCorrection, setPostureCorrection] = useState<number>(40) // %
  const [toneFactor, setToneFactor] = useState<number>(60) // %

  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Sincronizar selección de perfil
  useEffect(() => {
    if (initialProfileId && initialProfileId !== selectedProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles])

  // Load profile measurements and simulations
  useEffect(() => {
    if (selectedProfileId) {
      api.measurements(Number(selectedProfileId))
        .then(setMeasurements)
        .catch(() => setMeasurements([]))

      loadSimulations()
    } else {
      setMeasurements([])
      setSavedSimulations([])
    }
  }, [selectedProfileId])

  const loadSimulations = () => {
    if (selectedProfileId) {
      api.simulations(Number(selectedProfileId))
        .then(setSavedSimulations)
        .catch(() => setSavedSimulations([]))
    }
  }

  // Find baseline metrics or reasonable standard baselines
  const baseWeight = measurements.find(m => m.metric.toLowerCase().includes('peso'))?.value || 74.0
  const baseWaist = measurements.find(m => m.metric.toLowerCase().includes('cintura'))?.value || 82.0
  const baseFat = measurements.find(m => m.metric.toLowerCase().includes('grasa'))?.value || 19.5
  const baseHeight = measurements.find(m => m.metric.toLowerCase().includes('estatura'))?.value || 175.0

  // Computed hypothetical values
  const simulatedWeight = (baseWeight + muscleDelta + (fatDelta * 0.4)).toFixed(1)
  const simulatedWaist = (baseWaist + (fatDelta * 0.75)).toFixed(1)
  const simulatedFat = Math.max(5, baseFat + fatDelta).toFixed(1)

  async function handleSaveSimulation(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfileId) return
    setError('')
    try {
      const params = {
        muscle_delta_kg: muscleDelta,
        fat_delta_percent: fatDelta,
        posture_correction_pct: postureCorrection,
        tone_factor_pct: toneFactor,
        base_weight: baseWeight,
        projected_weight: Number(simulatedWeight),
        base_waist: baseWaist,
        projected_waist: Number(simulatedWaist),
        engine: 'v1.2-hypo'
      }
      await api.createSimulation(Number(selectedProfileId), {
        title,
        params_json: JSON.stringify(params)
      })
      setNotice(`Escenario hipotético "${title}" guardado sin modificar mediciones reales.`)
      loadSimulations()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  return (
    <div className="simulations-view">
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Selectors Bar */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente para Simulación:</b>
          <select
            value={selectedProfileId}
            onChange={e => {
              const val = e.target.value ? Number(e.target.value) : ''
              setSelectedProfileId(val)
              if (val && onSelectProfile) onSelectProfile(Number(val))
            }}
          >
            <option value="">-- Seleccionar expediente --</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.display_code} — {p.display_name}</option>
            ))}
          </select>
        </label>
        <span className="badge-warning">ESCENARIOS NO DESTRUCTIVOS AISLADOS</span>
      </div>

      <div className="grid-two" style={{ marginTop: '16px' }}>
        {/* Left: Parametric Sliders Panel */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Parámetros de Simulación Hipotética</h3>
              <p>Variables biomecánicas del motor predictivo</p>
            </div>
            <SlidersHorizontal size={18} color="#e5a93c" />
          </div>

          <form onSubmit={handleSaveSimulation} className="form">
            <label>
              Título del Escenario
              <input
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Plan Progresivo 12 Semanas"
              />
            </label>

            {/* Slider 1: Muscle mass */}
            <div className="slider-item">
              <div className="slider-header">
                <span>Variación de Masa Muscular</span>
                <b>{muscleDelta > 0 ? `+${muscleDelta}` : muscleDelta} kg</b>
              </div>
              <input
                type="range"
                min="-5"
                max="10"
                step="0.5"
                value={muscleDelta}
                onChange={e => setMuscleDelta(parseFloat(e.target.value))}
              />
              <div className="slider-limits">
                <span>-5.0 kg</span>
                <span>Neutro (0)</span>
                <span>+10.0 kg</span>
              </div>
            </div>

            {/* Slider 2: Fat percent */}
            <div className="slider-item">
              <div className="slider-header">
                <span>Ajuste de Adiposidad Estimada</span>
                <b>{fatDelta > 0 ? `+${fatDelta}` : fatDelta} %</b>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={fatDelta}
                onChange={e => setFatDelta(parseFloat(e.target.value))}
              />
              <div className="slider-limits">
                <span>-10.0%</span>
                <span>Sin cambio</span>
                <span>+10.0%</span>
              </div>
            </div>

            {/* Slider 3: Postural correction */}
            <div className="slider-item">
              <div className="slider-header">
                <span>Corrección de Alineación Postural</span>
                <b>{postureCorrection}%</b>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={postureCorrection}
                onChange={e => setPostureCorrection(parseInt(e.target.value))}
              />
              <div className="slider-limits">
                <span>Postura actual</span>
                <span>50%</span>
                <span>Alineación ideal</span>
              </div>
            </div>

            <button className="primary" type="submit" disabled={!selectedProfileId}>
              <Save size={15} /> Guardar Escenario en Historial
            </button>
          </form>
        </section>

        {/* Right: Comparative Side-by-Side (Observado vs Simulado) */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Comparador Morfométrico</h3>
              <p>Contraste de valores observados vs. proyectados</p>
            </div>
            <GitCompare size={18} color="#45cbbd" />
          </div>

          <div className="comparator-grid">
            {/* Real Observed Column */}
            <div className="comparator-col observed">
              <div className="comparator-badge blue">DATO REAL OBSERVADO</div>
              <div className="comparator-metric">
                <span>Peso Corporal</span>
                <strong>{baseWeight} kg</strong>
                <small>Medición de base</small>
              </div>
              <div className="comparator-metric">
                <span>Perímetro Cintura</span>
                <strong>{baseWaist} cm</strong>
                <small>Cinta antropométrica</small>
              </div>
              <div className="comparator-metric">
                <span>% Grasa Estimada</span>
                <strong>{baseFat} %</strong>
                <small>Bioimpedancia</small>
              </div>
            </div>

            {/* Simulated Column */}
            <div className="comparator-col simulated">
              <div className="comparator-badge amber">PROYECCIÓN SIMULADA</div>
              <div className="comparator-metric">
                <span>Peso Proyectado</span>
                <strong style={{ color: '#ffd56b' }}>{simulatedWeight} kg</strong>
                <small>Delta: {(Number(simulatedWeight) - baseWeight).toFixed(1)} kg</small>
              </div>
              <div className="comparator-metric">
                <span>Cintura Proyectada</span>
                <strong style={{ color: '#ffd56b' }}>{simulatedWaist} cm</strong>
                <small>Delta: {(Number(simulatedWaist) - baseWaist).toFixed(1)} cm</small>
              </div>
              <div className="comparator-metric">
                <span>% Grasa Proyectada</span>
                <strong style={{ color: '#ffd56b' }}>{simulatedFat} %</strong>
                <small>Delta: {(Number(simulatedFat) - baseFat).toFixed(1)}%</small>
              </div>
            </div>
          </div>

          {/* Visual Silhouette representation */}
          <div className="silhouette-comparison-box">
            <span>Visualización esquemática de contorno:</span>
            <div className="silhouette-bars">
              <div className="bar-track">
                <span>Cintura observada: {baseWaist}cm</span>
                <div className="bar-fill blue" style={{ width: `${(baseWaist / 120) * 100}%` }} />
              </div>
              <div className="bar-track">
                <span>Cintura simulada: {simulatedWaist}cm</span>
                <div className="bar-fill amber" style={{ width: `${(Number(simulatedWaist) / 120) * 100}%` }} />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Bottom: Saved Scenarios */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          <div>
            <h3>Escenarios Simulados para este Expediente</h3>
            <p>{savedSimulations.length} proyecciones versionadas</p>
          </div>
        </div>

        {savedSimulations.length === 0 ? (
          <div className="empty">No hay escenarios hipotéticos guardados para este expediente.</div>
        ) : (
          <div className="simulations-list">
            {savedSimulations.map(sim => {
              let params: any = {}
              try { params = JSON.parse(sim.params_json) } catch {}
              return (
                <div key={sim.id} className="simulation-card">
                  <div className="sim-header">
                    <b>{sim.title}</b>
                    <span>Motor: {sim.engine_version} · Creado el {new Date(sim.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="sim-meta-tags">
                    <span className="tag-sim">Masa: {params.muscle_delta_kg > 0 ? `+${params.muscle_delta_kg}` : params.muscle_delta_kg}kg</span>
                    <span className="tag-sim">Grasa: {params.fat_delta_percent}%</span>
                    <span className="tag-sim">Postura: {params.posture_correction_pct}%</span>
                    <span className="tag-sim">Peso est.: {params.projected_weight}kg</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Safety Notice */}
      <div className="compliance-banner" style={{ marginTop: '16px' }}>
        <AlertTriangle size={18} color="#e5a93c" />
        <div>
          <b>Garantía de Integridad de Datos:</b> Los escenarios hipotéticos se almacenan en una tabla independiente (<code>simulations</code>) y nunca sobreescriben la tabla inmutable de registros observados (<code>measurements</code>).
        </div>
      </div>
    </div>
  )
}
