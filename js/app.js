// Main Application Controller - Updated Version
const App = {
    currentTab: 'home',
    isInitialized: false,
    isNavigating: false,
    pageCache: {},
    
    // Page mapping configuration
    pageMap: {
        'home': 'pages/home.html',
        'members': 'pages/members.html',
        'publications': 'pages/publications.html',
        'projects': 'pages/projects.html',
        'journal-club': 'pages/journal-club.html',
        'news': 'pages/news.html',
        'join-us': 'pages/join-us.html'
    },
    
    async init() {
        // Prevent multiple initializations
        if (this.isInitialized) {
            console.log('App already initialized');
            return;
        }
        
        console.log('Initializing App...');
        
        // Load components first
        await this.loadComponents();
        
        // Initialize router ONCE
        this.initRouter();
        
        // Initialize mobile menu ONCE
        this.initMobileMenu();
        
        // Initialize accordion functionality
        this.initAccordions();
        
        // Load initial page
        await this.loadPage('home');
        
        this.isInitialized = true;
        console.log('App initialization complete');
    },
    
    async loadComponents() {
        try {
            // Load all components in parallel for better performance
            const [headerHtml, footerHtml, drawerHtml] = await Promise.all([
                this.fetchHTML('components/header.html'),
                this.fetchHTML('components/footer.html'),
                this.fetchHTML('components/drawer.html')
            ]);
            
            document.getElementById('header-container').innerHTML = headerHtml;
            document.getElementById('footer-container').innerHTML = footerHtml;
            document.getElementById('drawer-container-wrapper').innerHTML = drawerHtml;
            
            console.log('Components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    },
    
    async fetchHTML(path) {
        // Check cache first
        if (this.pageCache[path]) {
            return this.pageCache[path];
        }
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                throw new Error(`Failed to load ${path}: ${response.status}`);
            }
            const html = await response.text();
            
            // Cache the result
            this.pageCache[path] = html;
            return html;
        } catch (error) {
            console.error(`Error loading ${path}:`, error);
            return `<div class="p-4 text-red-600">Failed to load content from ${path}</div>`;
        }
    },
    
    async loadPage(tabId) {
        // Prevent multiple simultaneous navigations
        if (this.isNavigating) {
            console.log('Navigation already in progress');
            return;
        }
        
        // Check if we're already on this page
        if (this.currentTab === tabId && document.getElementById('main-content').children.length > 0) {
            console.log(`Already on page: ${tabId}`);
            return;
        }
        
        this.isNavigating = true;
        console.log(`Loading page: ${tabId}`);
        
        const pagePath = this.pageMap[tabId];
        if (!pagePath) {
            console.error(`Page not found: ${tabId}`);
            this.isNavigating = false;
            return;
        }
        
        try {
            // Update current tab
            this.currentTab = tabId;
            
            // Get main content container
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
            
            // Close mobile menu if open
            this.closeMobileMenu();
            
            // Initialize page-specific modules after a short delay
            setTimeout(() => {
                this.initPageModules(tabId);
                // Re-initialize accordions for the new page
                if (tabId === 'join-us') {
                    this.initAccordions();
                }
            }, 100);
            
            // Scroll to top
            window.scrollTo(0, 0);
            
        } catch (error) {
            console.error(`Error loading page ${tabId}:`, error);
            // Show error message
            document.getElementById('main-content').innerHTML = `
                <div class="flex items-center justify-center py-20">
                    <div class="text-center">
                        <div class="text-red-500 text-xl mb-4">⚠️</div>
                        <p class="text-red-600">Failed to load page: ${tabId}</p>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-brand-accent text-white rounded hover:bg-opacity-90">
                            Refresh Page
                        </button>
                    </div>
                </div>
            `;
        } finally {
            this.isNavigating = false;
        }
    },
    
    updateNavigation(activeTab) {
        // Update all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            const isActive = link.dataset.tab === activeTab;
            
            if (isActive) {
                link.classList.add('active', 'text-brand-navy', 'font-semibold');
                link.classList.remove('text-gray-600');
            } else {
                link.classList.remove('active', 'text-brand-navy', 'font-semibold');
                link.classList.add('text-gray-600');
            }
        });
    },
    
    initRouter() {
        // Remove any existing listeners first
        const oldClickHandler = this.clickHandler;
        if (oldClickHandler) {
            document.removeEventListener('click', oldClickHandler);
        }
        
        // Create new click handler
        this.clickHandler = (e) => {
            // Handle nav links
            const navLink = e.target.closest('.nav-link');
            if (navLink && navLink.dataset.tab) {
                e.preventDefault();
                e.stopPropagation();
                const tabId = navLink.dataset.tab;
                this.loadPage(tabId);
                return;
            }
            
            // Handle tab-link (cards on home page)
            const tabLink = e.target.closest('[data-tab-link]');
            if (tabLink && tabLink.dataset.tabLink) {
                e.preventDefault();
                e.stopPropagation();
                const tabId = tabLink.dataset.tabLink;
                this.loadPage(tabId);
                return;
            }
        };
        
        // Add the new click handler
        document.addEventListener('click', this.clickHandler);
        console.log('Router initialized');
    },
    
    initPageModules(tabId) {
        console.log(`Initializing modules for ${tabId}`);
        
        // Clean up previous module states if needed
        this.cleanupModules();
        
        // Initialize page-specific JavaScript modules
        switch(tabId) {
            case 'publications':
                if (typeof PublicationsManager !== 'undefined') {
                    PublicationsManager.initialized = false; // Reset state
                    PublicationsManager.init();
                }
                break;
            case 'members':
                if (typeof MembersManager !== 'undefined') {
                    MembersManager.initialized = false; // Reset state
                    MembersManager.init();
                }
                break;
            case 'projects':
                if (typeof ProjectsManager !== 'undefined') {
                    ProjectsManager.initialized = false; // Reset state
                    ProjectsManager.init();
                }
                break;
            case 'journal-club':
                console.log('Initializing Journal Club Manager...');
                if (typeof JournalClubManager !== 'undefined') {
                    JournalClubManager.initialized = false; // Reset state
                    JournalClubManager.init();
                } else {
                    console.warn('JournalClubManager not found');
                }
                break;
            case 'news':
                if (typeof NewsManager !== 'undefined') {
                    NewsManager.initialized = false; // Reset state
                    NewsManager.init();
                }
                break;
        }
    },
    
    cleanupModules() {
        // Clean up any module-specific event listeners or states
        // This prevents memory leaks and conflicts
        const searchInputs = document.querySelectorAll('#publication-search, #project-search, #journal-search');
        searchInputs.forEach(input => {
            if (input) {
                // Clone node to remove all event listeners
                const newInput = input.cloneNode(true);
                input.parentNode.replaceChild(newInput, input);
            }
        });
    },
    
    initMobileMenu() {
        // Remove any existing mobile menu handler
        if (this.mobileMenuHandler) {
            document.removeEventListener('click', this.mobileMenuHandler);
        }
        
        this.mobileMenuHandler = (e) => {
            if (e.target.closest('#mobile-menu-button')) {
                e.preventDefault();
                this.toggleMobileMenu();
            }
        };
        
        document.addEventListener('click', this.mobileMenuHandler);
        console.log('Mobile menu initialized');
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
    },
    
    initAccordions() {
        const accordionToggles = document.querySelectorAll('.accordion-toggle');
        
        accordionToggles.forEach(toggle => {
            // Remove existing listeners
            const newToggle = toggle.cloneNode(true);
            toggle.parentNode.replaceChild(newToggle, toggle);
            
            // Add new listener
            newToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleAccordion(newToggle);
            });
        });
    },
    
    toggleAccordion(toggle) {
        const content = toggle.nextElementSibling;
        const isActive = toggle.classList.contains('active');
        
        // Find parent container to close other accordions in the same group
        const parentContainer = toggle.closest('.space-y-4');
        if (parentContainer) {
            parentContainer.querySelectorAll('.accordion-toggle').forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.classList.remove('active');
                    const otherContent = otherToggle.nextElementSibling;
                    if (otherContent && otherContent.classList.contains('accordion-content')) {
                        otherContent.style.maxHeight = null;
                    }
                }
            });
        }
        
        // Toggle current accordion
        toggle.classList.toggle('active', !isActive);
        if (content && content.classList.contains('accordion-content')) {
            if (!isActive) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = null;
            }
        }
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        App.init();
    });
} else {
    // DOM is already loaded
    App.init();
}