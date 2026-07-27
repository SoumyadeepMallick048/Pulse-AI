// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
  // Check Authentication Session
  const userSession = localStorage.getItem('pulseai_user');
  if (!userSession) {
    window.location.href = 'login.html';
    return;
  }

  const user = JSON.parse(userSession);

  // Update UI with User Information
  const userNameEl = $('#userName');
  const userEmailEl = $('#userEmail');
  const userAvatarEl = $('#userAvatar');

  if (userNameEl) userNameEl.textContent = user.name || 'User';
  if (userEmailEl) userEmailEl.textContent = user.email || '';
  if (userAvatarEl && user.name) {
    userAvatarEl.textContent = user.name.charAt(0).toUpperCase();
  }

  // Logout Handler
  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('pulseai_user');
      window.location.href = 'login.html';
    });
  }

  // Load and Render Recent Activity
  renderRecentActivity();
});

/**
 * Renders recent activity log from localStorage or provides realistic defaults
 */
function renderRecentActivity() {
  const activityContainer = $('#activityList');
  if (!activityContainer) return;

  const savedActivities = JSON.parse(localStorage.getItem('pulseai_activities') || '[]');

  // Default seed activities for portfolio presentation if none exist
  const defaultActivities = [
    {
      type: 'medicine',
      icon: '💊',
      title: 'Searched Amoxicillin',
      desc: 'Viewed dosage & drug interactions',
      time: '2 hours ago'
    },
    {
      type: 'symptom',
      icon: '🩺',
      title: 'Symptom Assessment',
      desc: 'Headache & Mild Fever analysis',
      time: 'Yesterday'
    },
    {
      type: 'routine',
      icon: '🥗',
      title: 'Generated Routine Plan',
      desc: 'Weight loss & Cardio plan',
      time: '3 days ago'
    }
  ];

  const activities = savedActivities.length > 0 ? savedActivities : defaultActivities;

  activityContainer.innerHTML = activities.map(item => `
    <div class="activity-item">
      <div class="activity-icon">${item.icon}</div>
      <div class="activity-details">
        <h4>${item.title}</h4>
        <p>${item.desc}</p>
        <span class="activity-time">${item.time}</span>
      </div>
    </div>
  `).join('');
}