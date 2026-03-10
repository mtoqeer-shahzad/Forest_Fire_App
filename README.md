# 🔥 Algerian Forest Fire Predictor

<div align="center">

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

**Predict Fire Weather Index (FWI) using Ridge Regression — FastAPI Backend + React TypeScript Frontend**

[Overview](#-overview) • [Features](#-features) • [Project Structure](#-project-structure) • [Installation](#-installation) • [API Docs](#-api-documentation) • [Deployment](#-deployment)

</div>

---

## 📌 Overview

**Algerian Forest Fire Predictor** is a full-stack Machine Learning web application that predicts the **Fire Weather Index (FWI)** based on weather and environmental conditions from the **Algerian Forest Fires Dataset**.

The system uses a **Ridge Regression** model trained on real fire data, served via a **FastAPI** REST API, and consumed by a **React TypeScript** frontend with a dark fire-themed UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 ML Model | Ridge Regression — R² Score: 0.98 |
| ⚡ FastAPI Backend | Ultra-fast REST API with auto Swagger docs |
| ⚛️ React TypeScript | Type-safe, modern frontend |
| 🎨 Dark Fire UI | Orange/red themed, fully responsive |
| 📊 FWI Risk Scale | Color-coded risk level (Very Low → Extreme) |
| 🔄 Real-time Prediction | Instant results on form submit |
| 📋 Input Summary | All values shown alongside result |
| ❌ Error Handling | API down? User-friendly error messages |
| 📄 Auto API Docs | Swagger UI at `/docs` |
| 🐳 Docker Ready | Containerized for deployment |

---

## 📁 Project Structure

```
forest-fire-predictor/
│
├── backend/
│   ├── flask_app.py            # FastAPI application
│   ├── ridge.pkl               # Trained Ridge model
│   ├── scaler.pkl              # StandardScaler
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── ForestFireApp.tsx   # Main React component
│   │   ├── App.tsx             # Root component
│   │   └── index.tsx           # Entry point
│   ├── public/
│   ├── package.json
│   └── tsconfig.json
│
├── notebooks/
│   ├── 2.0-EDA-And-FE.ipynb        # Exploratory Data Analysis
│   └── 3.0-Model-Training.ipynb    # Model training & evaluation
│
├── .gitignore
└── README.md
```

---

## ⚙️ Installation

### Prerequisites

- Python 3.10+
- Node.js 20.17+
- Git

---

### 🐍 Backend Setup

```bash
# 1. Clone the repository
git clone https://github.com/mtoqeer-shahzad/forest-fire-predictor.git
cd forest-fire-predictor/backend

# 2. Create virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# Linux / Mac
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run FastAPI server
uvicorn flask_app:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at → `http://127.0.0.1:8000`

---

### ⚛️ Frontend Setup

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install packages
npm install

# 3. Start React app
npm start
```

Frontend runs at → `http://localhost:3000`

---

## 🔑 Environment

No `.env` file needed — model files (`ridge.pkl`, `scaler.pkl`) must be in the backend folder.

> ⚠️ Never commit `.pkl` files or `.env` to GitHub

---

## 📡 API Documentation

### Base URL
```
http://127.0.0.1:8000
```

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/predict` | Predict FWI |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc UI |

---

### GET `/`
```json
{
  "status": "running",
  "model": "Ridge Regression",
  "endpoint": "/predict"
}
```

---

### POST `/predict`

**Request Body:**
```json
{
  "Temperature": 29.0,
  "RH": 57.0,
  "Ws": 18.0,
  "Rain": 0.0,
  "FFMC": 65.7,
  "DMC": 3.4,
  "ISI": 1.3,
  "Classes": 0.0,
  "Region": 1.0
}
```

**Response:**
```json
{
  "status": "success",
  "predicted_FWI": 3.75
}
```

**cURL Example:**
```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Temperature": 29.0,
    "RH": 57.0,
    "Ws": 18.0,
    "Rain": 0.0,
    "FFMC": 65.7,
    "DMC": 3.4,
    "ISI": 1.3,
    "Classes": 0.0,
    "Region": 1.0
  }'
```

---

### Input Parameters

| Parameter | Type | Range | Description |
|---|---|---|---|
| Temperature | float | 0–60 | Ambient temperature (°C) |
| RH | float | 0–100 | Relative humidity (%) |
| Ws | float | 0–60 | Wind speed (km/h) |
| Rain | float | 0–20 | Total rain (mm) |
| FFMC | float | 0–100 | Fine Fuel Moisture Code |
| DMC | float | 0–200 | Duff Moisture Code |
| ISI | float | 0–50 | Initial Spread Index |
| Classes | float | 0 or 1 | 0 = Not Fire, 1 = Fire |
| Region | float | 0 or 1 | 0 = Bejaia, 1 = Sidi-Bel |

---

## 📊 FWI Risk Scale

| FWI Value | Risk Level | Color |
|---|---|---|
| < 5 | Very Low | 🟢 Green |
| 5 – 10 | Low | 🟡 Yellow-Green |
| 10 – 20 | Moderate | 🟡 Amber |
| 20 – 30 | High | 🟠 Orange |
| 30+ | Extreme | 🔴 Red |

---

## 🧠 Model Details

| Detail | Value |
|---|---|
| Algorithm | Ridge Regression (L2 Regularization) |
| R² Score | 0.98 |
| MAE | 0.54 |
| Scaling | StandardScaler |
| Features Used | 9 (after multicollinearity check) |
| Dropped Features | BUI, DC (94% correlated) |
| Cross Validation | 5-Fold |

### Training Pipeline

```
Raw Dataset (Algerian Forest Fires)
        │
        ▼
EDA + Feature Engineering
        │
        ▼
Drop: day, month, year
        │
        ▼
Encode Classes (fire=1, not fire=0)
        │
        ▼
Multicollinearity Check (threshold=0.85)
→ Drop: BUI, DC
        │
        ▼
StandardScaler
        │
        ▼
Ridge Regression → R²=0.98 ✅
        │
        ▼
Save: ridge.pkl + scaler.pkl
```

---

## 🐳 Docker

```bash
# Build image
docker build -t forest-fire-api .

# Run container
docker run -p 8000:8000 forest-fire-api
```

**Dockerfile:**
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "flask_app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 🚀 Deployment

### GCP VM (Google Cloud)

```bash
# VM pe SSH karo
gcloud compute ssh your-vm-name

# Code clone karo
git clone https://github.com/mtoqeer-shahzad/forest-fire-predictor.git

# Docker build & run
docker build -t forest-fire-api .
docker run -d -p 8000:8000 forest-fire-api
```

---

## 📦 Requirements

**Backend (`requirements.txt`):**
```txt
fastapi
uvicorn
scikit-learn==1.2.0
numpy
pandas
pydantic
python-multipart
```

**Frontend:**
```txt
react 18+
typescript 5+
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **ML Model** | Ridge Regression (scikit-learn) |
| **Backend** | FastAPI + Uvicorn |
| **Frontend** | React 18 + TypeScript |
| **Validation** | Pydantic |
| **Containerization** | Docker |
| **Language** | Python 3.10+ / TypeScript |

---

## 👨‍💻 Author

**Muhammad Toqeer Shahzad**
Data Scientist | ML Engineer | LLM & GenAI Developer | MLOps Engineer

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=flat&logo=github&logoColor=white)](https://github.com/mtoqeer-shahzad)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0A66C2?style=flat&logo=linkedin&logoColor=white)](https://linkedin.com/in/mtoqeer-shahzad)

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
Made with ❤️ — Ridge Regression × FastAPI × React TypeScript
</div>
