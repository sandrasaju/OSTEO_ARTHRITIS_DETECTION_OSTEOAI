const dropzone   = document.getElementById('dropzone');
const fileInput  = document.getElementById('fileInput');
const fileBtn    = document.getElementById('fileBtn');
const previewGrid = document.getElementById('previewGrid');
const analyzeBtn = document.getElementById('analyzeBtn');
let selectedFile = null;

fileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  if (e.target.files[0]) setFile(e.target.files[0]);
  fileInput.value = '';
});

dropzone.addEventListener('dragover', e => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const f = e.dataTransfer.files[0];
  if (f && f.type.startsWith('image/')) setFile(f);
});

function setFile(f) {
  selectedFile = f;
  const url = URL.createObjectURL(f);
  previewGrid.innerHTML = `
    <div class="preview-item">
      <img src="${url}" alt="preview">
      <div class="preview-item-info">${f.name}</div>
      <button class="preview-remove" id="removeBtn">✕</button>
    </div>`;
  document.getElementById('removeBtn').addEventListener('click', () => {
    selectedFile = null;
    previewGrid.innerHTML = '';
    analyzeBtn.disabled = true;
  });
  analyzeBtn.disabled = false;
}

analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  analyzeBtn.disabled = true;
  analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch('/predict', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Server error: ' + res.status);
    const data = await res.json();
    sessionStorage.setItem('oaResult', JSON.stringify(data));
    window.location.href = 'results.html';
  } catch (err) {
    alert('Error: ' + err.message);
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = 'Analyze X-ray';
  }
});
