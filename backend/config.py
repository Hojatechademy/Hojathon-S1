import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("eduro-backend")

# Default GCP settings
DEFAULT_PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCP_PROJECT") or "qr-ai-502319"
DEFAULT_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION") or os.environ.get("GCP_LOCATION") or "global"
DEFAULT_MODEL = os.environ.get("GEMINI_MODEL") or "gemini-3.7-flash"

class Config:
    PROJECT_ID = DEFAULT_PROJECT_ID
    LOCATION = DEFAULT_LOCATION
    MODEL_NAME = DEFAULT_MODEL
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
    PDFS_DIR = os.path.join(DATA_DIR, "pdfs")
    STUDENT_FILE = os.path.join(DATA_DIR, "student_profile.json")
    SUBJECTS_FILE = os.path.join(DATA_DIR, "subjects.json")

def check_adc_credentials():
    """
    Checks if Google Cloud Application Default Credentials (ADC) are valid and available.
    Returns: (is_available: bool, project_id: str or None, message: str)
    """
    try:
        import google.auth
        credentials, project = google.auth.default()
        resolved_project = project or Config.PROJECT_ID
        logger.info(f"GCP ADC found! Project: {resolved_project}, Credentials type: {type(credentials).__name__}")
        return True, resolved_project, f"ADC active (Project: {resolved_project})"
    except Exception as e:
        logger.warning(f"GCP ADC not configured yet: {e}")
        return False, None, f"ADC not active ({str(e)}). Run 'gcloud auth application-default login'"
