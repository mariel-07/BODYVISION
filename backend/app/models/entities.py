from datetime import datetime, timezone
from sqlalchemy import String, DateTime, Float, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

def utcnow():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(30), default="specialist") # admin, specialist, end_user, ai_service
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

class Profile(Base):
    __tablename__ = "profiles"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    display_code: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    measurements: Mapped[list["Measurement"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    consents: Mapped[list["Consent"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    media_assets: Mapped[list["MediaAsset"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    simulations: Mapped[list["Simulation"]] = relationship(back_populates="profile", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship(back_populates="profile", cascade="all, delete-orphan")

class ProfileAccess(Base):
    __tablename__ = "profile_access"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    scope: Mapped[str] = mapped_column(String(40), default="read_write") # read_only, read_write, full

class Measurement(Base):
    __tablename__ = "measurements"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    metric: Mapped[str] = mapped_column(String(80))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20))
    method: Mapped[str] = mapped_column(String(80))
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    created_by: Mapped[str] = mapped_column(String(120), default="local-starter")
    is_correction: Mapped[bool] = mapped_column(Boolean, default=False)
    correction_reason: Mapped[str | None] = mapped_column(String(255), nullable=True)
    original_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    profile: Mapped["Profile"] = relationship(back_populates="measurements")

class Consent(Base):
    __tablename__ = "consents"
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    purpose: Mapped[str] = mapped_column(String(160))
    version: Mapped[str] = mapped_column(String(30), default="v1.0")
    status: Mapped[str] = mapped_column(String(20), default="accepted") # accepted, pending, revoked, expired
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, default=utcnow)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    profile: Mapped["Profile"] = relationship(back_populates="consents")

class MediaAsset(Base):
    __tablename__ = "media_assets"
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    storage_key: Mapped[str] = mapped_column(String(255))
    view_type: Mapped[str] = mapped_column(String(40), default="frontal") # frontal, lateral, posterior
    mime: Mapped[str] = mapped_column(String(100))
    checksum: Mapped[str] = mapped_column(String(128))
    status: Mapped[str] = mapped_column(String(20), default="ready") # uploaded, validating, ready, rejected
    retention_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    profile: Mapped["Profile"] = relationship(back_populates="media_assets")
    analyses: Mapped[list["PoseAnalysis"]] = relationship(back_populates="media_asset", cascade="all, delete-orphan")

class PoseAnalysis(Base):
    __tablename__ = "pose_analyses"
    id: Mapped[int] = mapped_column(primary_key=True)
    media_id: Mapped[int] = mapped_column(ForeignKey("media_assets.id"), index=True)
    model_version: Mapped[str] = mapped_column(String(80), default="MediaPipe Pose Landmarker v0.10.14")
    status: Mapped[str] = mapped_column(String(30), default="completed") # queued, processing, completed, needs_review
    confidence_score: Mapped[float] = mapped_column(Float, default=0.98)
    landmarks_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    quality_flags: Mapped[str | None] = mapped_column(Text, nullable=True)
    processed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    media_asset: Mapped["MediaAsset"] = relationship(back_populates="analyses")

class Simulation(Base):
    __tablename__ = "simulations"
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    title: Mapped[str] = mapped_column(String(120), default="Escenario Proyección")
    engine_version: Mapped[str] = mapped_column(String(50), default="v1.2-hypo")
    status: Mapped[str] = mapped_column(String(30), default="completed")
    params_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    profile: Mapped["Profile"] = relationship(back_populates="simulations")

class Report(Base):
    __tablename__ = "reports"
    id: Mapped[int] = mapped_column(primary_key=True)
    profile_id: Mapped[int] = mapped_column(ForeignKey("profiles.id"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    period: Mapped[str] = mapped_column(String(80))
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    source_refs: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile: Mapped["Profile"] = relationship(back_populates="reports")

class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    actor_id: Mapped[str] = mapped_column(String(80), default="operador-local")
    action: Mapped[str] = mapped_column(String(60))
    resource: Mapped[str] = mapped_column(String(120))
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    outcome: Mapped[str] = mapped_column(String(30), default="SUCCESS")
    details: Mapped[str | None] = mapped_column(String(255), nullable=True)
