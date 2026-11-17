import React, { useState, useEffect } from 'react'
import {
  Activity, Plus, History, TrendingUp, AlertCircle,
  Edit3, Check, X, ShieldAlert, Sparkles
} from 'lucide-react'
import { api, Profile, Measurement, MetricItem } from '../../services/api'

interface MeasurementsViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
}

export const MeasurementsView: React.FC<MeasurementsViewProps> = ({ profiles, initialProfileId }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  )
  const [catalog, setCatalog] = useState<MetricItem[]>([])
  const [metricName, setMetricName] = useState('Estatura')
  const [value, setValue] = useState('')
  const [unit, setUnit] = useState('cm')
  const [method, setMethod] = useState('Estadiómetro de pared')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [selectedChartMetric, setSelectedChartMetric] = useState<string>('Peso Corporal')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Correction state
  const [correctingItem, setCorrectingItem] = useState<Measurement | null>(null)
  const [correctedValue, setCorrectedValue] = useState('')
  const [correctionReason, setCorrectionReason] = useState('')

  // Load catalog
  useEffect(() => {
    api.metricsCatalog().then(setCatalog).catch(() => {
      // Fallback local catalog
      setCatalog([
        { metric: 'Estatura', unit: 'cm', defaultMethod: 'Estadiómetro de pared', min: 50, max: 250, category: 'Antropometría' },
        { metric: 'Peso Corporal', unit: 'kg', defaultMethod: 'Báscula bioimpedancia', min: 20, max: 300, category: 'Composición' },
        { metric: 'Perímetro Cintura', unit: 'cm', defaultMethod: 'Cinta métrica metálica', min: 40, max: 200, category: 'Perímetros' },
        { metric: 'Perímetro Cadera', unit: 'cm', defaultMethod: 'Cinta métrica metálica', min: 50, max: 220, category: 'Perímetros' },
        { metric: 'Perímetro Tórax', unit: 'cm', defaultMethod: 'Cinta métrica metálica', min: 50, max: 200, category: 'Perímetros' },
        { metric: 'Perímetro Brazo Relajado', unit: 'cm', defaultMethod: 'Cinta métrica', min: 15, max: 70, category: 'Perímetros' },
        { metric: '% Grasa Corporal (Estimada)', unit: '%', defaultMethod: 'Bioimpedancia / Estimación', min: 3, max: 65, category: 'Composición' }
      ])
    })
  }, [])

  // Load measurements when profile changes
  const loadMeasurements = () => {
    if (selectedProfileId) {
      api.measurements(Number(selectedProfileId))
        .then(data => {
          setMeasurements(data)
          if (data.length > 0 && !selectedChartMetric) {
            setSelectedChartMetric(data[0].metric)
          }
        })
        .catch(err => setError((err as Error).message))
    } else {
      setMeasurements([])
    }
  }

  useEffect(() => {
    loadMeasurements()
  }, [selectedProfileId])

  // Update unit and method when selecting catalog metric
  function handleCatalogSelect(name: string) {
    setMetricName(name)
    const found = catalog.find(c => c.metric === name)
    if (found) {
      setUnit(found.unit)
      setMethod(found.defaultMethod)
    }
  }

  // Create standard measurement
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfileId) return
    setError('')
    setNotice('')
    try {
      await api.createMeasurement(Number(selectedProfileId), {
        metric: metricName,
        value: Number(value),
        unit,
        method
      })
      setValue('')
      setNotice(`Medición de ${metricName} registrada con trazabilidad.`)
      loadMeasurements()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Submit non-destructive correction
  async function handleCorrect(e: React.FormEvent) {
    e.preventDefault()
    if (!correctingItem || !selectedProfileId) return
    if (!correctionReason.trim()) {
      setError('Es obligatorio indicar el motivo de la corrección.')
      return
    }
    try {
      await api.createMeasurement(Number(selectedProfileId), {
        metric: correctingItem.metric,
        value: Number(correctedValue),
        unit: correctingItem.unit,
        method: `${correctingItem.method} (Rectificado)`,
        is_correction: true,
        correction_reason: correctionReason,
        original_id: correctingItem.id
      })
      setCorrectingItem(null)
      setCorrectedValue('')
      setCorrectionReason('')
      setNotice('Corrección registrada sin alterar el histórico precedente.')
      loadMeasurements()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  // Prepare data for evolution chart
  const currentMetricCatalog = catalog.find(c => c.metric === metricName)
  const chartItems = measurements
    .filter(m => m.metric === selectedChartMetric)
    .sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime())

  const uniqueMetrics = Array.from(new Set(measurements.map(m => m.metric)))

  return (
    <div className="measurements-view">
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Profile Selector Banner */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente Activo:</b>
          <select
            value={selectedProfileId}
            onChange={e => setSelectedProfileId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">-- Seleccionar expediente --</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>
                {p.display_code} — {p.display_name} ({p.status})
              </option>
            ))}
          </select>
        </label>
        <span className="profile-stat-pill">
          {measurements.length} mediciones históricas
        </span>
      </div>

      <div className="grid-two" style={{ marginTop: '16px' }}>
        {/* Left: Registration Form with Catalog */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Registrar Medición Observada</h3>
              <p>Datos directos validados; indicar técnica y unidad oficial</p>
            </div>
            <Activity size={18} color="#45cbbd" />
          </div>

          <form onSubmit={handleCreate} className="form">
            <label>
              Métrica Estandarizada
              <select
                value={metricName}
                onChange={e => handleCatalogSelect(e.target.value)}
              >
                {catalog.map(c => (
                  <option key={c.metric} value={c.metric}>
                    [{c.category}] {c.metric} ({c.unit})
                  </option>
                ))}
              </select>
            </label>

            <div className="inline-fields">
              <label>
                Valor Observado
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.0"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              </label>
              <label>
                Unidad
                <input
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  required
                />
              </label>
            </div>

            {currentMetricCatalog && (
              <div className="range-indicator">
                <span>Rango recomendado: {currentMetricCatalog.min} a {currentMetricCatalog.max} {currentMetricCatalog.unit}</span>
              </div>
            )}

            <label>
              Método / Instrumento de Medición
              <input
                required
                value={method}
                onChange={e => setMethod(e.target.value)}
                placeholder="Ej. Cinta antropométrica Cescorf"
              />
            </label>

            <button className="primary" type="submit" disabled={!selectedProfileId}>
              <Plus size={16} /> Guardar Medición Inmutable
            </button>
          </form>
        </section>

        {/* Right: Evolution Graph */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Evolución Temporal de la Métrica</h3>
              <p>Historial y tendencia cuantitativa</p>
            </div>
            <TrendingUp size={18} color="#45cbbd" />
          </div>

          {uniqueMetrics.length > 0 && (
            <div className="chart-metric-selector">
              <span>Métrica a graficar:</span>
              <select
                value={selectedChartMetric}
                onChange={e => setSelectedChartMetric(e.target.value)}
              >
                {uniqueMetrics.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          )}

          {chartItems.length < 2 ? (
            <div className="empty" style={{ minHeight: '160px', display: 'grid', placeItems: 'center' }}>
              <p>Se requieren al menos 2 registros de {selectedChartMetric} para visualizar la gráfica de evolución temporal.</p>
            </div>
          ) : (
            <div className="chart-container">
              <EvolutionSparkline items={chartItems} />
            </div>
          )}
        </section>
      </div>

      {/* Bottom: Complete Chronological Audit Table */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          <div>
            <h3>Historial Cronológico de Mediciones y Auditoría</h3>
            <p>Registro inmutable con soporte de rectificaciones no destructivas</p>
          </div>
          <span className="badge-live">{measurements.length} REGISTROS</span>
        </div>

        {measurements.length === 0 ? (
          <div className="empty">No hay mediciones registradas para este expediente.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Métrica</th>
                  <th>Valor</th>
                  <th>Unidad</th>
                  <th>Método</th>
                  <th>Fecha de Registro</th>
                  <th>Operador</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {measurements.map(m => (
                  <tr key={m.id} className={m.is_correction ? 'correction-row' : ''}>
                    <td>
                      <b>{m.metric}</b>
                      {m.is_correction && (
                        <span className="tag-corrected">Rectificación de #{m.original_id}</span>
                      )}
                    </td>
                    <td><strong style={{ fontSize: '13px' }}>{m.value}</strong></td>
                    <td>{m.unit}</td>
                    <td>
                      {m.method}
                      {m.correction_reason && (
                        <small style={{ display: 'block', color: '#e5a93c' }}>
                          Motivo: {m.correction_reason}
                        </small>
                      )}
                    </td>
                    <td>{new Date(m.measured_at).toLocaleString()}</td>
                    <td><code>{m.created_by}</code></td>
                    <td>
                      <span className="badge-ok">Válido</span>
                    </td>
                    <td>
                      <button
                        className="btn-icon-subtle"
                        title="Rectificar medición (no destructivo)"
                        onClick={() => {
                          setCorrectingItem(m)
                          setCorrectedValue(m.value.toString())
                          setCorrectionReason('')
                        }}
                      >
                        <Edit3 size={14} /> Corregir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Non-destructive Correction Modal */}
      {correctingItem && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#e5a93c" />
                <h4 style={{ margin: 0 }}>Rectificación No Destructiva</h4>
              </div>
              <button className="btn-close" onClick={() => setCorrectingItem(null)}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#9bb0c5' }}>
              De acuerdo con las directrices de trazabilidad, el registro original #{correctingItem.id} ({correctingItem.metric}: {correctingItem.value} {correctingItem.unit}) no será eliminado. Se generará un nuevo registro versionado con el motivo declarado.
            </p>
            <form onSubmit={handleCorrect} className="form" style={{ marginTop: '12px' }}>
              <label>
                Nuevo Valor ({correctingItem.unit})
                <input
                  type="number"
                  step="any"
                  required
                  value={correctedValue}
                  onChange={e => setCorrectedValue(e.target.value)}
                />
              </label>
              <label>
                Motivo Obligatorio de la Corrección
                <input
                  required
                  placeholder="Ej: Error tipográfico en lectura inicial del estadiómetro"
                  value={correctionReason}
                  onChange={e => setCorrectionReason(e.target.value)}
                />
              </label>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-revoke" onClick={() => setCorrectingItem(null)}>
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  <Check size={14} /> Confirmar Rectificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Custom SVG Sparkline for timeline visualization
function EvolutionSparkline({ items }: { items: Measurement[] }) {
  const values = items.map(i => i.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1

  const width = 480
  const height = 140
  const padding = 28

  const points = items.map((item, idx) => {
    const x = padding + (idx / (items.length - 1)) * (width - padding * 2)
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2)
    return { x, y, value: item.value, date: new Date(item.measured_at).toLocaleDateString(), unit: item.unit }
  })

  const pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '')

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="evolution-svg">
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1f374f" strokeDasharray="3 3" />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#1f374f" />
        
        {/* Line */}
        <path d={pathD} fill="none" stroke="#48dbcb" strokeWidth="2.5" />

        {/* Data points */}
        {points.map((pt, i) => (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="4.5" fill="#0b1728" stroke="#48dbcb" strokeWidth="2" />
            <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#c3d5e8" fontSize="10" fontWeight="600">
              {pt.value} {pt.unit}
            </text>
            <text x={pt.x} y={height - 8} textAnchor="middle" fill="#6c849e" fontSize="8">
              {pt.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
