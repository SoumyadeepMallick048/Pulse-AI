// js/auth.js

document.addEventListener('DOMContentLoaded', () => {
  const loginTab = $('#loginTab');
  const signupTab = $('#signupTab');
  const loginForm = $('#loginForm');
  const signupForm = $('#signupForm');
  const alertBox = $('#alertBox');

  // Check if user is already logged in
  const currentUser = localStorage.getItem('pulseai_user');
  if (currentUser) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Tab Toggle Logic
  if (loginTab && signupTab) {
    loginTab.addEventListener('click', () => {
      loginTab.classList.add('active');
      signupTab.classList.remove('active');
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
      hideAlert();
    });

    signupTab.addEventListener('click', () => {
      signupTab.classList.add('active');
      loginTab.classList.remove('active');
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
      hideAlert();
    });
  }

  // Password Visibility Toggle
  $$('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
      const input = this.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        this.textContent = 'Hide';
      } else {
        input.type = 'password';
        this.textContent = 'Show';
      }
    });
  });

  // Handle Signup Submission
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      const name = $('#signupName').value.trim();
      const email = $('#signupEmail').value.trim();
      const password = $('#signupPassword').value.trim();

      if (!name || !email || !password) {
        showAlert('Please fill in all required fields.', 'error');
        return;
      }

      if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'error');
        return;
      }

      // Check if user exists
      const users = JSON.parse(localStorage.getItem('pulseai_registered_users') || '[]');
      const userExists = users.some(user => user.email === email);

      if (userExists) {
        showAlert('An account with this email already exists.', 'error');
        return;
      }

      // Store New User
      const newUser = { name, email, password };
      users.push(newUser);
      localStorage.setItem('pulseai_registered_users', JSON.stringify(users));

      // Auto Login
      localStorage.setItem('pulseai_user', JSON.stringify({ name: newUser.name, email: newUser.email }));
      showAlert('Account created successfully! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    });
  }

  // Handle Login Submission
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      hideAlert();

      const email = $('#loginEmail').value.trim();
      const password = $('#loginPassword').value.trim();

      if (!email || !password) {
        showAlert('Please enter both email and password.', 'error');
        return;
      }

      const users = JSON.parse(localStorage.getItem('pulseai_registered_users') || '[]');
      const validUser = users.find(u => u.email === email && u.password === password);

      // Demo fallback if no users in local storage yet
      if (!validUser && email === 'demo@pulseai.com' && password === 'password123') {
        localStorage.setItem('pulseai_user', JSON.stringify({ name: 'Alex Johnson', email: 'demo@pulseai.com' }));
        showAlert('Welcome back! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
        return;
      }

      if (!validUser) {
        showAlert('Invalid email or password. Try demo@pulseai.com / password123', 'error');
        return;
      }

      // Save user session
      localStorage.setItem('pulseai_user', JSON.stringify({ name: validUser.name, email: validUser.email }));
      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    });
  }

  // Helper Alert Functions
  function showAlert(msg, type) {
    if (!alertBox) return;
    alertBox.textContent = msg;
    alertBox.className = `alert-box ${type}`;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.className = 'alert-box';
    alertBox.textContent = '';
  }
});