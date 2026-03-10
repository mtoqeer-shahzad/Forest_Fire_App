from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pickle
import uvicorn

app = FastAPI(
    title="Algerian Forest Fire API",
    description="Ridge Regression model — FWI Prediction",
    version="1.0"
)


## Add Middle Ware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models load karo ──────────────────────────────────
ridge_model   = pickle.load(open("ridge.pkl",  "rb"))
scaler_pickle = pickle.load(open("scaler.pkl", "rb"))


# ── Input Schema (Pydantic) ───────────────────────────
class FireData(BaseModel):
    Temperature: float
    RH:          float
    Ws:          float
    Rain:        float
    FFMC:        float
    DMC:         float
    ISI:         float
    Classes:     float
    Region:      float


# ── Health Check ──────────────────────────────────────
@app.get("/")
def health_check():
    return {
        "status":   "running",
        "model":    "Ridge Regression",
        "endpoint": "/predict"
    }


# ── Prediction ────────────────────────────────────────
@app.post("/predict")
def predict(data: FireData):
    try:
        features = [[
            data.Temperature,
            data.RH,
            data.Ws,
            data.Rain,
            data.FFMC,
            data.DMC,
            data.ISI,
            data.Classes,
            data.Region
        ]]

        # Scale → Predict
        scaled = scaler_pickle.transform(features)
        result = ridge_model.predict(scaled)

        return {
            "status":        "success",
            "predicted_FWI": round(float(result[0]), 2)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ✅ Fix: application → flask_app
if __name__ == "__main__":
    uvicorn.run("flask_app:app", host="0.0.0.0",
                port=8000, reload=True)