import React, { useRef, useState, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF, Html, Grid } from '@react-three/drei'
import * as THREE from 'three'
import {
  RotateCw, Eye, Sparkles, Activity, Flame,
  Layers, Crosshair, ChevronDown, ChevronUp, Scale,
  Compass, Thermometer, Zap, AlertTriangle, Info
} from 'lucide-react'

// Preload 3D model
try {
  useGLTF.preload('/models/human_body.glb')
} catch (e) {
  // Silent fallback
}

export type ActiveLayer = 'hologram' | 'thermal' | 'fat'
export type ViewerTab = '3d' | 'analisis' | 'termico'

export interface HotspotInfo {
  id: string
  name: string
  position: [number, number, number]
  temp: string
  status: 'normal' | 'warning' | 'critical'
  metric: string
  rom: string
  description: string
}

export const ANATOMICAL_HOTSPOTS: HotspotInfo[] = [
  {
    id: 'cervical',
    name: 'Zona Cervical / Trapecios',
    position: [0, 1.48, 0.08],
    temp: '37.8°C',
    status: 'critical',
    metric: 'Tensión Alta (Hipertermia)',
    rom: '82% ROM (Restricción leve)',
    description: 'Contractura postural bilateral con anteriorización de cabeza (2.2 cm).'
  },
  {
    id: 'lumbar',
    name: 'Región Lumbar (L4-L5)',
    position: [0, 1.05, -0.06],
    temp: '37.1°C',
    status: 'warning',
    metric: 'Sobrecarga Compensatoria',
    rom: '64% ROM (Flexión limitada)',
    description: 'Hipertonía paravertebral por basculación pélvica de 1.8°.'
  },
  {
    id: 'knee_left',
    name: 'Rótula & Tendón Patelar Izq.',
    position: [-0.18, 0.52, 0.06],
    temp: '36.9°C',
    status: 'warning',
    metric: 'Asimetría de Carga',
    rom: '95% ROM (Normal)',
    description: 'Microtensión por apoyo plantar asimétrico (52% apoyo en hemicuerpo izq).'
  },
  {
    id: 'torso',
    name: 'Tórax & Músculo Pectoral',
    position: [0, 1.34, 0.12],
    temp: '36.1°C',
    status: 'normal',
    metric: 'Normotérmico',
    rom: '91% ROM (Abducción 164°)',
    description: 'Tono y simetría bilateral dentro de rangos fisiológicos normales.'
  },
  {
    id: 'abdomen_fat',
    name: 'Tejido Adiposo Abdominal',
    position: [0, 1.12, 0.14],
    temp: '35.6°C',
    status: 'normal',
    metric: 'Panículo Subcutáneo 18mm',
    rom: 'Grasa Visceral: Grado 4',
    description: 'Distribución androide leve, perímetro 78 cm, 21.8% grasa corporal total.'
  }
]

interface Dashboard3DViewerProps {
  activeLayer: ActiveLayer
  setActiveLayer: (layer: ActiveLayer) => void
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
  patientName?: string
  patientWeight?: number
}

export const Dashboard3DViewer: React.FC<Dashboard3DViewerProps> = ({
  activeLayer,
  setActiveLayer,
  selectedHotspot,
  onSelectHotspot,
  patientName = 'Mateo Silva',
  patientWeight = 68.0
}) => {
  const [autoRotate, setAutoRotate] = useState(false)
  const [showPlumbLine, setShowPlumbLine] = useState(true)
  const [showJoints, setShowJoints] = useState(true)
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'back' | 'perspective'>('perspective')
  const [activeTab, setActiveTab] = useState<ViewerTab>('3d')
  const controlsRef = useRef<any>(null)

  const applyPreset = (preset: 'front' | 'side' | 'back' | 'perspective') => {
    setCameraPreset(preset)
    if (!controlsRef.current) return
    controlsRef.current.reset()
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 0.90, 2.75)
    } else if (preset === 'side') {
      controlsRef.current.object.position.set(2.75, 0.90, 0)
    } else if (preset === 'back') {
      controlsRef.current.object.position.set(0, 0.90, -2.75)
    } else {
      controlsRef.current.object.position.set(1.35, 1.15, 2.35)
    }
    controlsRef.current.target.set(0, 0.88, 0)
    controlsRef.current.update()
  }

  return (
    <div className="dash-3d-card">
      {/* Header: Title + Tab Navigation */}
      <div className="dash-3d-header">
        <div className="dash-3d-title-row">
          <div>
            <div className="dash-3d-title">
              <Activity size={16} color="#00ffd5" />
              <span>MODELO ANATÓMICO DIGITAL 3D</span>
            </div>
            <p className="dash-3d-sub">
              Visor holográfico integrado · Análisis corporal · Termografía
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="dash-viewer-tabs">
            <button
              className={`viewer-tab ${activeTab === '3d' ? 'active' : ''}`}
              onClick={() => setActiveTab('3d')}
            >
              <Sparkles size={12} /> Visor 3D
            </button>
            <button
              className={`viewer-tab ${activeTab === 'analisis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analisis')}
            >
              <Activity size={12} /> Análisis Corporal
            </button>
            <button
              className={`viewer-tab ${activeTab === 'termico' ? 'active' : ''}`}
              onClick={() => setActiveTab('termico')}
            >
              <Flame size={12} /> Mapa Térmico
            </button>
          </div>
        </div>

        {/* Layer Selector — only visible in 3D tab */}
        {activeTab === '3d' && (
          <div className="dash-layer-pill-group">
            <button
              className={`dash-layer-pill ${activeLayer === 'hologram' ? 'active-hologram' : ''}`}
              onClick={() => setActiveLayer('hologram')}
              title="Malla holográfica con cinemática articular y puntos de postura"
            >
              <Sparkles size={13} />
              <span>Holograma</span>
            </button>
            <button
              className={`dash-layer-pill ${activeLayer === 'thermal' ? 'active-thermal' : ''}`}
              onClick={() => setActiveLayer('thermal')}
              title="Mapa térmico tridimensional infrarrojo de superficie corporal"
            >
              <Flame size={13} />
              <span>Capa Térmica</span>
            </button>
            <button
              className={`dash-layer-pill ${activeLayer === 'fat' ? 'active-fat' : ''}`}
              onClick={() => setActiveLayer('fat')}
              title="Visualización volumétrica de tejido adiposo y composición corporal"
            >
              <Layers size={13} />
              <span>Capa de Grasa</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB CONTENT */}
      {activeTab === '3d' && (
        <div className="dash-3d-main-split">
          {/* Main 3D Viewport Column */}
          <div className="dash-3d-viewport-column">
            {/* 3D Viewport */}
            <div className="dash-3d-viewport">
              <div className="dash-3d-hud-top">
                <span className="dash-hud-tag live">
                  <span className="dot pulse" /> EVALUACIÓN POSTURAL 3D
                </span>
                <span className="dash-hud-tag patient">
                  {patientName} · Eje Gravitacional Activo
                </span>
              </div>

              {/* Hotspot Floating Tooltip */}
              {selectedHotspot && (
                <div className="dash-3d-hotspot-callout">
                  {(() => {
                    const spot = ANATOMICAL_HOTSPOTS.find(h => h.id === selectedHotspot)
                    if (!spot) return null
                    return (
                      <div>
                        <div className="callout-head">
                          <span className={`status-dot ${spot.status}`} />
                          <b>{spot.name}</b>
                          <span className="callout-temp">{spot.temp}</span>
                        </div>
                        <p>{spot.description}</p>
                        <div className="callout-chips">
                          <span>{spot.metric}</span>
                          <span>{spot.rom}</span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* 3D WebGL Canvas */}
              <Canvas shadows gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
                <PerspectiveCamera makeDefault position={[1.35, 1.15, 2.35]} fov={44} />
                <OrbitControls
                  ref={controlsRef}
                  autoRotate={autoRotate}
                  autoRotateSpeed={1.2}
                  minDistance={1.0}
                  maxDistance={5.0}
                  target={[0, 0.88, 0]}
                  maxPolarAngle={Math.PI / 2 + 0.05}
                />

                <ambientLight intensity={0.7} color="#dbeafe" />
                <directionalLight position={[2.5, 4, 3]} intensity={1.8} color="#e0f2fe" />
                <directionalLight position={[-2.5, 3, -2]} intensity={1.2} color="#00f5d4" />
                <pointLight position={[0, 1.2, 2]} intensity={0.8} color="#38bdf8" />

                <Suspense fallback={<DashboardLoadingFallback />}>
                  <DashboardHumanMesh
                    layer={activeLayer}
                    selectedHotspot={selectedHotspot}
                    onSelectHotspot={onSelectHotspot}
                    showJoints={showJoints}
                    showPlumbLine={showPlumbLine}
                    weight={patientWeight}
                  />
                </Suspense>

                {/* Podometric Floor Grid */}
                <Grid
                  position={[0, 0, 0]}
                  args={[4, 4]}
                  cellSize={0.15}
                  cellThickness={0.5}
                  cellColor="#0e3a4e"
                  sectionSize={0.6}
                  sectionThickness={1.0}
                  sectionColor="#1b607e"
                  fadeDistance={6}
                />
              </Canvas>

              {/* Bottom Bar Controls */}
              <div className="dash-3d-bottom-bar">
                <div className="view-presets-group">
                  {(['perspective', 'front', 'side', 'back'] as const).map(p => (
                    <button
                      key={p}
                      className={`btn-dash-tool ${cameraPreset === p ? 'active' : ''}`}
                      onClick={() => applyPreset(p)}
                    >
                      {p === 'perspective' ? '3D Libre' : p === 'front' ? 'Frontal' : p === 'side' ? 'Lateral' : 'Posterior'}
                    </button>
                  ))}
                </div>

                <div className="toggles-group">
                  <button
                    className={`btn-dash-tool ${autoRotate ? 'active' : ''}`}
                    onClick={() => setAutoRotate(!autoRotate)}
                    title="Giro continuo 360°"
                  >
                    <RotateCw size={12} /> 360°
                  </button>
                  <button
                    className={`btn-dash-tool ${showPlumbLine ? 'active' : ''}`}
                    onClick={() => setShowPlumbLine(!showPlumbLine)}
                    title="Línea de plomada (Eje gravitacional central)"
                  >
                    <Crosshair size={12} /> Plomada
                  </button>
                  <button
                    className={`btn-dash-tool ${showJoints ? 'active' : ''}`}
                    onClick={() => setShowJoints(!showJoints)}
                    title="Puntos de control biomecánicos y articulaciones"
                  >
                    <Eye size={12} /> Puntos
                  </button>
                </div>
              </div>
            </div>

            {/* Layer Context Bar */}
            <div className="dash-3d-footer-info">
              {activeLayer === 'hologram' && (
                <div className="layer-footer-pill hologram">
                  <Sparkles size={14} color="#00ffd5" />
                  <div>
                    <b>Capa Holográfica Biomecánica:</b>
                    <span>Visualizando 33 puntos de control, simetría escapular y eje de plomada.</span>
                  </div>
                </div>
              )}
              {activeLayer === 'thermal' && (
                <div className="layer-footer-pill thermal">
                  <Flame size={14} color="#ef4444" />
                  <div>
                    <b>Capa Térmica 3D (Termografía Infrarroja):</b>
                    <span>Mapeo en tiempo real de hipertermia cervical (37.8°C) y sobrecarga lumbar (37.1°C).</span>
                  </div>
                </div>
              )}
              {activeLayer === 'fat' && (
                <div className="layer-footer-pill fat">
                  <Layers size={14} color="#f59e0b" />
                  <div>
                    <b>Capa de Grasa & Tejido Adiposo:</b>
                    <span>Panículo subcutáneo (21.8% grasa total) con grosor estimado en tronco y flancos.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Integrated Clinical Telemetry Sidebar */}
          <div className="dash-3d-side-hud">
            {/* Quick Score Card */}
            <div className="dash-side-score-box">
              <div className="dash-side-score-top">
                <span className="side-score-title">SCORE BIOMECÁNICO</span>
                <span className="side-score-badge">NIVEL GENERAL</span>
              </div>
              <div className="side-score-row">
                <strong className="side-score-num">68.4<small>%</small></strong>
                <div className="side-score-bars">
                  <div className="side-bar-row">
                    <span>Alineación Postural</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '74%', background: '#00ffd5' }} /></div>
                    <b>74%</b>
                  </div>
                  <div className="side-bar-row">
                    <span>Simetría de Carga</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '69%', background: '#38bdf8' }} /></div>
                    <b>69%</b>
                  </div>
                  <div className="side-bar-row">
                    <span>Composición & Tejidos</span>
                    <div className="bar-track"><div className="bar-fill" style={{ width: '62%', background: '#f59e0b' }} /></div>
                    <b>62%</b>
                  </div>
                </div>
              </div>
            </div>

            {/* Hotspots Quick List */}
            <div className="dash-side-hotspots-box">
              <div className="side-box-head">
                <Flame size={13} color="#ef4444" />
                <span>PUNTOS ANATÓMICOS DETECTADOS</span>
              </div>
              <div className="side-hotspots-list">
                {ANATOMICAL_HOTSPOTS.map(h => (
                  <div
                    key={h.id}
                    className={`side-hotspot-item ${selectedHotspot === h.id ? 'active' : ''}`}
                    onClick={() => onSelectHotspot(h.id)}
                  >
                    <div className="side-spot-main">
                      <span className={`spot-dot ${h.status}`} />
                      <div className="spot-text">
                        <b>{h.name}</b>
                        <small>{h.metric}</small>
                      </div>
                    </div>
                    <span className="spot-temp">{h.temp}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep-Dive Navigation Shortcuts */}
            <div className="dash-side-actions">
              <button
                type="button"
                className="btn-side-nav"
                onClick={() => setActiveTab('analisis')}
              >
                <Activity size={13} color="#38bdf8" />
                <span>Ver Análisis Corporal Completo</span>
              </button>
              <button
                type="button"
                className="btn-side-nav"
                onClick={() => setActiveTab('termico')}
              >
                <Flame size={13} color="#ef4444" />
                <span>Ver Mapa Térmico Infrarrojo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analisis' && (
        <AnalisisCorporalTab
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={onSelectHotspot}
        />
      )}

      {activeTab === 'termico' && (
        <MapaTermicoTab
          selectedHotspot={selectedHotspot}
          onSelectHotspot={onSelectHotspot}
          activeLayer={activeLayer}
          setActiveLayer={setActiveLayer}
        />
      )}
    </div>
  )
}

function DashboardLoadingFallback() {
  return (
    <Html center>
      <div className="dash-3d-loading">
        <div className="spinner-orbit" />
        <span>Cargando modelo anatómico 3D...</span>
      </div>
    </Html>
  )
}

interface MeshProps {
  layer: ActiveLayer
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
  showJoints: boolean
  showPlumbLine: boolean
  weight?: number
}

function DashboardHumanMesh({
  layer,
  selectedHotspot,
  onSelectHotspot,
  showJoints,
  showPlumbLine,
  weight = 68.0
}: MeshProps) {
  let gltf: any = null
  try {
    gltf = useGLTF('/models/human_body.glb')
  } catch (err) {
    gltf = null
  }

  // Shaders & Materials based on layer
  const holographicMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: '#00e5c9',
      wireframe: true,
      roughness: 0.25,
      metalness: 0.8,
      emissive: '#003a35',
      emissiveIntensity: 0.4
    })
  }, [])

  const thermalMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.35,
      metalness: 0.1,
    })
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        varying vec3 vNormalVec;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vY = position.y;
        vNormalVec = normal;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        varying vec3 vNormalVec;
        vec3 getThermalColor(float y) {
          // Normalize y between 0 and 1.8m
          float t = clamp((y + 0.1) / 1.75, 0.0, 1.0);
          // Legs: Greenish-cyan normothermic
          if (t < 0.45) return mix(vec3(0.0, 0.8, 0.6), vec3(0.2, 0.85, 0.3), t / 0.45);
          // Lumbar & abdomen: warm yellow transition
          if (t < 0.68) return mix(vec3(0.2, 0.85, 0.3), vec3(0.98, 0.82, 0.1), (t - 0.45) / 0.23);
          // Torso & chest: yellow to orange
          if (t < 0.84) return mix(vec3(0.98, 0.82, 0.1), vec3(0.96, 0.45, 0.12), (t - 0.68) / 0.16);
          // Cervical & upper trapezius: red hyperthermic trigger zones
          return mix(vec3(0.96, 0.45, 0.12), vec3(0.92, 0.12, 0.22), (t - 0.84) / 0.16);
        }
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        vec3 heatColor = getThermalColor(vY);
        gl_FragColor = vec4(mix(gl_FragColor.rgb, heatColor, 0.82), gl_FragColor.a);
        `
      )
    }
    return mat
  }, [])

  const fatMaterial = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      roughness: 0.45,
      metalness: 0.15,
      color: '#d4af37'
    })
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        varying vec3 vPos;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vY = position.y;
        vPos = position;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        varying float vY;
        varying vec3 vPos;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        // Highlight abdominal, flank & thigh adipose tissue deposits (y ~ 0.8 to 1.25)
        float isAbdominal = smoothstep(0.72, 1.0, vY) * (1.0 - smoothstep(1.22, 1.40, vY));
        vec3 baseTone = vec3(0.12, 0.22, 0.32);
        vec3 fatGold = vec3(0.98, 0.76, 0.22);
        vec3 finalCol = mix(baseTone, fatGold, isAbdominal * 0.75 + 0.15);
        gl_FragColor = vec4(finalCol, gl_FragColor.a);
        `
      )
    }
    return mat
  }, [])

  const clonedScene = useMemo(() => {
    if (!gltf || !gltf.scene) return null
    const cloned = gltf.scene.clone(true)
    return cloned
  }, [gltf])

  useEffect(() => {
    if (!clonedScene) return
    clonedScene.traverse((child: any) => {
      if (child.isMesh) {
        if (layer === 'hologram') {
          child.material = holographicMaterial
        } else if (layer === 'thermal') {
          child.material = thermalMaterial
        } else if (layer === 'fat') {
          child.material = fatMaterial
        }
      }
    })
  }, [clonedScene, layer, holographicMaterial, thermalMaterial, fatMaterial])

  // Biomechanical Joint points
  const joints: [number, number, number, string][] = [
    [0, 1.62, 0.05, 'Cabeza / Occipital'],
    [0, 1.46, 0.05, 'Cervical C7'],
    [-0.22, 1.40, 0.02, 'Hombro Izq (Acromion)'],
    [0.22, 1.38, 0.02, 'Hombro Der (Acromion)'],
    [-0.32, 1.10, 0.04, 'Codo Izq'],
    [0.32, 1.08, 0.04, 'Codo Der'],
    [-0.35, 0.85, 0.06, 'Muñeca Izq'],
    [0.35, 0.83, 0.06, 'Muñeca Der'],
    [0, 1.08, 0.03, 'Columna Lumbar L3'],
    [-0.14, 0.94, 0.02, 'Espina Ilíaca Izq (ASIS)'],
    [0.14, 0.92, 0.02, 'Espina Ilíaca Der (ASIS)'],
    [-0.15, 0.52, 0.03, 'Rodilla Izquierda'],
    [0.15, 0.52, 0.03, 'Rodilla Derecha'],
    [-0.13, 0.08, 0.02, 'Tobillo Izquierdo'],
    [0.13, 0.08, 0.02, 'Tobillo Derecho']
  ]

  // Kinetic chains / Biomechanical skeleton lines
  const skeletonSegments: [[number, number, number], [number, number, number]][] = [
    [[0, 1.62, 0.05], [0, 1.46, 0.05]], // Cabeza a cervical
    [[-0.22, 1.40, 0.02], [0.22, 1.38, 0.02]], // Cintura escapular
    [[0, 1.46, 0.05], [0, 1.08, 0.03]], // Columna
    [[-0.22, 1.40, 0.02], [-0.32, 1.10, 0.04]], // Brazo izq
    [[-0.32, 1.10, 0.04], [-0.35, 0.85, 0.06]],
    [[0.22, 1.38, 0.02], [0.32, 1.08, 0.04]], // Brazo der
    [[0.32, 1.08, 0.04], [0.35, 0.83, 0.06]],
    [[-0.14, 0.94, 0.02], [0.14, 0.92, 0.02]], // Cintura pélvica
    [[0, 1.08, 0.03], [-0.14, 0.94, 0.02]],
    [[0, 1.08, 0.03], [0.14, 0.92, 0.02]],
    [[-0.14, 0.94, 0.02], [-0.15, 0.52, 0.03]], // Pierna izq
    [[-0.15, 0.52, 0.03], [-0.13, 0.08, 0.02]],
    [[0.14, 0.92, 0.02], [0.15, 0.52, 0.03]], // Pierna der
    [[0.15, 0.52, 0.03], [0.13, 0.08, 0.02]]
  ]

  // Morphological weight factor — clamped to avoid distortion on profile switch
  const baseWeight = 68.0
  const safeWeight = weight && weight > 20 && weight < 300 ? weight : baseWeight
  const wRatio = safeWeight / baseWeight
  // Keep scale factors close to 1.0 to avoid visual distortion
  const widthFactor = Math.pow(Math.max(0.7, Math.min(wRatio, 1.6)), 0.38)
  const depthFactor = Math.pow(Math.max(0.7, Math.min(wRatio, 1.6)), 0.38)

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Human Model standing tall on floor, facing camera */}
      {clonedScene ? (
        <primitive
          object={clonedScene}
          position={[0, 0.88, 0]}
          scale={[1.75 * depthFactor, 1.75, 1.75 * widthFactor]}
          rotation={[0, -Math.PI / 2, 0]}
        />
      ) : (
        /* Procedural Mannequin Fallback if GLB not yet loaded */
        <ProceduralMannequin layer={layer} widthFactor={widthFactor} depthFactor={depthFactor} />
      )}

      {/* Plumb Line (Central Gravity Line) */}
      {showPlumbLine && (
        <group>
          {/* Vertical Laser Cable */}
          <mesh position={[0, 0.88, 0.05]}>
            <cylinderGeometry args={[0.003, 0.003, 1.76, 8]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
          </mesh>
          {/* Floor Plumb Target */}
          <mesh position={[0, 0.002, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.08, 0.085, 32]} />
            <meshBasicMaterial color="#38bdf8" transparent opacity={0.8} />
          </mesh>
        </group>
      )}

      {/* Biomechanical Skeleton Chain */}
      {showJoints && (
        <group>
          {skeletonSegments.map((seg, idx) => {
            const start = new THREE.Vector3(...seg[0])
            const end = new THREE.Vector3(...seg[1])
            const mid = start.clone().add(end).multiplyScalar(0.5)
            const len = start.distanceTo(end)
            const dir = end.clone().sub(start).normalize()
            const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)

            return (
              <mesh key={`seg-${idx}`} position={mid} quaternion={quat}>
                <cylinderGeometry args={[0.005, 0.005, len, 6]} />
                <meshBasicMaterial
                  color={layer === 'hologram' ? '#00ffd5' : layer === 'thermal' ? '#ffd166' : '#f59e0b'}
                  transparent
                  opacity={0.7}
                />
              </mesh>
            )
          })}

          {/* Joint Nodes */}
          {joints.map((j, i) => (
            <mesh key={`joint-${i}`} position={[j[0], j[1], j[2]]}>
              <sphereGeometry args={[0.02, 16, 16]} />
              <meshStandardMaterial
                color="#00ffd5"
                emissive="#00ffd5"
                emissiveIntensity={0.9}
                roughness={0.1}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Interactive Anatomical Hotspots */}
      {ANATOMICAL_HOTSPOTS.map((h) => {
        const isSelected = selectedHotspot === h.id
        const color = h.status === 'critical' ? '#ef4444' : h.status === 'warning' ? '#f59e0b' : '#10b981'

        return (
          <group
            key={h.id}
            position={h.position}
            onClick={(e) => {
              e.stopPropagation()
              onSelectHotspot(h.id)
            }}
          >
            {/* Glowing Ring */}
            <mesh>
              <sphereGeometry args={[isSelected ? 0.045 : 0.032, 16, 16]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isSelected ? 1.6 : 0.9}
                roughness={0.2}
              />
            </mesh>

            {/* Ripple halo around hotspot */}
            <mesh>
              <ringGeometry args={[0.04, 0.055, 24]} />
              <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.6} />
            </mesh>
          </group>
        )
      })}

      {/* Center of Gravity / Mass Sphere */}
      <mesh position={[0, 0.98, 0.02]}>
        <sphereGeometry args={[0.035, 16, 16]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.8}
          wireframe
        />
      </mesh>
    </group>
  )
}

// ============================================================
// EMBEDDED TAB: ANÁLISIS CORPORAL
// ============================================================
interface AnalisisTabProps {
  activeLayer: ActiveLayer
  setActiveLayer: (layer: ActiveLayer) => void
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
}

function AnalisisCorporalTab({ activeLayer, setActiveLayer, selectedHotspot, onSelectHotspot }: AnalisisTabProps) {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    rom: true,
    symmetry: false,
    composition: false
  })
  const toggleSection = (sec: string) => setOpenSections(prev => ({ ...prev, [sec]: !prev[sec] }))

  const radius = 56
  const circumference = 2 * Math.PI * radius
  const overallScore = 68.4
  const strokeDashoffset = circumference - (overallScore / 100) * circumference

  return (
    <div className="viewer-tab-content analisis-scroll">
      {/* Score Gauge Row */}
      <div className="tab-gauge-row">
        <div className="tab-circle-gauge">
          <svg width="130" height="130" viewBox="0 0 130 130">
            <defs>
              <linearGradient id="sg2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f5d4" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
            <circle cx="65" cy="65" r={radius} stroke="url(#sg2)" strokeWidth="10"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              strokeLinecap="round" fill="transparent" transform="rotate(-90 65 65)" />
          </svg>
          <div className="tab-circle-inner">
            <span className="tab-circle-num">68.4<small>%</small></span>
            <span className="tab-circle-lbl">BIOMECÁNICA</span>
          </div>
        </div>
        <div className="tab-submetrics">
          <div className="tab-submetric"><span>Alineación Postural</span><b style={{ color: '#00ffd5' }}>74.0%</b></div>
          <div className="tab-submetric"><span>Simetría de Carga</span><b style={{ color: '#38bdf8' }}>69.2%</b></div>
          <div className="tab-submetric"><span>Composición & Grasa</span><b style={{ color: '#ffd166' }}>62.0%</b></div>
          <div className="tab-submetric"><span>Flexibilidad ROM</span><b style={{ color: '#a78bfa' }}>81.4%</b></div>
        </div>
      </div>

      {/* Accordion */}
      <div className="tab-accordion">
        {/* ROM */}
        <div className="tab-acc-item">
          <button className={`tab-acc-trigger ${openSections.rom ? 'open' : ''}`} onClick={() => toggleSection('rom')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Compass size={13} color="#00ffd5" /> Rango de Movimientos (ROM)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tab-badge ok">81.4%</span>
              {openSections.rom ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {openSections.rom && (
            <div className="tab-acc-body">
              {[
                { label: 'Flexión / Extensión Cervical', val: '82%', pct: 82, note: 'Leve restricción C5-C7', warn: false, id: 'cervical' },
                { label: 'Abducción Glenohumeral', val: '91%', pct: 91, note: 'Ritmo escapulohumeral normal', warn: false, id: 'torso' },
                { label: 'Flexión Lumbar & Tronco', val: '64%', pct: 64, note: 'Restricción por hipertonía L4-L5', warn: true, id: 'lumbar' },
                { label: 'Flexión Patelofemoral', val: '96%', pct: 96, note: 'Rango bilateral completo', warn: false, id: 'knee_left' },
              ].map(r => (
                <div key={r.id} className={`tab-metric-row ${selectedHotspot === r.id ? 'highlight' : ''}`} onClick={() => onSelectHotspot(r.id)}>
                  <div className="tab-metric-label"><b>{r.label}</b><span className={r.warn ? 'warn-val' : ''}>{r.val}</span></div>
                  <div className="tab-progress-track"><div className={`tab-progress-fill ${r.warn ? 'warn' : 'ok'}`} style={{ width: `${r.pct}%` }} /></div>
                  <small className={r.warn ? 'tab-note warn' : 'tab-note'}>{r.note}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Simetría */}
        <div className="tab-acc-item">
          <button className={`tab-acc-trigger ${openSections.symmetry ? 'open' : ''}`} onClick={() => toggleSection('symmetry')}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={13} color="#38bdf8" /> Simetría Corporal & Biomecánica</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tab-badge warn">76.8%</span>
              {openSections.symmetry ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {openSections.symmetry && (
            <div className="tab-acc-body">
              {[
                { label: 'Nivelación Biacromial', val: '92%', pct: 92, note: 'Hombro izq. levemente ascendido', warn: false },
                { label: 'Basculación Pélvica', val: '86%', pct: 86, note: 'Inclinación antero-lateral', warn: true },
                { label: 'Distribución Plantar', val: '52% Izq · 48% Der', pct: 52, note: 'Asimetría leve compatible con compensación lumbar', warn: false },
                { label: 'Línea de Plomada (Sagital)', val: '88%', pct: 88, note: 'Cabeza adelantada +2.2 cm', warn: true },
              ].map((r, i) => (
                <div key={i} className="tab-metric-row">
                  <div className="tab-metric-label"><b>{r.label}</b><span className={r.warn ? 'warn-val' : ''}>{r.val}</span></div>
                  <div className="tab-progress-track"><div className={`tab-progress-fill ${r.warn ? 'warn' : 'ok'}`} style={{ width: `${r.pct}%` }} /></div>
                  <small className={r.warn ? 'tab-note warn' : 'tab-note'}>{r.note}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Composición */}
        <div className="tab-acc-item">
          <button className={`tab-acc-trigger ${openSections.composition ? 'open' : ''}`} onClick={() => { toggleSection('composition'); setActiveLayer('fat') }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Scale size={13} color="#ffd166" /> IMC & Composición Corporal</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="tab-badge fat">21.8% Grasa</span>
              {openSections.composition ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </button>
          {openSections.composition && (
            <div className="tab-acc-body">
              <div className="tab-comp-grid">
                <div className="tab-comp-card"><span>IMC</span><strong>23.4<small> kg/m²</small></strong><span className="chip normal">Normopeso</span></div>
                <div className="tab-comp-card hi"><span>Grasa Total</span><strong>21.8<small>%</small></strong><span className="chip fat">14.8 kg</span></div>
                <div className="tab-comp-card"><span>Masa Magra</span><strong>34.2<small> kg</small></strong><span className="chip ok">74.3%</span></div>
                <div className="tab-comp-card"><span>Grasa Visceral</span><strong>Grado 4</strong><span className="chip ok">Rango Óptimo</span></div>
              </div>
              <div className="tab-metric-row" style={{ marginTop: 10 }}>
                <div className="tab-metric-label"><b>Agua Corporal (TBW)</b><span>58.6% · 40.1 L</span></div>
                <div className="tab-progress-track"><div className="tab-progress-fill ok" style={{ width: '58.6%' }} /></div>
              </div>
              <div className="tab-metric-row">
                <div className="tab-metric-label"><b>Adiposidad Subcutánea</b><span>Tronco 12.4% · Miembros 9.4%</span></div>
                <div className="tab-progress-track"><div className="tab-progress-fill fat" style={{ width: '68%' }} /></div>
              </div>
              <button className={`tab-fat-btn ${activeLayer === 'fat' ? 'active' : ''}`} onClick={() => setActiveLayer('fat')}>
                <Layers size={12} /> {activeLayer === 'fat' ? 'Capa de Grasa Activa en 3D' : 'Proyectar Capa de Grasa en 3D'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// EMBEDDED TAB: MAPA TÉRMICO
// ============================================================
interface TermicoTabProps {
  selectedHotspot: string | null
  onSelectHotspot: (id: string) => void
  activeLayer: ActiveLayer
  setActiveLayer: (layer: ActiveLayer) => void
}

function MapaTermicoTab({ selectedHotspot, onSelectHotspot, activeLayer, setActiveLayer }: TermicoTabProps) {
  const [viewOrientation, setViewOrientation] = useState<'anterior' | 'posterior'>('posterior')
  const [showInsulationEffect, setShowInsulationEffect] = useState(false)
  const activeSpot = ANATOMICAL_HOTSPOTS.find(h => h.id === selectedHotspot) || ANATOMICAL_HOTSPOTS[0]

  return (
    <div className="viewer-tab-content termico-layout">
      {/* Controls */}
      <div className="termico-controls">
        <div className="thermal-view-switch">
          <button className={`btn-orient ${viewOrientation === 'anterior' ? 'active' : ''}`} onClick={() => setViewOrientation('anterior')}>Anterior</button>
          <button className={`btn-orient ${viewOrientation === 'posterior' ? 'active' : ''}`} onClick={() => setViewOrientation('posterior')}>Posterior</button>
        </div>
        <button className={`tab-fat-btn ${showInsulationEffect ? 'active' : ''}`} onClick={() => { setShowInsulationEffect(!showInsulationEffect); if (!showInsulationEffect) setActiveLayer('fat') }}>
          <Thermometer size={12} /> {showInsulationEffect ? 'Ocultar Aislante' : 'Cruzar con Grasa'}
        </button>
        <button className="tab-fat-btn" onClick={() => { setActiveLayer('thermal'); }}>
          <Flame size={12} /> Ver en Visor 3D
        </button>
      </div>

      {/* Thermal body + scale */}
      <div className="termico-body-row">
        <div className="thermal-silhouette-wrap">
          <svg className="thermal-svg" viewBox="0 0 240 380" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="hC2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" /><stop offset="55%" stopColor="#f59e0b" stopOpacity="0.8" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
              <radialGradient id="hL2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.92" /><stop offset="60%" stopColor="#eab308" stopOpacity="0.75" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
              <radialGradient id="hK2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.88" /><stop offset="65%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
              <radialGradient id="nC2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.7" /><stop offset="80%" stopColor="#065f46" stopOpacity="0.3" /><stop offset="100%" stopColor="#064e3b" stopOpacity="0" /></radialGradient>
              <radialGradient id="aS2" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#d97706" stopOpacity="0.7" /><stop offset="70%" stopColor="#b45309" stopOpacity="0.3" /><stop offset="100%" stopColor="#000" stopOpacity="0" /></radialGradient>
              <filter id="tG2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
            </defs>
            <g opacity="0.35" stroke="#38bdf8" strokeWidth="1.2">
              <circle cx="120" cy="42" r="22" fill="#082f49" />
              <path d="M112 64 L112 76 L128 76 L128 64 Z" fill="#082f49" />
              <path d="M112 76 C95 78 72 85 64 100 L72 170 L86 170 L92 210 L148 210 L154 170 L168 170 L176 100 C168 85 145 78 128 76 Z" fill="#082f49" />
              <path d="M64 100 L50 170 L42 225 L54 228 L64 172 L72 120 Z" fill="#082f49" />
              <path d="M176 100 L190 170 L198 225 L186 228 L176 172 L168 120 Z" fill="#082f49" />
              <path d="M94 210 L88 280 L84 340 L102 340 L110 280 L116 210 Z" fill="#082f49" />
              <path d="M146 210 L152 280 L156 340 L138 340 L130 280 L124 210 Z" fill="#082f49" />
            </g>
            <g filter="url(#tG2)" opacity="0.8">
              <ellipse cx="120" cy="140" rx="36" ry="50" fill="url(#nC2)" />
              <ellipse cx="60" cy="160" rx="12" ry="40" fill="url(#nC2)" />
              <ellipse cx="180" cy="160" rx="12" ry="40" fill="url(#nC2)" />
              <ellipse cx="144" cy="275" rx="14" ry="55" fill="url(#nC2)" />
              <ellipse cx="96" cy="275" rx="14" ry="55" fill="url(#nC2)" />
            </g>
            <g filter="url(#tG2)" style={{ cursor: 'pointer' }} onClick={() => onSelectHotspot('cervical')}>
              <ellipse cx="120" cy="82" rx={selectedHotspot === 'cervical' ? '32' : '28'} ry={selectedHotspot === 'cervical' ? '18' : '15'} fill="url(#hC2)" />
              <circle cx="120" cy="80" r="5" fill="#ffffff" opacity="0.9" />
              <circle cx="120" cy="80" r="11" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
            </g>
            <g filter="url(#tG2)" style={{ cursor: 'pointer' }} onClick={() => onSelectHotspot('lumbar')}>
              <ellipse cx="120" cy="175" rx={selectedHotspot === 'lumbar' ? '30' : '26'} ry={selectedHotspot === 'lumbar' ? '17' : '14'} fill="url(#hL2)" />
              <circle cx="120" cy="175" r="4.5" fill="#fef08a" />
              <circle cx="120" cy="175" r="9" stroke="#f59e0b" strokeWidth="1.5" />
            </g>
            <g filter="url(#tG2)" style={{ cursor: 'pointer' }} onClick={() => onSelectHotspot('knee_left')}>
              <ellipse cx="98" cy="278" rx={selectedHotspot === 'knee_left' ? '18' : '15'} ry={selectedHotspot === 'knee_left' ? '18' : '15'} fill="url(#hK2)" />
              <circle cx="98" cy="278" r="4" fill="#fef08a" />
              <circle cx="98" cy="278" r="8" stroke="#f59e0b" strokeWidth="1.2" />
            </g>
            {showInsulationEffect && (
              <g filter="url(#tG2)">
                <ellipse cx="120" cy="165" rx="32" ry="24" fill="url(#aS2)" />
                <text x="120" y="168" fill="#ffd166" fontSize="8" textAnchor="middle" fontWeight="bold">Aislante Adiposo (-1.2°C)</text>
              </g>
            )}
            <g fontSize="8" fontFamily="Manrope, sans-serif" fontWeight="700">
              <line x1="120" y1="80" x2="35" y2="55" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="10" y="44" width="55" height="18" rx="4" fill="#381017" stroke="#ef4444" strokeWidth="1" />
              <text x="37" y="56" fill="#fecaca" textAnchor="middle">37.8°C C-7</text>
              <line x1="120" y1="175" x2="205" y2="160" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="175" y="150" width="56" height="18" rx="4" fill="#35240f" stroke="#f59e0b" strokeWidth="1" />
              <text x="203" y="162" fill="#fed7aa" textAnchor="middle">37.1°C L4-5</text>
              <line x1="98" y1="278" x2="30" y2="285" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
              <rect x="5" y="275" width="55" height="18" rx="4" fill="#35240f" stroke="#f59e0b" strokeWidth="1" />
              <text x="32" y="287" fill="#fed7aa" textAnchor="middle">36.9°C Rót</text>
            </g>
          </svg>
        </div>

        {/* Scale + Delta */}
        <div className="termico-side">
          <div className="thermal-scale-card">
            <span className="scale-title">GRADIENTE</span>
            <div className="thermal-gradient-bar">
              <span className="grad-tick hot">38.5°C</span>
              <div className="grad-fill" />
              <span className="grad-tick warm">36.8°C</span>
              <span className="grad-tick norm">35.5°C</span>
              <span className="grad-tick cold">28.0°C</span>
            </div>
            <div className="scale-legend">
              <div className="legend-row"><span className="leg-dot red" /><b>&gt;37.4°C:</b> Hipertermia</div>
              <div className="legend-row"><span className="leg-dot yel" /><b>36.6-37.3:</b> Sobrecarga</div>
              <div className="legend-row"><span className="leg-dot grn" /><b>35.0-36.5:</b> Normotérmico</div>
            </div>
          </div>
          <div className="thermal-delta-box">
            <div className="delta-head"><Zap size={13} color="#f59e0b" /><span>ASIMETRÍA</span></div>
            <strong className="delta-value">ΔT = 1.9°C</strong>
            <small>Diferencial cervical vs. tronco basal (35.9°C).</small>
          </div>
        </div>
      </div>

      {/* Selected hotspot */}
      <div className="termico-hotspot-card">
        <div className="hotspot-active-header">
          <div className="hotspot-title-row">
            <span className={`status-badge ${activeSpot.status}`}>{activeSpot.status === 'critical' ? 'HIPERTERMIA' : activeSpot.status === 'warning' ? 'SOBRECARGA' : 'NORMAL'}</span>
            <b>{activeSpot.name}</b>
          </div>
          <span className="hotspot-temp-pill">{activeSpot.temp}</span>
        </div>
        <p className="hotspot-desc">{activeSpot.description}</p>
        <div className="hotspot-correlation-grid">
          <div className="corr-item"><span>Diagnóstico:</span><strong>{activeSpot.metric}</strong></div>
          <div className="corr-item"><span>ROM:</span><strong>{activeSpot.rom}</strong></div>
        </div>
      </div>
    </div>
  )
}

function ProceduralMannequin({
  layer,
  widthFactor = 1,
  depthFactor = 1
}: {
  layer: ActiveLayer
  widthFactor?: number
  depthFactor?: number
}) {
  const color = layer === 'hologram' ? '#00ffd5' : layer === 'thermal' ? '#f97316' : '#d97706'
  const isWireframe = layer === 'hologram'

  return (
    <group position={[0, 0, 0]} scale={[widthFactor, 1, depthFactor]}>
      {/* Head */}
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.11, 24, 24]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.47, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.1, 16]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Torso */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.19, 0.14, 0.38, 20]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Pelvis / Hips */}
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.22, 20]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Upper Legs */}
      <mesh position={[-0.11, 0.73, 0]}>
        <cylinderGeometry args={[0.075, 0.055, 0.35, 16]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      <mesh position={[0.11, 0.73, 0]}>
        <cylinderGeometry args={[0.075, 0.055, 0.35, 16]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Lower Legs */}
      <mesh position={[-0.11, 0.32, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.44, 16]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      <mesh position={[0.11, 0.32, 0]}>
        <cylinderGeometry args={[0.055, 0.04, 0.44, 16]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Arms */}
      <mesh position={[-0.27, 1.22, 0]} rotation={[0, 0, 0.15]}>
        <cylinderGeometry args={[0.045, 0.038, 0.32, 14]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      <mesh position={[0.27, 1.22, 0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.045, 0.038, 0.32, 14]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      {/* Forearms */}
      <mesh position={[-0.32, 0.92, 0]} rotation={[0, 0, 0.1]}>
        <cylinderGeometry args={[0.038, 0.03, 0.3, 14]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
      <mesh position={[0.32, 0.92, 0]} rotation={[0, 0, -0.1]}>
        <cylinderGeometry args={[0.038, 0.03, 0.3, 14]} />
        <meshStandardMaterial color={color} wireframe={isWireframe} opacity={0.85} transparent />
      </mesh>
    </group>
  )
}
