document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const emailInput = document.getElementById('email');
    const submitBtn = document.querySelector('.submit-btn');

    // Form submission
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitForm();
        }
    });

    // Real-time validation
    emailInput.addEventListener('blur', validateEmail);

    function validateForm() {
        return validateEmail();
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
        
        if (type === 'success') {
            messageElement.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <div>${message}</div>
            `;
        } else {
            messageElement.textContent = message;
        }
        
        forgotPasswordForm.insertBefore(messageElement, forgotPasswordForm.firstChild);
        
        // Auto-remove after 8 seconds for success messages
        if (type === 'success') {
            setTimeout(() => {
                messageElement.remove();
            }, 8000);
        } else {
            setTimeout(() => {
                messageElement.remove();
            }, 5000);
        }
    }

    function submitForm() {
        // Show loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
            const email = emailInput.value.trim();
            
            // Check if user exists (in real app, this would be an API call)
            const users = JSON.parse(localStorage.getItem('farmUsers') || '[]');
            const userExists = users.some(user => user.email === email);
            
            if (userExists) {
                // In a real application, you would send an email here
                // For demo purposes, we'll just show a success message
                
                // Store reset token (in real app, this would be generated server-side)
                const resetToken = generateResetToken();
                localStorage.setItem(`resetToken_${email}`, resetToken);
                localStorage.setItem(`resetTokenExpiry_${email}`, (Date.now() + 3600000).toString()); // 1 hour
                
                showMessage(`
                    <strong>Reset instructions sent!</strong><br>
                    We've sent password reset instructions to ${email}. 
                    Please check your inbox and follow the link to reset your password.
                    <br><br>
                    <small><em>Note: This is a demo. In a real application, an email would be sent.</em></small>
                `, 'success');
                
                // Clear form
                emailInput.value = '';
                
            } else {
                showMessage('No account found with this email address. Please check your email or create a new account.', 'error');
            }
            
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
            
        }, 2000);
    }

    function generateResetToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
});