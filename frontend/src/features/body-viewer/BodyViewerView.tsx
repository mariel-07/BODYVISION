import React, { useState, useEffect, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Center, Grid, ContactShadows, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import {
  Cuboid, Eye, Layers, Camera, Sun, RotateCw,
  Maximize2, Activity, Info, ShieldCheck
} from 'lucide-react'
import { api, Profile, Measurement } from '../../services/api'

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
  const [layer, setLayer] = useState<'surface' | 'wireframe' | 'skeleton' | 'measurements'>('surface')
  const [lighting, setLighting] = useState<'studio' | 'cyberpunk' | 'clinical'>('studio')
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'back' | 'perspective'>('perspective')

  const controlsRef = useRef<any>(null)

  // Load measurements for selected profile
  useEffect(() => {
    if (selectedProfileId) {
      api.measurements(Number(selectedProfileId))
        .then(setMeasurements)
        .catch(() => setMeasurements([]))
    } else {
      setMeasurements([])
    }
  }, [selectedProfileId])

  // Move camera based on preset
  function applyCameraPreset(preset: 'front' | 'side' | 'back' | 'perspective') {
    setCameraPreset(preset)
    if (!controlsRef.current) return
    controlsRef.current.reset()
    if (preset === 'front') {
      controlsRef.current.object.position.set(0, 0.9, 3.2)
    } else if (preset === 'side') {
      controlsRef.current.object.position.set(3.2, 0.9, 0)
    } else if (preset === 'back') {
      controlsRef.current.object.position.set(0, 0.9, -3.2)
    } else {
      controlsRef.current.object.position.set(1.8, 1.2, 2.6)
    }
    controlsRef.current.target.set(0, 0.8, 0)
    controlsRef.current.update()
  }

  // Get key metrics for HUD
  const getMetricVal = (mName: string) => {
    const found = measurements.find(m => m.metric.toLowerCase().includes(mName.toLowerCase()))
    return found ? `${found.value} ${found.unit}` : 'N/D'
  }

  return (
    <div className="body-viewer-view">
      {/* Top Selector Bar */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente para Modelo 3D:</b>
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
        <span className="badge-live">MOTOR THREE.JS + R3F · 60 FPS</span>
      </div>

      <div className="viewer-layout" style={{ marginTop: '16px' }}>
        {/* 3D Canvas Area */}
        <div className="canvas-wrapper">
          {/* Canvas Floating HUD Overlay */}
          <div className="viewer-floating-hud">
            <div className="hud-metric-pill">
              <span>Estatura:</span>
              <b>{getMetricVal('Estatura')}</b>
            </div>
            <div className="hud-metric-pill">
              <span>Cintura:</span>
              <b>{getMetricVal('Cintura')}</b>
            </div>
            <div className="hud-metric-pill">
              <span>Cadera:</span>
              <b>{getMetricVal('Cadera')}</b>
            </div>
            <div className="hud-metric-pill">
              <span>Tórax:</span>
              <b>{getMetricVal('Tórax')}</b>
            </div>
          </div>

          {/* Perspective Preset Buttons */}
          <div className="viewer-perspective-bar">
            {(['front', 'side', 'back', 'perspective'] as const).map(p => (
              <button
                key={p}
                className={`btn-preset ${cameraPreset === p ? 'active' : ''}`}
                onClick={() => applyCameraPreset(p)}
              >
                {p === 'front' ? 'Frontal' : p === 'side' ? 'Lateral' : p === 'back' ? 'Posterior' : '3D Libre'}
              </button>
            ))}
            <button
              className={`btn-preset ${autoRotate ? 'active' : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
              title="Giro continuo (Turntable)"
            >
              <RotateCw size={13} /> Giro 360°
            </button>
          </div>

          {/* WebGL Canvas */}
          <Canvas shadows gl={{ antialias: true, alpha: true }}>
            <PerspectiveCamera makeDefault position={[1.8, 1.2, 2.6]} fov={45} />
            <OrbitControls
              ref={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={1.8}
              minDistance={1.0}
              maxDistance={6.0}
              target={[0, 0.8, 0]}
              maxPolarAngle={Math.PI / 2 + 0.1}
            />

            {/* Lighting Setups */}
            {lighting === 'studio' && (
              <>
                <ambientLight intensity={0.6} />
                <directionalLight position={[3, 5, 4]} intensity={1.5} castShadow shadow-mapSize={1024} />
                <directionalLight position={[-3, 2, -2]} intensity={0.8} color="#45cbbd" />
                <pointLight position={[0, -1, 2]} intensity={0.4} />
              </>
            )}
            {lighting === 'cyberpunk' && (
              <>
                <ambientLight intensity={0.3} color="#0d1b2a" />
                <directionalLight position={[4, 3, 2]} intensity={2.2} color="#00ffcc" />
                <directionalLight position={[-4, 2, -2]} intensity={2.0} color="#ff007f" />
                <pointLight position={[0, 2, 3]} intensity={1.0} color="#38b6ff" />
              </>
            )}
            {lighting === 'clinical' && (
              <>
                <ambientLight intensity={1.2} color="#ffffff" />
                <directionalLight position={[0, 6, 2]} intensity={1.6} />
                <directionalLight position={[0, 1, -4]} intensity={0.8} />
              </>
            )}

            {/* Anatomical Mannequin Body Mesh */}
            <Center top position={[0, 0, 0]}>
              <AnatomicalMannequin layer={layer} />
            </Center>

            {/* Studio Floor Grid & Contact Shadows */}
            <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={5} blur={1.5} far={2} />
            <Grid
              position={[0, -0.01, 0]}
              args={[10, 10]}
              cellSize={0.2}
              cellThickness={0.6}
              cellColor="#1b344b"
              sectionSize={1}
              sectionThickness={1.2}
              sectionColor="#2f5b82"
              fadeDistance={6}
            />
          </Canvas>
        </div>

        {/* Right: Layers & Shader Controls */}
        <div className="viewer-controls-panel">
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Capas de Visualización</h3>
                <p>Niveles anatómicos configurables</p>
              </div>
              <Layers size={18} color="#45cbbd" />
            </div>

            <div className="layer-button-group">
              {[
                { id: 'surface', label: 'Superficie Anatómica', desc: 'Sombreado PBR de malla dérmica' },
                { id: 'wireframe', label: 'Malla Wireframe', desc: 'Inspección de topología y quads' },
                { id: 'skeleton', label: 'Esqueleto y Articulaciones', desc: 'Estructura ósea y centros articulares' },
                { id: 'measurements', label: 'Zonas de Perímetro', desc: 'Bandas métricas de pecho, cintura y cadera' },
              ].map(item => (
                <button
                  key={item.id}
                  className={`layer-option-btn ${layer === item.id ? 'active' : ''}`}
                  onClick={() => setLayer(item.id as any)}
                >
                  <div className="layer-dot" />
                  <div>
                    <b>{item.label}</b>
                    <span>{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Lighting & Environment */}
          <section className="panel" style={{ marginTop: '16px' }}>
            <div className="panel-title">
              <div>
                <h3>Iluminación de Estudio</h3>
                <p>Esquemas ópticos de render</p>
              </div>
              <Sun size={18} color="#45cbbd" />
            </div>

            <div className="lighting-preset-tabs">
              {(['studio', 'cyberpunk', 'clinical'] as const).map(l => (
                <button
                  key={l}
                  className={`light-tab ${lighting === l ? 'active' : ''}`}
                  onClick={() => setLighting(l)}
                >
                  {l === 'studio' ? 'Estudio Pro' : l === 'cyberpunk' ? 'Cyber Cyan' : 'Clínico Neutro'}
                </button>
              ))}
            </div>
          </section>

          {/* Architecture Compliance Tag */}
          <div className="viewer-specs-box" style={{ marginTop: '16px' }}>
            <ShieldCheck size={16} color="#3bd5c5" />
            <div>
              <b>Directiva de Activos 3D (Maya / Web):</b>
              <p>
                El activo base sigue el flujo de modelado y topología en Autodesk Maya con exportación optimizada a GLTF/GLB y ejecución directa en navegador mediante Three.js.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Procedural 3D Anatomical Mannequin with segmented volumes and layers
function AnatomicalMannequin({ layer }: { layer: 'surface' | 'wireframe' | 'skeleton' | 'measurements' }) {
  const groupRef = useRef<THREE.Group>(null)

  // Material setup
  const isWire = layer === 'wireframe'

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: isWire ? '#45d6c8' : '#22384d',
    wireframe: isWire,
    roughness: 0.35,
    metalness: 0.25,
  })

  const jointMaterial = new THREE.MeshStandardMaterial({
    color: '#00ffd5',
    emissive: '#00ffd5',
    emissiveIntensity: 0.7,
    roughness: 0.2,
  })

  const boneMaterial = new THREE.MeshStandardMaterial({
    color: '#345573',
    roughness: 0.5,
  })

  const metricRingMaterial = new THREE.MeshStandardMaterial({
    color: '#ffc83b',
    emissive: '#ffc83b',
    emissiveIntensity: 0.8,
    side: THREE.DoubleSide
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. SURFACE & VOLUMES (Torso, Limbs, Head) */}
      {(layer === 'surface' || layer === 'wireframe' || layer === 'measurements') && (
        <group>
          {/* Head */}
          <mesh position={[0, 1.68, 0]} material={bodyMaterial} castShadow>
            <sphereGeometry args={[0.11, 24, 24]} />
          </mesh>
          {/* Neck */}
          <mesh position={[0, 1.54, 0]} material={bodyMaterial}>
            <cylinderGeometry args={[0.045, 0.05, 0.08, 16]} />
          </mesh>

          {/* Thorax / Chest */}
          <mesh position={[0, 1.38, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.17, 0.14, 0.24, 20]} />
          </mesh>

          {/* Abdomen / Waist */}
          <mesh position={[0, 1.20, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.135, 0.145, 0.16, 20]} />
          </mesh>

          {/* Pelvis / Hips */}
          <mesh position={[0, 1.05, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.155, 0.145, 0.16, 20]} />
          </mesh>

          {/* Left Arm */}
          <mesh position={[-0.24, 1.32, 0]} rotation={[0, 0, 0.15]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.26, 16]} />
          </mesh>
          <mesh position={[-0.30, 1.06, 0]} rotation={[0, 0, 0.12]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.038, 0.032, 0.26, 16]} />
          </mesh>

          {/* Right Arm */}
          <mesh position={[0.24, 1.32, 0]} rotation={[0, 0, -0.15]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.045, 0.04, 0.26, 16]} />
          </mesh>
          <mesh position={[0.30, 1.06, 0]} rotation={[0, 0, -0.12]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.038, 0.032, 0.26, 16]} />
          </mesh>

          {/* Left Leg */}
          <mesh position={[-0.10, 0.78, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.065, 0.05, 0.38, 18]} />
          </mesh>
          <mesh position={[-0.10, 0.38, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.048, 0.038, 0.40, 18]} />
          </mesh>
          {/* Left Foot */}
          <mesh position={[-0.10, 0.04, 0.05]} material={bodyMaterial} castShadow>
            <boxGeometry args={[0.07, 0.06, 0.18]} />
          </mesh>

          {/* Right Leg */}
          <mesh position={[0.10, 0.78, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.065, 0.05, 0.38, 18]} />
          </mesh>
          <mesh position={[0.10, 0.38, 0]} material={bodyMaterial} castShadow>
            <cylinderGeometry args={[0.048, 0.038, 0.40, 18]} />
          </mesh>
          {/* Right Foot */}
          <mesh position={[0.10, 0.04, 0.05]} material={bodyMaterial} castShadow>
            <boxGeometry args={[0.07, 0.06, 0.18]} />
          </mesh>
        </group>
      )}

      {/* 2. SKELETON & JOINT LANDMARKS LAYER */}
      {(layer === 'skeleton' || layer === 'surface') && (
        <group>
          {/* Spine & Joints */}
          {[
            [0, 1.68, 0], // Head/Nose
            [0, 1.50, 0], // C7 Neck
            [-0.20, 1.45, 0], // Left Shoulder
            [0.20, 1.45, 0], // Right Shoulder
            [-0.28, 1.20, 0], // Left Elbow
            [0.28, 1.20, 0], // Right Elbow
            [-0.34, 0.94, 0], // Left Wrist
            [0.34, 0.94, 0], // Right Wrist
            [-0.10, 0.98, 0], // Left Hip
            [0.10, 0.98, 0], // Right Hip
            [-0.10, 0.58, 0], // Left Knee
            [0.10, 0.58, 0], // Right Knee
            [-0.10, 0.18, 0], // Left Ankle
            [0.10, 0.18, 0], // Right Ankle
          ].map(([x, y, z], idx) => (
            <mesh key={idx} position={[x, y, z]} material={jointMaterial}>
              <sphereGeometry args={[0.024, 16, 16]} />
            </mesh>
          ))}
        </group>
      )}

      {/* 3. MEASUREMENT CALLOUT RINGS */}
      {layer === 'measurements' && (
        <group>
          {/* Chest Band */}
          <mesh position={[0, 1.40, 0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.18, 0.007, 12, 32]} />
          </mesh>
          {/* Waist Band */}
          <mesh position={[0, 1.20, 0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.15, 0.007, 12, 32]} />
          </mesh>
          {/* Hip Band */}
          <mesh position={[0, 1.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.165, 0.007, 12, 32]} />
          </mesh>
          {/* Thigh Band */}
          <mesh position={[-0.10, 0.80, 0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.075, 0.006, 12, 32]} />
          </mesh>
        </group>
      )}
    </group>
  )
}
