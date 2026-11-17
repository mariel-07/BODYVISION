# BODYVISION AI — Starter Enterprise v3.0

Starter técnico basado en `BODYVISION_AI_Arquitectura_Modelos_Funcionales_y_Fases_v3.pdf`.

## Estado y límites
Este repositorio implementa la fundación ejecutable: frontend React/TypeScript, API FastAPI, persistencia SQLAlchemy, CRUD inicial de expedientes y mediciones, Docker Compose y documentación. **No es un producto listo para producción.** Autenticación/autorización real, aislamiento multiusuario, carga privada endurecida, worker MediaPipe, modelo GLB licenciado, simulador validado y reportes productivos quedan como fases pendientes explícitas. No usar fotografías ni datos personales reales hasta completar seguridad y consentimiento.

El sistema no diagnostica ni sustituye a profesionales sanitarios. Los landmarks de pose son estimaciones visuales, no medidas clínicas.

## Requisitos
- Docker Desktop con Docker Compose, o Node.js 20+ y Python 3.11+.
- Para ejecución local sin Docker se puede usar SQLite cambiando `DATABASE_URL`.

## Inicio con Docker
1. Copiar `.env.example` a `.env` y cambiar la contraseña.
2. Ejecutar `docker compose up --build`.
3. Frontend: http://localhost:5173
4. API: http://localhost:8000
5. Swagger: http://localhost:8000/docs
6. Health: http://localhost:8000/api/health

## Inicio manual
Backend:
```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Frontend:
```bash
cd frontend
npm install
npm run dev
```

## API inicial
- `GET /api/health`
- `POST /api/profiles`
- `GET /api/profiles`
- `GET /api/profiles/{profile_id}`
- `POST /api/profiles/{profile_id}/measurements`
- `GET /api/profiles/{profile_id}/measurements`

Las rutas CRUD iniciales todavía no incorporan autenticación ni aislamiento por usuario, tal como advierte el documento técnico.

## Próximo orden de trabajo
1. Fase 2: completar expedientes, catálogo de métricas, historial y correcciones no destructivas.
2. Fase 3: identidad, RBAC, consentimiento, sesiones, rate limiting y auditoría.
3. Fase 4: carga segura, validación real de contenido, almacenamiento privado y retención.
4. Fase 5: MediaPipe Pose Landmarker, cola asíncrona, versionado y revisión.
5. Fase 6: adquirir/producir y verificar licencia del activo 3D GLB.
6. Fases 7–9: analítica, simulación, reportes y preparación de producción.

Consulta `docs/` antes de ampliar funcionalidades.
