// Activities Manager Module
const ActivitiesManager = {
    data: null,
    initialized: false,
    currentFilter: 'all',
    currentYear: 'all',
    currentActivityId: null,
    
    async init() {
        this.initialized = false;
        
        console.log('Initializing Activities Manager...');
        try {
            await this.loadData();
            this.render();
            this.initFilters();
            this.bindEvents();
            this.updateStatistics();
            this.initialized = true;
            console.log('Activities Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Activities Manager:', error);
            this.showError();
        }
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/activities.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log(`Loaded ${this.data.activities.length} activities`);
        } catch (error) {
            console.error('Failed to load activities data:', error);
            this.data = { activities: [], categories: {} };
        }
    },
    
    render() {
        this.renderCategoryFilters();
        this.renderFeaturedActivity();
        this.renderActivitiesGrid();
    },
    
    renderCategoryFilters() {
        const container = document.getElementById('category-filters');
        if (!container) return;
        
        let html = `
            <button class="category-filter active px-4 py-2 text-sm font-medium bg-brand-accent text-white rounded-lg" data-category="all">
                All Categories
            </button>
        `;
        
        Object.entries(this.data.categories).forEach(([key, category]) => {
            html += `
                <button class="category-filter px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" 
                        data-category="${key}">
                    ${category.icon} ${category.name}
                </button>
            `;
        });
        
        container.innerHTML = html;
    },
    
    renderFeaturedActivity() {
        const featured = this.data.activities.find(a => a.featured);
        if (!featured) return;
        
        const container = document.getElementById('featured-activity');
        if (!container) return;
        
        const category = this.data.categories[featured.type];
        
        container.innerHTML = `
            <div class="bg-gradient-to-r from-brand-accent/10 to-brand-teal/10 rounded-2xl p-8 cursor-pointer hover:shadow-lg transition-all"
                 onclick="ActivitiesManager.openActivityDetail('${featured.id}')">
                <div class="flex flex-col md:flex-row gap-8 items-center">
                    <div class="md:w-1/3">
                        <img src="${featured.thumbnail}" 
                             alt="${featured.title}"
                             class="w-full h-48 object-cover rounded-lg shadow-md"
                             onerror="this.src='https://placehold.co/400x300/2563EB/FFFFFF?text=Activity'">
                    </div>
                    <div class="md:w-2/3">
                        <div class="flex items-center gap-3 mb-3">
                            <span class="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-semibold">
                                ⭐ Featured
                            </span>
                            <span class="bg-${this.getCategoryColor(featured.type)}-100 text-${this.getCategoryColor(featured.type)}-800 text-xs px-3 py-1 rounded-full">
                                ${category.icon} ${category.name}
                            </span>
                            <span class="text-gray-500 text-sm">${this.formatDate(featured.date)}</span>
                        </div>
                        <h3 class="text-2xl font-bold text-brand-navy mb-2">${featured.title}</h3>
                        ${featured.title_kr ? `<p class="text-lg text-gray-600 mb-3">${featured.title_kr}</p>` : ''}
                        <p class="text-gray-700 mb-4">${featured.summary}</p>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2 text-sm text-gray-600">
                                <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                ${featured.location}
                            </div>
                            <span class="text-brand-accent font-semibold text-sm">View Details →</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderActivitiesGrid() {
        const container = document.getElementById('activities-grid');
        if (!container) return;
        
        // Filter activities
        let filteredActivities = this.filterActivities();
        
        if (filteredActivities.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📅</div>
                    <p class="text-lg font-semibold mb-2">No activities found</p>
                    <p class="text-sm">Try adjusting your filters</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = filteredActivities.map(activity => 
            this.createActivityCard(activity)
        ).join('');
    },
    
    createActivityCard(activity) {
        const category = this.data.categories[activity.type];
        
        return `
            <article class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
                     onclick="ActivitiesManager.openActivityDetail('${activity.id}')">
                <div class="h-48 overflow-hidden bg-gray-100">
                    <img src="${activity.thumbnail}" 
                         alt="${activity.title}"
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                         onerror="this.src='https://placehold.co/400x300/2563EB/FFFFFF?text=${activity.type}'">
                </div>
                <div class="p-6">
                    <div class="flex items-center justify-between mb-3">
                        <span class="bg-${this.getCategoryColor(activity.type)}-100 text-${this.getCategoryColor(activity.type)}-800 text-xs px-2 py-1 rounded">
                            ${category.icon} ${category.name}
                        </span>
                        <time class="text-xs text-gray-500">${this.formatDate(activity.date)}</time>
                    </div>
                    <h4 class="font-semibold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-accent transition-colors">
                        ${activity.title}
                    </h4>
                    ${activity.title_kr ? `<p class="text-sm text-gray-500 mb-2">${activity.title_kr}</p>` : ''}
                    <p class="text-sm text-gray-600 line-clamp-3 mb-3">${activity.summary}</p>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1 text-xs text-gray-500">
                            <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            ${activity.location}
                        </div>
                        <span class="text-brand-accent text-sm font-medium">Details →</span>
                    </div>
                </div>
            </article>
        `;
    },
    
    openActivityDetail(activityId) {
        const activity = this.data.activities.find(a => a.id === activityId);
        if (!activity) return;
        
        this.currentActivityId = activityId;
        
        // Create or get modal
        let modal = document.getElementById('activity-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'activity-detail-modal';
            modal.className = 'fixed inset-0 z-50 overflow-y-auto hidden';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = this.createActivityDetailModal(activity);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Add hash to URL for minimal sharing capability
        window.location.hash = activityId;
        
        // Initialize gallery if exists
        this.initGallery(activity);
    },
    
    createActivityDetailModal(activity) {
        const category = this.data.categories[activity.type];
        
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50 z-40" onclick="ActivitiesManager.closeActivityDetail()"></div>
            <div class="relative min-h-screen flex items-start justify-center p-4 pt-8 z-50">
                <div class="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                    <!-- Close button -->
                    <button onclick="ActivitiesManager.closeActivityDetail()" 
                            class="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                        <svg class="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <!-- Scrollable Content -->
                    <div class="overflow-y-auto max-h-[90vh]">
                        <!-- Hero Image -->
                        ${activity.thumbnail ? `
                            <div class="h-64 md:h-80 overflow-hidden bg-gray-100">
                                <img src="${activity.thumbnail}" 
                                     alt="${activity.title}"
                                     class="w-full h-full object-cover">
                            </div>
                        ` : ''}
                        
                        <!-- Header -->
                        <div class="p-8 border-b">
                            <div class="flex flex-wrap items-center gap-3 mb-4">
                                <span class="bg-${this.getCategoryColor(activity.type)}-100 text-${this.getCategoryColor(activity.type)}-800 text-xs px-3 py-1 rounded-full">
                                    ${category.icon} ${category.name}
                                </span>
                                <span class="text-gray-500 text-sm">${this.formatDate(activity.date)}</span>
                                <span class="text-gray-500 text-sm">📍 ${activity.location}</span>
                            </div>
                            <h1 class="text-3xl font-bold text-brand-navy mb-2">${activity.title}</h1>
                            ${activity.title_kr ? `<p class="text-xl text-gray-600">${activity.title_kr}</p>` : ''}
                        </div>
                        
                        <!-- Content -->
                        <div class="p-8">
                            ${this.renderActivityContent(activity)}
                            
                            <!-- Participants -->
                            ${activity.participants && activity.participants.length > 0 ? `
                                <div class="mt-8 p-6 bg-gray-50 rounded-lg">
                                    <h3 class="font-semibold text-brand-navy mb-4">Participants</h3>
                                    <div class="flex flex-wrap gap-3">
                                        ${activity.participants.map(p => `
                                            <div class="bg-white px-4 py-2 rounded-lg border border-gray-200">
                                                <span class="font-medium text-gray-800">${p.name}</span>
                                                ${p.role ? `<span class="text-xs text-gray-500 ml-2">${p.role}</span>` : ''}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            <!-- Links -->
                            ${activity.links && activity.links.length > 0 ? `
                                <div class="mt-8 p-6 bg-blue-50 rounded-lg">
                                    <h3 class="font-semibold text-brand-navy mb-4">Related Links</h3>
                                    <div class="space-y-2">
                                        ${activity.links.map(link => `
                                            <a href="${link.url}" target="_blank" rel="noopener noreferrer"
                                               class="flex items-center text-brand-accent hover:underline">
                                                <svg class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                ${link.text}
                                            </a>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    
    renderActivityContent(activity) {
        if (!activity.content) return `<p class="text-gray-700">${activity.summary}</p>`;
        
        let html = '';
        
        // Overview
        if (activity.content.overview) {
            html += `
                <div class="mb-8">
                    <p class="text-gray-700 leading-relaxed">${activity.content.overview}</p>
                </div>
            `;
        }
        
        // Highlights
        if (activity.content.highlights && activity.content.highlights.length > 0) {
            html += `
                <div class="mb-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                    <h3 class="font-semibold text-brand-navy mb-3">Key Highlights</h3>
                    <ul class="space-y-2">
                        ${activity.content.highlights.map(h => `
                            <li class="flex items-start">
                                <span class="text-yellow-600 mr-2">✓</span>
                                <span class="text-gray-700">${h}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        // Dynamic sections
        if (activity.content.sections) {
            activity.content.sections.forEach(section => {
                html += this.renderContentSection(section);
            });
        }
        
        return html;
    },
    
    renderContentSection(section) {
        let html = '';
        
        switch(section.type) {
            case 'text':
                html = `
                    <div class="mb-8">
                        ${section.title ? `<h3 class="font-semibold text-brand-navy mb-3">${section.title}</h3>` : ''}
                        <p class="text-gray-700 leading-relaxed">${section.content}</p>
                    </div>
                `;
                break;
                
            case 'presentations':
                html = `
                    <div class="mb-8">
                        <h3 class="font-semibold text-brand-navy mb-4">${section.title}</h3>
                        <div class="space-y-4">
                            ${section.items.map(item => `
                                <div class="p-4 bg-white border border-gray-200 rounded-lg">
                                    <h4 class="font-medium text-gray-900 mb-2">${item.title}</h4>
                                    <div class="text-sm text-gray-600 space-y-1">
                                        <p>👤 Presenter: ${item.presenter}</p>
                                        <p>📅 Session: ${item.session}</p>
                                        <p>🕒 Time: ${item.time}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
                
            case 'gallery':
                html = `
                    <div class="mb-8">
                        <h3 class="font-semibold text-brand-navy mb-4">${section.title}</h3>
                        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                            ${section.images.map((img, idx) => `
                                <div class="cursor-pointer group" onclick="ActivitiesManager.openImageModal('${img.url}', ${idx})">
                                    <img src="${img.url}" 
                                         alt="${img.caption || ''}"
                                         class="w-full h-40 object-cover rounded-lg group-hover:opacity-90 transition-opacity"
                                         onerror="this.parentElement.style.display='none'">
                                    ${img.caption ? `<p class="text-xs text-gray-600 mt-2">${img.caption}</p>` : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
                break;
        }
        
        return html;
    },
    
    openImageModal(imageSrc, index) {
        // Similar to NewsManager's image modal
        let imageModal = document.getElementById('activity-image-modal');
        if (!imageModal) {
            imageModal = document.createElement('div');
            imageModal.id = 'activity-image-modal';
            imageModal.className = 'fixed inset-0 z-[60] hidden';
            document.body.appendChild(imageModal);
        }
        
        imageModal.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-90" onclick="ActivitiesManager.closeImageModal()"></div>
            <div class="relative w-full h-full flex items-center justify-center p-4">
                <button onclick="ActivitiesManager.closeImageModal()" 
                        class="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur rounded-full p-3 text-white hover:bg-white/30">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <img src="${imageSrc}" 
                     alt="Full size image" 
                     class="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                     onclick="event.stopPropagation()">
            </div>
        `;
        
        imageModal.classList.remove('hidden');
    },
    
    closeImageModal() {
        const imageModal = document.getElementById('activity-image-modal');
        if (imageModal) {
            imageModal.classList.add('hidden');
        }
    },
    
    closeActivityDetail() {
        const modal = document.getElementById('activity-detail-modal');
        const imageModal = document.getElementById('activity-image-modal');
        
        if (modal) {
            modal.classList.add('hidden');
        }
        if (imageModal) {
            imageModal.classList.add('hidden');
        }
        
        document.body.style.overflow = '';
        this.currentActivityId = null;
        
        // Remove hash from URL
        if (window.location.hash) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
    },
    
    filterActivities() {
        let filtered = [...this.data.activities];
        
        // Filter by year
        if (this.currentYear !== 'all') {
            filtered = filtered.filter(a => 
                new Date(a.date).getFullYear().toString() === this.currentYear
            );
        }
        
        // Filter by category
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(a => a.type === this.currentFilter);
        }
        
        // Sort by date (newest first)
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        return filtered;
    },
    
    initFilters() {
        // Year filters
        document.querySelectorAll('.year-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.year-filter').forEach(b => {
                    b.classList.remove('active', 'bg-brand-accent', 'text-white');
                    b.classList.add('bg-gray-200', 'text-gray-700');
                });
                btn.classList.add('active', 'bg-brand-accent', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                
                this.currentYear = btn.dataset.year;
                this.renderActivitiesGrid();
            });
        });
        
        // Category filters (using event delegation)
        document.getElementById('category-filters')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.category-filter');
            if (!btn) return;
            
            document.querySelectorAll('.category-filter').forEach(b => {
                b.classList.remove('active', 'bg-brand-accent', 'text-white');
                b.classList.add('bg-gray-200', 'text-gray-700');
            });
            btn.classList.add('active', 'bg-brand-accent', 'text-white');
            btn.classList.remove('bg-gray-200', 'text-gray-700');
            
            this.currentFilter = btn.dataset.category;
            this.renderActivitiesGrid();
        });
    },
    
    bindEvents() {
        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeActivityDetail();
                this.closeImageModal();
            }
        });
        
        // Handle hash changes (for direct links)
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.slice(1);
            if (hash && this.data) {
                const activity = this.data.activities.find(a => a.id === hash);
                if (activity) {
                    this.openActivityDetail(hash);
                }
            }
        });
        
        // Check for hash on initial load
        if (window.location.hash) {
            const hash = window.location.hash.slice(1);
            setTimeout(() => {
                if (this.data) {
                    const activity = this.data.activities.find(a => a.id === hash);
                    if (activity) {
                        this.openActivityDetail(hash);
                    }
                }
            }, 500);
        }
    },
    
    initGallery(activity) {
        // Initialize any gallery-specific features
        // Could add swipe gestures, keyboard navigation, etc.
    },
    
    updateStatistics() {
        const container = document.getElementById('activity-stats');
        if (!container) return;
        
        const stats = {
            total: this.data.activities.length,
            conferences: this.data.activities.filter(a => a.type === 'conference').length,
            workshops: this.data.activities.filter(a => a.type === 'workshop').length,
            social: this.data.activities.filter(a => a.type === 'social').length
        };
        
        container.innerHTML = `
            <div>
                <div class="text-3xl font-bold text-brand-accent">${stats.total}</div>
                <div class="text-sm text-gray-600">Total Activities</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-blue-600">${stats.conferences}</div>
                <div class="text-sm text-gray-600">Conferences</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-purple-600">${stats.workshops}</div>
                <div class="text-sm text-gray-600">Workshops</div>
            </div>
            <div>
                <div class="text-3xl font-bold text-green-600">${stats.social}</div>
                <div class="text-sm text-gray-600">Social Events</div>
            </div>
        `;
    },
    
    getCategoryColor(type) {
        const colors = {
            'conference': 'blue',
            'workshop': 'purple',
            'social': 'green',
            'seminar': 'orange'
        };
        return colors[type] || 'gray';
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },
    
    showError() {
        const container = document.getElementById('activities-grid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-red-500">
                    <div class="text-4xl mb-4">⚠️</div>
                    <p class="text-lg font-semibold mb-2">Failed to load activities</p>
                    <p class="text-sm">Please check your connection and try again</p>
                </div>
            `;
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ActivitiesManager;
}