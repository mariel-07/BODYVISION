import React, { useState, useEffect } from 'react'
import {
  Settings, ShieldCheck, Users, Lock, FileSearch,
  CheckCircle2, AlertOctagon, RefreshCw, Key, Download, Database
} from 'lucide-react'
import { api, User, AuditEvent } from '../../services/api'

export const AdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([])
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'policies'>('users')
  const [retentionYears, setRetentionYears] = useState(5)
  const [exifStripping, setExifStripping] = useState(true)
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.users().catch(() => []),
      api.auditLogs().catch(() => [])
    ]).then(([u, a]) => {
      setUsers(u)
      setAuditLogs(a)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  function handleExportAudit() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute("href", dataStr)
    downloadAnchor.setAttribute("download", `audit_log_export_${Date.now()}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    setNotice('Historial de auditoría exportado para custodia legal.')
  }

  return (
    <div className="admin-view">
      {notice && <div className="alert success">{notice}</div>}

      {/* Top Security Posture Bar */}
      <div className="security-posture-banner">
        <div className="posture-item">
          <ShieldCheck size={20} color="#38d39f" />
          <div>
            <b>Cifrado en Reposo</b>
            <span>AES-256 GCM Activo</span>
          </div>
        </div>
        <div className="posture-item">
          <Lock size={20} color="#38d39f" />
          <div>
            <b>Aislamiento RBAC</b>
            <span>4 Roles Granulares</span>
          </div>
        </div>
        <div className="posture-item">
          <Key size={20} color="#38d39f" />
          <div>
            <b>Trazabilidad Legal</b>
            <span>Ley 29733 (Perú) / RGPD</span>
          </div>
        </div>
        <div className="posture-item">
          <Database size={20} color="#38d39f" />
          <div>
            <b>Bóveda de Medios</b>
            <span>Checksums SHA-256</span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-nav-tabs" style={{ marginTop: '16px' }}>
        <button
          className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Usuarios y Roles RBAC ({users.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <FileSearch size={16} /> Registro de Auditoría ({auditLogs.length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'policies' ? 'active' : ''}`}
          onClick={() => setActiveTab('policies')}
        >
          <Settings size={16} /> Políticas de Retención y Privacidad
        </button>
        <button className="btn-icon-subtle" style={{ marginLeft: 'auto' }} onClick={loadData} title="Refrescar datos">
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
        </button>
      </div>

      {/* TAB 1: USERS & ROLES */}
      {activeTab === 'users' && (
        <section className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-title">
            <div>
              <h3>Matriz de Usuarios y Control de Acceso (RBAC)</h3>
              <p>Asignación de privilegios según responsabilidad funcional</p>
            </div>
            <span className="badge-live">POLÍTICAS ACTIVAS</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Correo Electrónico</th>
                  <th>Rol Asignado</th>
                  <th>Ámbito de Acceso</th>
                  <th>Estado</th>
                  <th>Alta en Sistema</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td><b>{u.full_name}</b></td>
                    <td><code>{u.email}</code></td>
                    <td>
                      <span className={`role-pill ${u.role.toLowerCase().replace(' ', '-')}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      {u.role === 'Administrador' && 'Acceso total y configuración'}
                      {u.role === 'Especialista' && 'Expedientes autorizados y análisis'}
                      {u.role === 'Auditor' && 'Lectura de logs e informes'}
                      {u.role === 'Servicio IA' && 'Procesamiento asíncrono sin interfaz'}
                    </td>
                    <td><span className="badge-ok">Activo</span></td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <section className="panel" style={{ marginTop: '16px' }}>
          <div className="panel-title">
            <div>
              <h3>Eventos de Auditoría de Seguridad (AuditEvent)</h3>
              <p>Registro inmutable de acciones, recursos afectados y resultados</p>
            </div>
            <button className="primary" onClick={handleExportAudit}>
              <Download size={14} /> Exportar Log Legal (JSON)
            </button>
          </div>

          {auditLogs.length === 0 ? (
            <div className="empty">No se registran eventos de auditoría todavía.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Operador / Actor</th>
                    <th>Acción</th>
                    <th>Recurso</th>
                    <th>Resultado</th>
                    <th>Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(evt => (
                    <tr key={evt.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {new Date(evt.timestamp).toLocaleString()}
                      </td>
                      <td><code>{evt.actor_id}</code></td>
                      <td><b>{evt.action}</b></td>
                      <td><code>{evt.resource}</code></td>
                      <td>
                        <span className={evt.outcome === 'SUCCESS' ? 'badge-ok' : 'badge-danger'}>
                          {evt.outcome}
                        </span>
                      </td>
                      <td>
                        <small style={{ color: '#8aa3bd' }}>{evt.details || '—'}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: PRIVACY POLICIES */}
      {activeTab === 'policies' && (
        <div className="grid-two" style={{ marginTop: '16px' }}>
          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Retención y Depuración de Datos</h3>
                <p>Cumplimiento de plazos de custodia según Ley 29733</p>
              </div>
            </div>

            <div className="form">
              <label>
                Periodo de Retención Obligatoria: <b>{retentionYears} Años</b>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={retentionYears}
                  onChange={e => setRetentionYears(parseInt(e.target.value))}
                />
              </label>
              <p style={{ fontSize: '11px', color: '#7a91aa' }}>
                Tras cumplirse el periodo legal, los expedientes pasarán al estado <code>restricted</code> y los archivos de imagen serán programados para destrucción segura criptográfica.
              </p>

              <div className="checklist-group" style={{ marginTop: '8px' }}>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={exifStripping}
                    onChange={e => setExifStripping(e.target.checked)}
                  />
                  <div>
                    <b>Despojo Obligatorio de Metadatos EXIF</b>
                    <span>Elimina geolocalización GPS, número de serie de cámara y fecha interna del dispositivo.</span>
                  </div>
                </label>
              </div>

              <button className="primary" onClick={() => setNotice('Políticas de retención y privacidad actualizadas.')}>
                Guardar Políticas de Privacidad
              </button>
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <div>
                <h3>Gestión de Derechos ARCO</h3>
                <p>Acceso, Rectificación, Cancelación y Oposición</p>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: '#9bb0c5', lineHeight: 1.6 }}>
              Todo titular de un expediente registrado en BODYVISION AI puede ejercer sus derechos de protección de datos personales. Las solicitudes de revocación de consentimiento detienen inmediatamente cualquier procesamiento algorítmico posterior.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
              <button className="quick-action-btn" onClick={() => setNotice('Simulación: Solicitud de portabilidad de datos generada.')}>
                Emitir Paquete de Portabilidad de Datos (JSON)
              </button>
              <button className="quick-action-btn" onClick={() => setNotice('Simulación: Bloqueo de expediente por oposición registrado en auditoría.')}>
                Registrar Solicitud de Oposición o Cancelación
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
