import React, { useState, useEffect } from 'react'
import {
  Archive, CircleUserRound, Plus, ShieldCheck,
  CheckCircle2, XCircle, Search, Filter, Calendar, FileCheck, ArrowRight
} from 'lucide-react'
import { api, Profile, Consent } from '../../services/api'

interface ProfilesViewProps {
  profiles: Profile[]
  initialProfileId?: number | null
  onRefresh: () => void
  onNavigate: (section: string, profileId?: number) => void
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({ profiles, initialProfileId, onRefresh, onNavigate }) => {
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    initialProfileId || (profiles.length > 0 ? profiles[0].id : null)
  )
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [consents, setConsents] = useState<Consent[]>([])
  const [loadingConsent, setLoadingConsent] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  // Sincronizar selección cuando cambia initialProfileId o cargan los expedientes
  useEffect(() => {
    if (initialProfileId) {
      setSelectedProfileId(initialProfileId)
    } else if (!selectedProfileId && profiles.length > 0) {
      setSelectedProfileId(profiles[0].id)
    }
  }, [initialProfileId, profiles, selectedProfileId])

  // Load consents for selected profile
  useEffect(() => {
    if (selectedProfileId) {
      setLoadingConsent(true)
      api.consents(selectedProfileId)
        .then(setConsents)
        .catch(() => setConsents([]))
        .finally(() => setLoadingConsent(false))
    } else {
      setConsents([])
    }
  }, [selectedProfileId])

  const selectedProfile = profiles.find(p => p.id === selectedProfileId)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    try {
      const created = await api.createProfile({ display_code: code, display_name: name })
      setCode('')
      setName('')
      setNotice(`Expediente ${created.display_code} registrado exitosamente.`)
      onRefresh()
      setSelectedProfileId(created.id)
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleSignConsent() {
    if (!selectedProfileId) return
    setError('')
    setNotice('')
    try {
      await api.signConsent(selectedProfileId, {
        purpose: 'Consentimiento para registro antropométrico, captura de imágenes y procesamiento de landmarks bajo Ley 29733 / RGPD.',
        version: 'v1.1'
      })
      setNotice('Nuevo consentimiento firmado y registrado en auditoría.')
      const updated = await api.consents(selectedProfileId)
      setConsents(updated)
      onRefresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  async function handleRevokeConsent(consentId: number) {
    if (!selectedProfileId) return
    if (!confirm('¿Confirma que desea revocar el consentimiento? Esto bloqueará el procesamiento de nuevas imágenes.')) return
    setError('')
    setNotice('')
    try {
      await api.revokeConsent(selectedProfileId, consentId)
      setNotice('Consentimiento revocado. El procesamiento queda inhabilitado.')
      const updated = await api.consents(selectedProfileId)
      setConsents(updated)
      onRefresh()
    } catch (err) {
      setError((err as Error).message)
    }
  }

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = p.display_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.display_code.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeConsent = consents.find(c => c.status === 'accepted')

  return (
    <div className="profiles-view">
      {notice && <div className="alert success">{notice}</div>}
      {error && <div className="alert error">{error}</div>}

      <div className="grid-two">
        {/* Left Column: Management & List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Create Profile Form */}
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Nuevo Expediente</h3>
                <p>Apertura de registro único con asignación de código</p>
              </div>
            </div>
            <form onSubmit={handleCreate} className="form">
              <label>
                Código Identificador (ID Clínico / Antropométrico)
                <input
                  required
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ej: BV-2026-0042"
                />
              </label>
              <label>
                Nombre del Titular o Seudónimo
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej: Mateo Valenzuela"
                />
              </label>
              <button className="primary" type="submit">
                <Plus size={16} /> Crear Expediente
              </button>
            </form>
          </section>

          {/* List and Search */}
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Directorio de Expedientes</h3>
                <p>{filteredProfiles.length} de {profiles.length} expedientes encontrados</p>
              </div>
            </div>

            {/* Filter controls */}
            <div className="search-bar">
              <div className="search-input-wrap">
                <Search size={15} />
                <input
                  placeholder="Buscar por código o nombre..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="archived">Archivados</option>
                <option value="restricted">Restringidos</option>
              </select>
            </div>

            {filteredProfiles.length === 0 ? (
              <div className="empty">No se encontraron expedientes con los criterios seleccionados.</div>
            ) : (
              <div className="profile-list-scroll">
                {filteredProfiles.map(p => {
                  const isSelected = p.id === selectedProfileId
                  return (
                    <div
                      key={p.id}
                      className={`profile-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedProfileId(p.id)}
                    >
                      <div className="avatar">
                        <CircleUserRound size={20} />
                      </div>
                      <div className="profile-meta">
                        <b>{p.display_name}</b>
                        <span>{p.display_code} · Creado el {new Date(p.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-pill ${p.status}`}>{p.status}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Profile Sheet & Consents */}
        <div>
          {selectedProfile ? (
            <section className="panel ficha-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow light">FICHA TÉCNICA DEL EXPEDIENTE</span>
                  <h3 style={{ fontSize: '18px', marginTop: '4px' }}>{selectedProfile.display_name}</h3>
                  <p>Código Oficial: <strong>{selectedProfile.display_code}</strong> · Ref #{selectedProfile.id}</p>
                </div>
                <span className={`status-pill ${selectedProfile.status}`}>
                  {selectedProfile.status.toUpperCase()}
                </span>
              </div>

              {/* Fast Action Shortcuts */}
              <div className="ficha-actions">
                <button
                  className="quick-action-btn"
                  onClick={() => onNavigate('Mediciones', selectedProfile.id)}
                >
                  <Plus size={15} /> Nueva Medición
                </button>
                <button
                  className="quick-action-btn"
                  onClick={() => onNavigate('Captura', selectedProfile.id)}
                >
                  <FileCheck size={15} /> Capturar Imagen
                </button>
                <button
                  className="quick-action-btn"
                  onClick={() => onNavigate('Visor 3D', selectedProfile.id)}
                >
                  <ArrowRight size={15} /> Visor 3D
                </button>
              </div>

              {/* Consent Management (Fase 3 Requirement) */}
              <div className="consent-box" style={{ marginTop: '20px' }}>
                <div className="consent-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShieldCheck size={20} color={activeConsent ? '#38d39f' : '#e65c5c'} />
                    <div>
                      <h4 style={{ margin: 0 }}>Consentimiento Informado (Ley 29733 / RGPD)</h4>
                      <span style={{ fontSize: '10px', color: '#7e94ac' }}>
                        Requisito de legalidad previo al procesamiento de imágenes corporales
                      </span>
                    </div>
                  </div>
                  {activeConsent ? (
                    <span className="badge-consent-ok">
                      <CheckCircle2 size={13} /> VIGENTE ({activeConsent.version})
                    </span>
                  ) : (
                    <span className="badge-consent-bad">
                      <XCircle size={13} /> SIN CONSENTIMIENTO ACTIVO
                    </span>
                  )}
                </div>

                <div className="consent-body">
                  <p>
                    {activeConsent
                      ? activeConsent.purpose
                      : 'El expediente actual no cuenta con un consentimiento informado activo. Las funciones de carga de imágenes y procesamiento de pose IA se encuentran bloqueadas por seguridad.'}
                  </p>
                  <div className="consent-meta">
                    {activeConsent && activeConsent.accepted_at && (
                      <span>Aceptado el: {new Date(activeConsent.accepted_at).toLocaleString()}</span>
                    )}
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                      {activeConsent ? (
                        <button
                          className="btn-revoke"
                          onClick={() => handleRevokeConsent(activeConsent.id)}
                        >
                          Revocar Consentimiento
                        </button>
                      ) : (
                        <button className="primary" onClick={handleSignConsent}>
                          <CheckCircle2 size={14} /> Registrar Aceptación Formal
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expediente Overview Grid */}
              <div className="ficha-grid" style={{ marginTop: '20px' }}>
                <div className="ficha-card">
                  <span>Fecha de Apertura</span>
                  <b>{new Date(selectedProfile.created_at).toLocaleDateString()}</b>
                </div>
                <div className="ficha-card">
                  <span>Nivel de Acceso</span>
                  <b>Especialista Autorizado</b>
                </div>
                <div className="ficha-card">
                  <span>Retención de Datos</span>
                  <b>5 años (Estándar Clínico)</b>
                </div>
                <div className="ficha-card">
                  <span>Cifrado de Almacenamiento</span>
                  <b>AES-256 Activo</b>
                </div>
              </div>
            </section>
          ) : (
            <div className="panel empty" style={{ minHeight: '350px', display: 'grid', placeItems: 'center' }}>
              <p>Selecciona un expediente de la lista para ver su ficha técnica.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
