document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordToggle = document.getElementById('passwordToggle');
    const rememberMe = document.getElementById('rememberMe');
    const submitBtn = document.querySelector('.submit-btn');
    const demoButtons = document.querySelectorAll('.demo-btn');

    // Password toggle functionality
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Demo account buttons
    demoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const email = this.getAttribute('data-email');
            const password = this.getAttribute('data-password');
            
            emailInput.value = email;
            passwordInput.value = password;
            
            // Show success message
            showMessage('Demo credentials filled! Click Sign In to continue.', 'success');
        });
    });

    // Form submission
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation
    emailInput.addEventListener('blur', validateEmail);
    passwordInput.addEventListener('blur', validatePassword);

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
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    function createErrorElement(formGroup) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
        return errorElement;
    }

    function showMessage(message, type) {
        // Remove existing messages
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageElement = document.createElement('div');
        messageElement.className = `success-message ${type === 'success' ? 'show' : ''}`;
        messageElement.textContent = message;
        
        loginForm.insertBefore(messageElement, loginForm.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    }

    function submitForm() {
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            const email = emailInput.value.trim();
            const password = passwordInput.value.trim();
            
            // Check if it's a demo account
            if ((email === 'farmer@demo.com' && password === 'demo123') || 
                (email === 'admin@demo.com' && password === 'admin123')) {
                
                // Save to localStorage if remember me is checked
                if (rememberMe.checked) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }
                
                // Save user session
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('userEmail', email);
                sessionStorage.setItem('userRole', email === 'admin@demo.com' ? 'admin' : 'farmer');
                
                // Redirect to dashboard
                showMessage('Login successful! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
                
            } else {
                showMessage('Invalid credentials. Please try again.', 'error');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
            }
        }, 1500);
    }

    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        emailInput.value = rememberedEmail;
        rememberMe.checked = true;
    }
});