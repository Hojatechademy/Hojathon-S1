from fastapi import FastAPI

app = FastAPI(
    title="Kisan Mitra",
    description="AI Agent for Agriculture & Local Economy",
    version="0.1.0",
)


@app.get("/")
def root():
    return {
        "project": "Kisan Mitra",
        "status": "running",
        "message": "AI Agent backend is online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
