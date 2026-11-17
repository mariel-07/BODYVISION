# Plan de implementación por fases

| Fase | Alcance | Estado de este ZIP |
|---|---|---|
| 0 Descubrimiento | Personas, alcance, riesgos, licencias y criterios | Documentado como base |
| 1 Fundación técnica | Monorepo, Docker, PostgreSQL, FastAPI, React, configuración | Starter implementado; validar en equipo |
| 2 Expedientes y mediciones | CRUD, unidades, historial, correcciones no destructivas | CRUD básico inicial |
| 3 Seguridad e identidad | Login, RBAC, aislamiento, consentimiento, sesiones, auditoría | Pendiente |
| 4 Captura segura | Validación de contenido, EXIF, storage privado, retención | Pendiente |
| 5 IA de pose | MediaPipe, modelo .task, worker, landmarks y flags | Pendiente |
| 6 Visor 3D | Activo con licencia, GLB, R3F, capas, LOD | Pendiente |
| 7 Analítica y reportes | Series, comparación, valores atípicos, exportación | Pendiente |
| 8 Simulación | Parámetros, versionado, comparador y disclaimer | Pendiente |
| 9 Producción | CI/CD, secretos, TLS, observabilidad, backups y soporte | Pendiente |

No se debe pasar a datos reales hasta cerrar seguridad y consentimiento. Cada fase requiere pruebas y aceptación.
