from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict



BASE_DIR = Path(__file__).resolve().parent.parent.parent





class Settings(BaseSettings):

  database_url: str



  cors_origins: str = "http://localhost:5173"



  upload_dir: str = "./uploads"



  max_upload_mb: int = 10



  pose_model_path: str = "./models/pose_landmarker_full.task"



  model_config = SettingsConfigDict(

    env_file=".env",

    extra="ignore"

  )





settings = Settings()
