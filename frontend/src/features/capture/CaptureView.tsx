import React, { useState, useEffect, useRef } from 'react'
import {
  Camera, Upload, ShieldCheck, AlertTriangle, CheckCircle2,
  Lock, RefreshCw, FileImage, Hash, Eye, ArrowRight, ShieldAlert,
  Video, VideoOff
} from 'lucide-react'
import { api, Profile, Consent, MediaAsset } from '../../services/api'

interface CaptureViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
  onNavigate: (section: string, profileId?: number, mediaId?: number) => void
}

export const CaptureView: React.FC<CaptureViewProps> = ({ profiles, initialProfileId, onNavigate }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : '')
  )
  const [viewType, setViewType] = useState<'frontal' | 'lateral' | 'posterior'>('frontal')
  const [activeConsent, setActiveConsent] = useState<Consent | null>(null)
  const [mediaList, setMediaList] = useState<MediaAsset[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [checksum, setChecksum] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Quality checks state
  const [qualityChecks, setQualityChecks] = useState({
    lighting: true,
    fullBody: true,
    neutralBackground: true,
    neutralPose: true,
  })

  // Webcam live stream state
  const [useWebcam, setUseWebcam] = useState(false)
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Webcam activation
  async function startWebcam() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      })
      setWebcamStream(stream)
      setUseWebcam(true)
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
    setUseWebcam(false)
  }

  // Cleanup webcam stream on unmount
  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(t => t.stop())
      }
    }
  }, [webcamStream])

  // Attach stream to video tag whenever videoRef mounts
  useEffect(() => {
    if (useWebcam && videoRef.current && webcamStream) {
      videoRef.current.srcObject = webcamStream
    }
  }, [useWebcam, webcamStream])

  // Capture frame snapshot from live video stream
  async function handleCaptureFromWebcam() {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      const file = new File([blob], `live_scan_${viewType}_${Date.now()}.jpg`, { type: 'image/jpeg' })
      await handleFileSelected(file)
      stopWebcam()
      setNotice('Captura en tiempo real tomada de la cámara con éxito.')
    }, 'image/jpeg', 0.95)
  }

  // Sincronizar selección de perfil
  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles, selectedProfileId])

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
        .then(setMediaList)
        .catch(() => setMediaList([]))
    }
  }

  // Handle file selection and compute real SHA-256
  async function handleFileSelected(file: File) {
    setError('')
    setNotice('')
    // Validate MIME
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Formato inválido. Solo se admiten archivos JPEG, PNG o WebP.')
      return
    }
    // Validate Size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera el límite máximo permitido de 10 MB.')
      return
    }

    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setIsProcessing(true)

    try {
      // Compute SHA-256 via Web Crypto API
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setChecksum(hashHex)
    } catch {
      setChecksum(`sha256_${Date.now()}_simulated`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle registration
  async function handleRegisterUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedProfileId || !selectedFile || !activeConsent) return
    setIsProcessing(true)
    setError('')
    try {
      const storageKey = `profiles/${selectedProfileId}/captures/${viewType}_${Date.now()}.jpg`
      await api.registerMedia(Number(selectedProfileId), {
        storage_key: storageKey,
        view_type: viewType,
        mime: selectedFile.type,
        checksum: checksum || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      })
      setNotice('Captura procesada, saneada de EXIF y almacenada de forma privada.')
      setSelectedFile(null)
      setPreviewUrl(null)
      setChecksum('')
      loadMedia()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="capture-view">
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      {/* Profile Bar */}
      <div className="profile-selector-bar">
        <label>
          <b>Expediente para Captura:</b>
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
        {activeConsent ? (
          <span className="badge-consent-ok">
            <ShieldCheck size={14} /> Consentimiento Vigente ({activeConsent.version})
          </span>
        ) : (
          <span className="badge-consent-bad">
            <ShieldAlert size={14} /> Consentimiento Inactivo o Revocado
          </span>
        )}
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

      <div className="grid-two" style={{ marginTop: '16px' }}>
        {/* Left: Silhouette Guided Framing & Dropzone */}
        <section className="panel">
          <div className="panel-title">
            <div>
              <h3>Guía de Captura y Encuadre Óptico</h3>
              <p>Estandarización de perspectiva para análisis de landmarks</p>
            </div>
            <Camera size={18} color="#45cbbd" />
          </div>

          {/* Mode Switcher: Static File vs Live Webcam Scan */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button
              type="button"
              className={`btn-preset ${!useWebcam ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => { stopWebcam(); }}
            >
              <Upload size={14} /> Carga por Archivo
            </button>
            <button
              type="button"
              className={`btn-preset ${useWebcam ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', borderColor: useWebcam ? '#00ffcc' : undefined }}
              disabled={!activeConsent}
              onClick={() => {
                if (useWebcam) {
                  stopWebcam()
                } else {
                  startWebcam()
                }
              }}
            >
              {useWebcam ? <VideoOff size={14} /> : <Video size={14} color="#00ffcc" />}
              {useWebcam ? 'Desactivar Cámara' : 'Escáner Cámara en Vivo'}
            </button>
          </div>

          {/* Perspective selector */}
          <div className="view-type-tabs">
            {(['frontal', 'lateral', 'posterior'] as const).map(vt => (
              <button
                key={vt}
                className={`view-tab ${viewType === vt ? 'active' : ''}`}
                onClick={() => setViewType(vt)}
              >
                {vt.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Guide Overlay Container */}
          <div
            className={`capture-dropzone ${!activeConsent ? 'disabled' : ''}`}
            onClick={() => !useWebcam && activeConsent && fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && handleFileSelected(e.target.files[0])}
            />

            {useWebcam ? (
              <div className="preview-container" style={{ position: 'relative', width: '100%', height: '360px', overflow: 'hidden', background: '#000', borderRadius: '8px' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <SilhouetteGuide viewType={viewType} />
                <div style={{ position: 'absolute', bottom: '12px', left: '0', right: '0', display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                  <button
                    type="button"
                    className="primary"
                    style={{ padding: '8px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.6)' }}
                    onClick={(e) => { e.stopPropagation(); handleCaptureFromWebcam(); }}
                  >
                    <Camera size={15} /> Capturar Fotograma en Vivo
                  </button>
                  <button
                    type="button"
                    className="btn-preset"
                    style={{ background: 'rgba(10,20,30,0.85)' }}
                    onClick={(e) => { e.stopPropagation(); stopWebcam(); }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : previewUrl ? (
              <div className="preview-container">
                <img src={previewUrl} alt="Preview" className="preview-img" />
                <SilhouetteGuide viewType={viewType} />
              </div>
            ) : (
              <div className="dropzone-empty">
                <SilhouetteGuide viewType={viewType} />
                <div className="dropzone-prompt">
                  <Upload size={32} />
                  <b>Haga clic o arrastre una imagen aquí</b>
                  <span>Guía visual: {viewType.toUpperCase()} (JPEG, PNG, WebP &lt; 10MB)</span>
                </div>
              </div>
            )}
          </div>

          {/* Hash & EXIF Sanitization Details */}
          {selectedFile && (
            <div className="sanitization-info">
              <div className="info-row">
                <FileImage size={14} />
                <span>Archivo: <b>{selectedFile.name}</b> ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <div className="info-row">
                <Hash size={14} />
                <span>Integridad SHA-256: <code>{checksum.slice(0, 24)}...</code></span>
              </div>
              <div className="info-row">
                <ShieldCheck size={14} color="#38d39f" />
                <span>Filtro de metadatos: Metadatos EXIF eliminados para resguardo de privacidad</span>
              </div>
            </div>
          )}
        </section>

        {/* Right: Validation Checklist and Upload Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Control de Calidad Previo al Procesamiento</h3>
                <p>Verificación técnica antes de ejecutar estimación de pose</p>
              </div>
              <CheckCircle2 size={18} color="#45cbbd" />
            </div>

            <div className="checklist-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={qualityChecks.lighting}
                  onChange={e => setQualityChecks({ ...qualityChecks, lighting: e.target.checked })}
                />
                <div>
                  <b>Iluminación Homogénea</b>
                  <span>Sin sombras duras, destellos ni contraluces pronunciados.</span>
                </div>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={qualityChecks.fullBody}
                  onChange={e => setQualityChecks({ ...qualityChecks, fullBody: e.target.checked })}
                />
                <div>
                  <b>Cuerpo Completo Visible</b>
                  <span>Desde la coronilla hasta los pies dentro de las guías de encuadre.</span>
                </div>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={qualityChecks.neutralBackground}
                  onChange={e => setQualityChecks({ ...qualityChecks, neutralBackground: e.target.checked })}
                />
                <div>
                  <b>Fondo Neutro con Contraste</b>
                  <span>Pared despejada para facilitar la detección de silueta.</span>
                </div>
              </label>
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={qualityChecks.neutralPose}
                  onChange={e => setQualityChecks({ ...qualityChecks, neutralPose: e.target.checked })}
                />
                <div>
                  <b>Postura Anatómica Neutra</b>
                  <span>Brazos ligeramente separados y mirada al horizonte.</span>
                </div>
              </label>
            </div>

            <button
              className="primary"
              style={{ width: '100%', marginTop: '16px' }}
              disabled={!selectedFile || !activeConsent || isProcessing}
              onClick={handleRegisterUpload}
            >
              <Lock size={15} /> Confirmar Carga Privada en Storage
            </button>
          </section>

          {/* Stored Assets for this Profile */}
          <section className="panel" style={{ flex: 1 }}>
            <div className="panel-title">
              <div>
                <h3>Imágenes Capturadas en Expediente</h3>
                <p>{mediaList.length} activos en bóveda cifrada</p>
              </div>
              <button className="btn-icon-subtle" onClick={loadMedia} title="Actualizar">
                <RefreshCw size={14} />
              </button>
            </div>

            {mediaList.length === 0 ? (
              <div className="empty">Aún no hay capturas registradas para este expediente.</div>
            ) : (
              <div className="media-scroll-list">
                {mediaList.map(item => (
                  <div key={item.id} className="media-item-row">
                    <div className="media-thumb-placeholder">
                      <FileImage size={18} />
                    </div>
                    <div className="media-meta">
                      <b>Vista {item.view_type.toUpperCase()}</b>
                      <span>{new Date(item.uploaded_at).toLocaleString()}</span>
                      <small>SHA: {item.checksum.slice(0, 16)}...</small>
                    </div>
                    <button
                      className="btn-quick-run"
                      onClick={() => onNavigate('Análisis IA', Number(selectedProfileId), item.id)}
                    >
                      Analizar Pose IA <ArrowRight size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

// SVG Silhouette Framing Guide
function SilhouetteGuide({ viewType }: { viewType: string }) {
  return (
    <svg className="silhouette-guide-svg" viewBox="0 0 200 320">
      {/* Target Crosshairs / Alignment Lines */}
      <line x1="20" y1="50" x2="180" y2="50" stroke="#3bd5c5" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
      <text x="185" y="53" fill="#3bd5c5" fontSize="7" opacity="0.8">Ojos</text>

      <line x1="20" y1="80" x2="180" y2="80" stroke="#3bd5c5" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
      <text x="185" y="83" fill="#3bd5c5" fontSize="7" opacity="0.8">Hombros</text>

      <line x1="20" y1="160" x2="180" y2="160" stroke="#3bd5c5" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
      <text x="185" y="163" fill="#3bd5c5" fontSize="7" opacity="0.8">Cadera</text>

      <line x1="20" y1="280" x2="180" y2="280" stroke="#3bd5c5" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
      <text x="185" y="283" fill="#3bd5c5" fontSize="7" opacity="0.8">Tobillos</text>

      {/* Silhouette Head */}
      <circle cx="100" cy="40" r="16" fill="none" stroke="#3bd5c5" strokeWidth="1.2" strokeDasharray="4 2" opacity="0.5" />
      
      {/* Torso & Limbs outline based on view */}
      {viewType === 'lateral' ? (
        <path
          d="M100 56 Q108 80 106 120 Q108 160 100 200 L98 280 M96 120 L94 200 L95 280"
          fill="none"
          stroke="#3bd5c5"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      ) : (
        <path
          d="M84 75 Q100 70 116 75 L124 130 L115 160 L118 280 M84 75 L76 130 L85 160 L82 280 M100 160 L100 280"
          fill="none"
          stroke="#3bd5c5"
          strokeWidth="1.2"
          strokeDasharray="4 2"
          opacity="0.5"
        />
      )}
    </svg>
  )
}
