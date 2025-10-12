document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const farmNameInput = document.getElementById('farmName');
    const farmTypeInput = document.getElementById('farmType');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const agreeTerms = document.getElementById('agreeTerms');
    const passwordToggle = document.getElementById('passwordToggle');
    const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
    const submitBtn = document.querySelector('.submit-btn');
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');

    // Password toggle functionality
    passwordToggle.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    confirmPasswordToggle.addEventListener('click', function() {
        const type = confirmPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        confirmPasswordInput.setAttribute('type', type);
        this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
    });

    // Password strength indicator
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        strengthFill.className = 'strength-fill';
        strengthFill.classList.add(strength.level);
        
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });

    // Form submission
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation
    firstNameInput.addEventListener('blur', validateName);
    lastNameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    farmNameInput.addEventListener('blur', validateFarmName);
    farmTypeInput.addEventListener('blur', validateFarmType);
    passwordInput.addEventListener('blur', validatePassword);
    confirmPasswordInput.addEventListener('blur', validateConfirmPassword);
    agreeTerms.addEventListener('change', validateTerms);

    function validateForm() {
        const isNameValid = validateName() && validateName.call(lastNameInput);
        const isEmailValid = validateEmail();
        const isFarmNameValid = validateFarmName();
        const isFarmTypeValid = validateFarmType();
        const isPasswordValid = validatePassword();
        const isConfirmPasswordValid = validateConfirmPassword();
        const isTermsValid = validateTerms();
        
        return isNameValid && isEmailValid && isFarmNameValid && isFarmTypeValid && 
               isPasswordValid && isConfirmPasswordValid && isTermsValid;
    }

    function validateName() {
        const name = this.value.trim();
        const nameRegex = /^[a-zA-Z\s]{2,}$/;
        
        if (!name) {
            showError(this, 'Name is required');
            return false;
        } else if (!nameRegex.test(name)) {
            showError(this, 'Name must be at least 2 characters and contain only letters');
            return false;
        } else {
            clearError(this);
            return true;
        }
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

    function validateFarmName() {
        const farmName = farmNameInput.value.trim();
        
        if (!farmName) {
            showError(farmNameInput, 'Farm name is required');
            return false;
        } else if (farmName.length < 2) {
            showError(farmNameInput, 'Farm name must be at least 2 characters');
            return false;
        } else {
            clearError(farmNameInput);
            return true;
        }
    }

    function validateFarmType() {
        const farmType = farmTypeInput.value;
        
        if (!farmType) {
            showError(farmTypeInput, 'Please select your farm type');
            return false;
        } else {
            clearError(farmTypeInput);
            return true;
        }
    }

    function validatePassword() {
        const password = passwordInput.value;
        
        if (!password) {
            showError(passwordInput, 'Password is required');
            return false;
        } else if (password.length < 8) {
            showError(passwordInput, 'Password must be at least 8 characters');
            return false;
        } else {
            clearError(passwordInput);
            return true;
        }
    }

    function validateConfirmPassword() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!confirmPassword) {
            showError(confirmPasswordInput, 'Please confirm your password');
            return false;
        } else if (password !== confirmPassword) {
            showError(confirmPasswordInput, 'Passwords do not match');
            return false;
        } else {
            clearError(confirmPasswordInput);
            return true;
        }
    }

    function validateTerms() {
        if (!agreeTerms.checked) {
            showError(agreeTerms, 'You must agree to the terms and conditions');
            return false;
        } else {
            clearError(agreeTerms);
            return true;
        }
    }

    function calculatePasswordStrength(password) {
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.match(/[a-z]/)) score++;
        if (password.match(/[A-Z]/)) score++;
        if (password.match(/[0-9]/)) score++;
        if (password.match(/[^a-zA-Z0-9]/)) score++;
        
        if (score <= 2) {
            return { level: 'weak', text: 'Weak password', color: '#EF4444' };
        } else if (score <= 4) {
            return { level: 'medium', text: 'Medium password', color: '#F59E0B' };
        } else {
            return { level: 'strong', text: 'Strong password', color: '#10B981' };
        }
    }

    function showError(input, message) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message') || createErrorElement(formGroup);
        
        if (input.type === 'checkbox') {
            formGroup.classList.add('error');
        } else {
            input.closest('.input-group').classList.add('error');
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }

    function clearError(input) {
        const formGroup = input.closest('.form-group');
        const errorElement = formGroup.querySelector('.error-message');
        
        if (input.type === 'checkbox') {
            formGroup.classList.remove('error');
        } else {
            input.closest('.input-group').classList.remove('error');
        }
        
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
        
        signupForm.insertBefore(messageElement, signupForm.firstChild);
        
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
            const userData = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                email: emailInput.value.trim(),
                farmName: farmNameInput.value.trim(),
                farmType: farmTypeInput.value,
                password: passwordInput.value
            };
            
            // Save to localStorage (in real app, this would be an API call)
            const users = JSON.parse(localStorage.getItem('farmUsers') || '[]');
            
            // Check if user already exists
            const existingUser = users.find(user => user.email === userData.email);
            if (existingUser) {
                showMessage('An account with this email already exists.', 'error');
                submitBtn.classList.remove('loading');
                submitBtn.disabled = false;
                return;
            }
            
            // Add new user
            users.push({
                ...userData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('farmUsers', JSON.stringify(users));
            
            // Save user session
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userEmail', userData.email);
            sessionStorage.setItem('userName', `${userData.firstName} ${userData.lastName}`);
            sessionStorage.setItem('userRole', 'farmer');
            sessionStorage.setItem('farmName', userData.farmName);
            
            // Show success message and redirect
            showMessage('Account created successfully! Redirecting to dashboard...', 'success');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
            
        }, 2000);
    }
});