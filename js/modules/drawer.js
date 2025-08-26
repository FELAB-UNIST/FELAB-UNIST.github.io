// Drawer Manager Module
const DrawerManager = {
    drawerData: null,
    
    async init() {
        // Load drawer data if needed
        await this.loadDrawerData();
        
        // Bind escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeDrawer();
            }
        });
    },
    
    async loadDrawerData() {
        // This could be loaded from JSON in the future
        // For now, we'll define it here
        this.drawerData = {
            'member-yongjae-lee': {
                title: 'Yongjae Lee',
                content: '<p>Professor at UNIST Financial Engineering Lab</p>'
            },
            'member-junhyeong-lee': {
                title: 'Junhyeong Lee',
                content: '<p>Ph.D-M.S Combined Student</p>'
            },
            'member-inwoo-tae': {
                title: 'Inwoo Tae',
                content: '<p>Ph.D-M.S Combined Student</p>'
            },
            'member-juchan-kim': {
                title: 'Juchan Kim',
                content: '<p>Ph.D-M.S Combined Student</p>'
            },
            'member-kangmin-kim': {
                title: 'Kangmin Kim',
                content: '<p>Ph.D-M.S Combined Student</p>'
            },
            'member-hoyoung-lee': {
                title: 'Hoyoung Lee',
                content: '<p>M.S. Student</p>'
            },
            'news': {
                title: 'News Article',
                content: '<p>Full news article content here.</p>'
            },
            'conference-informs-2024': {
                title: 'INFORMS Annual Meeting 2024',
                content: `
                    <img src="https://placehold.co/400x250/2563EB/FFFFFF?text=Conference+Photo" 
                         alt="Team at INFORMS 2024" 
                         class="rounded-lg mb-4 w-full h-auto object-cover">
                    <p class="text-gray-600 mb-2"><strong>Location:</strong> Seattle, WA</p>
                    <p class="text-gray-600 mb-4">Our team presented two papers at the INFORMS Annual Meeting...</p>
                `
            }
        };
    },
    
    openDrawer(type) {
        const drawerContainer = document.getElementById('drawer-container');
        const drawerTitle = document.getElementById('drawer-title');
        const drawerContent = document.getElementById('drawer-content');
        
        if (this.drawerData && this.drawerData[type]) {
            drawerTitle.textContent = this.drawerData[type].title;
            drawerContent.innerHTML = this.drawerData[type].content;
            drawerContainer.classList.add('is-open');
            document.body.style.overflow = 'hidden';
        }
    },
    
    closeDrawer() {
        const drawerContainer = document.getElementById('drawer-container');
        drawerContainer.classList.remove('is-open');
        document.body.style.overflow = '';
    }
};

// Make functions globally available for onclick handlers
window.openDrawer = (type) => DrawerManager.openDrawer(type);
window.closeDrawer = () => DrawerManager.closeDrawer();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    DrawerManager.init();
});