// Main Application Controller - Phase 1
const App = {
    currentTab: 'home',
    components: {},
    pages: {},
    
    // 페이지 매핑 정보
    pageMap: {
        'home': 'pages/home.html',
        'members': 'pages/members.html',
        'publications': 'pages/publications.html',
        'projects': 'pages/projects.html',
        'activities': 'pages/activities.html',
        'journal-club': 'pages/journal-club.html',
        'news': 'pages/news.html',
        'join-us': 'pages/join-us.html'
    },
    
    async init() {
        console.log('Initializing App...');
        
        // Load components first
        await this.loadComponents();
        
        // Initialize router
        this.initRouter();
        
        // Load initial page
        await this.loadPage('home');
        
        // Initialize mobile menu
        this.initMobileMenu();
    },
    
    async loadComponents() {
        // Load header
        const headerHtml = await this.fetchHTML('components/header.html');
        document.getElementById('header-container').innerHTML = headerHtml;
        
        // Load footer
        const footerHtml = await this.fetchHTML('components/footer.html');
        document.getElementById('footer-container').innerHTML = footerHtml;
        
        // Load drawer
        const drawerHtml = await this.fetchHTML('components/drawer.html');
        document.getElementById('drawer-container-wrapper').innerHTML = drawerHtml;
        
        console.log('Components loaded');
    },
    
    async fetchHTML(path) {
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}`);
            }
            return await response.text();
        } catch (error) {
            console.error(`Error loading ${path}:`, error);
            return `<div class="p-4 text-red-600">Failed to load content from ${path}</div>`;
        }
    },
    
    async loadPage(tabId) {
        console.log(`Loading page: ${tabId}`);
        
        const pagePath = this.pageMap[tabId];
        if (!pagePath) {
            console.error(`Page not found: ${tabId}`);
            return;
        }
        
        // Update current tab
        this.currentTab = tabId;
        
        // Load page content
        const mainContent = document.getElementById('main-content');
        
        // Show loading state
        mainContent.innerHTML = `
            <div class="flex items-center justify-center py-20">
                <div class="inline-flex items-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-brand-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading...
                </div>
            </div>
        `;
        
        // Fetch and load page content
        const pageHtml = await this.fetchHTML(pagePath);
        mainContent.innerHTML = pageHtml;
        
        // Update navigation active states
        this.updateNavigation(tabId);
        
        // Initialize page-specific modules
        this.initPageModules(tabId);
        
        // Close mobile menu if open
        this.closeMobileMenu();
        
        // Scroll to top
        window.scrollTo(0, 0);
    },
    
    updateNavigation(activeTab) {
        // Update all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.dataset.tab === activeTab) {
                link.classList.add('active', 'text-brand-navy', 'font-semibold');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('active', 'text-brand-navy', 'font-semibold');
                link.classList.add('text-gray-600');
            }
        });
    },
    
    initRouter() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            // Handle nav links
            const navLink = e.target.closest('.nav-link');
            if (navLink) {
                e.preventDefault();
                const tabId = navLink.dataset.tab;
                if (tabId) {
                    this.loadPage(tabId);
                }
            }
            
            // Handle tab-link (cards on home page)
            const tabLink = e.target.closest('[data-tab-link]');
            if (tabLink) {
                e.preventDefault();
                const tabId = tabLink.dataset.tabLink;
                if (tabId) {
                    this.loadPage(tabId);
                }
            }
        });
    },
    
    initPageModules(tabId) {
        // Initialize page-specific JavaScript modules
        switch(tabId) {
            case 'publications':
                if (typeof PublicationsManager !== 'undefined') {
                    PublicationsManager.init();
                }
                break;
            case 'members':
                if (typeof MembersManager !== 'undefined') {
                    MembersManager.init();
                }
                break;
            // Add more cases as needed
        }
    },
    
    initMobileMenu() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobile-menu-button')) {
                this.toggleMobileMenu();
            }
        });
    },
    
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    },
    
    closeMobileMenu() {
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});