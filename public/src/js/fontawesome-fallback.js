// Font Awesome Fallback Script
(function() {
    // Check if Font Awesome loaded by testing for a specific icon
    function checkFontAwesome() {
        const testIcon = document.createElement('i');
        testIcon.className = 'fas fa-home';
        testIcon.style.visibility = 'hidden';
        testIcon.style.position = 'absolute';
        document.body.appendChild(testIcon);
        
        const computed = window.getComputedStyle(testIcon, ':before');
        const fontFamily = computed.getPropertyValue('font-family');
        
        document.body.removeChild(testIcon);
        
        return fontFamily.includes('Font Awesome') || fontFamily.includes('FontAwesome');
    }
    
    // Try to load from alternative CDN if Font Awesome didn't load
    function loadFontAwesomeFallback() {
        if (!checkFontAwesome()) {
            console.warn('Font Awesome not loaded, trying fallback CDN...');
            
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css';
            
            link.onerror = function() {
                console.warn('First fallback failed, trying second fallback...');
                this.href = 'https://use.fontawesome.com/releases/v6.4.0/css/all.css';
                this.onerror = function() {
                    console.error('All Font Awesome CDNs failed. Please check your internet connection.');
                };
            };
            
            document.head.appendChild(link);
        }
    }
    
    // Check after page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(loadFontAwesomeFallback, 1000);
        });
    } else {
        setTimeout(loadFontAwesomeFallback, 1000);
    }
})();

