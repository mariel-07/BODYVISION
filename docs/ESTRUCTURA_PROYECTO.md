# Estructura del repositorio

- `frontend/`: aplicación React + TypeScript + Vite.
  - `src/app/`: composición y navegación.
  - `src/services/`: cliente HTTP.
  - `src/features/`: reservado para separar módulos por dominio.
  - `public/models/`: activos GLB/GLTF autorizados.
- `backend/app/api/routes/`: contratos HTTP.
- `backend/app/core/`: configuración.
- `backend/app/db/`: conexión y sesión.
- `backend/app/models/`: entidades SQLAlchemy.
- `backend/app/services/`: reglas e integraciones.
- `backend/tests/`: pruebas automatizadas.
- `infra/`: despliegue y operación.
- `docs/`: arquitectura, fases, seguridad y QA.

La interfaz actual mantiene los módulos visibles y señala como pendientes aquellos que requieren seguridad, modelos o activos reales.
