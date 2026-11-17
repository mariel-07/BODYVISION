const getBaseApi = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  // Usa ruta relativa para aprovechar el proxy de Vite en el mismo host/puerto (sin problemas de CORS ni IP)
  if (typeof window !== 'undefined') return ''
  return 'http://localhost:8000'
}
const API = getBaseApi()

export interface Profile {
  id: number
  display_code: string
  display_name: string
  status: string
  created_at: string
}

export interface Measurement {
  id: number
  profile_id: number
  metric: string
  value: number
  unit: string
  method: string
  measured_at: string
  created_by: string
  is_correction?: boolean
  correction_reason?: string
  original_id?: number
}

export interface Consent {
  id: number
  profile_id: number
  purpose: string
  version: string
  status: 'accepted' | 'pending' | 'revoked' | 'expired'
  accepted_at: string | null
  revoked_at: string | null
}

export interface MediaAsset {
  id: number
  profile_id: number
  storage_key: string
  view_type: 'frontal' | 'lateral' | 'posterior'
  mime: string
  checksum: string
  status: 'uploaded' | 'validating' | 'ready' | 'rejected'
  uploaded_at: string
}

export interface LandmarkPoint {
  id: number
  name: string
  x: number
  y: number
  z: number
  visibility: number
}

export interface PoseAnalysis {
  id: number
  media_id: number
  model_version: string
  status: string
  confidence_score: number
  landmarks_json: string | null
  quality_flags: string | null
  processed_at: string
}

export interface Simulation {
  id: number
  profile_id: number
  title: string
  engine_version: string
  status: string
  params_json: string
  created_at: string
}

export interface Report {
  id: number
  profile_id: number
  title: string
  period: string
  generated_at: string
  source_refs: string | null
  summary_json: string | null
}

export interface User {
  id: number
  email: string
  full_name: string
  role: string
  status: string
  created_at: string
}

export interface AuditEvent {
  id: number
  actor_id: string
  action: string
  resource: string
  timestamp: string
  outcome: string
  details: string | null
}

export interface MetricItem {
  metric: string
  unit: string
  defaultMethod: string
  min: number
  max: number
  category: string
}

export interface DashboardStats {
  profiles_count: number
  measurements_count: number
  media_count: number
  analyses_count: number
  simulations_count: number
  consents_active: number
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.detail || `Error HTTP ${response.status}`)
  }
  return response.json()
}

export const api = {
  // Profiles
  profiles: () => request<Profile[]>('/profiles'),
  getProfile: (id: number) => request<Profile>(`/profiles/${id}`),
  createProfile: (data: { display_code: string; display_name: string }) =>
    request<Profile>('/profiles', { method: 'POST', body: JSON.stringify(data) }),

  // Stats & Catalog
  stats: () => request<DashboardStats>('/dashboard/stats'),
  metricsCatalog: () => request<MetricItem[]>('/catalog/metrics'),

  // Measurements
  measurements: (profileId: number) => request<Measurement[]>(`/profiles/${profileId}/measurements`),
  createMeasurement: (profileId: number, data: {
    metric: string
    value: number
    unit: string
    method: string
    is_correction?: boolean
    correction_reason?: string
    original_id?: number
  }) => request<Measurement>(`/profiles/${profileId}/measurements`, { method: 'POST', body: JSON.stringify(data) }),

  // Consents
  consents: (profileId: number) => request<Consent[]>(`/profiles/${profileId}/consents`),
  signConsent: (profileId: number, data?: { purpose?: string; version?: string }) =>
    request<Consent>(`/profiles/${profileId}/consents`, { method: 'POST', body: JSON.stringify(data || {}) }),
  revokeConsent: (profileId: number, consentId: number) =>
    request<Consent>(`/profiles/${profileId}/consents/${consentId}/revoke`, { method: 'POST' }),

  // Media
  media: (profileId: number) => request<MediaAsset[]>(`/profiles/${profileId}/media`),
  registerMedia: (profileId: number, data: {
    storage_key: string
    view_type: string
    mime: string
    checksum: string
  }) => request<MediaAsset>(`/profiles/${profileId}/media`, { method: 'POST', body: JSON.stringify(data) }),

  // Pose Analyses
  analyses: (profileId: number) => request<PoseAnalysis[]>(`/profiles/${profileId}/analyses`),
  createPoseAnalysis: (data: {
    media_id: number
    landmarks_json?: string
    quality_flags?: string
    confidence_score?: number
  }) => request<PoseAnalysis>('/analyses/pose', { method: 'POST', body: JSON.stringify(data) }),

  // Simulations
  simulations: (profileId: number) => request<Simulation[]>(`/profiles/${profileId}/simulations`),
  createSimulation: (profileId: number, data: { title: string; params_json: string }) =>
    request<Simulation>(`/profiles/${profileId}/simulations`, { method: 'POST', body: JSON.stringify(data) }),

  // Reports
  reports: (profileId: number) => request<Report[]>(`/profiles/${profileId}/reports`),
  createReport: (profileId: number, data: { title: string; period: string; source_refs?: string; summary_json?: string }) =>
    request<Report>(`/profiles/${profileId}/reports`, { method: 'POST', body: JSON.stringify(data) }),

  // Admin & Audit
  users: () => request<User[]>('/admin/users'),
  auditLogs: () => request<AuditEvent[]>('/admin/audit-logs'),
}
