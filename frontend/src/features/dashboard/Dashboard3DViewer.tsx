import React, { useRef, useState, Suspense, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, useGLTF, Html, Grid } from '@react-three/drei'
import * as THREE from 'three'
import {
  RotateCw, Eye, Sparkles, Activity, Flame, ShieldAlert,
  Layers, Crosshair, ChevronRight, CheckCircle2, Zap
} from 'lucide-react'

// Preload 3D model
try {
  useGLTF.preload('/models/human_body.glb')
} catch (e) {
  // Silent fallback
}

export type ActiveLayer = 'hologram' | 'thermal' | 'fat'

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
}

export const Dashboard3DViewer: React.FC<Dashboard3DViewerProps> = ({
  activeLayer,
  setActiveLayer,
  selectedHotspot,
  onSelectHotspot,
  patientName = 'Mateo Silva'
}) => {
  const [autoRotate, setAutoRotate] = useState(false)
  const [showPlumbLine, setShowPlumbLine] = useState(true)
  const [showJoints, setShowJoints] = useState(true)
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'back' | 'perspective'>('perspective')
  const controlsRef = useRef<any>(null)

  const applyPreset = (preset: 'front' | 'side' | 'back' | 'perspective') => {
    setCameraPreset(preset)
    if (!controlsRef.current) return
    controlsRef.current.reset()
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 0.9, 2.7)
    } else if (preset === 'side') {
      controlsRef.current.object.position.set(2.7, 0.9, 0)
    } else if (preset === 'back') {
      controlsRef.current.object.position.set(0, 0.9, -2.7)
    } else {
      controlsRef.current.object.position.set(1.4, 1.2, 2.1)
    }
    controlsRef.current.target.set(0, 0.9, 0)
    controlsRef.current.update()
  }

  return (
    <div className="dash-3d-card">
      {/* Top Header & Layer Tabs */}
      <div className="dash-3d-header">
        <div>
          <div className="dash-3d-title">
            <Activity size={16} color="#00ffd5" />
            <span>MODELO ANATÓMICO DIGITAL 3D</span>
          </div>
          <p className="dash-3d-sub">
            Sombreado holográfico · Postura, simetrías y puntos biomecánicos
          </p>
        </div>

        {/* Layer Selector */}
        <div className="dash-layer-pill-group">
          <button
            className={`dash-layer-pill ${activeLayer === 'hologram' ? 'active-hologram' : ''}`}
            onClick={() => setActiveLayer('hologram')}
            title="Malla holográfica con cinemática articular y puntos de postura"
          >
            <Sparkles size={13} />
            <span>Holograma / Malla</span>
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
      </div>

      {/* Floating HUD Badges */}
      <div className="dash-3d-viewport">
        <div className="dash-3d-hud-top">
          <span className="dash-hud-tag live">
            <span className="dot pulse" /> EVALUACIÓN POSTURAL 3D
          </span>
          <span className="dash-hud-tag patient">
            {patientName} · Eje Gravitacional Activo
          </span>
        </div>

        {/* Hotspot Floating Tooltip if selected */}
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
          <PerspectiveCamera makeDefault position={[1.4, 1.2, 2.1]} fov={45} />
          <OrbitControls
            ref={controlsRef}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
            minDistance={0.9}
            maxDistance={5.0}
            target={[0, 0.9, 0]}
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
            />
          </Suspense>

          {/* Podometric Floor Grid */}
          <Grid
            position={[0, 0, 0]}
            args={[3.5, 3.5]}
            cellSize={0.15}
            cellThickness={0.5}
            cellColor="#0e3a4e"
            sectionSize={0.6}
            sectionThickness={1.0}
            sectionColor="#1b607e"
            fadeDistance={5}
          />
        </Canvas>

        {/* Bottom Bar Controls inside Canvas */}
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

      {/* Layer Context Bar below 3D */}
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
}

function DashboardHumanMesh({
  layer,
  selectedHotspot,
  onSelectHotspot,
  showJoints,
  showPlumbLine
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

  return (
    <group position={[0, 0, 0]}>
      {/* 3D Human Model */}
      {clonedScene ? (
        <primitive object={clonedScene} position={[0, 0, 0]} scale={[1, 1, 1]} />
      ) : (
        /* Procedural Mannequin Fallback if GLB not yet loaded */
        <ProceduralMannequin layer={layer} />
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

function ProceduralMannequin({ layer }: { layer: ActiveLayer }) {
  const color = layer === 'hologram' ? '#00ffd5' : layer === 'thermal' ? '#f97316' : '#d97706'
  const isWireframe = layer === 'hologram'

  return (
    <group position={[0, 0, 0]}>
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
