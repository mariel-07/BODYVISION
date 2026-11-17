class PoseService:
    """Punto de integración pendiente para MediaPipe Pose Landmarker.

    No genera landmarks ficticios. La fase 5 debe cargar el modelo .task,
    validar consentimiento, ejecutar en worker y guardar versión/flags.
    """
    def process(self, image_path: str):
        raise NotImplementedError("Integración MediaPipe pendiente (Fase 5)")
