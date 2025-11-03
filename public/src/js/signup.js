// signup.js — Smart Farmer Signup (Edge Function)
document.addEventListener('DOMContentLoaded', function () {
  const signupForm = document.getElementById('signupForm');
  const firstNameInput = document.getElementById('firstName');
  const lastNameInput = document.getElementById('lastName');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const agreeTerms = document.getElementById('agreeTerms');
  const passwordToggle = document.getElementById('passwordToggle');
  const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
  const submitBtn = document.querySelector('.submit-btn');
  const strengthFill = document.querySelector('.strength-fill');
  const strengthText = document.querySelector('.strength-text');

  // Password toggle logic
  passwordToggle.addEventListener('click', () => togglePassword(passwordInput, passwordToggle));
  confirmPasswordToggle.addEventListener('click', () => togglePassword(confirmPasswordInput, confirmPasswordToggle));

  // Terms checkbox change handler - clear error when checked
  if (agreeTerms) {
    agreeTerms.addEventListener('change', function() {
      if (this.checked) {
        clearError(this);
      }
    });
  }

  function togglePassword(input, toggleBtn) {
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    toggleBtn.innerHTML = type === 'password'
      ? '<i class="fas fa-eye"></i>'
      : '<i class="fas fa-eye-slash"></i>';
  }

  // Password strength indicator
  passwordInput.addEventListener('input', () => {
    const strength = calculatePasswordStrength(passwordInput.value);
    strengthFill.className = 'strength-fill ' + strength.level;
    strengthText.textContent = strength.text;
    strengthText.style.color = strength.color;
  });

  // 🟢 Form submit handler
  signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) {
      console.warn("⚠️ Validation failed, not submitting.");
      return;
    }

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const userData = {
      first_name: firstNameInput.value.trim(),
      last_name: lastNameInput.value.trim(),
      email: emailInput.value.trim(),
      password: passwordInput.value,
      role: 'farmer'
    };

    console.log("🚀 Sending signup request:", userData);

    try {
      const response = await fetch(
        'https://bmdypirsqwhghrvbhqoy.functions.supabase.co/create-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(userData)
        }
      );

      console.log("📡 Raw response:", response);

      const data = await response.json();
      console.log("📦 Parsed response:", data);

      if (response.ok && data.success) {
        showMessage('✅ Account created successfully! Redirecting...', 'success');
        sessionStorage.setItem('userEmail', userData.email);
        sessionStorage.setItem('userName', `${userData.first_name} ${userData.last_name}`);
        sessionStorage.setItem('userRole', userData.role);
        console.log("✅ Account created:", data.user);

        setTimeout(() => {
          window.location.href = '../public/index.html';
        }, 2000);
      } else {
        console.error("❌ Signup failed:", data.error);
        showMessage(`❌ Signup failed: ${data.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('❌ Network or fetch error:', error);
      showMessage('❌ Something went wrong. Please try again.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  // ---------------- Validation ----------------
  function validateForm() {
    const isNameValid = validateName(firstNameInput) && validateName(lastNameInput);
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isTermsValid = validateTerms();
    return isNameValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && isTermsValid;
  }

  function validateName(input) {
    const name = input.value.trim();
    const nameRegex = /^[a-zA-Z\s]{2,}$/;
    if (!name) return showError(input, 'Name is required'), false;
    if (!nameRegex.test(name)) return showError(input, 'Must be at least 2 letters'), false;
    clearError(input);
    return true;
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return showError(emailInput, 'Email is required'), false;
    if (!emailRegex.test(email)) return showError(emailInput, 'Invalid email'), false;
    clearError(emailInput);
    return true;
  }

  function validatePassword() {
    const val = passwordInput.value;
    if (!val) return showError(passwordInput, 'Password required'), false;
    if (val.length < 8) return showError(passwordInput, 'Min 8 characters'), false;
    clearError(passwordInput);
    return true;
  }

  function validateConfirmPassword() {
    if (confirmPasswordInput.value !== passwordInput.value)
      return showError(confirmPasswordInput, 'Passwords do not match'), false;
    clearError(confirmPasswordInput);
    return true;
  }

  function validateTerms() {
    if (!agreeTerms || !agreeTerms.checked) {
      const formGroup = agreeTerms.closest('.form-group');
      if (formGroup) {
        let error = formGroup.querySelector('.error-message');
        if (!error) {
          error = document.createElement('div');
          error.className = 'error-message';
          formGroup.appendChild(error);
        }
        formGroup.classList.add('error');
        error.textContent = 'You must agree to the terms and conditions';
        error.style.display = 'block';
      }
      return false;
    }
    const formGroup = agreeTerms.closest('.form-group');
    if (formGroup) {
      const error = formGroup.querySelector('.error-message');
      if (error) {
        error.style.display = 'none';
        error.textContent = '';
      }
      formGroup.classList.remove('error');
    }
    return true;
  }

  function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    if (score <= 2) return { level: 'weak', text: 'Weak password', color: '#EF4444' };
    if (score <= 4) return { level: 'medium', text: 'Medium password', color: '#F59E0B' };
    return { level: 'strong', text: 'Strong password', color: '#10B981' };
  }

  function showError(input, message) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    let error = formGroup.querySelector('.error-message');
    if (!error) {
      error = document.createElement('div');
      error.className = 'error-message';
      formGroup.appendChild(error);
    }
    formGroup.classList.add('error');
    error.textContent = message;
    error.style.display = 'block';
  }

  function clearError(input) {
    const formGroup = input.closest('.form-group');
    if (!formGroup) return;
    const error = formGroup.querySelector('.error-message');
    if (error) {
      error.textContent = '';
      error.style.display = 'none';
    }
    formGroup.classList.remove('error');
  }

  function showMessage(message, type) {
    const msg = document.createElement('div');
    msg.className = `alert ${type}`;
    msg.textContent = message;
    signupForm.prepend(msg);
    setTimeout(() => msg.remove(), 4000);
  }
});
