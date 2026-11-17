# Decisiones técnicas iniciales

1. Monorepo para versionar frontend, backend, infraestructura y documentación coordinadamente.
2. React + TypeScript + Vite para la aplicación web.
3. FastAPI como única puerta de acceso a datos y servicios.
4. PostgreSQL como base de datos de despliegue; SQLite puede utilizarse solo en desarrollo local.
5. SQLAlchemy para ORM; Alembic será obligatorio para migraciones controladas antes de producción.
6. Maya produce activos 3D; el navegador renderiza GLB/GLTF mediante Three.js/R3F.
7. MediaPipe Pose Landmarker estima landmarks; no se presentará como medición clínica.
8. Los escenarios simulados se almacenarán separados de mediciones observadas.
