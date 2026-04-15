# 🦴 OsteoAI — Knee Osteoarthritis Severity Predictor

![Python](https://img.shields.io/badge/Python-3.9+-blue?style=flat-square&logo=python)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-ee4c2c?style=flat-square&logo=pytorch)
![Flask](https://img.shields.io/badge/Flask-2.x-black?style=flat-square&logo=flask)
![License](https://img.shields.io/badge/License-Research%20Only-red?style=flat-square)

> AI-powered web application for knee osteoarthritis severity assessment from X-ray images using deep learning.

---

## 📌 Overview

**OsteoAI** is a multitask deep learning web application that analyzes knee X-ray images and predicts multiple clinically relevant outcomes in a single forward pass:

- 🦴 **KL Grade (0–4)** — Kellgren-Lawrence osteoarthritis severity classification
- 📉 **JSN Severity** — Joint space narrowing (None / Mild-Moderate / Definite / Severe)
- 📊 **KOOS Pain Score (0–100)** — Patient-reported pain estimation from imaging
- 🔥 **Grad-CAM Heatmaps** — Visual explanation of model decisions for all 3 tasks

---

## ✨ Key Features

- 🤖 **Multitask prediction** — classification + regression in one model
- 🧠 **State-of-the-art backbone** — ConvNeXt-Small pretrained on ImageNet-22K
- 🔍 **Explainable AI** — Grad-CAM heatmaps for KL, JSN, and KOOS tasks
- ⚡ **Test-Time Augmentation** — 5-run TTA for robust, stable predictions
- 🌗 **Dark mode support** — clean medical-style UI with light/dark toggle
- 💊 **Clinical recommendations** — personalized advice based on KL grade

---

## 🧠 Model Architecture

| Component | Details |
|---|---|
| Backbone | ConvNeXt-Small (pretrained on ImageNet-22K → fine-tuned on ImageNet-1K) |
| Pooling | Generalized Mean Pooling (GeM) |
| Shared Head | Linear(feat→768) → BN → GELU → Dropout → Linear(768→384) → BN → GELU |
| KL Head | Ordinal regression — 4 binary thresholds (grades 0–4) |
| JSN Head | 4-class softmax classification |
| KOOS Head | Single scalar regression (0–100) |
| Loss (KL) | Weighted Ordinal Binary Cross-Entropy |
| Loss (JSN) | Focal Cross-Entropy with class weights |
| Loss (KOOS) | Smooth L1 (Huber Loss) |
| Optimizer | AdamW with differential learning rates |
| Scheduler | Cosine Annealing with linear warmup |
| Inference | Test-Time Augmentation (TTA, 5 runs) |

---

## 📊 Dataset

| Property | Details |
|---|---|
| Source | OAI — Osteoarthritis Initiative (NIH-funded) |
| Total Images | 6,759 knee X-rays (224×224 PNG) |
| Train Split | 4,730 images |
| Validation Split | 1,012 images |
| Test Split | 1,017 images |
| Targets | KL grade, JSN severity, KOOS pain subscale score |
| Imbalance Handling | WeightedRandomSampler + Focal Loss + Ordinal pos weights |

---

## 📈 Results

| Metric | Value |
|---|---|
| 🦴 KL Accuracy | 69.0% |
| 📊 KL Quadratic Weighted Kappa | 0.850 |
| 🎯 KL Macro F1 | 0.699 |
| 📉 JSN Accuracy | 55.6% |
| 📊 JSN Macro F1 | 0.601 |
| 💊 KOOS MAE | 12.40 |
| 📉 KOOS RMSE | 16.56 |

---

## 🌐 Web Application

Built with a lightweight **Flask** backend and a clean medical-style frontend.

### Pages

| Page | Description |
|---|---|
| 📤 Upload | Drag & drop knee X-ray, sends to `/predict` endpoint |
| 📊 Results | KL grade, JSN severity, KOOS score, Grad-CAM heatmaps (tab-based) |
| 💡 Recommendations | Clinical suggestions based on predicted KL grade |

### Frontend Stack
- Vanilla HTML / CSS / JavaScript (no frameworks)
- CSS custom properties for light/dark theming
- `sessionStorage` for passing results between pages
- Fetch API for async communication with Flask backend

---

## 📁 Project Structure

```
OSTEO_MTECH/
│
├── app.py                                  # Flask backend + model inference
├── index.html                              # Upload page
├── results.html                            # Results page
├── recommendations.html                    # Recommendations page
│
├── static/
│   ├── style.css                           # Global shared styles
│   ├── theme.js                            # Dark/light mode toggle
│   ├── index.css / index.js                # Upload page styles & logic
│   ├── results.css / results.js            # Results page styles & logic
│   └── recommendations.css / recommendations.js
│
├── knee_oa_multitask_best_final_v7.pth     # Model weights (excluded from repo)
├── knee_oa_kl_thresholds_final_v7.npy      # Tuned KL ordinal thresholds
└── .gitignore
```

---

## ⚙️ Setup & Run

### 1. Install dependencies
```bash
pip install flask torch torchvision timm pillow numpy opencv-python-headless
```

### 2. Add model weights
Download `knee_oa_multitask_best_final_v7.pth` and place it in the project root alongside `app.py`.

### 3. Run the server
```bash
python app.py
```

### 4. Open in browser
```
http://127.0.0.1:5000
```

---

## 🔬 How It Works

1. User uploads a knee X-ray image
2. Backend crops the knee ROI from the image
3. Image is preprocessed and passed through ConvNeXt-Small backbone
4. GeM pooling compresses spatial features
5. Shared MLP extracts a common 384-dim representation
6. Three task heads predict KL grade, JSN severity, and KOOS score simultaneously
7. Grad-CAM generates heatmaps showing which regions influenced each prediction
8. Results and heatmaps are returned as JSON and rendered in the browser
9. Recommendations page provides clinical guidance based on KL grade

---

## 🧪 Notes

- Model weights (`.pth`) are excluded due to GitHub's 100MB file size limit
- The frontend works as a static demo without the backend — results page falls back to example predictions
- For faster testing, reduce `TTA_RUNS` in `app.py` from `5` to `1`

---

## 🚀 Future Improvements

- 📡 Deploy as a cloud-based medical screening tool
- 🧾 Patient history tracking and longitudinal monitoring
- 📊 Advanced analytics dashboard
- 🧠 Model ensemble for higher accuracy
- 📱 Mobile-responsive UI

---

## ⚠️ Disclaimer

This tool is intended for **research purposes only** and is **not a substitute** for professional medical diagnosis. Always consult a qualified healthcare professional for medical advice and treatment decisions.

---

## 🛠️ Tech Stack

`Python` &nbsp;`PyTorch` &nbsp;`timm` &nbsp;`Flask` &nbsp;`ConvNeXt` &nbsp;`Grad-CAM` &nbsp;`HTML` &nbsp;`CSS` &nbsp;`JavaScript`
<img width="1035" height="839" alt="image" src="https://github.com/user-attachments/assets/f46af4fc-7233-45b6-b5e2-6186a381e49f" />
<img width="785" height="563" alt="image" src="https://github.com/user-attachments/assets/44b83e82-5739-4c98-be6b-554851f7463f" />
<img width="880" height="806" alt="image" src="https://github.com/user-attachments/assets/1206ef07-fea1-4efe-a671-da34afd045bd" />
<img width="858" height="875" alt="image" src="https://github.com/user-attachments/assets/a030a48b-b3ae-4a7b-a8b9-7e0a70afa4c1" />


