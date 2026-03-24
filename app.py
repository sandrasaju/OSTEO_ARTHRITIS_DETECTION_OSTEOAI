"""
OsteoAI — Flask Backend
Serves the frontend and exposes /predict endpoint.

Requirements:
    pip install flask torch torchvision timm pillow numpy opencv-python-headless

Run:
    python app.py
"""

import os
import io
import copy
import base64
import numpy as np
from flask import Flask, request, jsonify, send_from_directory

from PIL import Image, ImageFile
ImageFile.LOAD_TRUNCATED_IMAGES = True

import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from torchvision.transforms import InterpolationMode
import timm
import cv2

# ── Config ──────────────────────────────────────────────────
MODEL_PATH = os.environ.get("MODEL_PATH", "knee_oa_multitask_best_final_v7.pth")
THRESHOLD_PATH = os.environ.get("THRESHOLD_PATH", "knee_oa_kl_thresholds_final_v7.npy")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
IMG_SIZE = 224
AMP_ENABLED = DEVICE == "cuda"
TTA_RUNS = 5

imagenet_mean = [0.485, 0.456, 0.406]
imagenet_std  = [0.229, 0.224, 0.225]

JSN_LABELS = {0: "none", 1: "mild/mod", 2: "def", 3: "severe"}

# ── ROI crop ────────────────────────────────────────────────
def crop_knee_roi_pil(img, keep_w=0.88, keep_h=0.75, y_shift=0.02):
    w, h = img.size
    crop_w = int(w * keep_w)
    crop_h = int(h * keep_h)
    cx, cy = w // 2, int(h * (0.50 + y_shift))
    left   = max(0, cx - crop_w // 2)
    top    = max(0, cy - crop_h // 2)
    right  = min(w, left + crop_w)
    bottom = min(h, top + crop_h)
    left   = max(0, right - crop_w)
    top    = max(0, bottom - crop_h)
    return img.crop((left, top, right, bottom))

# ── Transforms ──────────────────────────────────────────────
eval_transform = transforms.Compose([
    transforms.Lambda(lambda img: crop_knee_roi_pil(img)),
    transforms.Resize((IMG_SIZE, IMG_SIZE), interpolation=InterpolationMode.BILINEAR),
    transforms.ToTensor(),
    transforms.Normalize(imagenet_mean, imagenet_std),
])

tta_transform = transforms.Compose([
    transforms.Lambda(lambda img: crop_knee_roi_pil(img)),
    transforms.Resize((IMG_SIZE + 8, IMG_SIZE + 8), interpolation=InterpolationMode.BILINEAR),
    transforms.CenterCrop(IMG_SIZE),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.ToTensor(),
    transforms.Normalize(imagenet_mean, imagenet_std),
])

fivecrop_base = transforms.Compose([
    transforms.Lambda(lambda img: crop_knee_roi_pil(img)),
    transforms.Resize((IMG_SIZE + 16, IMG_SIZE + 16), interpolation=InterpolationMode.BILINEAR),
    transforms.FiveCrop(IMG_SIZE),
])

def fivecrop_to_tensor(crops):
    tensors = []
    for c in crops:
        t = transforms.ToTensor()(c)
        t = transforms.Normalize(imagenet_mean, imagenet_std)(t)
        tensors.append(t)
    return torch.stack(tensors, dim=0)

# ── GeM pooling ─────────────────────────────────────────────
class GeM(nn.Module):
    def __init__(self, p=3.0, eps=1e-6):
        super().__init__()
        self.p   = nn.Parameter(torch.ones(1) * p)
        self.eps = eps

    def forward(self, x):
        x = x.clamp(min=self.eps).pow(self.p)
        x = F.avg_pool2d(x, kernel_size=(x.size(-2), x.size(-1))).pow(1.0 / self.p)
        return x.flatten(1)

# ── Model ───────────────────────────────────────────────────
class MultiTaskOAImageModel(nn.Module):
    def __init__(self, kl_num_classes=5, jsn_num_classes=4):
        super().__init__()
        self.backbone = timm.create_model(
            "convnext_small.fb_in22k_ft_in1k",
            pretrained=False,
            num_classes=0,
            global_pool="",
        )
        feat_dim = self.backbone.num_features
        self.pool = GeM()
        self.shared = nn.Sequential(
            nn.Linear(feat_dim, 768), nn.BatchNorm1d(768), nn.GELU(), nn.Dropout(0.35),
            nn.Linear(768, 384),     nn.BatchNorm1d(384), nn.GELU(), nn.Dropout(0.25),
        )
        self.kl_head   = nn.Sequential(nn.Linear(384, 192), nn.GELU(), nn.Dropout(0.20), nn.Linear(192, kl_num_classes - 1))
        self.jsn_head  = nn.Sequential(nn.Linear(384, 192), nn.GELU(), nn.Dropout(0.20), nn.Linear(192, jsn_num_classes))
        self.koos_head = nn.Sequential(nn.Linear(384, 128), nn.GELU(), nn.Dropout(0.15), nn.Linear(128, 1))

    def forward(self, x):
        feat   = self.pool(self.backbone.forward_features(x))
        shared = self.shared(feat)
        return self.kl_head(shared), self.jsn_head(shared), self.koos_head(shared).squeeze(1)

# ── Ordinal helpers ─────────────────────────────────────────
def ordinal_logits_to_class(logits, thresholds):
    probs = torch.sigmoid(logits)
    thr   = torch.tensor(thresholds, device=probs.device, dtype=probs.dtype).view(1, -1)
    return int((probs > thr).sum(dim=1).item())

# ── Grad-CAM ────────────────────────────────────────────────
class GradCAM:
    def __init__(self, model, kl_thresholds):
        self.model         = model
        self.kl_thresholds = kl_thresholds
        self.gradients     = None
        self.activations   = None
        target_layer       = model.backbone.stages[-1].blocks[-1]
        self._fwd = target_layer.register_forward_hook(self._fwd_hook)
        self._bwd = target_layer.register_full_backward_hook(self._bwd_hook)

    def _fwd_hook(self, m, inp, out): self.activations = out
    def _bwd_hook(self, m, gi, go):  self.gradients    = go[0]

    def generate(self, tensor, task="kl"):
        self.model.eval()
        self.model.zero_grad()
        kl_out, jsn_out, koos_out = self.model(tensor)

        if task == "kl":
            grade = ordinal_logits_to_class(kl_out, self.kl_thresholds)
            score = kl_out[:, :max(1, grade)].sum(dim=1) if grade > 0 else kl_out[:, 0]
        elif task == "jsn":
            score = jsn_out[:, jsn_out.argmax(dim=1).item()]
        else:
            score = koos_out

        score.sum().backward(retain_graph=True)

        g = self.gradients
        a = self.activations
        if g is None or a is None:
            return np.zeros((IMG_SIZE, IMG_SIZE), dtype=np.float32)

        if a.ndim == 3: a = a.permute(0, 2, 1).unsqueeze(-1)
        if g.ndim == 3: g = g.permute(0, 2, 1).unsqueeze(-1)

        weights = g.mean(dim=(2, 3), keepdim=True)
        cam     = F.relu((weights * a).sum(dim=1, keepdim=True))
        cam     = cam.squeeze().detach().cpu().numpy()
        cam     = cv2.resize(cam, (IMG_SIZE, IMG_SIZE))
        cam    -= cam.min()
        if cam.max() > 0: cam /= cam.max()
        return cam

    def remove(self):
        self._fwd.remove()
        self._bwd.remove()

def cam_to_b64(cam, roi_img_pil):
    raw = np.array(roi_img_pil.resize((IMG_SIZE, IMG_SIZE)))
    heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
    heatmap = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
    overlay = np.clip(0.6 * raw + 0.4 * heatmap, 0, 255).astype(np.uint8)

    def to_b64(arr):
        _, buf = cv2.imencode(".png", cv2.cvtColor(arr, cv2.COLOR_RGB2BGR))
        return base64.b64encode(buf).decode()

    return to_b64(heatmap), to_b64(overlay)

def img_to_b64(pil_img, size=(IMG_SIZE, IMG_SIZE)):
    buf = io.BytesIO()
    pil_img.resize(size).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

# ── Load model ──────────────────────────────────────────────
model = None
kl_thresholds = np.array([0.60, 0.50, 0.55, 0.40], dtype=np.float32)

def load_model():
    global model, kl_thresholds
    m = MultiTaskOAImageModel().to(DEVICE)
    if os.path.exists(MODEL_PATH):
        state = torch.load(MODEL_PATH, map_location=DEVICE)
        m.load_state_dict(state)
        print(f"[OsteoAI] Loaded model from {MODEL_PATH}")
    else:
        print(f"[OsteoAI] WARNING: model file not found at {MODEL_PATH}. Using random weights.")
    m.eval()
    model = m

    if os.path.exists(THRESHOLD_PATH):
        kl_thresholds = np.load(THRESHOLD_PATH).astype(np.float32)
        print(f"[OsteoAI] Loaded thresholds: {kl_thresholds}")

# ── Flask app ───────────────────────────────────────────────
app = Flask(__name__, static_folder="static")

@app.route("/")
def index():
    return send_from_directory(".", "index.html")

@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(".", filename)

@app.route("/predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename"}), 400

    try:
        raw_img = Image.open(f.stream).convert("RGB")
    except Exception as e:
        return jsonify({"error": f"Cannot open image: {e}"}), 400

    roi_img = crop_knee_roi_pil(raw_img)

    # ── TTA inference ──
    base_tensor = eval_transform(raw_img).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        kl_probs_sum  = None
        jsn_probs_sum = None
        koos_sum      = 0.0

        # Base pass
        with torch.cuda.amp.autocast(enabled=AMP_ENABLED):
            kl_out, jsn_out, koos_out = model(base_tensor)
        kl_probs_sum  = torch.sigmoid(kl_out).cpu()
        jsn_probs_sum = torch.softmax(jsn_out, dim=1).cpu()
        koos_sum      = koos_out.item()

        # TTA passes
        for _ in range(TTA_RUNS - 1):
            t = tta_transform(raw_img).unsqueeze(0).to(DEVICE)
            with torch.cuda.amp.autocast(enabled=AMP_ENABLED):
                kl_o, jsn_o, koos_o = model(t)
            kl_probs_sum  += torch.sigmoid(kl_o).cpu()
            jsn_probs_sum += torch.softmax(jsn_o, dim=1).cpu()
            koos_sum      += koos_o.item()

        kl_probs_avg  = (kl_probs_sum  / TTA_RUNS).squeeze(0)
        jsn_probs_avg = (jsn_probs_sum / TTA_RUNS).squeeze(0)
        koos_avg      = float(np.clip(koos_sum / TTA_RUNS * 100.0, 0, 100))

    thr = torch.tensor(kl_thresholds, dtype=torch.float32)
    kl_grade    = int((kl_probs_avg > thr).sum().item())
    jsn_severity = int(jsn_probs_avg.argmax().item())

    # ── Grad-CAM ──
    grad_cam = GradCAM(model, kl_thresholds)
    results  = {}
    for task in ("kl", "jsn", "koos"):
        t = eval_transform(raw_img).unsqueeze(0).to(DEVICE).requires_grad_(True)
        cam = grad_cam.generate(t, task=task)
        heatmap_b64, overlay_b64 = cam_to_b64(cam, roi_img)
        results[f"gradcam_{task}_heatmap"] = heatmap_b64
        results[f"gradcam_{task}_overlay"] = overlay_b64
    grad_cam.remove()

    return jsonify({
        "filename":      f.filename,
        "kl_grade":      kl_grade,
        "jsn_severity":  jsn_severity,
        "koos_score":    round(koos_avg, 2),
        "kl_probs":      kl_probs_avg.tolist(),
        "jsn_probs":     jsn_probs_avg.tolist(),
        "orig_image":    img_to_b64(raw_img),
        "roi_image":     img_to_b64(roi_img),
        **results,
    })

if __name__ == "__main__":
    load_model()
    app.run(debug=True, host="0.0.0.0", port=5000)
