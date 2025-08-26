// Tab Navigation Module
const TabManager = {
    currentTab: 'home',
    
    init() {
        this.bindEvents();
        this.switchTab('home');
        this.initMobileMenu();
    },
    
    switchTab(tabId) {
        // Update current tab
        this.currentTab = tabId;
        
        // Hide all tab contents
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            if (content.id === `tab-${tabId}`) {
                content.classList.remove('hidden');
            } else {
                content.classList.add('hidden');
            }
        });
        
        // Update active nav links
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => {
            if (link.dataset.tab === tabId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Close mobile menu if open
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
        }
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        // Trigger tab-specific initialization if needed
        this.onTabSwitch(tabId);
    },
    
    onTabSwitch(tabId) {
        // Trigger specific initialization for each tab
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
            case 'projects':
                if (typeof ProjectsManager !== 'undefined') {
                    ProjectsManager.init();
                }
                break;
            // Add more cases as needed
        }
    },
    
    bindEvents() {
        // Bind navigation links
        const allNavLinks = document.querySelectorAll('.nav-link');
        allNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
        
        // Bind card links (on home page)
        const cardLinks = document.querySelectorAll('[data-tab-link]');
        cardLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.dataset.tabLink;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
    },
    
    initMobileMenu() {
        const mobileMenuButton = document.getElementById('mobile-menu-button');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (mobileMenuButton && mobileMenu) {
            mobileMenuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }
};

// Accordion Module
const AccordionManager = {
    init() {
        const accordionToggles = document.querySelectorAll('.accordion-toggle');
        
        accordionToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                this.toggleAccordion(toggle);
            });
        });
    },
    
    toggleAccordion(toggle) {
        const content = toggle.nextElementSibling;
        const isActive = toggle.classList.contains('active');
        
        // Find parent container to close other accordions in the same group
        const parentContainer = toggle.closest('.space-y-4, .space-y-8, .grid');
        if (parentContainer) {
            parentContainer.querySelectorAll('.accordion-toggle').forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    otherToggle.classList.remove('active');
                    const otherContent = otherToggle.nextElementSibling;
                    if (otherContent) {
                        otherContent.style.maxHeight = null;
                    }
                }
            });
        }
        
        // Toggle current accordion
        toggle.classList.toggle('active', !isActive);
        if (content) {
            if (!isActive) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = null;
            }
        }
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    TabManager.init();
    AccordionManager.init();
});