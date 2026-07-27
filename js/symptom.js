// js/symptom.js

const REGION_PRESETS = {
  "Head & Neck": [
    { label: "Severe Headache", value: "Severe throbbing headache" },
    { label: "Dizziness", value: "Dizziness or feeling lightheaded" },
    { label: "Sore Throat", value: "Sore throat when swallowing" },
    { label: "Sinus Pressure", value: "Pressure behind eyes and sinuses" }
  ],
  "Chest & Heart": [
    { label: "Tightness", value: "Tightness or pressure in chest" },
    { label: "Shortness of Breath", value: "Shortness of breath on exertion" },
    { label: "Rapid Heartbeat", value: "Heart racing or palpitations" },
    { label: "Persistent Cough", value: "Dry persistent cough" }
  ],
  "Abdomen & Gut": [
    { label: "Sharp Stomach Pain", value: "Sharp crampy abdominal pain" },
    { label: "Nausea", value: "Nausea and loss of appetite" },
    { label: "Bloating", value: "Abdominal bloating after meals" },
    { label: "Acid Reflux", value: "Burning heartburn feeling" }
  ],
  "Muscles & Joints": [
    { label: "Joint Stiffness", value: "Joint pain and morning stiffness" },
    { label: "Muscle Aches", value: "Generalized body and muscle pain" },
    { label: "Lower Back Pain", value: "Dull aching lower back pain" },
    { label: "Swelling", value: "Swelling in ankles or wrists" }
  ],
  "General & Systemic": [
    { label: "High Fever", value: "High fever with chills" },
    { label: "Extreme Fatigue", value: "Unusual persistent exhaustion" },
    { label: "Night Sweats", value: "Excessive night sweating" },
    { label: "Cold Chills", value: "Shivering and cold body chills" }
  ]
};

document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = $('#analyzeBtn');
  const symptomInput = $('#symptomInput');
  const durationSelect = $('#durationSelect');
  const severitySelect = $('#severitySelect');
  const loadingState = $('#loadingState');
  const resultsContainer = $('#resultsContainer');

  // Region Selector Listener
  const regionBtns = document.querySelectorAll('.region-btn');
  regionBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      regionBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChips(btn.dataset.region);
    });
  });

  // Attach Initial Chip Handlers
  attachChipClickHandlers();

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', handleSymptomAnalysis);
  }

  async function handleSymptomAnalysis() {
    const text = symptomInput ? symptomInput.value.trim() : '';
    const duration = durationSelect ? durationSelect.value : '';
    const severity = severitySelect ? severitySelect.value : '';

    if (!text) {
      alert('Please describe your symptoms before starting the analysis.');
      return;
    }

    if (loadingState) loadingState.style.display = 'flex';
    if (resultsContainer) resultsContainer.style.display = 'none';

    const prompt = `
      Act as an AI Triage Assistant. Analyze the following health query:
      - Symptoms: "${text}"
      - Duration: "${duration}"
      - Severity: "${severity}"

      Return ONLY a JSON object matching this exact schema:
      {
        "urgencyLevel": "Low" | "Moderate" | "High",
        "urgencyTitle": "Clear summary headline",
        "urgencyDescription": "Plain-English explanation of priority level.",
        "possibleConditions": [
          { "name": "Condition Name", "description": "Short 1-sentence clinical explanation." }
        ],
        "nextSteps": [
          "Actionable recommendation 1",
          "Actionable recommendation 2"
        ]
      }
    `;

    try {
      let data = null;

      if (typeof callGeminiAPI === 'function') {
        data = await callGeminiAPI(prompt, true);
      }

      if (!data) {
        data = getMockSymptomData(text);
      }

      renderSymptomResults(data);

      if (typeof saveToActivityLog === 'function') {
        saveToActivityLog('symptom', '🩺', `Analyzed Symptoms`, text.slice(0, 40) + '...');
      }

    } catch (err) {
      console.error('Symptom analysis error:', err);
      renderSymptomResults(getMockSymptomData(text));
    } finally {
      if (loadingState) loadingState.style.display = 'none';
    }
  }
});

function renderChips(regionKey) {
  const chipContainer = $('#chipContainer');
  if (!chipContainer || !REGION_PRESETS[regionKey]) return;

  chipContainer.innerHTML = REGION_PRESETS[regionKey].map(item => `
    <span class="chip" data-symptom="${item.value}">${item.label}</span>
  `).join('');

  attachChipClickHandlers();
}

function attachChipClickHandlers() {
  const chips = document.querySelectorAll('.chip');
  const symptomInput = $('#symptomInput');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.symptom;
      if (!symptomInput) return;

      if (symptomInput.value.trim() === '') {
        symptomInput.value = val;
      } else if (!symptomInput.value.includes(val)) {
        symptomInput.value += `, ${val}`;
      }
    });
  });
}

function renderSymptomResults(data) {
  const resultsContainer = $('#resultsContainer');
  const urgencyCard = $('#urgencyCard');
  const urgencyIcon = $('#urgencyIcon');
  const urgencyBadge = $('#urgencyBadge');
  const urgencyTitle = $('#urgencyTitle');
  const urgencyText = $('#urgencyText');
  const conditionsList = $('#conditionsList');
  const recommendationsList = $('#recommendationsList');

  if (!resultsContainer) return;

  const level = (data.urgencyLevel || 'Low').toLowerCase();

  // Reset urgency classes
  urgencyCard.className = 'urgency-banner';

  if (level === 'high') {
    urgencyCard.classList.add('urgency-high');
    urgencyIcon.textContent = '🔴';
    urgencyBadge.textContent = 'High Urgency';
  } else if (level === 'moderate') {
    urgencyCard.classList.add('urgency-moderate');
    urgencyIcon.textContent = '🟠';
    urgencyBadge.textContent = 'Moderate Urgency';
  } else {
    urgencyCard.classList.add('urgency-low');
    urgencyIcon.textContent = '🟢';
    urgencyBadge.textContent = 'Low Urgency';
  }

  urgencyTitle.textContent = data.urgencyTitle || 'Self-Care & Observation Recommended';
  urgencyText.textContent = data.urgencyDescription || 'Your symptoms do not currently indicate an acute emergency.';

  // Render Conditions
  if (conditionsList) {
    conditionsList.innerHTML = (data.possibleConditions || []).map(item => `
      <div class="condition-item">
        <div class="condition-name">${item.name}</div>
        <div class="condition-desc">${item.description}</div>
      </div>
    `).join('');
  }

  // Render Actions
  if (recommendationsList) {
    recommendationsList.innerHTML = (data.nextSteps || []).map(step => `
      <li>${step}</li>
    `).join('');
  }

  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function getMockSymptomData(input) {
  return {
    urgencyLevel: "Low",
    urgencyTitle: "Routine Primary Care / Self-Care",
    urgencyDescription: "Your reported symptoms match typical viral or tension-related conditions that usually improve with rest and hydration.",
    possibleConditions: [
      { name: "Tension Headache / Sinus Congestion", description: "Common inflammatory or muscle-tension response often triggered by stress or mild dehydration." },
      { name: "Upper Respiratory Viral Symptoms", description: "Mild viral infection causing systemic tiredness and localized discomfort." }
    ],
    nextSteps: [
      "Ensure hydration (drink at least 2 liters of water daily).",
      "Rest in a quiet, dark environment if experiencing head pressure.",
      "Consult a doctor if symptoms persist beyond 5–7 days."
    ]
  };
}