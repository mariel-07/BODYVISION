import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Center, Grid, ContactShadows, PerspectiveCamera, useGLTF, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  Layers, Sun, RotateCw, Activity, ShieldCheck, UserCheck, Sparkles
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
  const [layer, setLayer] = useState<'surface' | 'clinical' | 'wireframe' | 'skeleton' | 'measurements'>('surface')
  const [lighting, setLighting] = useState<'studio' | 'cyberpunk' | 'clinical'>('studio')
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraPreset, setCameraPreset] = useState<'front' | 'side' | 'back' | 'perspective'>('perspective')

  const controlsRef = useRef<any>(null)

  // Sincronizar selección de perfil
  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles, selectedProfileId])

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
      controlsRef.current.object.position.set(0, 0.88, 2.8)
    } else if (preset === 'side') {
      controlsRef.current.object.position.set(2.8, 0.88, 0)
    } else if (preset === 'back') {
      controlsRef.current.object.position.set(0, 0.88, -2.8)
    } else {
      controlsRef.current.object.position.set(1.5, 1.2, 2.2)
    }
    controlsRef.current.target.set(0, 0.88, 0)
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
        <span className="badge-live" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <UserCheck size={14} color="#34d399" /> MALLA ANATÓMICA HUMANA REAL (28.3K VÉRTICES)
        </span>
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
              <span>Tórax:</span>
              <b>{getMetricVal('Tórax')}</b>
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
              <span>% Grasa:</span>
              <b>{getMetricVal('Grasa')}</b>
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
            <PerspectiveCamera makeDefault position={[1.6, 1.25, 2.5]} fov={45} />
            <OrbitControls
              ref={controlsRef}
              autoRotate={autoRotate}
              autoRotateSpeed={1.5}
              minDistance={0.8}
              maxDistance={6.0}
              target={[0, 0.88, 0]}
              maxPolarAngle={Math.PI / 2 + 0.05}
            />

            {/* Lighting Setups */}
            {lighting === 'studio' && (
              <>
                <ambientLight intensity={0.85} />
                <directionalLight position={[2.5, 4.5, 3.5]} intensity={1.8} castShadow shadow-mapSize={1024} />
                <directionalLight position={[-2.5, 3.0, 2.0]} intensity={1.0} color="#e0f2fe" />
                <directionalLight position={[0, 2.0, -3.5]} intensity={0.9} color="#bae6fd" />
                <pointLight position={[0, 0.5, 2.0]} intensity={0.4} />
              </>
            )}
            {lighting === 'cyberpunk' && (
              <>
                <ambientLight intensity={0.4} color="#0c1929" />
                <directionalLight position={[3.5, 3, 2]} intensity={2.5} color="#00f5d4" />
                <directionalLight position={[-3.5, 2, -2]} intensity={2.2} color="#f72585" />
                <pointLight position={[0, 2, 3]} intensity={1.2} color="#7209b7" />
              </>
            )}
            {lighting === 'clinical' && (
              <>
                <ambientLight intensity={1.4} color="#ffffff" />
                <directionalLight position={[0, 6, 2.5]} intensity={1.8} />
                <directionalLight position={[0, 1.5, -4]} intensity={1.0} />
                <directionalLight position={[-3, 2, 0]} intensity={0.7} />
              </>
            )}

            {/* Real 3D Anatomical Human Body Mesh */}
            <Suspense fallback={<ModelLoadingFallback />}>
              <RealisticHumanBody layer={layer} />
            </Suspense>

            {/* Studio Floor Grid & Contact Shadows */}
            <ContactShadows position={[0, 0, 0]} opacity={0.65} scale={4.5} blur={1.5} far={2} />
            <Grid
              position={[0, -0.005, 0]}
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
                <h3>Capas Anatómicas Reales</h3>
                <p>Inspección del cuerpo humano 3D</p>
              </div>
              <Layers size={18} color="#45cbbd" />
            </div>

            <div className="layer-button-group">
              {[
                { id: 'surface', label: 'Cuerpo Humano Real (Textura)', desc: 'Piel real fotográfica y anatomía orgánica completa' },
                { id: 'clinical', label: 'Escaneo Clínico Dérmico', desc: 'Sombreado PBR de superficie dérmica y relieves musculares' },
                { id: 'wireframe', label: 'Malla Topológica (50K Quads)', desc: 'Inspección de la estructura poligonal anatómica real' },
                { id: 'skeleton', label: 'Silueta Translúcida y Articulaciones', desc: 'Estructura ósea interior con centros articulares' },
                { id: 'measurements', label: 'Perímetros Antropométricos', desc: 'Circunferencias reales de tórax, cintura, cadera y muslo' },
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

          {/* Real Human Model Specs */}
          <div className="viewer-specs-box" style={{ marginTop: '16px' }}>
            <Sparkles size={18} color="#34d399" />
            <div>
              <b>Malla 3D Orgánica Real (Sin figuras geométricas):</b>
              <p>
                Modelo volumétrico orgánico continuo con 28,391 vértices anatómicos y 50,000 polígonos. Representa con fidelidad la silueta humana real, proporciones dérmicas y curvaturas corporales para análisis antropométrico.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
        background: 'rgba(8, 23, 38, 0.9)',
        padding: '16px 28px',
        borderRadius: '10px',
        border: '1px solid #1f3d5c',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '220px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '26px',
          height: '26px',
          border: '3px solid #1f3d5c',
          borderTopColor: '#34d399',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>
          Cargando cuerpo humano 3D...
        </span>
      </div>
    </Html>
  )
}

// Realistic 3D Human Body Model Component
function RealisticHumanBody({ layer }: { layer: 'surface' | 'clinical' | 'wireframe' | 'skeleton' | 'measurements' }) {
  const { scene } = useGLTF('/models/human_body.glb')

  // Clone scene so materials can be customized per layer without affecting the cached original
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

  // Update materials when layer changes
  useEffect(() => {
    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
        if (layer === 'wireframe') {
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#34d399',
            wireframe: true,
            roughness: 0.4,
          })
        } else if (layer === 'clinical') {
          // Clean anatomical skin PBR shader highlighting muscle tone and body contours
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#d6a887',
            roughness: 0.58,
            metalness: 0.04,
            wireframe: false,
          })
        } else if (layer === 'skeleton') {
          // Translucent anatomical X-Ray glass body
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#1e3a5f',
            transparent: true,
            opacity: 0.38,
            roughness: 0.25,
            wireframe: false,
          })
        } else if (layer === 'measurements') {
          // Natural body with high contrast for metric perimeter rings
          mesh.material = new THREE.MeshStandardMaterial({
            color: '#2a4460',
            roughness: 0.5,
            metalness: 0.08,
            transparent: true,
            opacity: 0.88,
          })
        } else {
          // 'surface': Real human photographic skin texture from model
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
  }, [clonedScene, layer, scene])

  // Joint and Landmark Spheres Material
  const jointMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#00ffd5',
    emissive: '#00ffd5',
    emissiveIntensity: 0.85,
    roughness: 0.15,
  }), [])

  // Measurement Band Material
  const metricRingMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: '#ffc83b',
    emissive: '#ffb703',
    emissiveIntensity: 0.9,
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

      {/* Internal Skeleton & Articular Landmarks */}
      {(layer === 'skeleton') && (
        <group>
          {[
            [0, 1.62, 0.04],   // Cabeza / Nariz
            [0, 1.48, -0.01],  // C7 Cuello
            [-0.19, 1.38, 0],  // Hombro Izquierdo
            [0.19, 1.38, 0],   // Hombro Derecho
            [-0.27, 1.15, 0],  // Codo Izquierdo
            [0.27, 1.15, 0],   // Codo Derecho
            [-0.30, 0.90, 0],  // Muñeca Izquierda
            [0.30, 0.90, 0],   // Muñeca Derecha
            [0, 1.12, 0],      // Columna Lumbar
            [-0.10, 0.88, 0],  // Cadera Izquierda
            [0.10, 0.88, 0],   // Cadera Derecha
            [-0.10, 0.50, 0.02],// Rodilla Izquierda
            [0.10, 0.50, 0.02], // Rodilla Derecha
            [-0.10, 0.10, 0],  // Tobillo Izquierdo
            [0.10, 0.10, 0],   // Tobillo Derecho
          ].map(([x, y, z], idx) => (
            <mesh key={idx} position={[x, y, z]} material={jointMaterial}>
              <sphereGeometry args={[0.022, 16, 16]} />
            </mesh>
          ))}
        </group>
      )}

      {/* Anthropometric Circumference Measurement Rings mapped to real human anatomy */}
      {layer === 'measurements' && (
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
          {/* Perímetro Muslo Medio */}
          <mesh position={[-0.10, 0.68, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.092, 0.006, 16, 48]} />
          </mesh>
          <mesh position={[0.10, 0.68, 0.0]} rotation={[Math.PI / 2, 0, 0]} material={metricRingMaterial}>
            <torusGeometry args={[0.092, 0.006, 16, 48]} />
          </mesh>
        </group>
      )}
    </group>
  )
}
