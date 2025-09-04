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
        
        // Handle initial URL
        this.handleInitialRoute();
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handleRoute();
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
            
            console.log('Components loaded successfully');
        } catch (error) {
            console.error('Error loading components:', error);
        }
    },
    
    handleInitialRoute() {
        const hash = window.location.hash.slice(1); // Remove #
        if (hash.startsWith('profile/')) {
            const parts = hash.split('/');
            const memberId = parts[1];
            // Load members page first, then navigate to profile
            this.loadPage('members').then(() => {
                setTimeout(() => {
                    this.loadProfile(memberId);
                }, 100);
            });
        } else if (hash) {
            this.loadPage(hash);
        } else {
            this.loadPage('home');
        }
    },
    
    handleRoute() {
        const hash = window.location.hash.slice(1);
        if (hash.startsWith('profile/')) {
            const parts = hash.split('/');
            const memberId = parts[1];
            this.loadProfile(memberId);
        } else if (hash) {
            this.loadPage(hash, false);
        } else {
            this.loadPage('home', false);
        }
    },
    
    setupNavigation() {
        // Handle all navigation links
        document.addEventListener('click', async (e) => {
            // Check if clicked element or its parent is a nav-link
            const navLink = e.target.closest('.nav-link');
            
            if (navLink && navLink.dataset.tab) {
                e.preventDefault();
                
                const targetPage = navLink.dataset.tab;
                console.log('Navigation clicked:', targetPage);
                
                // Always load the page when navigation is clicked
                await this.loadPage(targetPage);
                
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
                    'activities': 'Activities',
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
    
    async loadProfile(memberId) {
        console.log(`Loading profile: ${memberId}`);
        
        try {
            // Load the profile template
            const response = await fetch('./pages/profile.html');
            if (!response.ok) {
                throw new Error('Failed to load profile template');
            }
            
            const html = await response.text();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = html;
                window.scrollTo(0, 0);
                
                // Update URL
                history.pushState({ profile: memberId }, '', `#members/${memberId}`);
                
                // Initialize profile with member data
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        if (typeof ProfileManager !== 'undefined') {
                            ProfileManager.init(memberId);
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            this.loadPage('members');
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
                const initCarousel = () => {
                    console.log('Attempting to initialize carousel...');
                    
                    if (typeof NewsCarousel === 'undefined') {
                        console.error('NewsCarousel module not loaded!');
                        return;
                    }
                    
                    const carouselElement = document.getElementById('news-carousel');
                    if (carouselElement) {
                        console.log('Found carousel, resetting and initializing...');
                        NewsCarousel.reset();
                        
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

            case 'activities':
                if (typeof ActivitiesManager !== 'undefined') {
                    ActivitiesManager.init();
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