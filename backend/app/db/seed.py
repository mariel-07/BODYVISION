from app.db.session import SessionLocal, engine, Base
from app.models.entities import Profile, Measurement, Consent, MediaAsset, PoseAnalysis, Simulation, User, AuditEvent
import json

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Users
    if db.query(User).count() == 0:
        users = [
            User(email="valeria.morales@bodyvision.ai", full_name="Dra. Valeria Morales", role="Especialista", status="active"),
            User(email="admin@bodyvision.ai", full_name="Lic. Carlos Mendoza", role="Administrador", status="active"),
            User(email="auditor@bodyvision.ai", full_name="Mg. Roberto Huamán", role="Auditor", status="active"),
            User(email="ai-daemon@bodyvision.local", full_name="MediaPipe Daemon Service", role="Servicio IA", status="active"),
        ]
        db.add_all(users)
        db.commit()

    # 2. Demo Profile
    profile = db.query(Profile).filter(Profile.display_code == "BV-2026-0001").first()
    if not profile:
        profile = Profile(
            display_code="BV-2026-0001",
            display_name="Elena Rostova",
            status="active"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

        # Consent
        consent = Consent(
            profile_id=profile.id,
            purpose="Consentimiento para captura antropométrica, estimación de landmarks y análisis morfológico bajo Ley 29733 / RGPD.",
            version="v1.0",
            status="accepted"
        )
        db.add(consent)

        # Measurements
        m1 = Measurement(profile_id=profile.id, metric="Estatura", value=168.0, unit="cm", method="Estadiómetro de pared", created_by="Dra. Valeria Morales")
        m2 = Measurement(profile_id=profile.id, metric="Peso Corporal", value=62.4, unit="kg", method="Báscula bioimpedancia InBody", created_by="Dra. Valeria Morales")
        m3 = Measurement(profile_id=profile.id, metric="Perímetro Cintura", value=68.5, unit="cm", method="Cinta métrica Cescorf", created_by="Dra. Valeria Morales")
        m4 = Measurement(profile_id=profile.id, metric="Perímetro Cadera", value=94.0, unit="cm", method="Cinta métrica Cescorf", created_by="Dra. Valeria Morales")
        m5 = Measurement(profile_id=profile.id, metric="Perímetro Tórax", value=88.0, unit="cm", method="Cinta métrica Cescorf", created_by="Dra. Valeria Morales")
        m6 = Measurement(profile_id=profile.id, metric="% Grasa Corporal (Estimada)", value=21.2, unit="%", method="Bioimpedancia eléctrica", created_by="Dra. Valeria Morales")
        db.add_all([m1, m2, m3, m4, m5, m6])

        # Media Asset
        media = MediaAsset(
            profile_id=profile.id,
            storage_key=f"profiles/{profile.id}/captures/frontal_demo.jpg",
            view_type="frontal",
            mime="image/jpeg",
            checksum="9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
            status="ready"
        )
        db.add(media)
        db.commit()
        db.refresh(media)

        # Pose Analysis (33 MediaPipe Landmarks)
        sample_landmarks = [
            {"id": 0, "name": "nose", "x": 0.50, "y": 0.12, "z": -0.04, "visibility": 0.99},
            {"id": 11, "name": "left_shoulder", "x": 0.42, "y": 0.25, "z": 0.02, "visibility": 0.98},
            {"id": 12, "name": "right_shoulder", "x": 0.58, "y": 0.25, "z": 0.02, "visibility": 0.98},
            {"id": 13, "name": "left_elbow", "x": 0.36, "y": 0.38, "z": 0.04, "visibility": 0.96},
            {"id": 14, "name": "right_elbow", "x": 0.64, "y": 0.38, "z": 0.04, "visibility": 0.96},
            {"id": 15, "name": "left_wrist", "x": 0.34, "y": 0.52, "z": 0.03, "visibility": 0.94},
            {"id": 16, "name": "right_wrist", "x": 0.66, "y": 0.52, "z": 0.03, "visibility": 0.94},
            {"id": 23, "name": "left_hip", "x": 0.45, "y": 0.52, "z": 0.01, "visibility": 0.97},
            {"id": 24, "name": "right_hip", "x": 0.55, "y": 0.52, "z": 0.01, "visibility": 0.97},
            {"id": 25, "name": "left_knee", "x": 0.44, "y": 0.72, "z": 0.02, "visibility": 0.96},
            {"id": 26, "name": "right_knee", "x": 0.56, "y": 0.72, "z": 0.02, "visibility": 0.96},
            {"id": 27, "name": "left_ankle", "x": 0.43, "y": 0.90, "z": 0.01, "visibility": 0.95},
            {"id": 28, "name": "right_ankle", "x": 0.57, "y": 0.90, "z": 0.01, "visibility": 0.95}
        ]
        flags = {
            "full_body_visible": True,
            "symmetry_score": 0.975,
            "shoulder_tilt_deg": 0.8,
            "pelvis_tilt_deg": -0.4,
            "camera_distance_adequate": True
        }
        analysis = PoseAnalysis(
            media_id=media.id,
            model_version="MediaPipe Pose Landmarker v0.10.14",
            status="completed",
            confidence_score=0.985,
            landmarks_json=json.dumps(sample_landmarks),
            quality_flags=json.dumps(flags)
        )
        db.add(analysis)

        # Simulation
        sim_params = {
            "muscle_delta_kg": 1.5,
            "fat_delta_percent": -3.0,
            "posture_correction_pct": 50,
            "base_weight": 62.4,
            "projected_weight": 61.2,
            "base_waist": 68.5,
            "projected_waist": 66.2,
            "engine": "v1.2-hypo"
        }
        simulation = Simulation(
            profile_id=profile.id,
            title="Proyección de Definición 8 Semanas",
            engine_version="v1.2-hypo",
            status="completed",
            params_json=json.dumps(sim_params)
        )
        db.add(simulation)

        # Audit Log
        audit = AuditEvent(
            actor_id="Dra. Valeria Morales",
            action="SEED_DATABASE",
            resource=f"Profile:{profile.id}",
            details="Inicialización de datos de prueba demostrativos Enterprise",
            outcome="SUCCESS"
        )
        db.add(audit)
        db.commit()
        print("Seed completado exitosamente.")

    db.close()

if __name__ == "__main__":
    seed()
