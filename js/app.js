// Main Application JavaScript
const App = {
    currentPage: 'home',
    
    async init() {
        console.log('Initializing App...');
        
        // Load components
        await this.loadComponents();
        
        // Initialize navigation
        this.setupNavigation();
        
        // Initialize mobile menu
        this.setupMobileMenu();
        
        // Load initial page (home)
        await this.loadPage('home');
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'home';
            this.loadPage(page, false);
        });
    },
    
    async loadComponents() {
        try {
            // Load header
            const headerResponse = await fetch('./components/header.html');
            const headerHTML = await headerResponse.text();
            document.getElementById('header-container').innerHTML = headerHTML;
            
            // Load footer
            const footerResponse = await fetch('./components/footer.html');
            const footerHTML = await footerResponse.text();
            document.getElementById('footer-container').innerHTML = footerHTML;
            
            // Load drawer
            const drawerResponse = await fetch('./components/drawer.html');
            const drawerHTML = await drawerResponse.text();
            document.getElementById('drawer-container-wrapper').innerHTML = drawerHTML;
            
            console.log('Components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    },
    
    setupNavigation() {
        // Handle all navigation links - but NOT cards on home page
        document.addEventListener('click', async (e) => {
            // Check if clicked element or its parent is a nav-link
            const navLink = e.target.closest('.nav-link');
            
            if (navLink && navLink.dataset.tab) {
                e.preventDefault();
                e.stopPropagation();
                
                const targetPage = navLink.dataset.tab;
                console.log('Navigation clicked:', targetPage);
                
                // Don't reload if we're already on that page (unless it's a card click on home page)
                if (this.currentPage !== targetPage || this.currentPage === 'home') {
                    await this.loadPage(targetPage);
                }
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    },
    
    setupMobileMenu() {
        const menuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    },
    
    async loadPage(page, updateHistory = true) {
        console.log(`Loading page: ${page}`);
        
        // Update current page
        this.currentPage = page;
        
        // Update active nav states
        this.updateActiveNav(page);
        
        try {
            const response = await fetch(`./pages/${page}.html`);
            if (!response.ok) {
                throw new Error(`Page not found: ${page}`);
            }
            
            const html = await response.text();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = html;
                
                // Scroll to top
                window.scrollTo(0, 0);
                
                // IMPORTANT: Wait for DOM to be fully rendered before initializing page
                // Use requestAnimationFrame to ensure DOM is painted
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        this.initializePage(page);
                    });
                });
                
                // Update browser history
                if (updateHistory) {
                    history.pushState({ page }, '', `#${page}`);
                }
                
                // Update page title
                const titles = {
                    'home': 'Home',
                    'members': 'Members',
                    'publications': 'Publications', 
                    'projects': 'Research Projects',
                    'journal-club': 'Journal Club',
                    'news': 'News & Announcements',
                    'join-us': 'Contact Us'
                };
                document.title = `${titles[page] || page} | UNIST Financial Engineering Lab`;
            }
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            // Load home page as fallback
            if (page !== 'home') {
                this.loadPage('home');
            }
        }
    },
    
    updateActiveNav(activePage) {
        // Remove all active classes
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active', 'text-brand-navy', 'font-semibold');
            link.classList.add('text-gray-600');
        });
        
        // Add active class to current page links
        document.querySelectorAll(`.nav-link[data-tab="${activePage}"]`).forEach(link => {
            link.classList.add('active', 'text-brand-navy', 'font-semibold');
            link.classList.remove('text-gray-600');
        });
    },
    
    initializePage(page) {
        console.log(`Initializing ${page} page functionality`);
        
        switch(page) {
            case 'home':
                // Initialize news carousel for home page
                // Add more robust checking and logging
                const initCarousel = () => {
                    console.log('Attempting to initialize carousel...');
                    
                    // Check if NewsCarousel module is loaded
                    if (typeof NewsCarousel === 'undefined') {
                        console.error('NewsCarousel module not loaded!');
                        return;
                    }
                    
                    // Check if the main content has the carousel element
                    const mainContent = document.getElementById('main-content');
                    console.log('Main content innerHTML length:', mainContent ? mainContent.innerHTML.length : 0);
                    
                    const carouselElement = document.getElementById('news-carousel');
                    console.log('Carousel element found:', !!carouselElement);
                    
                    if (carouselElement) {
                        console.log('Found carousel, resetting and initializing...');
                        NewsCarousel.reset();
                        
                        // Use a promise to ensure async operations complete
                        Promise.resolve().then(() => {
                            NewsCarousel.init().then(() => {
                                console.log('Carousel initialized successfully');
                            }).catch(err => {
                                console.error('Carousel init failed:', err);
                            });
                        });
                    } else {
                        console.log('Carousel element not found, retrying in 500ms...');
                        setTimeout(initCarousel, 500);
                    }
                };
                
                // Start initialization after a brief delay
                setTimeout(initCarousel, 300);
                break;
                
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
                
            case 'projects':
                if (typeof ProjectsManager !== 'undefined') {
                    ProjectsManager.init();
                }
                break;
                
            case 'journal-club':
                if (typeof JournalClubManager !== 'undefined') {
                    JournalClubManager.init();
                }
                break;
                
            case 'news':
                if (typeof NewsManager !== 'undefined') {
                    NewsManager.init();
                }
                break;
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App globally available
window.App = App;