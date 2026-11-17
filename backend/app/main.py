from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.config import settings
from app.db.session import Base, engine
from app.api.routes import health, profiles
from app import models  # registra metadatos ORM
from app.db.seed import seed

Base.metadata.create_all(bind=engine)  # bootstrap local; usar Alembic en despliegues controlados

# Asegurar columnas en bases de datos existentes
try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE measurements ADD COLUMN IF NOT EXISTS is_correction BOOLEAN DEFAULT FALSE;"))
        conn.execute(text("ALTER TABLE measurements ADD COLUMN IF NOT EXISTS correction_reason VARCHAR(255);"))
        conn.execute(text("ALTER TABLE measurements ADD COLUMN IF NOT EXISTS original_id INTEGER;"))
        conn.execute(text("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS view_type VARCHAR(40) DEFAULT 'frontal';"))
        conn.execute(text("ALTER TABLE media_assets ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
        conn.execute(text("ALTER TABLE pose_analyses ADD COLUMN IF NOT EXISTS confidence_score FLOAT DEFAULT 0.98;"))
        conn.execute(text("ALTER TABLE pose_analyses ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();"))
except Exception as e:
    print(f"Migration note: {e}")

try:
    seed()
except Exception as e:
    print(f"Seed note: {e}")
app = FastAPI(title="BODYVISION AI API", version="0.3.0", description="Starter API; revisar límites de seguridad antes de producción.")
origins = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
app.include_router(health.router, prefix="/api")
app.include_router(profiles.router, prefix="/api")

@app.get("/")
def root():
    return {"name": "BODYVISION AI", "docs": "/docs", "notice": "Starter no certificado para producción"}
