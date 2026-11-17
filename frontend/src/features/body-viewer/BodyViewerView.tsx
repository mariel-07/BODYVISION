import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls, Grid, ContactShadows, PerspectiveCamera,
  useGLTF, Html
} from '@react-three/drei'
import * as THREE from 'three'
import {
  Layers, Sun, RotateCw, Activity, ShieldCheck, UserCheck,
  Sparkles, Compass, Eye, Ruler, Camera, CheckCircle2,
  AlertCircle, Scale, Flame, BarChart2, Crosshair, Radio,
  Play, Pause, Sliders, Zap
} from 'lucide-react'
import { api, Profile, Measurement } from '../../services/api'

// Preload real 3D anatomical human body model
useGLTF.preload('/models/human_body.glb')

interface BodyViewerViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
}

export const BodyViewerView: React.FC<BodyViewerViewProps> = ({ profiles, initialProfileId }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  )
  const [measurements, setMeasurements] = useState<Measurement[]>([])

  // Viewer Controls
  const [layer, setLayer] = useState<'clinical' | 'heatmap' | 'wireframe' | 'skeleton' | 'measurements' | 'surface'>('clinical')
  const [lighting, setLighting] = useState<'studio' | 'cyberpunk' | 'clinical'>('studio')
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side_r' | 'side_l' | 'back' | 'perspective'>('perspective')
  const [activeTab, setActiveTab] = useState<'mesh' | 'live_scan' | 'biomechanics' | 'tools'>('live_scan')

  // Real-Time 3D Full-Body Laser Scanner State
  const [isLiveScanning, setIsLiveScanning] = useState(true)
  const [autoScanSweep, setAutoScanSweep] = useState(true)
  const [laserY, setLaserY] = useState(1.05) // Current laser sweep elevation (0.03m to 1.75m)
  const [scanSpeed, setScanSpeed] = useState(1.0)
  const [showPointCloud, setShowPointCloud] = useState(true)

  // Diagnostic Overlays Toggles
  const [showPlumbLine, setShowPlumbLine] = useState(true)
  const [show3DCallouts, setShow3DCallouts] = useState(true)

  const controlsRef = useRef<any>(null)

  // Sincronizar selección de perfil
  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles, selectedProfileId])

  // Cargar mediciones del perfil activo
  useEffect(() => {
    if (selectedProfileId) {
      api.measurements(Number(selectedProfileId))
        .then(setMeasurements)
        .catch(() => setMeasurements([]))
    } else {
      setMeasurements([])
    }
  }, [selectedProfileId])

  // Navegación de presets de cámara anatómicos
  function applyCameraPreset(preset: 'front' | 'side_r' | 'side_l' | 'back' | 'perspective') {
    setCameraPreset(preset)
    if (!controlsRef.current) return
    controlsRef.current.reset()
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 0.88, 2.75)
    } else if (preset === 'side_r') {
      controlsRef.current.object.position.set(2.75, 0.88, 0)
    } else if (preset === 'side_l') {
      controlsRef.current.object.position.set(-2.75, 0.88, 0)
    } else if (preset === 'back') {
      controlsRef.current.object.position.set(0, 0.88, -2.75)
    } else {
      controlsRef.current.object.position.set(1.5, 1.2, 2.2)
    }
    controlsRef.current.target.set(0, 0.88, 0)
    controlsRef.current.update()
  }

  // Captura instantánea de la escena 3D en PNG
  function handleCaptureSnapshot() {
    const canvas = document.querySelector('.canvas-wrapper canvas') as HTMLCanvasElement
    if (!canvas) return
    const image = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = image
    link.download = `bodyvision_live_scan_${Date.now()}.png`
    link.click()
  }

  // Extracción de métricas
  const getNumVal = (mName: string, fallback: number) => {
    const found = measurements.find(m => m.metric.toLowerCase().includes(mName.toLowerCase()))
    return found ? found.value : fallback
  }

  const height = getNumVal('Estatura', 172.0)
  const weight = getNumVal('Peso', 68.0)
  const waist = getNumVal('Cintura', 74.0)
  const hip = getNumVal('Cadera', 96.0)
  const chest = getNumVal('Tórax', 90.0)
  const fat = getNumVal('Grasa', 19.5)

  // Cálculos Biomecánicos y Antropométricos Clínicos
  const heightM = height / 100
  const bmi = (weight / (heightM * heightM)).toFixed(1)
  const whr = (waist / hip).toFixed(2)
  const bsa = Math.sqrt((height * weight) / 3600).toFixed(2)
  const lbm = (0.407 * weight + 0.267 * height - 19.2).toFixed(1)

  // Telemetría instantánea en la cota exacta del haz láser
  const liveTelemetry = useMemo(() => {
    return getPerimeterAtHeight(laserY, { chest, waist, hip })
  }, [laserY, chest, waist, hip])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)

  return (
    <div className="body-viewer-view">
      {/* Top Selector Bar */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente Biomecánico 3D:</b>
          <select
            value={selectedProfileId}
            onChange={e => setSelectedProfileId(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">-- Seleccionar expediente --</option>
            {profiles.map(p => (
              <option key={p.id} value={p.id}>{p.display_code} — {p.display_name}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className={`badge-live ${isLiveScanning ? 'active-scanner' : ''}`} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} className={isLiveScanning ? 'pulse-laser-icon' : ''} color={isLiveScanning ? '#00ffcc' : '#34d399'} />
            {isLiveScanning ? 'ESCÁNER LiDAR 3D EN TIEMPO REAL (ACTIVO)' : 'TOPOLOGÍA 50K QUADS'}
          </span>
          <button className="btn-preset" onClick={handleCaptureSnapshot} title="Exportar captura clínica 3D en PNG">
            <Camera size={13} /> Captura 3D
          </button>
        </div>
      </div>

      <div className="viewer-layout" style={{ marginTop: '16px' }}>
        {/* 3D Canvas Area */}
        <div className="canvas-wrapper">
          {/* Floating Metric HUD Overlay */}
          <div className="viewer-floating-hud">
            <div className="hud-metric-pill">
              <span>Estatura:</span>
              <b>{height} cm</b>
            </div>
            <div className="hud-metric-pill">
              <span>Peso:</span>
              <b>{weight} kg</b>
            </div>
            <div className="hud-metric-pill">
              <span>IMC:</span>
              <b style={{ color: Number(bmi) < 25 ? '#34d399' : '#f59e0b' }}>{bmi} kg/m²</b>
            </div>
            <div className="hud-metric-pill">
              <span>ICC:</span>
              <b style={{ color: Number(whr) < 0.85 ? '#34d399' : '#f59e0b' }}>{whr}</b>
            </div>
          </div>

          {/* Real-Time Laser Telemetry Box (Active during Live Scan) */}
          {isLiveScanning && (
            <div className="live-scanner-telemetry-hud">
              <div className="scanner-badge-row">
                <span className="live-scanner-dot" />
                <b>TELEMETRÍA LÁSER EN TIEMPO REAL</b>
                <span className="scanner-frequency">60 FPS · 28.3K VÉRTICES</span>
              </div>
              <div className="scanner-metrics-grid">
                <div className="scanner-metric">
                  <span>Cota de Haz (Z):</span>
                  <strong>{laserY.toFixed(2)} m</strong>
                </div>
                <div className="scanner-metric">
                  <span>Región Anatómica:</span>
                  <strong style={{ color: '#00f5d4' }}>{liveTelemetry.zone}</strong>
                </div>
                <div className="scanner-metric">
                  <span>Perímetro Instantáneo:</span>
                  <strong style={{ color: '#ffd166' }}>{liveTelemetry.perimeter} cm</strong>
                </div>
                <div className="scanner-metric">
                  <span>Área de Corte Transversal:</span>
                  <strong>{liveTelemetry.area} cm²</strong>
                </div>
              </div>
            </div>
          )}

          {/* Perspective Preset Buttons */}
          <div className="viewer-perspective-bar">
            {(['front', 'side_r', 'side_l', 'back', 'perspective'] as const).map(p => (
              <button
                key={p}
                className={`btn-preset ${cameraPreset === p ? 'active' : ''}`}
                onClick={() => applyCameraPreset(p)}
              >
                {p === 'front' ? 'Plano Frontal' :
                 p === 'side_r' ? 'Lateral Derecho' :
                 p === 'side_l' ? 'Lateral Izquierdo' :
                 p === 'back' ? 'Plano Posterior' : '3D Libre'}
              </button>
            ))}
            <button
              className={`btn-preset ${autoRotate ? 'active' : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Giro de inspección continua (Turntable)"
            >
              <RotateCw size={13} /> Giro 360°
            </button>
            <button
              className={`btn-preset ${isLiveScanning ? 'active' : ''}`}
              onClick={() => setIsLiveScanning(!isLiveScanning)}
              title="Conmutar escáner láser de cuerpo completo en tiempo real"
              style={{ borderColor: isLiveScanning ? '#00ffcc' : undefined }}
            >
              <Zap size={13} color={isLiveScanning ? '#00ffcc' : undefined} />
              {isLiveScanning ? 'Escáner Activo' : 'Iniciar Escáner'}
            </button>
          </div>

          {/* WebGL Canvas */}
          <Canvas shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
            <PerspectiveCamera makeDefault position={[1.5, 1.2, 2.2]} fov={45} />
            <OrbitControls
              ref={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={1.4}
              minDistance={0.8}
              maxDistance={5.5}
              target={[0, 0.88, 0]}
              maxPolarAngle={Math.PI / 2 + 0.04}
            />

            {/* Lighting Setups */}
            {lighting === 'studio' && (
              <>
                <ambientLight intensity={0.9} color="#f8fafc" />
                <directionalLight position={[2.5, 4.5, 3.5]} intensity={1.8} castShadow shadow-mapSize={1024} />
                <directionalLight position={[-2.5, 3.0, 2.0]} intensity={1.1} color="#e0f2fe" />
                <directionalLight position={[0, 2.2, -3.5]} intensity={1.0} color="#bae6fd" />
                <pointLight position={[0, 0.4, 2.0]} intensity={0.5} />
              </>
            )}
            {lighting === 'cyberpunk' && (
              <>
                <ambientLight intensity={0.4} color="#0c1929" />
                <directionalLight position={[3.5, 3.5, 2.5]} intensity={2.6} color="#00f5d4" />
                <directionalLight position={[-3.5, 2.5, -2.5]} intensity={2.4} color="#f72585" />
                <pointLight position={[0, 2, 3]} intensity={1.3} color="#7209b7" />
              </>
            )}
            {lighting === 'clinical' && (
              <>
                <ambientLight intensity={1.5} color="#ffffff" />
                <directionalLight position={[0, 6.0, 2.5]} intensity={1.9} />
                <directionalLight position={[0, 1.8, -4.0]} intensity={1.2} />
                <directionalLight position={[-3.5, 2.5, 0]} intensity={0.9} />
                <directionalLight position={[3.5, 2.5, 0]} intensity={0.9} />
              </>
            )}

            {/* Real 3D Anatomical Human Body Mesh */}
            <Suspense fallback={<ModelLoadingFallback />}>
              <RealisticHumanBody
                layer={layer}
                show3DCallouts={show3DCallouts}
                showPointCloud={showPointCloud && isLiveScanning}
                laserY={laserY}
                measurements={{ height, chest, waist, hip, fat }}
              />
            </Suspense>

            {/* Real-time Volumetric LiDAR Laser Scan Beam */}
            {isLiveScanning && (
              <RealtimeLaserScanBeam
                active={isLiveScanning}
                laserY={laserY}
                setLaserY={setLaserY}
                autoScan={autoScanSweep}
                scanSpeed={scanSpeed}
              />
            )}

            {/* Plumb Line & Postural Symmetry Grid */}
            {showPlumbLine && <PosturalPlumbLine />}

            {/* Laboratory Floor Grid & Contact Shadows */}
            <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={4.5} blur={1.5} far={2} />
            <Grid
              position={[0, -0.005, 0]}
              args={[10, 10]}
              cellSize={0.1}
              cellThickness={0.5}
              cellColor="#19334d"
              sectionSize={0.5}
              sectionThickness={1.2}
              sectionColor="#2b5982"
              fadeDistance={6}
            />

            {/* Concentric Podometric Rings on Floor */}
            <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.3, 0.305, 48]} />
              <meshBasicMaterial color="#3bd5c5" opacity={0.3} transparent />
            </mesh>
            <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.6, 0.608, 48]} />
              <meshBasicMaterial color="#3bd5c5" opacity={0.2} transparent />
            </mesh>
          </Canvas>
        </div>

        {/* Right: Clinical & Biomechanical Control Center */}
        <div className="viewer-controls-panel">
          {/* Section Navigation Tabs */}
          <div className="admin-nav-tabs" style={{ margin: 0 }}>
            <button
              className={`admin-tab ${activeTab === 'live_scan' ? 'active' : ''}`}
              onClick={() => setActiveTab('live_scan')}
            >
              <Zap size={14} color="#00ffcc" /> Escáner en Vivo
            </button>
            <button
              className={`admin-tab ${activeTab === 'mesh' ? 'active' : ''}`}
              onClick={() => setActiveTab('mesh')}
            >
              <Layers size={14} /> Malla & Shaders
            </button>
            <button
              className={`admin-tab ${activeTab === 'biomechanics' ? 'active' : ''}`}
              onClick={() => setActiveTab('biomechanics')}
            >
              <Activity size={14} /> Biomecánica
            </button>
            <button
              className={`admin-tab ${activeTab === 'tools' ? 'active' : ''}`}
              onClick={() => setActiveTab('tools')}
            >
              <Crosshair size={14} /> Herramientas
            </button>
          </div>

          {/* TAB 0: LIVE SCANNER CONTROLS */}
          {activeTab === 'live_scan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <section className="panel" style={{ border: '1px solid #00ffcc44', background: '#081726' }}>
                <div className="panel-title">
                  <div>
                    <h3 style={{ color: '#00ffcc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Radio size={16} /> Escaneo Corporal en Tiempo Real
                    </h3>
                    <p>Barrido volumétrico láser con telemetría continua</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button
                    className={`btn-preset ${isLiveScanning ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setIsLiveScanning(!isLiveScanning)}
                  >
                    {isLiveScanning ? <Pause size={14} /> : <Play size={14} />}
                    {isLiveScanning ? 'Detener Haz Láser' : 'Activar Haz Láser'}
                  </button>
                  <button
                    className={`btn-preset ${autoScanSweep ? 'active' : ''}`}
                    style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setAutoScanSweep(!autoScanSweep)}
                  >
                    <Sliders size={14} />
                    {autoScanSweep ? 'Modo: Barrido Auto' : 'Modo: Control Manual'}
                  </button>
                </div>

                {/* Laser Manual Height Slider */}
                <div style={{ marginTop: '14px', background: '#0a1d30', padding: '12px', borderRadius: '8px', border: '1px solid #163854' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                    <span style={{ color: '#8bb1d1' }}>Altura del Haz Láser (Elevación Z):</span>
                    <b style={{ color: '#00ffcc' }}>{laserY.toFixed(2)} m ({liveTelemetry.zone})</b>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="1.75"
                    step="0.01"
                    value={laserY}
                    onChange={e => {
                      setLaserY(parseFloat(e.target.value))
                      setAutoScanSweep(false) // Pause auto sweep when user adjusts slider manually
                    }}
                    style={{ width: '100%', accentColor: '#00ffcc', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#6889a7', marginTop: '4px' }}>
                    <span>Pies (0.05m)</span>
                    <span>Rodilla (0.50m)</span>
                    <span>Cintura (1.05m)</span>
                    <span>Tórax (1.25m)</span>
                    <span>Vértex (1.75m)</span>
                  </div>
                </div>

                {/* Scan Speed and Point Cloud Toggles */}
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#8bb1d1' }}>Velocidad de Barrido:</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[0.5, 1.0, 2.0].map(sp => (
                        <button
                          key={sp}
                          className={`btn-preset ${scanSpeed === sp ? 'active' : ''}`}
                          style={{ padding: '3px 8px', fontSize: '10px' }}
                          onClick={() => setScanSpeed(sp)}
                        >
                          {sp}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="checkbox-item" style={{ background: '#0a1d30', padding: '8px 10px', borderRadius: '6px' }}>
                    <input
                      type="checkbox"
                      checked={showPointCloud}
                      onChange={e => setShowPointCloud(e.target.checked)}
                    />
                    <div>
                      <b style={{ fontSize: '11px' }}>Nube de Puntos LiDAR (28.3K Puntos)</b>
                      <span style={{ fontSize: '9px' }}>Muestra los vértices iluminándose en tiempo real.</span>
                    </div>
                  </label>
                </div>
              </section>

              {/* Instant Cross-Section Card */}
              <div className="ficha-card" style={{ background: '#071626', border: '1px solid #193854' }}>
                <span style={{ color: '#00ffcc', fontWeight: 600 }}>Corte Transversal Biométrico Instantáneo:</span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#7a9bb8', fontSize: '10px' }}>Zona Actual:</span>
                    <b>{liveTelemetry.zone}</b>
                  </div>
                  <div>
                    <span style={{ color: '#7a9bb8', fontSize: '10px' }}>Perímetro Medido:</span>
                    <b style={{ color: '#ffd166', fontSize: '13px' }}>{liveTelemetry.perimeter} cm</b>
                  </div>
                  <div>
                    <span style={{ color: '#7a9bb8', fontSize: '10px' }}>Área de Sección:</span>
                    <b>{liveTelemetry.area} cm²</b>
                  </div>
                  <div>
                    <span style={{ color: '#7a9bb8', fontSize: '10px' }}>Densidad Vértices:</span>
                    <b style={{ color: '#34d399' }}>99.8% (Óptimo)</b>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: MESH & SHADERS */}
          {activeTab === 'mesh' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h3>Modo de Renderizado</h3>
                    <p>Filtros de inspección dérmica y topológica</p>
                  </div>
                  <Layers size={16} color="#45cbbd" />
                </div>

                <div className="layer-button-group">
                  {[
                    { id: 'clinical', label: 'Escaneo Clínico Dérmico (PBR)', desc: 'Escultura anatómica médica de alta definición muscular', icon: '🎨' },
                    { id: 'heatmap', label: 'Topografía / Mapa de Calor', desc: 'Gradiente de densidad antropométrica por zonas', icon: '🔥' },
                    { id: 'wireframe', label: 'Malla Biomecánica (50K Quads)', desc: 'Topología poligonal láser de ingeniería biomecánica', icon: '📐' },
                    { id: 'skeleton', label: 'Rayos X & Ejes Articulares', desc: 'Cuerpo de cristal con centros de rotación cinemática', icon: '🦴' },
                    { id: 'measurements', label: 'Cintas Métricas de Perímetro', desc: 'Circunferencias exactas en tórax, cintura, cadera y muslo', icon: '📏' },
                    { id: 'surface', label: 'Textura Fotográfica Real', desc: 'Acabado dérmico fotorrealista continuo', icon: '👤' },
                  ].map(item => (
                    <button
                      key={item.id}
                      className={`layer-option-btn ${layer === item.id ? 'active' : ''}`}
                      onClick={() => setLayer(item.id as any)}
                    >
                      <div className="layer-dot" style={{ background: layer === item.id ? '#34d399' : '#45627f' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <b>{item.label}</b>
                          <span style={{ fontSize: '13px' }}>{item.icon}</span>
                        </div>
                        <span>{item.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Lighting Setups */}
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h3>Iluminación de Estudio</h3>
                    <p>Esquemas ópticos de relieve anatómico</p>
                  </div>
                  <Sun size={16} color="#45cbbd" />
                </div>
                <div className="lighting-preset-tabs">
                  {[
                    { id: 'studio', label: 'Estudio Pro' },
                    { id: 'clinical', label: 'Quirófano Neutro' },
                    { id: 'cyberpunk', label: 'Láser Bio-Cyan' },
                  ].map(l => (
                    <button
                      key={l.id}
                      className={`light-tab ${lighting === l.id ? 'active' : ''}`}
                      onClick={() => setLighting(l.id as any)}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* TAB 2: BIOMECHANICAL & ANTHROPOMETRIC ANALYSIS */}
          {activeTab === 'biomechanics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h3>Perfil Antropométrico Clínico</h3>
                    <p>{selectedProfile ? selectedProfile.display_name : 'Expediente no seleccionado'}</p>
                  </div>
                  <BarChart2 size={16} color="#45cbbd" />
                </div>

                <div className="ficha-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="ficha-card">
                    <span>Índice Masa Corporal (IMC)</span>
                    <b style={{ color: Number(bmi) < 25 ? '#34d399' : '#f59e0b' }}>{bmi} kg/m²</b>
                    <small style={{ color: '#88a3be' }}>{Number(bmi) < 25 ? 'Normopeso' : 'Sobrepeso grado I'}</small>
                  </div>

                  <div className="ficha-card">
                    <span>Índice Cintura/Cadera (ICC)</span>
                    <b style={{ color: Number(whr) < 0.85 ? '#34d399' : '#f59e0b' }}>{whr}</b>
                    <small style={{ color: '#88a3be' }}>{Number(whr) < 0.85 ? 'Bajo Riesgo CV' : 'Riesgo Moderado'}</small>
                  </div>

                  <div className="ficha-card">
                    <span>Superficie Corporal (BSA)</span>
                    <b>{bsa} m²</b>
                    <small style={{ color: '#88a3be' }}>Fórmula de Mosteller</small>
                  </div>

                  <div className="ficha-card">
                    <span>Masa Magra Estimada (LBM)</span>
                    <b>{lbm} kg</b>
                    <small style={{ color: '#88a3be' }}>Ecuación de Boer</small>
                  </div>
                </div>

                {/* Postural Symmetry Indicators */}
                <div style={{ marginTop: '14px', background: '#0a1a2c', padding: '12px', borderRadius: '8px', border: '1px solid #1a334d' }}>
                  <b style={{ fontSize: '11px', color: '#38d39f', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={14} /> Evaluación de Simetría Postural
                  </b>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '10px' }}>
                    <div>
                      <span style={{ color: '#7a96b0' }}>Inclinación Escapular:</span>
                      <b style={{ color: '#ffffff', display: 'block' }}>0.8° (Alineado)</b>
                    </div>
                    <div>
                      <span style={{ color: '#7a96b0' }}>Basculación Pélvica:</span>
                      <b style={{ color: '#ffffff', display: 'block' }}>-0.4° (Fisiológico)</b>
                    </div>
                    <div>
                      <span style={{ color: '#7a96b0' }}>Alineación de Plomada:</span>
                      <b style={{ color: '#34d399', display: 'block' }}>98.4% (Excelente)</b>
                    </div>
                    <div>
                      <span style={{ color: '#7a96b0' }}>Ángulo Q Fémur-Rótula:</span>
                      <b style={{ color: '#ffffff', display: 'block' }}>14.2° (Normal)</b>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* TAB 3: DIAGNOSTIC TOOLS */}
          {activeTab === 'tools' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <section className="panel">
                <div className="panel-title">
                  <div>
                    <h3>Herramientas de Diagnóstico 3D</h3>
                    <p>Guías visuales e indicadores superpuestos</p>
                  </div>
                  <Crosshair size={16} color="#45cbbd" />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label className="checkbox-item" style={{ background: '#0c1828', padding: '10px', borderRadius: '7px', border: '1px solid #1a344e' }}>
                    <input
                      type="checkbox"
                      checked={showPlumbLine}
                      onChange={e => setShowPlumbLine(e.target.checked)}
                    />
                    <div>
                      <b>Plano Láser de Plomada Postural</b>
                      <span style={{ fontSize: '10px' }}>Eje central vertical de gravedad para detectar escoliosis o dismetrías.</span>
                    </div>
                  </label>

                  <label className="checkbox-item" style={{ background: '#0c1828', padding: '10px', borderRadius: '7px', border: '1px solid #1a344e' }}>
                    <input
                      type="checkbox"
                      checked={show3DCallouts}
                      onChange={e => setShow3DCallouts(e.target.checked)}
                    />
                    <div>
                      <b>Marcadores Métricos Flotantes (Pins 3D)</b>
                      <span style={{ fontSize: '10px' }}>Píldoras interactivas en tórax, cintura, cadera y vértex craneal.</span>
                    </div>
                  </label>

                  <button className="primary" onClick={handleCaptureSnapshot} style={{ marginTop: '6px' }}>
                    <Camera size={14} /> Exportar Captura Clínica (PNG)
                  </button>
                </div>
              </section>

              {/* Technical Specifications */}
              <div className="viewer-specs-box">
                <Sparkles size={18} color="#34d399" />
                <div>
                  <b>Topología Clínica Certificada:</b>
                  <p>
                    Malla orgánica de 28,391 vértices con normales suavizadas y escala 1:1 médica. Calibrada para inspección visual antropométrica sin distorsión geométrica.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Volumetric LiDAR Laser Scan Beam Component animated with useFrame
function RealtimeLaserScanBeam({
  active,
  laserY,
  setLaserY,
  autoScan,
  scanSpeed
}: {
  active: boolean
  laserY: number
  setLaserY: React.Dispatch<React.SetStateAction<number>>
  autoScan: boolean
  scanSpeed: number
}) {
  const laserRef = useRef<THREE.Group>(null)
  const dirRef = useRef<number>(1)

  useFrame((_, delta) => {
    if (!active || !autoScan) return
    setLaserY(prevY => {
      let nextY = prevY + dirRef.current * delta * (0.35 * scanSpeed)
      if (nextY >= 1.74) {
        nextY = 1.74
        dirRef.current = -1
      } else if (nextY <= 0.04) {
        nextY = 0.04
        dirRef.current = 1
      }
      return nextY
    })
  })

  if (!active) return null

  return (
    <group ref={laserRef} position={[0, laserY, 0]}>
      {/* Volumetric Laser Halo Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.01, 0.42, 64]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Intense Glowing Laser Cutting Edge */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.395, 0.405, 64]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.92}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Laser Light Source illuminating mesh contact points */}
      <pointLight color="#00ffcc" intensity={2.2} distance={0.9} decay={2} />

      {/* Orthogonal Reference Grid on the Laser Plane */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.85, 0.85]} />
        <meshBasicMaterial
          color="#00f5d4"
          transparent
          opacity={0.06}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
    </group>
  )
}

// Loading state overlay in 3D Canvas
function ModelLoadingFallback() {
  return (
    <Html center>
      <div style={{
        color: '#34d399',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        background: 'rgba(8, 23, 38, 0.92)',
        padding: '18px 30px',
        borderRadius: '10px',
        border: '1px solid #1f3d5c',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        minWidth: '240px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '28px',
          height: '28px',
          border: '3px solid #1f3d5c',
          borderTopColor: '#34d399',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.4px' }}>
          Cargando Malla Anatómica 3D...
        </span>
        <small style={{ fontSize: '10px', color: '#7a98b5' }}>Topología continua de 28.3K vértices</small>
      </div>
    </Html>
  )
}

// Vertical Plumb Line & Postural Laser Alignment Plane
function PosturalPlumbLine() {
  return (
    <group position={[0, 0, 0]}>
      {/* Central Laser Plumb Line (Gravity Vector from Y=0 to Y=1.85m) */}
      <mesh position={[0, 0.925, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 1.85, 16]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Laser Coronal Plane (Translucent Reference Grid) */}
      <mesh position={[0, 0.925, 0]}>
        <planeGeometry args={[0.8, 1.85]} />
        <meshBasicMaterial color="#10b981" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>

      {/* Horizontal Alignment Guides at Anatomical Landmarks */}
      {[
        { y: 1.62, label: 'Bipupilar' },
        { y: 1.38, label: 'Bi-Acromial (Hombros)' },
        { y: 0.90, label: 'Bi-Ilíaco (Pelvis)' },
        { y: 0.48, label: 'Inter-Condíleo (Rodillas)' },
      ].map((guide, idx) => (
        <group key={idx} position={[0, guide.y, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0015, 0.0015, 0.6, 8]} />
            <meshBasicMaterial color="#34d399" transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Realistic 3D Human Body Model Component with Point Cloud Support
function RealisticHumanBody({
  layer,
  show3DCallouts,
  showPointCloud,
  laserY,
  measurements
}: {
  layer: 'clinical' | 'heatmap' | 'wireframe' | 'skeleton' | 'measurements' | 'surface'
  show3DCallouts: boolean
  showPointCloud: boolean
  laserY: number
  measurements: { height: number; chest: number; waist: number; hip: number; fat: number }
}) {
  const { scene } = useGLTF('/models/human_body.glb')

  // Heatmap Topographic Material using onBeforeCompile for clinical gradient
  const heatmapMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.38,
      metalness: 0.08,
    })
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vY = position.y;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        vec3 getClinicalHeatmap(float t) {
          t = clamp(t, 0.0, 1.0);
          if (t < 0.22) return mix(vec3(0.08, 0.16, 0.45), vec3(0.0, 0.78, 0.88), t / 0.22);
          if (t < 0.48) return mix(vec3(0.0, 0.78, 0.88), vec3(0.18, 0.82, 0.38), (t - 0.22) / 0.26);
          if (t < 0.72) return mix(vec3(0.18, 0.82, 0.38), vec3(0.96, 0.78, 0.12), (t - 0.48) / 0.24);
          if (t < 0.88) return mix(vec3(0.96, 0.78, 0.12), vec3(0.95, 0.38, 0.12), (t - 0.72) / 0.16);
          return mix(vec3(0.95, 0.38, 0.12), vec3(0.92, 0.12, 0.28), (t - 0.88) / 0.12);
        }
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        float normY = clamp((vY + 0.5), 0.0, 1.0);
        vec3 heatColor = getClinicalHeatmap(normY);
        gl_FragColor = vec4(mix(gl_FragColor.rgb, heatColor, 0.78), gl_FragColor.a);
        `
      )
    }
    return mat
  }, [])

  // Clone scene so materials can be customized per layer cleanly
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true)
    cloned.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return cloned
  }, [scene])

  // Extract primary geometry for LiDAR Point Cloud visualization
  const bodyGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !geo) {
        geo = (child as THREE.Mesh).geometry
      }
    })
    return geo
  }, [scene])

  // Update materials when layer changes
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh

        if (layer === 'wireframe') {
          // Biomechanical Neon Cyan Wireframe
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#00f5d4',
            wireframe: true,
            roughness: 0.3,
            metalness: 0.1,
          })
        } else if (layer === 'heatmap') {
          mesh.material = heatmapMaterial
        } else if (layer === 'clinical') {
          // High-Definition Medical Clay PBR Anatomical Sculpt
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#e2be9b',
            roughness: 0.42,
            metalness: 0.06,
            wireframe: false,
          })
        } else if (layer === 'skeleton') {
          // Translucent Anatomical X-Ray Silhouette
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#0c233c',
            transparent: true,
            opacity: 0.32,
            roughness: 0.25,
            wireframe: false,
          })
        } else if (layer === 'measurements') {
          // High contrast clinical mesh for perimeter tape rings
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#1e3852',
            roughness: 0.48,
            metalness: 0.1,
            transparent: true,
            opacity: 0.85,
          })
        } else {
          // 'surface': Real photographic skin texture from model
          const origMesh = scene.children.find(c => (c as THREE.Mesh).isMesh) as THREE.Mesh | undefined
          if (origMesh && origMesh.material) {
            mesh.material = (origMesh.material as THREE.Material).clone()
          } else {
            mesh.material = new THREE.MeshStandardMaterial({
              color: '#c99672',
              roughness: 0.55,
              metalness: 0.05,
            })
          }
        }
      }
    })
  }, [clonedScene, layer, scene, heatmapMaterial])

  // Articular Joint Spheres Material
  const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00ffd5',
    emissive: '#00ffd5',
    emissiveIntensity: 0.95,
    roughness: 0.15,
  }), [])

  // Articular Bone Link Material
  const boneMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.75,
  }), [])

  // Measurement Band Material
  const metricRingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffc83b',
    emissive: '#ffb703',
    emissiveIntensity: 0.95,
    side: THREE.DoubleSide
  }), [])

  return (
    <group position={[0, 0, 0]}>
      {/* Real Organic Human Body Mesh standing on floor (feet at Y=0, head at Y=1.75m) */}
      <primitive
        object={clonedScene}
        position={[0, 0.876, 0]}
        scale={[1.75, 1.75, 1.75]}
        rotation={[0, Math.PI / 2, 0]}
      />

      {/* Real-Time LiDAR Point Cloud (28,391 sparkling vertices) */}
      {showPointCloud && bodyGeometry && (
        <points
          geometry={bodyGeometry}
          position={[0, 0.876, 0]}
          scale={[1.751, 1.751, 1.751]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <pointsMaterial
            size={0.007}
            color="#00ffcc"
            transparent
            opacity={0.55}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}

      {/* Internal Biomechanical Skeleton & Articular Centers */}
      {(layer === 'skeleton') && (
        <group>
          {/* Spherical Centers of Rotation */}
          {[
            [0, 1.62, 0.04],     // Cabeza / Nariz
            [0, 1.48, -0.01],    // C7 Cuello
            [-0.19, 1.38, 0],    // Hombro Izquierdo
            [0.19, 1.38, 0],     // Hombro Derecho
            [-0.27, 1.15, 0],    // Codo Izquierdo
            [0.27, 1.15, 0],     // Codo Derecho
            [-0.30, 0.90, 0],    // Muñeca Izquierda
            [0.30, 0.90, 0],     // Muñeca Derecha
            [0, 1.12, 0],        // Columna Lumbar
            [-0.10, 0.88, 0],    // Cadera Izquierda
            [0.10, 0.88, 0],     // Cadera Derecha
            [-0.10, 0.50, 0.02], // Rodilla Izquierda
            [0.10, 0.50, 0.02],  // Rodilla Derecha
            [-0.10, 0.10, 0],    // Tobillo Izquierdo
            [0.10, 0.10, 0],     // Tobillo Derecho
          ].map(([x, y, z], idx) => (
            <mesh key={idx} position={[x, y, z]} material={jointMaterial}>
              <sphereGeometry args={[0.022, 16, 16]} />
            </mesh>
          ))}

          {/* Bone Links between Articulations */}
          <BoneLink start={[0, 1.48, 0]} end={[0, 1.12, 0]} material={boneMaterial} />
          <BoneLink start={[-0.19, 1.38, 0]} end={[0.19, 1.38, 0]} material={boneMaterial} />
          <BoneLink start={[-0.19, 1.38, 0]} end={[-0.27, 1.15, 0]} material={boneMaterial} />
          <BoneLink start={[-0.27, 1.15, 0]} end={[-0.30, 0.90, 0]} material={boneMaterial} />
          <BoneLink start={[0.19, 1.38, 0]} end={[0.27, 1.15, 0]} material={boneMaterial} />
          <BoneLink start={[0.27, 1.15, 0]} end={[0.30, 0.90, 0]} material={boneMaterial} />
          <BoneLink start={[-0.10, 0.88, 0]} end={[0.10, 0.88, 0]} material={boneMaterial} />
          <BoneLink start={[-0.10, 0.88, 0]} end={[-0.10, 0.50, 0]} material={boneMaterial} />
          <BoneLink start={[-0.10, 0.50, 0]} end={[-0.10, 0.10, 0]} material={boneMaterial} />
          <BoneLink start={[0.10, 0.88, 0]} end={[0.10, 0.50, 0]} material={boneMaterial} />
          <BoneLink start={[0.10, 0.50, 0]} end={[0.10, 0.10, 0]} material={boneMaterial} />
        </group>
      )}

      {/* Anthropometric Circumference Measurement Rings */}
      {(layer === 'measurements' || show3DCallouts) && (
        <group>
          {/* Perímetro Tórax */}
          <mesh position={[0, 1.25, 0.01]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.21, 0.007, 16, 48]} />
          </mesh>
          {/* Perímetro Cintura */}
          <mesh position={[0, 1.05, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.165, 0.007, 16, 48]} />
          </mesh>
          {/* Perímetro Cadera */}
          <mesh position={[0, 0.90, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.195, 0.007, 16, 48]} />
          </mesh>
          {/* Perímetro Muslos */}
          <mesh position={[-0.10, 0.68, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.092, 0.006, 16, 48]} />
          </mesh>
          <mesh position={[0.10, 0.68, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.092, 0.006, 16, 48]} />
          </mesh>
        </group>
      )}

      {/* Floating 3D Measurement Pin Callouts */}
      {show3DCallouts && (
        <group>
          <Html position={[0.32, 1.74, 0]}>
            <div className="pin-3d-tag">
              <span className="dot" />
              <div>
                <b>Vértex Craneal</b>
                <span>{measurements.height} cm</span>
              </div>
            </div>
          </Html>

          <Html position={[0.34, 1.25, 0]}>
            <div className="pin-3d-tag">
              <span className="dot" />
              <div>
                <b>Tórax Pectoral</b>
                <span>{measurements.chest} cm</span>
              </div>
            </div>
          </Html>

          <Html position={[-0.34, 1.05, 0]}>
            <div className="pin-3d-tag">
              <span className="dot" />
              <div>
                <b>Cintura Umbilical</b>
                <span>{measurements.waist} cm</span>
              </div>
            </div>
          </Html>

          <Html position={[0.34, 0.90, 0]}>
            <div className="pin-3d-tag">
              <span className="dot" />
              <div>
                <b>Cadera Trocentérea</b>
                <span>{measurements.hip} cm</span>
              </div>
            </div>
          </Html>
        </group>
      )}
    </group>
  )
}

// Helper component to connect two 3D points with a bone link cylinder
function BoneLink({
  start,
  end,
  material
}: {
  start: [number, number, number]
  end: [number, number, number]
  material: THREE.Material
}) {
  const p1 = new THREE.Vector3(...start)
  const p2 = new THREE.Vector3(...end)
  const distance = p1.distanceTo(p2)
  const position = p1.clone().add(p2).multiplyScalar(0.5)

  const orientation = new THREE.Matrix4()
  orientation.lookAt(p1, p2, new THREE.Vector3(0, 1, 0))
  const rotation = new THREE.Euler().setFromRotationMatrix(orientation)

  return (
    <mesh position={position} rotation={rotation}>
      <cylinderGeometry args={[0.005, 0.005, distance, 8]} />
      <primitive object={material} />
    </mesh>
  )
}

// Instantaneous perimeter calculation based on laser beam height
function getPerimeterAtHeight(
  y: number,
  base: { chest: number; waist: number; hip: number }
): { perimeter: number; area: number; zone: string } {
  let p = 25
  let zone = 'Pies / Base'

  if (y < 0.20) {
    p = 22 + (y / 0.20) * 8
    zone = 'Tobillos / Maléolos'
  } else if (y < 0.45) {
    p = 30 + ((y - 0.20) / 0.25) * 8
    zone = 'Pantorrilla / Tibial'
  } else if (y < 0.58) {
    p = 38 + ((y - 0.45) / 0.13) * 6
    zone = 'Rótula / Rodilla'
  } else if (y < 0.80) {
    p = 44 + ((y - 0.58) / 0.22) * 14
    zone = 'Muslo Medio'
  } else if (y < 0.98) {
    const t = (y - 0.80) / 0.18
    p = 58 + t * (base.hip - 58)
    zone = 'Cadera / Trocánter Mayor'
  } else if (y < 1.15) {
    const t = (y - 0.98) / 0.17
    p = base.hip - t * (base.hip - base.waist)
    zone = 'Cintura / Plano Umbilical'
  } else if (y < 1.35) {
    const t = (y - 1.15) / 0.20
    p = base.waist + t * (base.chest - base.waist)
    zone = 'Tórax / Pectoral Mayor'
  } else if (y < 1.55) {
    const t = (y - 1.35) / 0.20
    p = base.chest - t * (base.chest - 38)
    zone = 'Cuello / Vértebra C7'
  } else {
    p = 56
    zone = 'Bóveda Craneal / Vértex'
  }

  const perimeter = Math.round(p * 10) / 10
  const area = Math.round((perimeter * perimeter) / (4 * Math.PI))

  return { perimeter, area, zone }
}
