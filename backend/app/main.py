from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.api.routes import health, profiles
from app import models  # registra metadatos ORM

Base.metadata.create_all(bind=engine)  # bootstrap local; usar Alembic en despliegues controlados
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
