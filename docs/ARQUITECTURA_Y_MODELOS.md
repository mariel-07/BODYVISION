# Arquitectura y modelos

## Flujo por capas
Navegador React → API FastAPI → servicios de negocio → SQLAlchemy/PostgreSQL y almacenamiento privado. El frontend nunca debe conectarse directamente a PostgreSQL ni a los archivos privados.

## Entidades previstas
- User, Role, Permission, ProfileAccess
- Profile, Consent, Measurement, MediaAsset
- PoseAnalysis, BodyModel, Simulation, Report, AuditEvent

En el starter están declaradas Profile, Measurement, Consent, MediaAsset y PoseAnalysis. Las restantes y sus relaciones de autorización deben completarse junto con RBAC.

## Secuencia de análisis objetivo
1. Operador selecciona expediente y archivo.
2. API valida identidad, permisos y consentimiento.
3. Archivo se valida y almacena en privado.
4. Se crea tarea pendiente con identificador.
5. Worker ejecuta Pose Landmarker.
6. Se persisten resultado, versión del modelo y flags de calidad.
7. UI consulta estado y presenta estimación con limitaciones.

Esta secuencia no está habilitada aún: captura y procesamiento IA son fases pendientes.
