// login.js — Login page script (calls Edge Function /login)
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordToggle = document.getElementById('passwordToggle');
  const rememberMe = document.getElementById('rememberMe');
  const submitBtn = document.querySelector('.submit-btn');
  const demoButtons = document.querySelectorAll('.demo-btn');

  // Password toggle functionality
  if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener('click', function() {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });
  }

  // Demo account buttons (fill credentials)
  demoButtons.forEach(button => {
    button.addEventListener('click', function() {
      const email = this.getAttribute('data-email');
      const password = this.getAttribute('data-password');
      emailInput.value = email;
      passwordInput.value = password;
      showMessage('Demo credentials filled! Click Sign In to continue.', 'success');
    });
  });

  // Restore remembered email
  const rememberedEmail = localStorage.getItem('rememberedEmail');
  if (rememberedEmail) {
    emailInput.value = rememberedEmail;
    rememberMe.checked = true;
  }

  // Form submission
  loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if (validateForm()) {
      submitForm();
    }
  });

  // Real-time validation hooks
  emailInput.addEventListener('blur', validateEmail);
  passwordInput.addEventListener('blur', validatePassword);

  // ---------------- Core submit flow (calls Edge Function) ----------------
  async function submitForm() {
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    console.log('🚀 Login attempt:', email);

    try {
      // Use FarmerAPI.login() from api.js
      if (!window.FarmerAPI || !window.FarmerAPI.login) {
        showMessage('API not loaded. Please refresh the page.', 'error');
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        return;
      }

      const response = await window.FarmerAPI.login(email, password);

      if (response.success) {
        // Persist remember-me
        if (rememberMe && rememberMe.checked) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        console.log('✅ Login success:', response.user);
        showMessage('Login successful! Redirecting...', 'success');

        // Set isLoggedIn flag
        sessionStorage.setItem('isLoggedIn', 'true');

        const authUser = response.session?.user || response.user;
        if (authUser) {
          sessionStorage.setItem('currentUser', JSON.stringify(authUser));
        } else if (response.user) {
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
        }

        const authId = authUser?.id || response.user?.auth_user_id || null;
        if (authId) {
          sessionStorage.setItem('authUserId', authId);
        }

        const appUserId =
          response.user?.user_id ||
          (response.user?.auth_user_id && response.user?.id && response.user.id !== response.user.auth_user_id
            ? response.user.id
            : null);

        if (appUserId) {
          sessionStorage.setItem('appUserId', appUserId);
        }

        window.currentProfile = {
          ...(window.currentProfile || {}),
          ...(authId ? { auth_user_id: authId } : {}),
          ...(appUserId ? { user_id: appUserId } : {})
        };

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 900);
      } else {
        // Handle error
        const errorMsg = response.error || 'Invalid credentials';
        
        // Check for email not confirmed
        if (errorMsg.toLowerCase().includes('not confirmed') || 
            errorMsg.toLowerCase().includes('email not confirmed') ||
            errorMsg.toLowerCase().includes('confirm')) {
          showMessage('Your email is not confirmed. Check your inbox or send a magic link to sign in.', 'warning');
          showResendMagicLinkUI(email);
        } else {
          showMessage(errorMsg, 'error');
        }
        
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
      }
    } catch (err) {
      console.error('Network/login error:', err);
      showMessage('Network error — check your connection and try again.', 'error');
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  // ---------------- Resend / Magic-link UI and logic ----------------
  function showResendMagicLinkUI(email) {
    let container = document.getElementById('magic-link-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'magic-link-container';
      container.style.marginTop = '12px';
      loginForm.appendChild(container);
    }
    container.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="sendMagicBtn" class="btn-small">Send magic link</button>
        <button id="resendConfirmBtn" class="btn-small secondary">Resend confirmation</button>
        <span id="magicStatus" style="margin-left:8px;color:#666;font-size:0.95rem"></span>
      </div>
    `;

    const sendMagicBtn = document.getElementById('sendMagicBtn');
    const resendConfirmBtn = document.getElementById('resendConfirmBtn');
    const magicStatus = document.getElementById('magicStatus');

    // Magic link via client-side supabase
    sendMagicBtn.addEventListener('click', async () => {
      magicStatus.textContent = 'Sending magic link…';
      if (window.supabase && typeof window.supabase.auth?.signInWithOtp === 'function') {
        try {
          const { data, error } = await window.supabase.auth.signInWithOtp({ email });
          if (error) {
            magicStatus.textContent = `Failed: ${error.message}`;
            console.error('Magic link error:', error);
          } else {
            magicStatus.textContent = 'Magic link sent — check your email.';
          }
        } catch (err) {
          console.error('Magic link exception:', err);
          magicStatus.textContent = 'Failed to send magic link.';
        }
      } else {
        magicStatus.textContent = 'Magic link not available (client supabase not loaded).';
      }
    });

    resendConfirmBtn.addEventListener('click', async () => {
      magicStatus.textContent = 'Requesting resend…';
      try {
        if (window.supabase && typeof window.supabase.auth?.signInWithOtp === 'function') {
          const { data, error } = await window.supabase.auth.signInWithOtp({ email });
          if (error) {
            magicStatus.textContent = `Failed: ${error.message}`;
            console.error('Resend confirmation (magic link) error:', error);
          } else {
            magicStatus.textContent = 'Magic link sent — check your inbox.';
          }
        } else {
          magicStatus.textContent = 'No server endpoint configured for resending confirmation.';
        }
      } catch (err) {
        console.error('Resend confirmation error:', err);
        magicStatus.textContent = 'Failed to resend confirmation.';
      }
    });
  }

  // ---------------- Validation helpers ----------------
  function validateForm() {
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    return isEmailValid && isPasswordValid;
  }

  function validateEmail() {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      showError(emailInput, 'Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      showError(emailInput, 'Please enter a valid email address');
      return false;
    } else {
      clearError(emailInput);
      return true;
    }
  }

  function validatePassword() {
    const password = passwordInput.value.trim();
    if (!password) {
      showError(passwordInput, 'Password is required');
      return false;
    } else if (password.length < 6) {
      showError(passwordInput, 'Password must be at least 6 characters');
      return false;
    } else {
      clearError(passwordInput);
      return true;
    }
  }

  function showError(input, message) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message') || createErrorElement(formGroup);
    input.closest('.input-group').classList.add('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }

  function clearError(input) {
    const formGroup = input.closest('.form-group');
    const errorElement = formGroup.querySelector('.error-message');
    input.closest('.input-group').classList.remove('error');
    if (errorElement) errorElement.style.display = 'none';
  }

  function createErrorElement(formGroup) {
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    formGroup.appendChild(errorElement);
    return errorElement;
  }

  function showMessage(message, type) {
    // Remove any existing message
    const existing = loginForm.querySelector('.success-message');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `success-message ${type === 'success' ? 'show' : ''}`;
    if (type === 'error' || type === 'warning') {
      el.style.color = type === 'error' ? '#721c24' : '#856404';
      el.style.background = type === 'error' ? '#f8d7da' : '#fff3cd';
    }
    el.textContent = message;
    loginForm.insertBefore(el, loginForm.firstChild);

    setTimeout(() => {
      if (el) el.remove();
    }, 5000);
  }
});
