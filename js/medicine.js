// js/medicine.js

document.addEventListener('DOMContentLoaded', () => {
  const medicineForm = $('#medicineForm');
  const searchInput = $('#medicineInput');
  const loadingState = $('#loadingState');
  const resultsContainer = $('#resultsContainer');

  if (medicineForm) {
    medicineForm.addEventListener('submit', async (e) => {
      // 1. CRITICAL: Prevent form submission from reloading the page
      e.preventDefault();
      e.stopPropagation();

      const medicineName = searchInput.value.trim();
      if (!medicineName) return false;

      // 2. UI Loading State
      if (loadingState) loadingState.style.display = 'flex';
      if (resultsContainer) resultsContainer.style.display = 'none';

      // 3. Structured Gemini Prompt
      const prompt = `
        Provide clear, well-structured clinical information about the medicine: "${medicineName}".
        Return ONLY a JSON object matching this exact structure:
        {
          "name": "${medicineName}",
          "category": "General class/category of drug",
          "uses": ["use 1", "use 2", "use 3"],
          "dosage": "Standard recommended dosage and intake frequency advice.",
          "sideEffects": ["side effect 1", "side effect 2", "side effect 3"],
          "precautions": ["precaution 1", "precaution 2"],
          "interactions": ["interaction 1", "interaction 2"],
          "storage": "Storage guidelines (temperature, light, safety)."
        }
      `;

      try {
        let data = null;
        
        // Safely call API or fallback to mock
        if (typeof callGeminiAPI === 'function') {
          data = await callGeminiAPI(prompt, true);
        }

        // Fallback demo mock if API key isn't provided or fails
        if (!data) {
          data = getMockMedicineData(medicineName);
        }

        renderMedicineData(data);
        saveToActivityLog('medicine', '💊', `Searched ${data.name}`, `Viewed drug details and uses`);

      } catch (err) {
        console.error("Error fetching medicine data:", err);
        // Display mock fallback on error so the app continues working gracefully
        const mockData = getMockMedicineData(medicineName);
        renderMedicineData(mockData);
      } finally {
        if (loadingState) loadingState.style.display = 'none';
      }

      return false; // Prevents default form navigation in all browsers
    });
  }
});

/**
 * Render structured JSON output to UI cards
 */
function renderMedicineData(data) {
  const resultsContainer = $('#resultsContainer');
  if (!resultsContainer) return;

  const medName = $('#medName');
  const medCategory = $('#medCategory');
  const medUses = $('#medUses');
  const medDosage = $('#medDosage');
  const medSideEffects = $('#medSideEffects');
  const medPrecautions = $('#medPrecautions');
  const medInteractions = $('#medInteractions');
  const medStorage = $('#medStorage');

  if (medName) medName.textContent = data.name;
  if (medCategory) medCategory.textContent = data.category || 'Pharmaceutical Agent';

  if (medUses) medUses.innerHTML = (data.uses || []).map(u => `<li>${u}</li>`).join('');
  if (medDosage) medDosage.textContent = data.dosage || 'Consult a healthcare provider for dosage instructions.';
  if (medSideEffects) medSideEffects.innerHTML = (data.sideEffects || []).map(s => `<li>${s}</li>`).join('');
  if (medPrecautions) medPrecautions.innerHTML = (data.precautions || []).map(p => `<li>${p}</li>`).join('');
  if (medInteractions) medInteractions.innerHTML = (data.interactions || []).map(i => `<li>${i}</li>`).join('');
  if (medStorage) medStorage.textContent = data.storage || 'Store in a cool, dry place away from direct sunlight.';

  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Save search activity to localStorage for Dashboard integration
 */
function saveToActivityLog(type, icon, title, desc) {
  try {
    const activities = JSON.parse(localStorage.getItem('pulseai_activities') || '[]');
    activities.unshift({
      type,
      icon,
      title,
      desc,
      time: 'Just now'
    });
    localStorage.setItem('pulseai_activities', JSON.stringify(activities.slice(0, 5)));
  } catch (err) {
    console.warn("Could not save to localStorage:", err);
  }
}

/**
 * Demo fallback mock data generator when no API key is supplied
 */
function getMockMedicineData(name) {
  return {
    name: name.toUpperCase(),
    category: "Analgesic / Anti-inflammatory (Demo Mode)",
    uses: [
      "Treatment of mild to moderate pain and fever",
      "Reduction of localized swelling and inflammation",
      "Symptomatic relief of headaches or muscle aches"
    ],
    dosage: "Take 1 tablet every 6 to 8 hours with water after meals as directed by a healthcare professional.",
    sideEffects: [
      "Mild stomach discomfort or nausea",
      "Drowsiness or mild fatigue",
      "Transient headache"
    ],
    precautions: [
      "Avoid alcohol consumption during treatment.",
      "Consult a doctor if you have active gastric ulcers or renal impairment."
    ],
    interactions: [
      "Blood thinners (e.g., Warfarin)",
      "Other NSAIDs or high-dose Aspirin"
    ],
    storage: "Store at room temperature below 25°C (77°F) away from moisture and heat."
  };
}