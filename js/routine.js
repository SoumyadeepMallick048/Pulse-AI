// js/routine.js

document.addEventListener('DOMContentLoaded', () => {
  const generateBtn = $('#generateBtn');
  const goalInput = $('#goalInput');
  const activityInput = $('#activityInput');
  const dietInput = $('#dietInput');
  const wakeTimeInput = $('#wakeTimeInput');
  const loadingState = $('#loadingState');
  const resultsContainer = $('#resultsContainer');

  if (generateBtn) {
    generateBtn.addEventListener('click', handleRoutineGeneration);
  }

  async function handleRoutineGeneration() {
    const goal = goalInput ? goalInput.value : 'Energy Boost';
    const activityLevel = activityInput ? activityInput.value : 'Moderate';
    const diet = dietInput ? dietInput.value : 'Balanced';
    const wakeTime = wakeTimeInput ? wakeTimeInput.value : '07:00 AM';

    if (loadingState) loadingState.style.display = 'flex';
    if (resultsContainer) resultsContainer.style.display = 'none';

    const prompt = `
      Create a tailored daily health schedule and wellness plan based on these parameters:
      - Goal: ${goal}
      - Activity Level: ${activityLevel}
      - Dietary Preference: ${diet}
      - Wake-up Time: ${wakeTime}

      Return ONLY a JSON object matching this exact structure:
      {
        "routineTitle": "Customized ${goal} Routine",
        "morning": [
          "Action 1 (hydrating, movement, light exposure)",
          "Action 2 (healthy breakfast item)"
        ],
        "afternoon": [
          "Action 1 (lunch focus, posture/walk reset)",
          "Action 2 (hydration / focus tip)"
        ],
        "evening": [
          "Action 1 (dinner guidance, wind down)",
          "Action 2 (screen off / sleep hygiene tip)"
        ],
        "dietTips": [
          "Nutrient tip 1 related to ${diet}",
          "Meal timing recommendation"
        ],
        "habitTrackers": [
          "Micro habit 1 to track daily",
          "Micro habit 2 to track daily"
        ]
      }
    `;

    try {
      let data = null;

      if (typeof callGeminiAPI === 'function') {
        data = await callGeminiAPI(prompt, true);
      }

      if (!data) {
        data = getMockRoutineData(goal);
      }

      renderRoutineResults(data);
      saveToActivityLog('routine', '🌅', `Generated Routine`, `Created plan for: ${goal}`);

    } catch (err) {
      console.error('Error generating routine:', err);
      const mockData = getMockRoutineData(goal);
      renderRoutineResults(mockData);
    } finally {
      if (loadingState) loadingState.style.display = 'none';
    }
  }
});

/**
 * Render structured routine JSON to the UI
 */
function renderRoutineResults(data) {
  const resultsContainer = $('#resultsContainer');
  if (!resultsContainer) return;

  const routineTitle = $('#routineTitle');
  if (routineTitle) routineTitle.textContent = data.routineTitle || 'Your Personalized Routine';

  // Render Time Blocks
  const morningList = $('#morningList');
  const afternoonList = $('#afternoonList');
  const eveningList = $('#eveningList');

  if (morningList) morningList.innerHTML = (data.morning || []).map(item => `<li>${item}</li>`).join('');
  if (afternoonList) afternoonList.innerHTML = (data.afternoon || []).map(item => `<li>${item}</li>`).join('');
  if (eveningList) eveningList.innerHTML = (data.evening || []).map(item => `<li>${item}</li>`).join('');

  // Render Diet & Habit Cards
  const dietList = $('#dietList');
  const habitList = $('#habitList');

  if (dietList) dietList.innerHTML = (data.dietTips || []).map(item => `<li>${item}</li>`).join('');
  if (habitList) habitList.innerHTML = (data.habitTrackers || []).map(item => `<li>${item}</li>`).join('');

  resultsContainer.style.display = 'block';
  resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Save search activity to localStorage for Dashboard
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
    console.warn('Could not save activity to localStorage:', err);
  }
}

/**
 * Fallback Mock Data Generator
 */
function getMockRoutineData(goal) {
  return {
    routineTitle: `Customized ${goal} Plan`,
    morning: [
      "Drink 500ml of water with a pinch of electrolytes upon waking.",
      "Get 10–15 minutes of natural sunlight exposure.",
      "Consume a protein-rich breakfast (30g protein)."
    ],
    afternoon: [
      "Take a 10-minute post-lunch walk to assist digestion.",
      "Perform desk mobility stretches every 90 minutes.",
      "Switch from caffeinated drinks to herbal tea after 2:00 PM."
    ],
    evening: [
      "Eat a light dinner at least 3 hours before sleep.",
      "Dim overhead lights and turn on warm room lighting.",
      "Disconnect from digital screens 45 minutes prior to bed."
    ],
    dietTips: [
      "Focus on whole food sources rich in complex carbohydrates and lean proteins.",
      "Maintain consistent meal times to keep circadian rhythm stable."
    ],
    habitTrackers: [
      "Track 2.5L daily hydration target.",
      "Log 7–8 hours of undisturbed sleep per night."
    ]
  };
}