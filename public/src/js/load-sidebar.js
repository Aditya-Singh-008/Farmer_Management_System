// src/js/load-sidebar.js
function loadSidebar() {
    fetch('./sidebar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('Sidebar HTML not found');
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('sidebar-container').innerHTML = html;
            
            // Load sidebar CSS if not already loaded
            if (!document.querySelector('link[href*="sidebar.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = './src/css/sidebar.css';
                document.head.appendChild(link);
            }
            
            // Dispatch event that sidebar is loaded
            document.dispatchEvent(new Event('sidebarLoaded'));
        })
        .catch(error => {
            console.error('Error loading sidebar:', error);
            // Fallback: Create basic sidebar structure
            createFallbackSidebar();
        });
}

function createFallbackSidebar() {
    document.getElementById('sidebar-container').innerHTML = `
        <aside class="sidebar collapsed" id="mainSidebar">
            <div class="sidebar-header">
                <div class="logo">
                    <h2>SF</h2>
                </div>
            </div>
            <nav class="sidebar-nav">
                <a href="index.html" class="nav-link">🏠</a>
                <a href="crops.html" class="nav-link">🌱</a>
                <a href="fields.html" class="nav-link">🚜</a>
                <a href="marketplace.html" class="nav-link">🏪</a>
            </nav>
            <div class="sidebar-footer">
                <button class="theme-toggle-btn" id="themeToggle">🌙</button>
            </div>
        </aside>
    `;
    document.dispatchEvent(new Event('sidebarLoaded'));
}

document.addEventListener('DOMContentLoaded', loadSidebar);