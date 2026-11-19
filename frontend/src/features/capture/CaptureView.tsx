import React, { useState, useEffect, useRef } from 'react'
import {
  Camera, Upload, ShieldCheck, ShieldAlert, CheckCircle2,
  AlertTriangle, Lock, Eye, Video, VideoOff, Layers, ArrowRight,
  RefreshCw, Check, Sparkles, Image as ImageIcon
} from 'lucide-react'
import { api, Profile, MediaAsset, Consent } from '../../services/api'

interface CaptureViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
  onSelectProfile?: (id: number) => void
  onNavigate: (section: string, profileId?: number, mediaId?: number) => void
}

type ViewType = 'frontal' | 'lateral' | 'posterior'

interface PerspectiveSlot {
  viewType: ViewType
  title: string
  subtitle: string
  file: File | null
  previewUrl: string | null
  checksum: string
  assetId?: number
  isReady: boolean
}

export const CaptureView: React.FC<CaptureViewProps> = ({
  profiles,
  initialProfileId,
  onSelectProfile,
  onNavigate
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  )
  const [activeConsent, setActiveConsent] = useState<Consent | null>(null)
  const [mediaList, setMediaList] = useState<MediaAsset[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // 3-View Photography Session State (Frontal, Lateral, Posterior)
  const [slots, setSlots] = useState<Record<ViewType, PerspectiveSlot>>({
    frontal: {
      viewType: 'frontal',
      title: 'Vista Frontal',
      subtitle: 'Plano Coronal · Eje Biacromial y Nivel Pélvico',
      file: null,
      previewUrl: null,
      checksum: '',
      isReady: false
    },
    lateral: {
      viewType: 'lateral',
      title: 'Vista Lateral',
      subtitle: 'Plano Sagital · Plomada y Cifosis/Lordosis',
      file: null,
      previewUrl: null,
      checksum: '',
      isReady: false
    },
    posterior: {
      viewType: 'posterior',
      title: 'Vista Posterior',
      subtitle: 'Plano Dorsal · Simetría Escapular y Columna',
      file: null,
      previewUrl: null,
      checksum: '',
      isReady: false
    }
  })

  // Webcam live capture state
  const [activeWebcamSlot, setActiveWebcamSlot] = useState<ViewType | null>(null)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // File input refs for each view
  const inputRefs = {
    frontal: useRef<HTMLInputElement>(null),
    lateral: useRef<HTMLInputElement>(null),
    posterior: useRef<HTMLInputElement>(null)
  }

  // Synchronize profile selection without resetting local user changes
  useEffect(() => {
    if (initialProfileId && initialProfileId !== selectedProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles])

  // Load consents and media when profile changes
  useEffect(() => {
    if (selectedProfileId) {
      api.consents(Number(selectedProfileId))
        .then(cons => {
          const active = cons.find(c => c.status === 'accepted')
          setActiveConsent(active || null)
        })
        .catch(() => setActiveConsent(null))

      loadMedia()
    } else {
      setActiveConsent(null)
      setMediaList([])
    }
  }, [selectedProfileId])

  const loadMedia = () => {
    if (selectedProfileId) {
      api.media(Number(selectedProfileId))
        .then(list => {
          setMediaList(list)
          // Pre-populate slots if already uploaded in DB
          setSlots(prev => {
            const next = { ...prev }
            ;(['frontal', 'lateral', 'posterior'] as ViewType[]).forEach(vt => {
              const found = list.find(m => m.view_type === vt)
              if (found) {
                next[vt] = {
                  ...next[vt],
                  isReady: true,
                  assetId: found.id,
                  checksum: found.checksum
                }
              }
            })
            return next
          })
        })
        .catch(() => setMediaList([]))
    }
  }

  // Compute SHA-256 and store preview
  async function handleFileSelectedForSlot(vt: ViewType, file: File) {
    setError('')
    setNotice('')
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError(`Formato inválido para ${vt}. Solo se admiten archivos JPEG, PNG o WebP.`)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`El archivo supera el límite máximo permitido de 10 MB.`)
      return
    }

    const preview = URL.createObjectURL(file)
    // Compute SHA-256
    let hashHex = ''
    try {
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    } catch {
      hashHex = `sha256_${Date.now()}`
    }

    // Save image in session storage for PoseAnalysisView overlay
    try {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          sessionStorage.setItem(`bv_img_${selectedProfileId}_${vt}`, reader.result)
        }
      }
      reader.readAsDataURL(file)
    } catch (e) {
      // Ignore storage errors
    }

    setSlots(prev => ({
      ...prev,
      [vt]: {
        ...prev[vt],
        file,
        previewUrl: preview,
        checksum: hashHex,
        isReady: true
      }
    }))

    // Auto-register to backend if consent is active
    if (selectedProfileId && activeConsent) {
      try {
        const storageKey = `profiles/${selectedProfileId}/captures/${vt}_${Date.now()}.jpg`
        const reg = await api.registerMedia(Number(selectedProfileId), {
          storage_key: storageKey,
          view_type: vt,
          mime: file.type,
          checksum: hashHex
        })
        setSlots(prev => ({
          ...prev,
          [vt]: { ...prev[vt], assetId: reg.id }
        }))
        setNotice(`Vista ${vt.toUpperCase()} registrada y asegurada con SHA-256.`)
        loadMedia()
      } catch (err) {
        setError((err as Error).message)
      }
    }
  }

  // Webcam activation for a specific slot
  async function startWebcamForSlot(vt: ViewType) {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      })
      setWebcamStream(stream)
      setActiveWebcamSlot(vt)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      setError('No se pudo acceder a la cámara web. Verifique los permisos en el navegador o utilice la carga por archivo.')
    }
  }

  function stopWebcam() {
    if (webcamStream) {
      webcamStream.getTracks().forEach(t => t.stop())
      setWebcamStream(null)
    }
    setActiveWebcamSlot(null)
  }

  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [webcamStream])

  useEffect(() => {
    if (activeWebcamSlot && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream
    }
  }, [activeWebcamSlot, webcamStream])

  function handleCaptureFromWebcam() {
    if (!videoRef.current || !activeWebcamSlot) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `live_${activeWebcamSlot}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      const vt = activeWebcamSlot
      stopWebcam()
      await handleFileSelectedForSlot(vt, file)
      setNotice(`Fotograma en vivo capturado para la vista ${vt.toUpperCase()}.`)
    }, 'image/jpeg', 0.95)
  }

  const readyCount = (['frontal', 'lateral', 'posterior'] as ViewType[]).filter(vt => slots[vt].isReady).length
  const primaryReadyAssetId = slots.frontal.assetId || slots.lateral.assetId || slots.posterior.assetId || (mediaList.length > 0 ? mediaList[0].id : undefined)

  return (
    <div className="capture-view">
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Profile Selector Bar */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente para Captura:</b>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {activeConsent ? (
            <span className="badge-consent-ok">
              <ShieldCheck size={14} /> Consentimiento Vigente Ley 29733
            </span>
          ) : (
            <span className="badge-consent-bad">
              <ShieldAlert size={14} /> Consentimiento Inactivo o Revocado
            </span>
          )}

          <span className="badge-live">
            {readyCount} DE 3 VISTAS CAPTURADAS
          </span>
        </div>
      </div>

      {!activeConsent && selectedProfileId && (
        <div className="alert-locked" style={{ marginTop: '14px' }}>
          <Lock size={20} color="#e65c5c" />
          <div>
            <b>Captura bloqueada por política de privacidad:</b>
            <p>
              El expediente seleccionado no cuenta con un consentimiento informado activo.
              Para habilitar la toma o carga de imágenes, debe registrar la aceptación del consentimiento desde el módulo de <strong>Expedientes</strong>.
            </p>
            <button className="primary" style={{ marginTop: '8px' }} onClick={() => onNavigate('Expedientes', Number(selectedProfileId))}>
              Ir a Consentimiento en Expedientes →
            </button>
          </div>
        </div>
      )}

      {/* TRI-PERSPECTIVE CAPTURE STUDIO: 3 VISTAS (FRONTAL, LATERAL, POSTERIOR) */}
      <div className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          <div>
            <h3>Tríada Fotográfica de Evaluación Biomecánica (3 Vistas)</h3>
            <p>Capture o cargue simultáneamente las perspectivas Frontal, Lateral y Posterior para un análisis 3D integral</p>
          </div>

          {readyCount > 0 && (
            <button
              className="primary"
              onClick={() => onNavigate('Análisis IA', Number(selectedProfileId), primaryReadyAssetId)}
            >
              <Sparkles size={15} /> Analizar Tríada en Pose IA ({readyCount}/3 listas) →
            </button>
          )}
        </div>

        {/* 3 Perspectives Grid */}
        <div className="tri-perspective-grid">
          {(['frontal', 'lateral', 'posterior'] as ViewType[]).map((vt) => {
            const slot = slots[vt]
            const isWebcamActiveForThis = activeWebcamSlot === vt

            return (
              <div key={vt} className={`perspective-slot-card ${slot.isReady ? 'ready' : ''}`}>
                <div className="slot-header">
                  <div>
                    <span className="slot-badge">{vt.toUpperCase()}</span>
                    <b>{slot.title}</b>
                    <small>{slot.subtitle}</small>
                  </div>
                  {slot.isReady ? (
                    <span className="status-pill active" title="Captura registrada"><Check size={12} /> LISTA</span>
                  ) : (
                    <span className="status-pill restricted">PENDIENTE</span>
                  )}
                </div>

                {/* Dropzone / Preview / Webcam Box */}
                <div className="slot-preview-box">
                  <input
                    type="file"
                    ref={inputRefs[vt]}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => e.target.files?.[0] && handleFileSelectedForSlot(vt, e.target.files[0])}
                  />

                  {isWebcamActiveForThis ? (
                    <div className="slot-webcam-active">
                      <video ref={videoRef} autoPlay playsInline muted className="webcam-video-feed" />
                      <div className="webcam-controls-overlay">
                        <button type="button" className="primary btn-sm" onClick={handleCaptureFromWebcam}>
                          <Camera size={13} /> Capturar Fotograma
                        </button>
                        <button type="button" className="btn-preset btn-sm" onClick={stopWebcam}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : slot.previewUrl ? (
                    <div className="slot-img-wrap" onClick={() => activeConsent && inputRefs[vt].current?.click()}>
                      <img src={slot.previewUrl} alt={slot.title} className="slot-preview-img" />
                      <div className="slot-change-hover">
                        <Upload size={16} /> Cambiar Imagen
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`slot-drop-empty ${!activeConsent ? 'disabled' : ''}`}
                      onClick={() => activeConsent && inputRefs[vt].current?.click()}
                    >
                      <SilhouettePreview viewType={vt} />
                      <span className="drop-cta-text">Arrastre o haga clic para cargar {slot.title}</span>
                      <small>JPEG, PNG o WebP</small>
                    </div>
                  )}
                </div>

                {/* Slot Action Buttons */}
                <div className="slot-actions-row">
                  <button
                    type="button"
                    className="btn-slot-action"
                    disabled={!activeConsent}
                    onClick={() => inputRefs[vt].current?.click()}
                  >
                    <Upload size={13} /> Cargar Archivo
                  </button>
                  <button
                    type="button"
                    className="btn-slot-action"
                    disabled={!activeConsent}
                    onClick={() => {
                      if (isWebcamActiveForThis) stopWebcam()
                      else startWebcamForSlot(vt)
                    }}
                  >
                    {isWebcamActiveForThis ? <VideoOff size={13} /> : <Video size={13} />}
                    {isWebcamActiveForThis ? 'Detener' : 'Cámara Web'}
                  </button>
                </div>

                {slot.checksum && (
                  <div className="slot-checksum-badge">
                    <span className="dot" /> SHA-256: {slot.checksum.substring(0, 16)}...
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Historical Captures List for this Profile */}
      <section className="panel" style={{ marginTop: '16px' }}>
        <div className="panel-title">
          <div>
            <h3>Historial de Capturas de este Expediente</h3>
            <p>{mediaList.length} capturas custodiadas en base de datos</p>
          </div>
        </div>

        {mediaList.length === 0 ? (
          <div className="empty">No hay capturas previas registradas para este expediente.</div>
        ) : (
          <div className="media-scroll-list">
            {mediaList.map(m => (
              <div key={m.id} className="media-item-row">
                <div className="media-thumb-placeholder">
                  <ImageIcon size={18} />
                </div>
                <div className="media-meta">
                  <b>Captura #{m.id} — Vista {m.view_type.toUpperCase()}</b>
                  <span>Subida el {new Date(m.uploaded_at).toLocaleString()} · Formato: {m.mime}</span>
                  <small>SHA-256: {m.checksum}</small>
                </div>
                <button
                  className="btn-quick-run"
                  onClick={() => onNavigate('Análisis IA', Number(selectedProfileId), m.id)}
                >
                  <Sparkles size={12} /> Procesar en Pose IA
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SilhouettePreview({ viewType }: { viewType: ViewType }) {
  return (
    <svg width="70" height="110" viewBox="0 0 100 160" fill="none" opacity="0.4" style={{ margin: '8px auto' }}>
      <circle cx="50" cy="18" r="11" stroke="#0d9488" strokeWidth="2" />
      {viewType === 'frontal' && (
        <>
          <path d="M50 30 L50 90 M30 45 L70 45 M30 45 L20 85 M70 45 L80 85 M50 90 L34 145 M50 90 L66 145" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {viewType === 'lateral' && (
        <>
          <path d="M46 30 C56 45 44 70 50 90 M50 45 L40 85 M50 90 L45 145" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
        </>
      )}
      {viewType === 'posterior' && (
        <>
          <path d="M50 30 L50 90 M28 45 L72 45 M28 45 L18 85 M72 45 L82 85 M50 90 L34 145 M50 90 L66 145" stroke="#0d9488" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="38" y1="52" x2="44" y2="60" stroke="#0d9488" strokeWidth="2" />
          <line x1="62" y1="52" x2="56" y2="60" stroke="#0d9488" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}
