from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Profiles ---
class ProfileCreate(BaseModel):
    display_code: str = Field(min_length=2, max_length=40)
    display_name: str = Field(min_length=2, max_length=120)

class ProfileRead(BaseModel):
    id: int
    display_code: str
    display_name: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Measurements ---
class MeasurementCreate(BaseModel):
    metric: str = Field(min_length=1, max_length=80)
    value: float
    unit: str = Field(min_length=1, max_length=20)
    method: str = Field(min_length=1, max_length=80)
    measured_at: datetime | None = None
    is_correction: bool = False
    correction_reason: str | None = None
    original_id: int | None = None

class MeasurementRead(BaseModel):
    id: int
    profile_id: int
    metric: str
    value: float
    unit: str
    method: str
    measured_at: datetime
    created_by: str
    is_correction: bool = False
    correction_reason: str | None = None
    original_id: int | None = None
    model_config = ConfigDict(from_attributes=True)

# --- Consents ---
class ConsentCreate(BaseModel):
    purpose: str = Field(default="Captura fotográfica y estimación visual de landmarks corporales bajo Ley 29733 / RGPD.")
    version: str = Field(default="v1.0")

class ConsentRead(BaseModel):
    id: int
    profile_id: int
    purpose: str
    version: str
    status: str
    accepted_at: datetime | None
    revoked_at: datetime | None
    model_config = ConfigDict(from_attributes=True)

# --- MediaAssets ---
class MediaAssetCreate(BaseModel):
    storage_key: str
    view_type: str = "frontal"
    mime: str = "image/jpeg"
    checksum: str

class MediaAssetRead(BaseModel):
    id: int
    profile_id: int
    storage_key: str
    view_type: str
    mime: str
    checksum: str
    status: str
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Pose Analyses ---
class PoseAnalysisCreate(BaseModel):
    media_id: int
    model_version: str = "MediaPipe Pose Landmarker v0.10.14"
    landmarks_json: str | None = None
    quality_flags: str | None = None
    confidence_score: float = 0.98

class PoseAnalysisRead(BaseModel):
    id: int
    media_id: int
    model_version: str
    status: str
    confidence_score: float
    landmarks_json: str | None
    quality_flags: str | None
    processed_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Simulations ---
class SimulationCreate(BaseModel):
    title: str = "Escenario Hipotético"
    params_json: str
    engine_version: str = "v1.2-hypo"

class SimulationRead(BaseModel):
    id: int
    profile_id: int
    title: str
    engine_version: str
    status: str
    params_json: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Reports ---
class ReportCreate(BaseModel):
    title: str
    period: str
    source_refs: str | None = None
    summary_json: str | None = None

class ReportRead(BaseModel):
    id: int
    profile_id: int
    title: str
    period: str
    generated_at: datetime
    source_refs: str | None
    summary_json: str | None
    model_config = ConfigDict(from_attributes=True)

# --- Audit & Users ---
class AuditEventRead(BaseModel):
    id: int
    actor_id: str
    action: str
    resource: str
    timestamp: datetime
    outcome: str
    details: str | None
    model_config = ConfigDict(from_attributes=True)

class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    status: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    profiles_count: int
    measurements_count: int
    media_count: int
    analyses_count: int
    simulations_count: int
    consents_active: int
