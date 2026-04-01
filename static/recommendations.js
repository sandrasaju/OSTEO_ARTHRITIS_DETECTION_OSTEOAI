const JSN_LABELS = ['None', 'Mild/Moderate', 'Definite', 'Severe'];
const KL_DESC    = ['Normal', 'Doubtful OA', 'Mild OA', 'Moderate OA', 'Severe OA'];

const RECS = {
  0: {
    urgency: 1,
    followup: 'Annual check-up recommended. No immediate intervention needed.',
    physio: [
      { icon: '🚴', title: 'Maintain active lifestyle',  desc: 'Regular low-impact exercise such as cycling or swimming.' },
      { icon: '🧘', title: 'Flexibility training',       desc: 'Yoga or stretching to maintain joint range of motion.' },
    ],
    med: [
      { icon: '💊', title: 'No medication required', desc: 'Over-the-counter analgesics only if occasional discomfort arises.' },
    ],
    lifestyle: [
      { icon: '⚖️', title: 'Maintain healthy weight',   desc: 'BMI within normal range reduces joint load significantly.' },
      { icon: '🥗', title: 'Anti-inflammatory diet',     desc: 'Omega-3 rich foods, fruits, and vegetables.' },
    ],
    monitor: [
      { icon: '📅', title: 'Annual X-ray review', desc: 'Monitor for early OA signs annually.' },
    ],
  },
  1: {
    urgency: 1,
    followup: 'Follow-up in 6–12 months. Monitor for symptom progression.',
    physio: [
      { icon: '🚴', title: 'Low-impact aerobic exercise', desc: 'Swimming, cycling, or walking 30 min/day, 5 days/week.' },
      { icon: '💪', title: 'Quadriceps strengthening',    desc: 'Targeted exercises to reduce knee joint load.' },
    ],
    med: [
      { icon: '💊', title: 'Topical NSAIDs if needed', desc: 'Diclofenac gel for localized pain relief.' },
      { icon: '🧴', title: 'Consider glucosamine',     desc: 'Discuss supplementation with your physician.' },
    ],
    lifestyle: [
      { icon: '⚖️', title: 'Weight management',   desc: 'Each kg lost reduces knee load by ~4 kg.' },
      { icon: '👟', title: 'Supportive footwear', desc: 'Cushioned shoes or orthotics to reduce impact.' },
    ],
    monitor: [
      { icon: '📅', title: 'Follow-up in 6 months', desc: 'Reassess symptoms and X-ray findings.' },
      { icon: '📝', title: 'Pain diary',             desc: 'Track pain levels and triggers daily.' },
    ],
  },
  2: {
    urgency: 2,
    followup: 'Follow-up in 3–6 months. Consider physiotherapy referral.',
    physio: [
      { icon: '🏊', title: 'Hydrotherapy',             desc: 'Water-based exercise reduces joint stress while building strength.' },
      { icon: '💪', title: 'Structured physiotherapy', desc: 'Formal PT program focusing on knee stabilization.' },
      { icon: '🚶', title: 'Walking aids if needed',   desc: 'Cane or walking stick to offload the affected knee.' },
    ],
    med: [
      { icon: '💊', title: 'Oral NSAIDs (short-term)',          desc: 'Ibuprofen or naproxen under physician supervision.' },
      { icon: '💉', title: 'Consider intra-articular injection', desc: 'Corticosteroid or hyaluronic acid injection may provide relief.' },
    ],
    lifestyle: [
      { icon: '⚖️', title: 'Weight loss program',    desc: 'Target 5–10% body weight reduction if overweight.' },
      { icon: '🪑', title: 'Activity modification',  desc: 'Avoid high-impact activities like running or jumping.' },
      { icon: '🛏️', title: 'Rest and recovery',      desc: 'Balance activity with adequate rest periods.' },
    ],
    monitor: [
      { icon: '📅', title: 'Follow-up in 3 months',    desc: 'Reassess pain, function, and X-ray progression.' },
      { icon: '🩺', title: 'Orthopedic consultation',  desc: 'Consider referral to orthopedic specialist.' },
    ],
  },
  3: {
    urgency: 3,
    followup: 'Urgent follow-up within 4–8 weeks. Orthopedic referral recommended.',
    physio: [
      { icon: '🏊', title: 'Aquatic therapy',    desc: 'Supervised water-based rehabilitation program.' },
      { icon: '🦯', title: 'Assistive devices',  desc: 'Knee brace, cane, or walker to reduce joint load.' },
      { icon: '💪', title: 'Supervised PT',      desc: 'Formal physiotherapy with a licensed therapist.' },
    ],
    med: [
      { icon: '💊', title: 'Multimodal pain management', desc: 'Combination of NSAIDs, acetaminophen, and topical agents.' },
      { icon: '💉', title: 'Intra-articular injections', desc: 'Corticosteroid injections for acute flares.' },
      { icon: '🧪', title: 'Discuss opioid alternatives', desc: 'Duloxetine or tramadol under specialist supervision.' },
    ],
    lifestyle: [
      { icon: '⚖️', title: 'Structured weight loss',           desc: 'Medically supervised weight management program.' },
      { icon: '🪑', title: 'Significant activity modification', desc: 'Avoid all high-impact activities.' },
      { icon: '🏠', title: 'Home modifications',               desc: 'Grab bars, raised toilet seat, stair rails.' },
    ],
    monitor: [
      { icon: '🩺', title: 'Orthopedic referral',    desc: 'Urgent referral for surgical evaluation.' },
      { icon: '📅', title: 'Follow-up in 4–8 weeks', desc: 'Close monitoring of pain and functional decline.' },
      { icon: '🔬', title: 'MRI consideration',       desc: 'Advanced imaging to assess cartilage and soft tissue.' },
    ],
  },
  4: {
    urgency: 4,
    followup: 'Immediate orthopedic referral. Surgical evaluation required.',
    physio: [
      { icon: '🦯', title: 'Assistive devices essential', desc: 'Knee brace, walker, or wheelchair as needed.' },
      { icon: '🏊', title: 'Aquatic therapy only',        desc: 'Land-based exercise may be too painful; water therapy preferred.' },
      { icon: '🏥', title: 'Pre-surgical rehabilitation', desc: 'Prehab program to optimize surgical outcomes.' },
    ],
    med: [
      { icon: '💊', title: 'Aggressive pain management', desc: 'Multimodal analgesia under specialist care.' },
      { icon: '💉', title: 'Palliative injections',      desc: 'Corticosteroid injections for temporary relief while awaiting surgery.' },
    ],
    lifestyle: [
      { icon: '🪑', title: 'Minimize weight-bearing', desc: 'Reduce standing and walking time significantly.' },
      { icon: '🏠', title: 'Home adaptations',        desc: 'Comprehensive home modification for safety and mobility.' },
      { icon: '🧠', title: 'Psychological support',   desc: 'Chronic pain counseling and coping strategies.' },
    ],
    monitor: [
      { icon: '🏥', title: 'Surgical evaluation',          desc: 'Total knee arthroplasty (TKA) is likely indicated.' },
      { icon: '🩺', title: 'Immediate orthopedic referral', desc: 'Do not delay specialist consultation.' },
      { icon: '📋', title: 'Surgical planning',            desc: 'Pre-operative assessment and optimization.' },
    ],
  },
};

const urgencyLabels = ['', 'Routine', 'Moderate', 'High', 'Urgent'];

function renderList(id, items) {
  const ul = document.getElementById(id);
  ul.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'recom-item';
    li.innerHTML = `<span class="icon">${item.icon}</span><div><strong>${item.title}</strong><span>${item.desc}</span></div>`;
    ul.appendChild(li);
  });
}

// ── Read params ──
const params = new URLSearchParams(window.location.search);
const raw    = sessionStorage.getItem('oaResult');
let kl   = parseInt(params.get('kl')   ?? (raw ? JSON.parse(raw).kl_grade    : 2));
let jsn  = parseInt(params.get('jsn')  ?? (raw ? JSON.parse(raw).jsn_severity : 1));
let koos = parseFloat(params.get('koos') ?? (raw ? JSON.parse(raw).koos_score  : 77));

if (isNaN(kl))   kl   = 2;
if (isNaN(jsn))  jsn  = 1;
if (isNaN(koos)) koos = 77;

const rec = RECS[kl] || RECS[2];

document.getElementById('subheading').textContent  = `KL Grade ${kl} — ${KL_DESC[kl]}`;
document.getElementById('sumKL').textContent        = `Grade ${kl}`;
document.getElementById('sumKLDesc').textContent    = KL_DESC[kl];
document.getElementById('sumJSN').textContent       = JSN_LABELS[jsn] || jsn;
document.getElementById('sumKOOS').textContent      = koos.toFixed ? koos.toFixed(1) : koos;
document.getElementById('sumUrgency').textContent   = urgencyLabels[rec.urgency];
document.getElementById('followup').textContent     = rec.followup;

document.querySelectorAll('.urgency-step').forEach((s, i) => {
  if (i < rec.urgency) s.classList.add('active');
});

renderList('physioList',    rec.physio);
renderList('medList',       rec.med);
renderList('lifestyleList', rec.lifestyle);
renderList('monitorList',   rec.monitor);
