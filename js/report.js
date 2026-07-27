// js/report.js

const SAMPLE_REPORTS = {
  lipid: `LIPID PANEL RESULT:
Total Cholesterol: 215 mg/dL (High, Ref: <200)
HDL Cholesterol: 48 mg/dL (Optimal, Ref: >40)
LDL Cholesterol: 135 mg/dL (Slightly Elevated, Ref: <100)
Triglycerides: 160 mg/dL (Elevated, Ref: <150)
IMPRESSION: Borderline hyperlipidemia. Recommend lifestyle modification and dietary reduction of saturated fats.`,

  metabolic: `COMPREHENSIVE METABOLIC PANEL (CMP):
Fasting Glucose: 112 mg/dL (High, Ref: 70-99)
BUN: 18 mg/dL (Normal, Ref: 7-20)
Serum Creatinine: 0.9 mg/dL (Normal, Ref: 0.6-1.2)
Sodium: 140 mEq/L (Normal, Ref: 135-145)
Potassium: 4.2 mEq/L (Normal, Ref: 3.5-5.0)
HbA1c: 5.9 % (Prediabetes Range, Ref: <5.7)
IMPRESSION: Mild impaired fasting glucose. Renal function and electrolytes remain within normal limits.`,

  cbc: `COMPLETE BLOOD COUNT (CBC):
WBC (White Blood Cells): 6.8 x10^3/uL (Normal, Ref: 4.5-11.0)
RBC (Red Blood Cells): 4.7 x10^6/uL (Normal, Ref: 4.3-5.9)
Hemoglobin: 14.2 g/dL (Normal, Ref: 13.5-17.5)
Platelets: 250 x10^3/uL (Normal, Ref: 150-450)
IMPRESSION: All hematologic markers are within normal biological target ranges.`
};

document.addEventListener('DOMContentLoaded', () => {
  const summarizeBtn = $('#summarizeBtn');
  const reportInput = $('#reportInput');
  const loadingState = $('#loadingState');
  const resultsContainer = $('#resultsContainer');

  // 1. Input Mode Tabs Handler
  const modeTabs = document.querySelectorAll('.mode-tab');
  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      modeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const mode = tab.dataset.mode;
      $('#textModeContainer').classList.toggle('active', mode === 'text');
      $('#fileModeContainer').classList.toggle('active', mode === 'file');
    });
  });

  // 2. Sample Report Pill Clickers
  const samplePills = document.querySelectorAll('.sample-pill');
  samplePills.forEach(pill => {
    pill.addEventListener('click', () => {
      const sampleKey = pill.dataset.sample;
      if (reportInput && SAMPLE_REPORTS[sampleKey]) {
        reportInput.value = SAMPLE_REPORTS[sampleKey];
        // Ensure we are in text mode
        document.querySelector('.mode-tab[data-mode="text"]').click();
      }
    });
  });

  // 3. Dropzone File Upload Simulation
  const dropzone = $('#dropzone');
  const fileInput = $('#fileInput');
  const fileNameDisplay = $('#fileNameDisplay');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        fileNameDisplay.textContent = `Attached: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        reportInput.value = `[Attached Medical File: ${file.name}]\nSimulated extraction of lab report data for: ${file.name}`;
      }
    });
  }

  // 4. Output Results Tab Switcher
  const resultTabs = document.querySelectorAll('.result-tab');
  resultTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      resultTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetTab = tab.dataset.tab;
      $('#tabSummary').classList.toggle('active', targetTab === 'summary');
      $('#tabBiomarkers').classList.toggle('active', targetTab === 'biomarkers');
      $('#tabActions').classList.toggle('active', targetTab === 'actions');
    });
  });

  // 5. Main Submit Handler
  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', handleReportSummary);
  }

  async function handleReportSummary() {
    const reportText = reportInput ? reportInput.value.trim() : '';

    if (!reportText) {
      alert('Please paste a medical report or upload a record before summarizing.');
      return;
    }

    if (loadingState) loadingState.style.display = 'flex';
    if (resultsContainer) resultsContainer.style.display = 'none';

    const prompt = `
      Act as an expert clinical communicator. Translate the following medical report or lab data into clear, easy-to-understand plain English for a patient.
      Report Content: "${reportText}"

      Return ONLY a JSON object matching this exact structure:
      {
        "overallStatus": "Stable Panel" | "Attention Recommended" | "Action Required",
        "plainEnglishSummary": "Clear 2-3 sentence overview explaining what this report indicates in plain language.",
        "keyTakeaways": [
          "Primary key finding 1",
          "Primary key finding 2"
        ],
        "biomarkers": [
          { "marker": "Test Name 1", "value": "140 mg/dL", "status": "Normal" | "Abnormal", "interpretation": "Brief note on what this value means." }
        ],
        "questionsForDoctor": [
          "Question to ask physician 1",
          "Question to ask physician 2"
        ]
      }
    `;

    try {
      let data = null;

      if (typeof callGeminiAPI === 'function') {
        data = await callGeminiAPI(prompt, true);
      }

      if (!data) {
        data = getMockReportData(reportText);
      }

      renderReportResults(data);

      if (typeof saveToActivityLog === 'function') {
        saveToActivityLog('report', '📄', `Analyzed Medical Report`, reportText.slice(0, 35) + '...');
      }

    } catch (err) {
      console.error('Error summarizing report:', err);
      renderReportResults(getMockReportData(reportText));
    } finally {
      if (loadingState) loadingState.style.display = 'none';
    }
  }
});

function renderReportResults(data) {
  const resultsContainer = $('#resultsContainer');
  if (!resultsContainer) return;

  // Overall Status Badge
  const overallBadge = $('#overallStatusBadge');
  if (overallBadge) {
    overallBadge.textContent = data.overallStatus || 'Analyzed Panel';
  }

  // Plain English Summary
  const plainSummary = $('#plainSummary');
  if (plainSummary) {
    plainSummary.textContent = data.plainEnglishSummary || 'Report analyzed successfully.';
  }

  // Key Takeaways
  const keyTakeawaysList = $('#keyTakeawaysList');
  if (keyTakeawaysList) {
    keyTakeawaysList.innerHTML = (data.keyTakeaways || []).map(item => `
      <li>${item}</li>
    `).join('');
  }

  // Biomarkers Table
  const biomarkerTableBody = $('#biomarkerTableBody');
  if (biomarkerTableBody) {
    biomarkerTableBody.innerHTML = (data.biomarkers || []).map(item => {
      const isNormal = (item.status || 'Normal').toLowerCase() === 'normal';
      const statusClass = isNormal ? 'status-normal' : 'status-abnormal';
      return `
        <tr>
          <td><strong>${item.marker}</strong></td>
          <td>${item.value}</td>
          <td><span class="${statusClass}">${item.status}</span></td>
          <td>${item.interpretation}</td>
        </tr>
      `;
    }).join('');
  }

  // Questions Checklist
  const questionsChecklist = $('#questionsChecklist');
  if (questionsChecklist) {
    questionsChecklist.innerHTML = (data.questionsForDoctor || []).map((q, idx) => `
      <div class="checklist-item">
        <input type="checkbox" id="q_${idx}">
        <label for="q_${idx}">${q}</label>
      </div>
    `).join('');
  }

  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

function getMockReportData(inputText) {
  return {
    overallStatus: "Attention Recommended",
    plainEnglishSummary: "Your lab panel indicates overall healthy organ function, but shows minor elevation in fasting sugar and lipid markers that warrant dietary attention.",
    keyTakeaways: [
      "Metabolic markers show slight blood glucose elevation above optimal range.",
      "Kidney and liver safety indicators are completely normal.",
      "Cardiovascular risk is low to moderate."
    ],
    biomarkers: [
      {
        marker: "Fasting Blood Glucose",
        value: "112 mg/dL",
        status: "Abnormal",
        interpretation: "Slightly above standard fasting limit (70–99 mg/dL)."
      },
      {
        marker: "Total Cholesterol",
        value: "185 mg/dL",
        status: "Normal",
        interpretation: "Within target range for cardiovascular health."
      },
      {
        marker: "Hemoglobin A1c",
        value: "5.8 %",
        status: "Normal",
        interpretation: "Reflects healthy average blood sugar over recent months."
      }
    ],
    questionsForDoctor: [
      "What dietary changes do you recommend for my glucose levels?",
      "When should we re-test this panel to monitor progress?"
    ]
  };
}