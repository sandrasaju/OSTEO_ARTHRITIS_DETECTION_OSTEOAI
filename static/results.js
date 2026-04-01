const KL_DESC = [
  'Normal — no OA features',
  'Doubtful — possible osteophytes',
  'Mild — definite osteophytes',
  'Moderate — joint space narrowing',
  'Severe — large osteophytes, marked narrowing',
];

const JSN_LABELS = ['None', 'Mild/Moderate', 'Definite', 'Severe'];
const JSN_BADGE  = ['badge-green', 'badge-yellow', 'badge-orange', 'badge-red'];

function painLevel(score) {
  if (score >= 85) return { label: 'Low Pain',       cls: 'badge-green',  desc: 'Minimal pain impact on daily activities.' };
  if (score >= 60) return { label: 'Moderate Pain',  cls: 'badge-yellow', desc: 'Noticeable pain affecting some activities.' };
  if (score >= 35) return { label: 'High Pain',      cls: 'badge-orange', desc: 'Significant pain limiting daily function.' };
  return             { label: 'Very High Pain',  cls: 'badge-red',    desc: 'Severe pain with major functional limitations.' };
}

function renderProbBars(container, labels, probs) {
  container.innerHTML = '';
  labels.forEach((lbl, i) => {
    const pct = (probs[i] * 100).toFixed(1);
    const row = document.createElement('div');
    row.className = 'prob-row';
    row.innerHTML = `
      <span class="prob-label">${lbl}</span>
      <div class="prob-bar-wrap">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="prob-val">${pct}%</span>`;
    container.appendChild(row);
  });
}

function setImg(id, b64) {
  const el = document.getElementById(id);
  if (b64) el.src = 'data:image/png;base64,' + b64;
  else el.style.display = 'none';
}

// ── Demo fallback ──
const DEMO = {
  filename: 'demo_9082159L.png',
  kl_grade: 3,
  jsn_severity: 1,
  koos_score: 77.31,
  kl_probs: [0.999, 1.000, 0.999, 0.0009],
  jsn_probs: [0.0334, 0.848, 0.0781, 0.0407],
  orig_image: null, roi_image: null,
  gradcam_kl_heatmap: null, gradcam_kl_overlay: null,
  gradcam_jsn_heatmap: null, gradcam_jsn_overlay: null,
  gradcam_koos_heatmap: null, gradcam_koos_overlay: null,
};

const raw  = sessionStorage.getItem('oaResult');
const data = raw ? JSON.parse(raw) : DEMO;

// Populate summary metrics
document.getElementById('filenameLabel').textContent = data.filename || '';
document.getElementById('klValue').textContent       = data.kl_grade;
document.getElementById('jsnValue').textContent      = JSN_LABELS[data.jsn_severity] || data.jsn_severity;
document.getElementById('koosValue').textContent     = data.koos_score.toFixed(1);
document.getElementById('koosLarge').textContent     = data.koos_score.toFixed(1);

// KL badge + severity scale
const klBadge = document.getElementById('klBadge');
klBadge.textContent = data.kl_grade;
document.getElementById('klDesc').textContent = KL_DESC[data.kl_grade] || '';

document.querySelectorAll('.severity-step').forEach((s, i) => {
  if (i <= data.kl_grade) s.classList.add('active', `kl-${data.kl_grade}`);
});

// Pain level
const pl = painLevel(data.koos_score);
document.getElementById('painBadge').innerHTML      = `<span class="badge ${pl.cls}">${pl.label}</span>`;
document.getElementById('painNeedle').style.left    = data.koos_score + '%';
document.getElementById('painLevelDetail').innerHTML =
  `<span class="badge ${pl.cls}" style="margin-bottom:8px">${pl.label}</span><br>
   <span style="color:var(--text-muted)">${pl.desc}</span>`;

// JSN badge
const jsnBadge = document.getElementById('jsnBadge');
jsnBadge.textContent = JSN_LABELS[data.jsn_severity] || data.jsn_severity;
jsnBadge.className   = `badge ${JSN_BADGE[data.jsn_severity] || 'badge-blue'}`;

// Probability bars
if (data.kl_probs)  renderProbBars(document.getElementById('klProbs'),  ['KL≥1','KL≥2','KL≥3','KL≥4'], data.kl_probs);
if (data.jsn_probs) renderProbBars(document.getElementById('jsnProbs'), JSN_LABELS, data.jsn_probs);

// Images
setImg('origImg',    data.orig_image);
setImg('roiImg',     data.roi_image);
setImg('heatmapImg', data.gradcam_kl_heatmap);
setImg('overlayImg', data.gradcam_kl_overlay);

// Grad-CAM tabs
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const task = btn.dataset.task;
    setImg('heatmapImg', data[`gradcam_${task}_heatmap`]);
    setImg('overlayImg', data[`gradcam_${task}_overlay`]);
  });
});

// Recommendations link
document.getElementById('recomBtn').href =
  `recommendations.html?kl=${data.kl_grade}&jsn=${data.jsn_severity}&koos=${data.koos_score.toFixed(1)}`;
